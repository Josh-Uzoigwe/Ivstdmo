import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BRAND } from "@/config/brand";
import { formatMoney } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await prisma.managedPlanSubscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plans: BRAND.managedPlans, subscriptions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.kycProfile?.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Complete KYC onboarding before allocating to a managed plan." },
      { status: 400 }
    );
  }

  const schema = z.object({
    planId: z.string(),
    amountCents: z.number().int().positive(),
    currency: z.enum(["USD", "EUR", "GBP"]),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid allocation request." }, { status: 400 });
  }

  const plan = BRAND.managedPlans.find((p) => p.id === parsed.data.planId);
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  if (parsed.data.amountCents < plan.minInvestmentCents) {
    return NextResponse.json(
      { error: `Minimum allocation for ${plan.name} is ${formatMoney(plan.minInvestmentCents, parsed.data.currency)}.` },
      { status: 400 }
    );
  }

  const bal = await prisma.cashBalance.findUnique({
    where: { userId_currency: { userId: user.id, currency: parsed.data.currency } },
  });
  if (!bal || bal.amountCents < parsed.data.amountCents) {
    return NextResponse.json(
      { error: `Insufficient ${parsed.data.currency} wallet balance.` },
      { status: 400 }
    );
  }

  const sub = await prisma.$transaction(async (tx) => {
    await tx.cashBalance.update({
      where: { id: bal.id },
      data: { amountCents: { decrement: parsed.data.amountCents } },
    });

    const created = await tx.managedPlanSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        allocatedCents: parsed.data.amountCents,
        currency: parsed.data.currency,
        status: "ACTIVE",
      },
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "BUY",
        currency: parsed.data.currency,
        amountCents: -parsed.data.amountCents,
        description: `Allocated ${formatMoney(parsed.data.amountCents, parsed.data.currency)} to ${plan.name} managed portfolio`,
        referenceId: created.id,
      },
    });

    return created;
  });

  return NextResponse.json({ subscription: sub });
}
