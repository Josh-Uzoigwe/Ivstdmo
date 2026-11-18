import {
  MarketDataProvider,
  MarketSimConfig,
  NewsArticle,
  PriceBar,
  Quote,
  Timeframe,
} from "./types";

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalRandom(rng: () => number): number {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

const DEFAULT_SIM: MarketSimConfig = {
  isPaused: false,
  volatilityMultiplier: 1.0,
  tickSeedOffset: 0,
};

function computeLivePrice(
  ticker: string,
  basePriceCents: number,
  volatility: number,
  simConfig: MarketSimConfig = DEFAULT_SIM
): { priceCents: number; prevCloseCents: number; dayHighCents: number; dayLowCents: number; volume: number } {
  const nowSec = simConfig.isPaused
    ? 1763480000
    : Math.floor(Date.now() / 2000) * 2; // 2-second buckets

  const dayBucket = Math.floor(nowSec / 86400);
  const tickerHash = hashString(ticker);

  // Previous close is anchored to dayBucket
  const prevRng = mulberry32(tickerHash ^ (dayBucket - 1));
  const prevDrift = normalRandom(prevRng) * volatility * 0.8;
  const prevCloseCents = Math.max(10, Math.round(basePriceCents * (1 + prevDrift)));

  // Intraday walk using 5-minute steps + 2-second micro-tick
  const intraStep = Math.floor((nowSec % 86400) / 300);
  const intraRng = mulberry32(tickerHash ^ dayBucket ^ (simConfig.tickSeedOffset * 977));

  let current = prevCloseCents;
  let dayHigh = prevCloseCents;
  let dayLow = prevCloseCents;
  const volMult = Math.max(0.1, simConfig.volatilityMultiplier);

  const steps = Math.max(12, intraStep % 96);
  for (let i = 0; i < steps; i++) {
    const stepShock = normalRandom(intraRng) * (volatility * 0.14 * volMult);
    current = Math.max(10, Math.round(current * (1 + stepShock)));
    if (current > dayHigh) dayHigh = current;
    if (current < dayLow) dayLow = current;
  }

  // Micro-tick for smooth live streaming feel
  const microRng = mulberry32(tickerHash ^ (nowSec + simConfig.tickSeedOffset * 31));
  const microShock = normalRandom(microRng) * (volatility * 0.03 * volMult);
  const priceCents = Math.max(10, Math.round(current * (1 + microShock)));
  dayHigh = Math.max(dayHigh, priceCents);
  dayLow = Math.min(dayLow, priceCents);

  const volume = Math.round(500_000 + (tickerHash % 9_000_000) * (0.6 + intraRng() * 0.8));

  return {
    priceCents,
    prevCloseCents,
    dayHighCents: dayHigh,
    dayLowCents: dayLow,
    volume,
  };
}

export class MockMarketDataProvider implements MarketDataProvider {
  async getQuote(
    ticker: string,
    basePriceCents: number,
    volatility: number,
    simConfig?: MarketSimConfig
  ): Promise<Quote> {
    const sim = simConfig ?? DEFAULT_SIM;
    const { priceCents, prevCloseCents, dayHighCents, dayLowCents, volume } =
      computeLivePrice(ticker, basePriceCents, volatility, sim);

    const changeCents = priceCents - prevCloseCents;
    const changePct = prevCloseCents > 0 ? (changeCents / prevCloseCents) * 100 : 0;

    return {
      ticker,
      priceCents,
      prevCloseCents,
      changeCents,
      changePct,
      dayHighCents,
      dayLowCents,
      volume,
      updatedAt: new Date().toISOString(),
    };
  }

  async getQuotes(
    assets: { ticker: string; basePriceCents: number; volatility: number }[],
    simConfig?: MarketSimConfig
  ): Promise<Record<string, Quote>> {
    const entries = await Promise.all(
      assets.map(async (a) => [
        a.ticker,
        await this.getQuote(a.ticker, a.basePriceCents, a.volatility, simConfig),
      ])
    );
    return Object.fromEntries(entries);
  }

  async getHistory(
    ticker: string,
    basePriceCents: number,
    volatility: number,
    timeframe: Timeframe,
    simConfig?: MarketSimConfig
  ): Promise<PriceBar[]> {
    const sim = simConfig ?? DEFAULT_SIM;
    const live = computeLivePrice(ticker, basePriceCents, volatility, sim);
    const endPrice = live.priceCents / 100;

    const configMap: Record<Timeframe, { count: number; stepSec: number; stepVol: number }> = {
      "1D": { count: 78, stepSec: 300, stepVol: volatility * 0.08 },
      "1W": { count: 84, stepSec: 7200, stepVol: volatility * 0.25 },
      "1M": { count: 60, stepSec: 43200, stepVol: volatility * 0.5 },
      "1Y": { count: 252, stepSec: 86400, stepVol: volatility * 0.9 },
      "ALL": { count: 180, stepSec: 604800, stepVol: volatility * 1.8 },
    };

    const { count, stepSec, stepVol } = configMap[timeframe];
    const nowSec = Math.floor(Date.now() / 1000);
    const alignedEnd = Math.floor(nowSec / stepSec) * stepSec;

    const rng = mulberry32(hashString(`${ticker}:${timeframe}`));
    // Walk backwards from endPrice so the final close matches the live quote
    const closes: number[] = new Array(count);
    closes[count - 1] = endPrice;

    for (let i = count - 2; i >= 0; i--) {
      const shock = normalRandom(rng) * stepVol;
      // Slight long-term upward drift for ALL/1Y
      const drift = timeframe === "ALL" ? 0.0025 : timeframe === "1Y" ? 0.0005 : 0;
      const prev = closes[i + 1] / (1 + shock + drift);
      closes[i] = Math.max(0.5, Number(prev.toFixed(2)));
    }

    const bars: PriceBar[] = [];
    for (let i = 0; i < count; i++) {
      const close = closes[i];
      const open = i === 0 ? Number((close * (1 + normalRandom(rng) * stepVol * 0.4)).toFixed(2)) : closes[i - 1];
      const wickUp = Math.abs(normalRandom(rng)) * stepVol * 0.6;
      const wickDown = Math.abs(normalRandom(rng)) * stepVol * 0.6;
      const high = Number((Math.max(open, close) * (1 + wickUp)).toFixed(2));
      const low = Number(Math.max(0.1, Math.min(open, close) * (1 - wickDown)).toFixed(2));

      bars.push({
        time: alignedEnd - (count - 1 - i) * stepSec,
        open,
        high,
        low,
        close,
        volume: Math.round(100_000 + rng() * 2_500_000),
      });
    }

    return bars;
  }

  async getNews(ticker: string, companyName: string, sector: string): Promise<NewsArticle[]> {
    const rng = mulberry32(hashString(`news:${ticker}`));
    const templates = [
      {
        title: `${companyName} (${ticker}) Quarterly Volume & Margin Commentary`,
        source: "MarketWire Global",
        sentiment: "positive" as const,
        summary: `Analysts noted steady institutional demand in the ${sector} segment as ${companyName} outlined capital allocation priorities for the coming quarter.`,
      },
      {
        title: `Sector Watch: ${sector} Leaders Adjust to Shifting Rate Expectations`,
        source: "Financial Chronicle",
        sentiment: "neutral" as const,
        summary: `Trading desks across US and European venues monitored ${ticker} alongside sector peers following updated central bank guidance.`,
      },
      {
        title: `${companyName} Expands Product Roadmap Amid Competitive Pressures`,
        source: "Equities Desk",
        sentiment: "positive" as const,
        summary: `Management highlighted operational efficiency gains and cross-border expansion plans in a briefing for institutional investors.`,
      },
      {
        title: `Options & Flow Activity Picks Up in ${ticker} Ahead of Macro Data`,
        source: "Northstone Research",
        sentiment: "neutral" as const,
        summary: `Implied volatility in ${ticker} ticked modestly higher this week as portfolio managers hedged currency and rate exposure.`,
      },
    ];

    const now = Date.now();
    return templates.map((tpl, idx) => ({
      id: `${ticker}-news-${idx}`,
      ticker,
      title: tpl.title,
      source: tpl.source,
      sentiment: tpl.sentiment,
      summary: tpl.summary,
      publishedAt: new Date(now - (idx * 6 + Math.floor(rng() * 5)) * 3600 * 1000).toISOString(),
    }));
  }
}
