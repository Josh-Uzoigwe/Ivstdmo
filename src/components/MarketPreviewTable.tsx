"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatMoney, formatPct } from "@/lib/utils";

interface MarketRow {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
  exchange: string;
  currency: string;
  sector: string;
  quote: {
    priceCents: number;
    changePct: number;
  };
}

export function MarketPreviewTable() {
  const [items, setItems] = useState<MarketRow[]>([]);
  const [tab, setTab] = useState<"ALL" | "STOCK" | "ETF" | "CRYPTO">("ALL");

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setItems(d.items);
      })
      .catch(() => {});

    const es = new EventSource("/api/markets/stream");
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.quotes) {
          setItems((prev) =>
            prev.map((item) =>
              parsed.quotes[item.ticker]
                ? { ...item, quote: parsed.quotes[item.ticker] }
                : item
            )
          );
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, []);

  const filtered = (tab === "ALL" ? items : items.filter((i) => i.assetClass === tab)).slice(
    0,
    7
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Live Market Watch
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time simulated quotes across US, European, UK, and Crypto venues
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(["ALL", "STOCK", "ETF", "CRYPTO"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                tab === t
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t === "ALL" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3 px-5">Ticker</th>
              <th className="py-3 px-5">Name</th>
              <th className="py-3 px-5">Venue</th>
              <th className="py-3 px-5 text-right">Last Price</th>
              <th className="py-3 px-5 text-right">24h</th>
              <th className="py-3 px-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {filtered.map((item) => {
              const up = item.quote.changePct >= 0;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-5 font-mono font-bold text-slate-900 dark:text-white">
                    {item.ticker}
                  </td>
                  <td className="py-3 px-5 text-slate-700 dark:text-slate-300">
                    {item.name}
                  </td>
                  <td className="py-3 px-5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {item.exchange} · {item.currency}
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {formatMoney(item.quote.priceCents, item.currency)}
                  </td>
                  <td
                    className={`py-3 px-5 text-right font-mono font-semibold ${
                      up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatPct(item.quote.changePct)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Link
                      href={`/markets/${item.ticker}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                    >
                      <span>Trade</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <Link
          href="/markets"
          className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
        >
          View all 35 markets →
        </Link>
      </div>
    </div>
  );
}
