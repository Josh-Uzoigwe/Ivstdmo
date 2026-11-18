import { prisma } from "@/lib/prisma";
import { MarketSimConfig } from "@/lib/market-data";

export async function getMarketSimConfig(): Promise<MarketSimConfig> {
  const state = await prisma.marketSimState.findUnique({
    where: { id: "singleton" },
  });
  if (!state) {
    return {
      isPaused: false,
      volatilityMultiplier: 1.0,
      tickSeedOffset: 0,
      activeEventName: null,
    };
  }
  return {
    isPaused: state.isPaused,
    volatilityMultiplier: state.volatilityMultiplier,
    tickSeedOffset: state.tickSeedOffset,
    activeEventName: state.activeEventName,
  };
}
