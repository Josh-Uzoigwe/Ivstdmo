import { prisma } from "@/lib/prisma";
import { getMarketDataProvider } from "@/lib/market-data";
import { getMarketSimConfig } from "@/lib/services/market-sim";
import { convertCurrency, getMidMarketFxRate } from "@/lib/fx";
import { BRAND, CurrencyCode } from "@/config/brand";
import { formatMoney, formatShares } from "@/lib/utils";

export interface PlaceOrderInput {
  assetId: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP";
  quantityDecimal?: number;
  notionalCents?: number;
  limitPriceCents?: number;
  stopPriceCents?: number;
  sourceCurrency?: CurrencyCode;
}

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { kycProfile: true, cashBalances: true },
  });
  if (!user) throw new Error("User not found");
  if (user.kycProfile?.status !== "APPROVED") {
    throw new Error("KYC verification must be approved before trading.");
  }

  const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
  if (!asset || !asset.isActive) throw new Error("Asset not found or inactive.");

  if (!input.quantityDecimal && !input.notionalCents) {
    throw new Error("Specify either a share quantity or a cash amount.");
  }

  const provider = getMarketDataProvider();
  const simConfig = await getMarketSimConfig();
  const quote = await provider.getQuote(
    asset.ticker,
    asset.basePriceCents,
    asset.volatility,
    simConfig
  );

  if (input.orderType === "LIMIT" && (!input.limitPriceCents || input.limitPriceCents <= 0)) {
    throw new Error("Limit price is required for limit orders.");
  }
  if (input.orderType === "STOP" && (!input.stopPriceCents || input.stopPriceCents <= 0)) {
    throw new Error("Stop price is required for stop orders.");
  }

  // For MARKET orders, execute immediately
  if (input.orderType === "MARKET") {
    return executeOrderFill({
      userId,
      asset,
      side: input.side,
      orderType: "MARKET",
      fillPriceCents: quote.priceCents,
      quantityDecimal: input.quantityDecimal,
      notionalCents: input.notionalCents,
      sourceCurrency: input.sourceCurrency ?? (user.baseCurrency as CurrencyCode),
    });
  }

  // For LIMIT / STOP orders, validate capacity & queue as PENDING
  const estPrice =
    input.orderType === "LIMIT" ? input.limitPriceCents! : input.stopPriceCents!;
  const estShares = input.quantityDecimal
    ? input.quantityDecimal
    : Number((input.notionalCents! / estPrice).toFixed(6));

  if (input.side === "SELL") {
    const pos = await prisma.position.findUnique({
      where: { userId_assetId: { userId, assetId: asset.id } },
    });
    if (!pos || pos.quantityDecimal < estShares - 1e-6) {
      throw new Error(`Insufficient ${asset.ticker} shares to place sell order.`);
    }
  }

  const order = await prisma.order.create({
    data: {
      userId,
      assetId: asset.id,
      side: input.side,
      orderType: input.orderType,
      status: "PENDING",
      quantityDecimal: input.quantityDecimal ?? null,
      notionalCents: input.notionalCents ?? null,
      limitPriceCents: input.limitPriceCents ?? null,
      stopPriceCents: input.stopPriceCents ?? null,
      settlementCurrency: asset.currency,
    },
    include: { asset: true },
  });

  return order;
}

