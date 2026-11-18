"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { formatMoney, formatPct } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";

interface HeroAsset {
  ticker: string;
  name: string;
  currency: string;
  exchange: string;
  quote: {
    priceCents: number;
    changePct: number;
    dayHighCents: number;
    dayLowCents: number;
  };
}

const FEATURED_TICKERS = ["AAPL", "NVDA", "BTC", "SPY", "ASML"];

const SPARK_PATHS: Record<string, number[]> = {
  AAPL: [218, 221, 219, 224, 223, 226, 225, 229, 227, 231, 228.5],
  NVDA: [128, 132, 130, 135, 133, 137, 134, 139, 136, 141, 138.4],
  BTC: [86500, 87200, 86900, 88400, 89100, 88600, 89800, 90200, 89500, 91100, 90450],
  SPY: [574, 576, 575, 578, 579, 581, 580, 582, 583, 585, 584.2],
  ASML: [652, 658, 655, 661, 664, 660, 665, 667, 663, 670, 668.4],
};

function buildSparklineSvg(points: number[]) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 320;
  const h = 88;
  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * w;
    const y = h - 8 - ((p - min) / range) * (h - 16);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${coords.join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  return { linePath, areaPath };
}

export function HeroShowcase() {
  const { t } = usePreferences();
  const [assets, setAssets] = useState<HeroAsset[]>([]);
  const [selected, setSelected] = useState("AAPL");

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((d) => {
        if (d.items) {
          setAssets(
            d.items.filter((i: HeroAsset) => FEATURED_TICKERS.includes(i.ticker))
          );
        }
      })
      .catch(() => {});

    const es = new EventSource(`/api/markets/stream?tickers=${FEATURED_TICKERS.join(",")}`);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.quotes) {
          setAssets((prev) =>
            prev.map((a) =>
              parsed.quotes[a.ticker] ? { ...a, quote: parsed.quotes[a.ticker] } : a
            )
          );
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, []);

  const current = assets.find((a) => a.ticker === selected) || {
    ticker: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
    exchange: "NASDAQ",
    quote: { priceCents: 22850, changePct: 1.42, dayHighCents: 23010, dayLowCents: 22540 },
  };

  const up = current.quote.changePct >= 0;
  const { linePath, areaPath } = buildSparklineSvg(
    SPARK_PATHS[current.ticker] || SPARK_PATHS.AAPL
  );

  const bidCents = Math.max(1, Math.round(current.quote.priceCents * 0.9994));
  const askCents = Math.round(current.quote.priceCents * 1.0006);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
    >
      {/* Terminal Window Bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.hero.liveStream}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {FEATURED_TICKERS.map((tk) => (
            <button
              key={tk}
              type="button"
              onClick={() => setSelected(tk)}
              className={`relative px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors ${
                selected === tk
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {selected === tk && (
                <motion.span
                  layoutId="hero-ticker-pill"
                  className="absolute inset-0 bg-slate-900 dark:bg-teal-600 rounded-md"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tk}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quote + Chart */}
      <div className="p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {current.exchange} · {current.ticker}
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {formatMoney(current.quote.priceCents, current.currency)}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block text-xs font-mono font-semibold tabular-nums px-2.5 py-1 rounded-md ${
                up
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
              }`}
            >
              {formatPct(current.quote.changePct)}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3">
          <svg viewBox="0 0 320 88" className="w-full h-24 overflow-visible">
            <defs>
              <linearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={up ? "#0f766e" : "#dc2626"} stopOpacity="0.28" />
                <stop offset="100%" stopColor={up ? "#0f766e" : "#dc2626"} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#heroSparkGrad)" />
            <motion.path
              key={current.ticker}
              initial={{ pathLength: 0.25, opacity: 0.5 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.55 }}
              d={linePath}
              fill="none"
              stroke={up ? "#0f766e" : "#dc2626"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Simulated Bid / Ask / Spread Strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-center py-2.5 text-xs font-mono tabular-nums">
          <div>
            <div className="text-[10px] uppercase text-slate-500">Bid</div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatMoney(bidCents, current.currency)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Ask</div>
            <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
              {formatMoney(askCents, current.currency)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Commission</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">$0.00</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Link
            href={`/markets/${current.ticker}`}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
          >
            <span>Buy {current.ticker}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/markets/${current.ticker}`}
            className="inline-flex items-center justify-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Full Chart & Depth
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
