import { prisma } from "@/lib/prisma";
import { getMarketDataProvider } from "@/lib/market-data";
import { getMarketSimConfig } from "@/lib/services/market-sim";
import { evaluatePendingTriggers } from "@/lib/services/trading";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tickersParam = searchParams.get("tickers");
  const tickersFilter = tickersParam
    ? tickersParam.split(",").map((t) => t.trim().toUpperCase())
    : null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const sendTick = async () => {
        if (closed) return;
        try {
          await evaluatePendingTriggers();
          const assets = await prisma.asset.findMany({
            where: {
              isActive: true,
              ...(tickersFilter ? { ticker: { in: tickersFilter } } : {}),
            },
            select: { ticker: true, basePriceCents: true, volatility: true },
          });

          const provider = getMarketDataProvider();
          const simConfig = await getMarketSimConfig();
          const quotes = await provider.getQuotes(assets, simConfig);

          const payload = JSON.stringify({ quotes, simConfig, ts: Date.now() });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error("SSE tick error:", err);
        }
      };

      await sendTick();
      const interval = setInterval(sendTick, 2500);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