async function executeOrderFill(params: {
  userId: string;
  asset: {
    id: string;
    ticker: string;
    name: string;
    currency: string;
  };
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP";
  fillPriceCents: number;
  quantityDecimal?: number | null;
  notionalCents?: number | null;
  sourceCurrency?: CurrencyCode;
  existingOrderId?: string;
  isAutoInvest?: boolean;
}) {
  const { userId, asset, side, orderType, fillPriceCents } = params;

  const shares = params.quantityDecimal
    ? Number(params.quantityDecimal.toFixed(6))
    : Number((params.notionalCents! / fillPriceCents).toFixed(6));

  if (shares <= 0) throw new Error("Order quantity must be positive.");

  const totalCostAssetCents = params.notionalCents
    ? params.notionalCents
    : Math.round(shares * fillPriceCents);

  if (totalCostAssetCents <= 0) throw new Error("Order value is too small.");

  return prisma.$transaction(async (tx) => {
    let fxRateApplied = 1;
    let fxFeeCents = 0;

    if (side === "BUY") {
      // Check native asset currency wallet first
      const nativeBal = await tx.cashBalance.findUnique({
        where: { userId_currency: { userId, currency: asset.currency } },
      });
      const availableNative = nativeBal?.amountCents ?? 0;

      if (availableNative >= totalCostAssetCents) {
        await tx.cashBalance.update({
          where: { userId_currency: { userId, currency: asset.currency } },
          data: { amountCents: { decrement: totalCostAssetCents } },
        });
      } else {
        // Need FX conversion from sourceCurrency (or any funded wallet)
        const deficitAssetCents = totalCostAssetCents - availableNative;
        const balances = await tx.cashBalance.findMany({ where: { userId } });
        const preferred = params.sourceCurrency || "USD";
        const sortedBalances = [
          ...balances.filter((b) => b.currency === preferred),
          ...balances.filter((b) => b.currency !== preferred && b.currency !== asset.currency),
        ];

        const sourceBal = sortedBalances.find((b) => {
          if (b.currency === asset.currency || b.amountCents <= 0) return false;
          const midRate = getMidMarketFxRate(b.currency, asset.currency);
          const effectiveRate = midRate * (1 - BRAND.fxSpreadPct);
          const maxAssetCents = Math.floor(b.amountCents * effectiveRate);
          return maxAssetCents >= deficitAssetCents;
        });

        if (!sourceBal) {
          throw new Error(
            `Insufficient funds. Need ${formatMoney(totalCostAssetCents, asset.currency)} in ${asset.currency} or equivalent.`
          );
        }

        const midRate = getMidMarketFxRate(sourceBal.currency, asset.currency);
        const effectiveRate = midRate * (1 - BRAND.fxSpreadPct);
        const requiredSourceCents = Math.ceil(deficitAssetCents / effectiveRate);
        const conv = convertCurrency(requiredSourceCents, sourceBal.currency, asset.currency, true);

        fxRateApplied = conv.effectiveRate;
        fxFeeCents = conv.feeCentsInSource;

        // Deduct from source currency
        await tx.cashBalance.update({
          where: { id: sourceBal.id },
          data: { amountCents: { decrement: requiredSourceCents } },
        });

        // Deduct remaining native balance if any
        if (availableNative > 0 && nativeBal) {
          await tx.cashBalance.update({
            where: { id: nativeBal.id },
            data: { amountCents: 0 },
          });
        }

        await tx.transaction.create({
          data: {
            userId,
            type: "FX_CONVERT",
            currency: sourceBal.currency,
            amountCents: -requiredSourceCents,
            description: `Auto-FX ${sourceBal.currency} → ${asset.currency} for ${asset.ticker} (0.25% spread: ${formatMoney(fxFeeCents, sourceBal.currency)})`,
          },
        });
      }

      // Update or create Position
      const existingPos = await tx.position.findUnique({
        where: { userId_assetId: { userId, assetId: asset.id } },
      });

      if (existingPos) {
        const newQty = Number((existingPos.quantityDecimal + shares).toFixed(6));
        const prevValue = existingPos.quantityDecimal * existingPos.avgCostCents;
        const addedValue = shares * fillPriceCents;
        const newAvgCost = Math.round((prevValue + addedValue) / newQty);

        await tx.position.update({
          where: { id: existingPos.id },
          data: { quantityDecimal: newQty, avgCostCents: newAvgCost },
        });
      } else {
        await tx.position.create({
          data: {
            userId,
            assetId: asset.id,
            quantityDecimal: shares,
            avgCostCents: fillPriceCents,
          },
        });
      }
    } else {
      // SELL
      const existingPos = await tx.position.findUnique({
        where: { userId_assetId: { userId, assetId: asset.id } },
      });
      if (!existingPos || existingPos.quantityDecimal < shares - 1e-6) {
        throw new Error(`Insufficient ${asset.ticker} shares to sell.`);
      }

      const remainingQty = Number((existingPos.quantityDecimal - shares).toFixed(6));
      if (remainingQty <= 0.000001) {
        await tx.position.delete({ where: { id: existingPos.id } });
      } else {
        await tx.position.update({
          where: { id: existingPos.id },
          data: { quantityDecimal: remainingQty },
        });
      }

      await tx.cashBalance.upsert({
        where: { userId_currency: { userId, currency: asset.currency } },
        update: { amountCents: { increment: totalCostAssetCents } },
        create: { userId, currency: asset.currency, amountCents: totalCostAssetCents },
      });
    }

    const order = params.existingOrderId
      ? await tx.order.update({
          where: { id: params.existingOrderId },
          data: {
            status: "FILLED",
            filledPriceCents: fillPriceCents,
            filledQuantityDecimal: shares,
            fxRateApplied,
            fxFeeCents,
            filledAt: new Date(),
          },
          include: { asset: true },
        })
      : await tx.order.create({
          data: {
            userId,
            assetId: asset.id,
            side,
            orderType,
            status: "FILLED",
            quantityDecimal: params.quantityDecimal ?? null,
            notionalCents: params.notionalCents ?? null,
            filledPriceCents: fillPriceCents,
            filledQuantityDecimal: shares,
            settlementCurrency: asset.currency,
            fxRateApplied,
            fxFeeCents,
            filledAt: new Date(),
          },
          include: { asset: true },
        });

    await tx.transaction.create({
      data: {
        userId,
        type: params.isAutoInvest ? "AUTO_INVEST" : side,
        currency: asset.currency,
        amountCents: side === "BUY" ? -totalCostAssetCents : totalCostAssetCents,
        description: `${side} ${formatShares(shares)} ${asset.ticker} @ ${formatMoney(fillPriceCents, asset.currency)}`,
        referenceId: order.id,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: "ORDER",
        title: `${side === "BUY" ? "Bought" : "Sold"} ${asset.ticker}`,
        message: `${orderType} ${side.toLowerCase()} of ${formatShares(shares)} ${asset.ticker} filled at ${formatMoney(fillPriceCents, asset.currency)}.`,
        link: `/markets/${asset.ticker}`,
      },
    });

    return order;
  });
}

