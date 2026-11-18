export type CurrencyCode = "USD" | "EUR" | "GBP";

export interface ManagedPlan {
  id: string;
  name: string;
  tagline: string;
  riskLevel: "Conservative" | "Balanced" | "Growth";
  minInvestmentCents: number;
  projectedAnnualReturn: {
    worst: number; // %
    typical: number; // %
    best: number; // %
  };
  annualFeePct: number;
  allocation: { label: string; pct: number; color: string }[];
  disclosure: string;
}

export const BRAND = {
  name: "Northstone",
  legalName: "Northstone Financial Technologies Ltd.",
  tagline: "Calm, transparent investing across global markets.",
  supportEmail: "support@northstone-demo.example",
  domain: "northstone-demo.example",
  foundedYear: 2026,
  // Theme accents (clean light banking feel)
  colors: {
    primary: "#0F766E", // Deep emerald/teal
    primaryHover: "#115E59",
    navy: "#0F172A",
    gain: "#16A34A",
    loss: "#DC2626",
  },
  currencies: ["USD", "EUR", "GBP"] as CurrencyCode[],
  currencySymbols: {
    USD: "$",
    EUR: "€",
    GBP: "£",
  } as Record<CurrencyCode, string>,
  // FX mid-market base rates relative to 1 USD
  baseFxRates: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
  } as Record<CurrencyCode, number>,
  fxSpreadPct: 0.0025, // 0.25% transparent FX spread
  demoDepositPresetsCents: [100000, 500000, 2500000], // $1,000 / $5,000 / $25,000
  referralBonusCents: 2500, // $25 welcome credit (demo)
  managedPlans: [
    {
      id: "starter-shield",
      name: "Starter Shield",
      tagline: "Capital-preservation tilt with broad index ETFs and short-duration bonds.",
      riskLevel: "Conservative",
      minInvestmentCents: 10000, // $100
      projectedAnnualReturn: { worst: -3.5, typical: 5.2, best: 9.8 },
      annualFeePct: 0.25,
      allocation: [
        { label: "Investment-Grade Bonds", pct: 55, color: "#0F766E" },
        { label: "Global Dividend Equities", pct: 30, color: "#0284C7" },
        { label: "Treasury Cash Equivalents", pct: 15, color: "#64748B" },
      ],
      disclosure:
        "Projected ranges are hypothetical historical-model estimates, not guaranteed returns. Capital is at risk.",
    },
    {
      id: "core-growth",
      name: "Core Growth",
      tagline: "Diversified US, European, and UK equities paired with stabilizing fixed income.",
      riskLevel: "Balanced",
      minInvestmentCents: 50000, // $500
      projectedAnnualReturn: { worst: -12.0, typical: 8.4, best: 17.5 },
      annualFeePct: 0.35,
      allocation: [
        { label: "US & Global Index ETFs", pct: 65, color: "#0F766E" },
        { label: "European & UK Equities", pct: 20, color: "#0284C7" },
        { label: "Aggregate Bonds", pct: 15, color: "#64748B" },
      ],
      disclosure:
        "Projected ranges reflect simulated market cycles. Past or modeled performance does not guarantee future results.",
    },
    {
      id: "global-alpha",
      name: "Global Alpha + Digital",
      tagline: "High-conviction equity growth with a capped 10% digital asset sleeve.",
      riskLevel: "Growth",
      minInvestmentCents: 250000, // $2,500
      projectedAnnualReturn: { worst: -24.0, typical: 11.6, best: 28.0 },
      annualFeePct: 0.45,
      allocation: [
        { label: "Global Tech & Innovation", pct: 60, color: "#0F766E" },
        { label: "International Growth", pct: 30, color: "#0284C7" },
        { label: "Major Crypto (BTC/ETH)", pct: 10, color: "#F59E0B" },
      ],
      disclosure:
        "High volatility portfolio including digital assets. Significant drawdowns are possible; no return is guaranteed.",
    },
  ] as ManagedPlan[],
};
