export type Timeframe = "1D" | "1W" | "1M" | "1Y" | "ALL";

export interface Quote {
  ticker: string;
  priceCents: number;
  prevCloseCents: number;
  changeCents: number;
  changePct: number;
  dayHighCents: number;
  dayLowCents: number;
  volume: number;
  updatedAt: string;
}

export interface PriceBar {
  time: number; // unix timestamp in seconds
  open: number; // in major currency units (e.g. 182.45)
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  id: string;
  ticker: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface MarketSimConfig {
  isPaused: boolean;
  volatilityMultiplier: number;
  tickSeedOffset: number;
  activeEventName?: string | null;
}

export interface MarketDataProvider {
  getQuote(
    ticker: string,
    basePriceCents: number,
    volatility: number,
    simConfig?: MarketSimConfig
  ): Promise<Quote>;

  getQuotes(
    assets: { ticker: string; basePriceCents: number; volatility: number }[],
    simConfig?: MarketSimConfig
  ): Promise<Record<string, Quote>>;

  getHistory(
    ticker: string,
    basePriceCents: number,
    volatility: number,
    timeframe: Timeframe,
    simConfig?: MarketSimConfig
  ): Promise<PriceBar[]>;

  getNews(ticker: string, companyName: string, sector: string): Promise<NewsArticle[]>;
}
