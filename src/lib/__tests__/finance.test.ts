import { describe, it, expect } from "vitest";
import { convertCurrency, getMidMarketFxRate } from "../fx";
import { MockMarketDataProvider } from "../market-data/mock-provider";

describe("FX Conversion Math", () => {
  it("returns 1:1 when currencies match", () => {
    expect(getMidMarketFxRate("USD", "USD")).toBe(1);
    const res = convertCurrency(10000, "USD", "USD", true);
    expect(res.convertedCents).toBe(10000);
    expect(res.feeCentsInSource).toBe(0);
  });

  it("applies transparent 0.25% spread on cross-currency conversion", () => {
    const res = convertCurrency(100000, "USD", "EUR", true);
    expect(res.feeCentsInSource).toBe(250); // $2.50 on $1,000
    expect(res.convertedCents).toBeGreaterThan(80000);
    expect(res.convertedCents).toBeLessThan(95000);
  });
});

describe("MockMarketDataProvider", () => {
  it("produces valid quotes and historical bars anchored to live price", async () => {
    const provider = new MockMarketDataProvider();
    const quote = await provider.getQuote("AAPL", 22850, 0.018);
    expect(quote.ticker).toBe("AAPL");
    expect(quote.priceCents).toBeGreaterThan(0);

    const bars = await provider.getHistory("AAPL", 22850, 0.018, "1M");
    expect(bars.length).toBe(60);
    expect(bars[bars.length - 1].close).toBeCloseTo(quote.priceCents / 100, 2);
  });
});
