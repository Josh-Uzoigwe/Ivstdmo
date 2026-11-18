import { BRAND, CurrencyCode } from "@/config/brand";

export function getMidMarketFxRate(from: CurrencyCode | string, to: CurrencyCode | string): number {
  const f = (from in BRAND.baseFxRates ? from : "USD") as CurrencyCode;
  const t = (to in BRAND.baseFxRates ? to : "USD") as CurrencyCode;
  if (f === t) return 1;
  // baseFxRates are units of currency per 1 USD
  return BRAND.baseFxRates[t] / BRAND.baseFxRates[f];
}

export function convertCurrency(
  amountCents: number,
  from: CurrencyCode | string,
  to: CurrencyCode | string,
  applySpread = true
): {
  convertedCents: number;
  feeCentsInSource: number;
  midRate: number;
  effectiveRate: number;
} {
  const midRate = getMidMarketFxRate(from, to);
  if (from === to) {
    return {
      convertedCents: amountCents,
      feeCentsInSource: 0,
      midRate: 1,
      effectiveRate: 1,
    };
  }

  const spread = applySpread ? BRAND.fxSpreadPct : 0;
  const feeCentsInSource = Math.round(amountCents * spread);
  const netSourceCents = amountCents - feeCentsInSource;
  const convertedCents = Math.round(netSourceCents * midRate);
  const effectiveRate = midRate * (1 - spread);

  return {
    convertedCents,
    feeCentsInSource,
    midRate,
    effectiveRate,
  };
}
