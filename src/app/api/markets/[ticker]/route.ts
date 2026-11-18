import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarketDataProvider, Timeframe } from "@/lib/market-data";
import { getMarketSimConfig } from "@/lib/services/market-sim";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  const { searchParams } = new URL(req.url);
  const timeframe = (searchParams.get("timeframe") || "1M") as Timeframe;

  const asset = await prisma.asset.findUnique({
    where: { ticker: ticker.toUpperCase() },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const provider = getMarketDataProvider();
  const simConfig = await getMarketSimConfig();

  const [quote, history, news] = await Promise.all([
    provider.getQuote(asset.ticker, asset.basePriceCents, asset.volatility, simConfig),
    provider.getHistory(
      asset.ticker,
      asset.basePriceCents,
      asset.volatility,
      timeframe,
      simConfig
    ),
    provider.getNews(asset.ticker, asset.name, asset.sector),
  ]);

  const user = await getCurrentUser();
  let position = null;
  let openOrders: unknown[] = [];
  let alerts: unknown[] = [];

  if (user) {
    [position, openOrders, alerts] = await Promise.all([
      prisma.position.findUnique({
        where: { userId_assetId: { userId: user.id, assetId: asset.id } },
      }),
      prisma.order.findMany({
        where: { userId: user.id, assetId: asset.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.priceAlert.findMany({
        where: { userId: user.id, assetId: asset.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
  }

  return NextResponse.json({
    asset,
    quote,
    history,
    news,
    position,
    openOrders,
    alerts,
    simConfig,
  });
}
