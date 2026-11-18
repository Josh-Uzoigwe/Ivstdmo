import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMidMarketFxRate } from "@/lib/fx";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, orders, transactions, simState, cashBalances, positions, auditLogs] =
    await Promise.all([
      prisma.user.findMany({
        include: {
          kycProfile: true,
          cashBalances: true,
          _count: { select: { orders: true, positions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        include: { asset: true, user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.transaction.findMany({
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.marketSimState.findUnique({ where: { id: "singleton" } }),
      prisma.cashBalance.findMany(),
      prisma.position.findMany({ include: { asset: true } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    ]);

  let totalCashUsdCents = 0;
  for (const b of cashBalances) {
    totalCashUsdCents += Math.round(b.amountCents * getMidMarketFxRate(b.currency, "USD"));
  }

  let totalHoldingsUsdCents = 0;
  for (const p of positions) {
    const val = Math.round(p.quantityDecimal * p.asset.basePriceCents);
    totalHoldingsUsdCents += Math.round(val * getMidMarketFxRate(p.asset.currency, "USD"));
  }

  const totalVolumeUsdCents = orders
    .filter((o) => o.status === "FILLED" && o.filledPriceCents && o.filledQuantityDecimal)
    .reduce((acc, o) => {
      const val = Math.round((o.filledQuantityDecimal || 0) * (o.filledPriceCents || 0));
      return acc + Math.round(val * getMidMarketFxRate(o.asset.currency, "USD"));
    }, 0);

  return NextResponse.json({
    metrics: {
      totalUsers: users.length,
      pendingKyc: users.filter((u) => u.kycProfile?.status === "PENDING").length,
      totalAumUsdCents: totalCashUsdCents + totalHoldingsUsdCents,
      totalVolumeUsdCents,
      totalOrders: orders.length,
    },
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      baseCurrency: u.baseCurrency,
      createdAt: u.createdAt,
      kycProfile: u.kycProfile,
      cashBalances: u.cashBalances,
      orderCount: u._count.orders,
      positionCount: u._count.positions,
    })),
    orders,
    transactions,
    simState,
    auditLogs,
  });
}

const adminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("kyc_review"),
    userId: z.string(),
    decision: z.enum(["APPROVED", "REJECTED"]),
    reviewNote: z.string().optional(),
  }),
  z.object({
    action: z.literal("market_sim"),
    isPaused: z.boolean().optional(),
    volatilityMultiplier: z.number().min(0.2).max(5.0).optional(),
    activeEventName: z.string().nullable().optional(),
    bumpSeed: z.boolean().optional(),
  }),
]);

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = adminActionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === "kyc_review") {
    const kyc = await prisma.kycProfile.update({
      where: { userId: data.userId },
      data: {
        status: data.decision,
        reviewNote: data.reviewNote || null,
        reviewedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: "KYC",
        title: `KYC ${data.decision === "APPROVED" ? "Approved" : "Update"}`,
        message:
          data.decision === "APPROVED"
            ? "Your identity verification was approved. Trading is now unlocked."
            : `Your verification was not approved: ${data.reviewNote || "Please re-submit."}`,
        link: data.decision === "APPROVED" ? "/markets" : "/onboarding",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: `KYC_${data.decision}`,
        targetType: "User",
        targetId: data.userId,
        details: data.reviewNote || null,
      },
    });

    return NextResponse.json({ kyc });
  }

  if (data.action === "market_sim") {
    const current = await prisma.marketSimState.findUnique({
      where: { id: "singleton" },
    });
    const updated = await prisma.marketSimState.upsert({
      where: { id: "singleton" },
      update: {
        isPaused: data.isPaused ?? current?.isPaused ?? false,
        volatilityMultiplier:
          data.volatilityMultiplier ?? current?.volatilityMultiplier ?? 1.0,
        activeEventName:
          data.activeEventName !== undefined
            ? data.activeEventName
            : current?.activeEventName ?? null,
        tickSeedOffset: data.bumpSeed
          ? (current?.tickSeedOffset ?? 0) + 1
          : current?.tickSeedOffset ?? 0,
      },
      create: {
        id: "singleton",
        isPaused: data.isPaused ?? false,
        volatilityMultiplier: data.volatilityMultiplier ?? 1.0,
        activeEventName: data.activeEventName ?? null,
        tickSeedOffset: data.bumpSeed ? 1 : 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "MARKET_SIM_UPDATE",
        targetType: "MarketSimState",
        targetId: "singleton",
        details: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ simState: updated });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