export async function evaluatePendingTriggers() {
  const provider = getMarketDataProvider();
  const simConfig = await getMarketSimConfig();

  // 1. Evaluate pending LIMIT and STOP orders
  const pendingOrders = await prisma.order.findMany({
    where: { status: "PENDING" },
    include: { asset: true },
  });

  if (pendingOrders.length > 0) {
    const quotes = await provider.getQuotes(
      pendingOrders.map((o) => ({
        ticker: o.asset.ticker,
        basePriceCents: o.asset.basePriceCents,
        volatility: o.asset.volatility,
      })),
      simConfig
    );

    for (const order of pendingOrders) {
      const q = quotes[order.asset.ticker];
      if (!q) continue;

      let shouldFill = false;
      if (order.orderType === "LIMIT" && order.limitPriceCents) {
        if (order.side === "BUY" && q.priceCents <= order.limitPriceCents) shouldFill = true;
        if (order.side === "SELL" && q.priceCents >= order.limitPriceCents) shouldFill = true;
      } else if (order.orderType === "STOP" && order.stopPriceCents) {
        if (order.side === "BUY" && q.priceCents >= order.stopPriceCents) shouldFill = true;
        if (order.side === "SELL" && q.priceCents <= order.stopPriceCents) shouldFill = true;
      }

      if (shouldFill) {
        try {
          await executeOrderFill({
            userId: order.userId,
            asset: order.asset,
            side: order.side as "BUY" | "SELL",
            orderType: order.orderType as "LIMIT" | "STOP",
            fillPriceCents: q.priceCents,
            quantityDecimal: order.quantityDecimal,
            notionalCents: order.notionalCents,
            existingOrderId: order.id,
          });
        } catch {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "REJECTED" },
          });
        }
      }
    }
  }

  // 2. Evaluate active Price Alerts
  const activeAlerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: { asset: true },
  });

  if (activeAlerts.length > 0) {
    const quotes = await provider.getQuotes(
      activeAlerts.map((a) => ({
        ticker: a.asset.ticker,
        basePriceCents: a.asset.basePriceCents,
        volatility: a.asset.volatility,
      })),
      simConfig
    );

    for (const alert of activeAlerts) {
      const q = quotes[alert.asset.ticker];
      if (!q) continue;
      const hit =
        (alert.direction === "ABOVE" && q.priceCents >= alert.targetPriceCents) ||
        (alert.direction === "BELOW" && q.priceCents <= alert.targetPriceCents);

      if (hit) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { isActive: false, triggeredAt: new Date() },
        });
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: "ALERT",
            title: `Price Alert: ${alert.asset.ticker}`,
            message: `${alert.asset.ticker} reached ${formatMoney(q.priceCents, alert.asset.currency)} (${alert.direction.toLowerCase()} ${formatMoney(alert.targetPriceCents, alert.asset.currency)}).`,
            link: `/markets/${alert.asset.ticker}`,
          },
        });
      }
    }
  }

  // 3. Evaluate due Recurring Investments
  const now = new Date();
  const dueRecurring = await prisma.recurringInvestment.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    include: { asset: true },
  });

  for (const plan of dueRecurring) {
    const quote = await provider.getQuote(
      plan.asset.ticker,
      plan.asset.basePriceCents,
      plan.asset.volatility,
      simConfig
    );
    try {
      await executeOrderFill({
        userId: plan.userId,
        asset: plan.asset,
        side: "BUY",
        orderType: "MARKET",
        fillPriceCents: quote.priceCents,
        notionalCents: plan.amountCents,
        sourceCurrency: plan.currency as CurrencyCode,
        isAutoInvest: true,
      });
    } catch {
      // Insufficient funds — skip this cycle and notify user
      await prisma.notification.create({
        data: {
          userId: plan.userId,
          type: "SYSTEM",
          title: `Auto-Invest Skipped: ${plan.asset.ticker}`,
          message: `Insufficient funds for your ${formatMoney(plan.amountCents, plan.asset.currency)} recurring buy.`,
          link: "/wallet",
        },
      });
    }

    const next = new Date(now);
    if (plan.frequency === "DAILY") next.setDate(next.getDate() + 1);
    else if (plan.frequency === "WEEKLY") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);

    await prisma.recurringInvestment.update({
      where: { id: plan.id },
      data: { lastRunAt: now, nextRunAt: next },
    });
  }
}
