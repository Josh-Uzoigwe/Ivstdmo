import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { convertCurrency } from "@/lib/fx";
import { formatMoney } from "@/lib/utils";
import { BRAND } from "@/config/brand";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [balances, transactions] = await Promise.all([
    prisma.cashBalance.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    balances,
    transactions,
    baseCurrency: user.baseCurrency,
    fxRates: BRAND.baseFxRates,
    fxSpreadPct: BRAND.fxSpreadPct,
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("deposit"),
    currency: z.enum(["USD", "EUR", "GBP"]),
    amountCents: z.number().int().positive().max(100_000_000),
    isDemo: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("withdraw"),
    currency: z.enum(["USD", "EUR", "GBP"]),
    amountCents: z.number().int().positive(),
    destinationLabel: z.string().min(2).max(80).optional(),
  }),
  z.object({
    action: z.literal("fx_convert"),
    fromCurrency: z.enum(["USD", "EUR", "GBP"]),
    toCurrency: z.enum(["USD", "EUR", "GBP"]),
    amountCents: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("set_base_currency"),
    baseCurrency: z.enum(["USD", "EUR", "GBP"]),
  }),
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid wallet request." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.action === "set_base_currency") {
    await prisma.user.update({
      where: { id: user.id },
      data: { baseCurrency: data.baseCurrency },
    });
    return NextResponse.json({ baseCurrency: data.baseCurrency });
  }

  if (data.action === "deposit") {
    await prisma.$transaction(async (tx) => {
      await tx.cashBalance.upsert({
        where: { userId_currency: { userId: user.id, currency: data.currency } },
        update: { amountCents: { increment: data.amountCents } },
        create: { userId: user.id, currency: data.currency, amountCents: data.amountCents },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          currency: data.currency,
          amountCents: data.amountCents,
          description: data.isDemo
            ? `Demo funds credit (${formatMoney(data.amountCents, data.currency)})`
            : `Bank transfer deposit (${formatMoney(data.amountCents, data.currency)})`,
        },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "WALLET",
          title: "Deposit Credited",
          message: `${formatMoney(data.amountCents, data.currency)} added to your ${data.currency} wallet.`,
          link: "/wallet",
        },
      });
    });

    const balances = await prisma.cashBalance.findMany({ where: { userId: user.id } });
    return NextResponse.json({ balances });
  }

  if (data.action === "withdraw") {
    const bal = await prisma.cashBalance.findUnique({
      where: { userId_currency: { userId: user.id, currency: data.currency } },
    });
    if (!bal || bal.amountCents < data.amountCents) {
      return NextResponse.json(
        { error: `Insufficient ${data.currency} balance for withdrawal.` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cashBalance.update({
        where: { id: bal.id },
        data: { amountCents: { decrement: data.amountCents } },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          currency: data.currency,
          amountCents: -data.amountCents,
          description: `Withdrawal to ${data.destinationLabel || "linked bank account"}`,
        },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "WALLET",
          title: "Withdrawal Initiated",
          message: `${formatMoney(data.amountCents, data.currency)} withdrawn from your ${data.currency} wallet.`,
          link: "/wallet",
        },
      });
    });

    const balances = await prisma.cashBalance.findMany({ where: { userId: user.id } });
    return NextResponse.json({ balances });
  }

  if (data.action === "fx_convert") {
    if (data.fromCurrency === data.toCurrency) {
      return NextResponse.json(
        { error: "Source and target currencies must differ." },
        { status: 400 }
      );
    }

    const fromBal = await prisma.cashBalance.findUnique({
      where: { userId_currency: { userId: user.id, currency: data.fromCurrency } },
    });
    if (!fromBal || fromBal.amountCents < data.amountCents) {
      return NextResponse.json(
        { error: `Insufficient ${data.fromCurrency} balance.` },
        { status: 400 }
      );
    }

    const conv = convertCurrency(data.amountCents, data.fromCurrency, data.toCurrency, true);

    await prisma.$transaction(async (tx) => {
      await tx.cashBalance.update({
        where: { id: fromBal.id },
        data: { amountCents: { decrement: data.amountCents } },
      });
      await tx.cashBalance.upsert({
        where: { userId_currency: { userId: user.id, currency: data.toCurrency } },
        update: { amountCents: { increment: conv.convertedCents } },
        create: {
          userId: user.id,
          currency: data.toCurrency,
          amountCents: conv.convertedCents,
        },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "FX_CONVERT",
          currency: data.fromCurrency,
          amountCents: -data.amountCents,
          description: `Converted ${formatMoney(data.amountCents, data.fromCurrency)} → ${formatMoney(conv.convertedCents, data.toCurrency)} (rate ${conv.effectiveRate.toFixed(4)})`,
        },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "FX_CONVERT",
          currency: data.toCurrency,
          amountCents: conv.convertedCents,
          description: `FX credit from ${data.fromCurrency} conversion`,
        },
      });
    });

    const balances = await prisma.cashBalance.findMany({ where: { userId: user.id } });
    return NextResponse.json({ balances, conversion: conv });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
