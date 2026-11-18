import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMarketDataProvider } from "@/lib/market-data";
import { getMarketSimConfig } from "@/lib/services/market-sim";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: { asset: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const allAssets = watchlists.flatMap((w) => w.items.map((i) => i.asset));
  const provider = getMarketDataProvider();
  const simConfig = await getMarketSimConfig();
  const quotes = await provider.getQuotes(
    allAssets.map((a) => ({
      ticker: a.ticker,
      basePriceCents: a.basePriceCents,
      volatility: a.volatility,
    })),
    simConfig
  );

  return NextResponse.json({ watchlists, quotes });
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_list"), name: z.string().min(1).max(40) }),
  z.object({ action: z.literal("add_item"), watchlistId: z.string(), assetId: z.string() }),
  z.object({ action: z.literal("remove_item"), watchlistId: z.string(), assetId: z.string() }),
  z.object({ action: z.literal("delete_list"), watchlistId: z.string() }),
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watchlist action." }, { status: 400 });
  }

  const d = parsed.data;
  if (d.action === "create_list") {
    const wl = await prisma.watchlist.create({
      data: { userId: user.id, name: d.name.trim() },
    });
    return NextResponse.json({ watchlist: wl });
  }

  const wl = await prisma.watchlist.findUnique({ where: { id: d.watchlistId } });
  if (!wl || wl.userId !== user.id) {
    return NextResponse.json({ error: "Watchlist not found." }, { status: 404 });
  }

  if (d.action === "add_item") {
    await prisma.watchlistItem.upsert({
      where: { watchlistId_assetId: { watchlistId: wl.id, assetId: d.assetId } },
      update: {},
      create: { watchlistId: wl.id, assetId: d.assetId },
    });
  } else if (d.action === "remove_item") {
    await prisma.watchlistItem.deleteMany({
      where: { watchlistId: wl.id, assetId: d.assetId },
    });
  } else if (d.action === "delete_list") {
    await prisma.watchlist.delete({ where: { id: wl.id } });
  }

  return NextResponse.json({ ok: true });
}
