import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarketDataProvider } from "@/lib/market-data";
import { getMarketSimConfig } from "@/lib/services/market-sim";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";
  const assetClass = searchParams.get("assetClass") || "";
  const currency = searchParams.get("currency") || "";
  const sector = searchParams.get("sector") || "";

  const assets = await prisma.asset.findMany({
    where: {
      isActive: true,
      ...(assetClass ? { assetClass } : {}),
      ...(currency ? { currency } : {}),
      ...(sector ? { sector } : {}),
    },
    orderBy: { ticker: "asc" },
  });

  const filtered = q
    ? assets.filter(
        (a) =>
          a.ticker.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.sector.toLowerCase().includes(q)
      )
    : assets;

  const provider = getMarketDataProvider();
  const simConfig = await getMarketSimConfig();
  const quotes = await provider.getQuotes(
    filtered.map((a) => ({
      ticker: a.ticker,
      basePriceCents: a.basePriceCents,
      volatility: a.volatility,
    })),
    simConfig
  );

  const items = filtered.map((asset) => ({
    ...asset,
    quote: quotes[asset.ticker],
  }));

  return NextResponse.json({ items, simConfig });
}
