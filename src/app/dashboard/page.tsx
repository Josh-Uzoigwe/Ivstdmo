"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatPct, formatShares } from "@/lib/utils";
import { ArrowUpRight, Wallet, PlusCircle, XCircle, TrendingUp } from "lucide-react";

interface PortfolioData {
  baseCurrency: string;
  totalValueBaseCents: number;
  holdingsValueBaseCents: number;
  cashBaseCents: number;
  managedBaseCents: number;
  dayPnlBaseCents: number;
  totalUnrealizedPnlBaseCents: number;
  holdings: {
    id: string;
    asset: {
      id: string;
      ticker: string;
      name: string;
      currency: string;
      assetClass: string;
    };
    quantityDecimal: number;
    avgCostCents: number;
    currentPriceCents: number;
    changePct: number;
    marketValueAssetCents: number;
    marketValueBaseCents: number;
    unrealizedPnlAssetCents: number;
    unrealizedPnlPct: number;
  }[];
  balances: { currency: string; amountCents: number }[];
  allocation: { name: string; valueCents: number; pct: number }[];
  openOrders: {
    id: string;
    side: string;
    orderType: string;
    quantityDecimal: number | null;
    notionalCents: number | null;
    limitPriceCents: number | null;
    stopPriceCents: number | null;
    asset: { ticker: string; currency: string };
  }[];
}

const COLORS = ["#0f766e", "#0284c7", "#6366f1", "#f59e0b", "#64748b"];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 5000);
    return () => clearInterval(interval);
  }, [loadPortfolio]);

  const cancelOrder = async (id: string) => {
    await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
    loadPortfolio();
  };

  if (loading || !data) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const base = data.baseCurrency;
  const dayUp = data.dayPnlBaseCents >= 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>
            <p className="text-sm text-slate-500">
              Consolidated in {base} · Real-time simulated valuation
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Wallet className="w-4 h-4 text-teal-700" />
              <span>Deposit / FX</span>
            </Link>
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trade Markets</span>
            </Link>
          </div>
        </div>

        {/* Empty Account Onboarding Banner */}
        {data.totalValueBaseCents === 0 && (
          <div className="rounded-2xl bg-teal-50 border border-teal-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-teal-950">
                Your account is ready to fund
              </h2>
              <p className="text-sm text-teal-800 mt-1">
                Credit instant virtual USD, EUR, or GBP in your Wallet to place your first trade in under 30 seconds.
              </p>
            </div>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Demo Funds</span>
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Portfolio Value
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
              {formatMoney(data.totalValueBaseCents, base)}
            </div>
            <div
              className={`text-xs font-medium tabular-nums mt-1 ${
                dayUp ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatMoney(data.dayPnlBaseCents, base, { showSign: true })} today
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Invested Holdings
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
              {formatMoney(data.holdingsValueBaseCents, base)}
            </div>
            <div
              className={`text-xs font-medium tabular-nums mt-1 ${
                data.totalUnrealizedPnlBaseCents >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatMoney(data.totalUnrealizedPnlBaseCents, base, { showSign: true })} unrealized
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Cash Buying Power
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
              {formatMoney(data.cashBaseCents, base)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across {data.balances.filter((b) => b.amountCents > 0).length || 3} currencies
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Managed Portfolios
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
              {formatMoney(data.managedBaseCents, base)}
            </div>
            <Link
              href="/plans"
              className="text-xs text-teal-700 font-medium hover:underline mt-1 inline-block"
            >
              Manage allocations →
            </Link>
          </div>
        </div>

        {/* Allocation + Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Asset Allocation</h2>
            {data.allocation.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                No assets or cash yet
              </div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.allocation}
                        dataKey="valueCents"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {data.allocation.map((entry, idx) => (
                          <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatMoney(Number(value), base)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-3">
                  {data.allocation.map((a, idx) => (
                    <div key={a.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        {a.name}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {a.pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Your Holdings</h2>
              <Link href="/markets" className="text-xs font-medium text-teal-700 hover:underline">
                Browse assets
              </Link>
            </div>

            {data.holdings.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                You have no open positions yet. Visit{" "}
                <Link href="/markets" className="text-teal-700 font-semibold hover:underline">
                  Markets
                </Link>{" "}
                to buy your first stock, ETF, or crypto.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="pb-2.5 font-medium">Asset</th>
                      <th className="pb-2.5 font-medium text-right">Shares</th>
                      <th className="pb-2.5 font-medium text-right">Price</th>
                      <th className="pb-2.5 font-medium text-right">Value</th>
                      <th className="pb-2.5 font-medium text-right">Return</th>
                      <th className="pb-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {data.holdings.map((h) => {
                      const up = h.unrealizedPnlAssetCents >= 0;
                      return (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="py-3">
                            <Link
                              href={`/markets/${h.asset.ticker}`}
                              className="font-semibold text-slate-900 hover:text-teal-700"
                            >
                              {h.asset.ticker}
                            </Link>
                            <div className="text-xs text-slate-500 truncate max-w-[160px]">
                              {h.asset.name}
                            </div>
                          </td>
                          <td className="py-3 text-right text-slate-700">
                            {formatShares(h.quantityDecimal)}
                          </td>
                          <td className="py-3 text-right text-slate-700">
                            {formatMoney(h.currentPriceCents, h.asset.currency)}
                          </td>
                          <td className="py-3 text-right font-semibold text-slate-900">
                            {formatMoney(h.marketValueAssetCents, h.asset.currency)}
                          </td>
                          <td
                            className={`py-3 text-right font-medium ${
                              up ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatPct(h.unrealizedPnlPct)}
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/markets/${h.asset.ticker}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
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
        </div>

        {/* Open Limit/Stop Orders */}
        {data.openOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Open Limit & Stop Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Ticker</th>
                    <th className="pb-2 font-medium">Side / Type</th>
                    <th className="pb-2 font-medium text-right">Size</th>
                    <th className="pb-2 font-medium text-right">Trigger Price</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {data.openOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 font-semibold text-slate-900">{o.asset.ticker}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            o.side === "BUY"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {o.side} {o.orderType}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {o.quantityDecimal
                          ? `${formatShares(o.quantityDecimal)} sh`
                          : formatMoney(o.notionalCents || 0, o.asset.currency)}
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {formatMoney(
                          o.limitPriceCents ?? o.stopPriceCents ?? 0,
                          o.asset.currency
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => cancelOrder(o.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
