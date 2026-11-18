import { MockMarketDataProvider } from "./mock-provider";
import { MarketDataProvider } from "./types";

let providerInstance: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (providerInstance) return providerInstance;

  const mode = process.env.MARKET_DATA_PROVIDER || "mock";
  switch (mode) {
    case "mock":
    default:
      providerInstance = new MockMarketDataProvider();
      return providerInstance;
  }
}

export * from "./types";
