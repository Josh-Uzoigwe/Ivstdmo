import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMarketDataProvider } from "@/lib/market-data";
import { getMarketSimConfig } from "@/lib/services/market-sim";
import { getMidMarketFxRate } from "@/lib/fx";
import { evaluatePendingTriggers } from "@/lib/services/trading";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await evaluatePendingTriggers();

  const [positions, balances, openOrders, managedPlans] = await Promise.all([
    prisma.position.findMany({
      where: { userId: user.id },
      include: { asset: true },
    }),
    prisma.cashBalance.findMany({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { asset: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.managedPlanSubscription.findMany({
      where: { userId: user.id, status: "ACTIVE" },
    }),
  ]);

  const provider = getMarketDataProvider();
  const simConfig = await getMarketSimConfig();
  const quotes = await provider.getQuotes(
    positions.map((p) => ({
      ticker: p.asset.ticker,
      basePriceCents: p.asset.basePriceCents,
      volatility: p.asset.volatility,
    })),
    simConfig
  );

  const base = user.baseCurrency;

  let holdingsValueBaseCents = 0;
  let holdingsCostBaseCents = 0;
  let dayPnlBaseCents = 0;

  const holdings = positions.map((p) => {
    const q = quotes[p.asset.ticker];
    const currentPriceCents = q?.priceCents ?? p.asset.basePriceCents;
    const prevCloseCents = q?.prevCloseCents ?? p.asset.basePriceCents;
    const marketValueAssetCents = Math.round(p.quantityDecimal * currentPriceCents);
    const costBasisAssetCents = Math.round(p.quantityDecimal * p.avgCostCents);
    const dayPnlAssetCents = Math.round(
      p.quantityDecimal * (currentPriceCents - prevCloseCents)
    );

    const fxRate = getMidMarketFxRate(p.asset.currency, base);
    const marketValueBaseCents = Math.round(marketValueAssetCents * fxRate);
    const costBasisBaseCents = Math.round(costBasisAssetCents * fxRate);
    const dayPnlConvertedCents = Math.round(dayPnlAssetCents * fxRate);

    holdingsValueBaseCents += marketValueBaseCents;
    holdingsCostBaseCents += costBasisBaseCents;
    dayPnlBaseCents += dayPnlConvertedCents;

    const unrealizedPnlAssetCents = marketValueAssetCents - costBasisAssetCents;
    const unrealizedPnlPct =
      costBasisAssetCents > 0 ? (unrealizedPnlAssetCents / costBasisAssetCents) * 100 : 0;

    return {
      id: p.id,
      asset: p.asset,
      quantityDecimal: p.quantityDecimal,
      avgCostCents: p.avgCostCents,
      currentPriceCents,
      changePct: q?.changePct ?? 0,
      marketValueAssetCents,
      marketValueBaseCents,
      unrealizedPnlAssetCents,
      unrealizedPnlPct,
    };
  });

  let cashBaseCents = 0;
  for (const b of balances) {
    cashBaseCents += Math.round(b.amountCents * getMidMarketFxRate(b.currency, base));
  }

  let managedBaseCents = 0;
  for (const m of managedPlans) {
    managedBaseCents += Math.round(m.allocatedCents * getMidMarketFxRate(m.currency, base));
  }

  const totalValueBaseCents = holdingsValueBaseCents + cashBaseCents + managedBaseCents;
  const totalUnrealizedPnlBaseCents = holdingsValueBaseCents - holdingsCostBaseCents;

  // Allocation by asset class
  const classTotals: Record<string, number> = {
    Cash: cashBaseCents,
    Stocks: 0,
    ETFs: 0,
    Crypto: 0,
    "Managed Plans": managedBaseCents,
  };
  for (const h of holdings) {
    if (h.asset.assetClass === "STOCK") classTotals.Stocks += h.marketValueBaseCents;
    else if (h.asset.assetClass === "ETF") classTotals.ETFs += h.marketValueBaseCents;
    else if (h.asset.assetClass === "CRYPTO") classTotals.Crypto += h.marketValueBaseCents;
  }

  const allocation = Object.entries(classTotals)
    .filter(([, value]) => value > 0)
    .map(([name, valueCents]) => ({
      name,
      valueCents,
      pct: totalValueBaseCents > 0 ? (valueCents / totalValueBaseCents) * 100 : 0,
    }));

  return NextResponse.json({
    baseCurrency: base,
    totalValueBaseCents,
    holdingsValueBaseCents,
    cashBaseCents,
    managedBaseCents,
    dayPnlBaseCents,
    totalUnrealizedPnlBaseCents,
    holdings,
    balances,
    allocation,
    openOrders,
  });
}
