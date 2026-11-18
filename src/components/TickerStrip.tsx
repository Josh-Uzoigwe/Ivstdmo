"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney, formatPct } from "@/lib/utils";

interface TickerItem {
  ticker: string;
  currency: string;
  assetClass: string;
  quote: {
    priceCents: number;
    changePct: number;
  };
}

export function TickerStrip() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/markets")
      .then((r) => r.json())
      .then((data) => {
        if (active && data.items) {
          setItems(data.items.slice(0, 14));
        }
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

    return () => {
      active = false;
      es.close();
    };
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 overflow-hidden py-2">
      <div className="animate-ticker flex items-center gap-6 px-4 text-xs font-medium tabular-nums">
        {doubled.map((item, idx) => {
          const up = item.quote.changePct >= 0;
          return (
            <Link
              key={`${item.ticker}-${idx}`}
              href={`/markets/${item.ticker}`}
              className="inline-flex items-center gap-2 hover:text-white transition-colors shrink-0"
            >
              <span className="font-semibold text-white">{item.ticker}</span>
              <span className="text-slate-300">
                {formatMoney(item.quote.priceCents, item.currency)}
              </span>
              <span className={up ? "text-emerald-400" : "text-rose-400"}>
                {formatPct(item.quote.changePct)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
