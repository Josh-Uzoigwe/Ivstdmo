"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TickerStrip } from "@/components/TickerStrip";
import { formatMoney, formatPct } from "@/lib/utils";

interface MarketItem {
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
    volume: number;
  };
}

export default function MarketsPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [query, setQuery] = useState("");
  const [assetClass, setAssetClass] = useState("ALL");
  const [currency, setCurrency] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setItems(d.items);
      })
      .finally(() => setLoading(false));

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

  const filtered = items.filter((a) => {
    if (assetClass !== "ALL" && a.assetClass !== assetClass) return false;
    if (currency !== "ALL" && a.currency !== currency) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return (
        a.ticker.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const topMovers = [...items]
    .sort((a, b) => Math.abs(b.quote.changePct) - Math.abs(a.quote.changePct))
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TickerStrip />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Global Markets</h1>
            <p className="text-sm text-slate-600 mt-1">
              Live simulated quotes across US, European, UK, and Digital Asset venues.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker, name, sector..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Top Movers */}
        {topMovers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {topMovers.map((m) => {
              const up = m.quote.changePct >= 0;
              return (
                <Link
                  key={m.id}
                  href={`/markets/${m.ticker}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{m.ticker}</span>
                    <span
                      className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {formatPct(m.quote.changePct)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{m.name}</div>
                  <div className="text-base font-bold text-slate-900 tabular-nums mt-2">
                    {formatMoney(m.quote.priceCents, m.currency)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "STOCK", "ETF", "CRYPTO"].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setAssetClass(cls)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  assetClass === cls
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cls === "ALL" ? "All Assets" : cls}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {["ALL", "USD", "EUR", "GBP"].map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currency === cur
                    ? "bg-teal-700 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading markets...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-3 px-4 font-semibold">Asset</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Venue</th>
                    <th className="py-3 px-4 font-semibold">Sector</th>
                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                    <th className="py-3 px-4 font-semibold text-right">24h Change</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {filtered.map((item) => {
                    const up = item.quote.changePct >= 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/markets/${item.ticker}`}
                            className="font-semibold text-slate-900 hover:text-teal-700"
                          >
                            {item.ticker}
                          </Link>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {item.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.assetClass}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {item.exchange} · {item.currency}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{item.sector}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                          {formatMoney(item.quote.priceCents, item.currency)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-semibold ${
                            up ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatPct(item.quote.changePct)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/markets/${item.ticker}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100"
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
