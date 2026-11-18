"use client";

import { Suspense, useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PriceChart } from "@/components/PriceChart";
import { formatMoney, formatPct, formatShares, formatDateTime } from "@/lib/utils";
import type { NewsArticle, PriceBar, Quote, Timeframe } from "@/lib/market-data/types";
import { BRAND } from "@/config/brand";
import { Bookmark, Bell, CheckCircle2, AlertCircle, Newspaper } from "lucide-react";

interface AssetDetail {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
  exchange: string;
  currency: string;
  sector: string;
  description: string;
  marketCapCents: number;
  peRatio: number | null;
  dividendYield: number | null;
  high52wCents: number;
  low52wCents: number;
}

interface UserInfo {
  id: string;
  baseCurrency: string;
  kycStatus: string;
  cashBalances: { currency: string; amountCents: number }[];
}

function AssetDetailInner({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [bars, setBars] = useState<PriceBar[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [position, setPosition] = useState<{ quantityDecimal: number; avgCostCents: number } | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [loading, setLoading] = useState(true);

  // Order ticket state
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [sizingMode, setSizingMode] = useState<"AMOUNT" | "SHARES">("AMOUNT");
  const [amountInput, setAmountInput] = useState("500");
  const [sharesInput, setSharesInput] = useState("1");
  const [triggerPriceInput, setTriggerPriceInput] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [orderMsg, setOrderMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Alert / Watchlist state
  const [alertPrice, setAlertPrice] = useState("");
  const [watchlisted, setWatchlisted] = useState(false);

  const loadData = useCallback(async (tf: Timeframe) => {
    const [assetRes, meRes] = await Promise.all([
      fetch(`/api/markets/${ticker}?timeframe=${tf}`),
      fetch("/api/auth/me"),
    ]);
    if (assetRes.ok) {
      const d = await assetRes.json();
      setAsset(d.asset);
      setQuote(d.quote);
      setBars(d.history);
      setNews(d.news);
      setPosition(d.position);
      if (!triggerPriceInput && d.quote) {
        setTriggerPriceInput((d.quote.priceCents / 100).toFixed(2));
        setAlertPrice(((d.quote.priceCents * 1.05) / 100).toFixed(2));
      }
    }
    if (meRes.ok) {
      const m = await meRes.json();
      setUser(m.user);
    }
    setLoading(false);
  }, [ticker, triggerPriceInput]);

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe, loadData]);

  // Live SSE quote updates
  useEffect(() => {
    const es = new EventSource(`/api/markets/stream?tickers=${ticker.toUpperCase()}`);
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        const q = parsed.quotes?.[ticker.toUpperCase()];
        if (q) setQuote(q);
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [ticker]);

  const submitOrder = async () => {
    if (!asset || !quote) return;
    setSubmitting(true);
    setOrderMsg(null);
    try {
      const payload: Record<string, unknown> = {
        assetId: asset.id,
        side,
        orderType,
      };
      if (sizingMode === "AMOUNT") {
        payload.notionalCents = Math.round(Number(amountInput) * 100);
      } else {
        payload.quantityDecimal = Number(sharesInput);
      }
      if (orderType === "LIMIT") {
        payload.limitPriceCents = Math.round(Number(triggerPriceInput) * 100);
      } else if (orderType === "STOP") {
        payload.stopPriceCents = Math.round(Number(triggerPriceInput) * 100);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderMsg({ type: "err", text: data.error || "Order failed." });
      } else {
        setOrderMsg({
          type: "ok",
          text:
            data.order.status === "FILLED"
              ? `Filled ${side} order for ${asset.ticker}.`
              : `Placed ${orderType} ${side} order for ${asset.ticker}.`,
        });
        setReviewing(false);
        loadData(timeframe);
      }
    } catch {
      setOrderMsg({ type: "err", text: "Network error placing order." });
    } finally {
      setSubmitting(false);
    }
  };

  const addToWatchlist = async () => {
    if (!asset || !user) return;
    const wlRes = await fetch("/api/watchlists");
    const wlData = await wlRes.json();
    const listId = wlData.watchlists?.[0]?.id;
    if (!listId) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_item", watchlistId: listId, assetId: asset.id }),
    });
    setWatchlisted(true);
  };

  const createAlert = async () => {
    if (!asset || !quote || !user) return;
    const targetCents = Math.round(Number(alertPrice) * 100);
    if (!targetCents || targetCents <= 0) return;
    const direction = targetCents >= quote.priceCents ? "ABOVE" : "BELOW";
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: asset.id, direction, targetPriceCents: targetCents }),
    });
    if (res.ok) {
      setOrderMsg({
        type: "ok",
        text: `Price alert set for ${asset.ticker} ${direction.toLowerCase()} ${formatMoney(targetCents, asset.currency)}.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full animate-pulse">
          <div className="h-12 bg-slate-200 rounded-xl w-64 mb-6" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!asset || !quote) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Asset not found</h1>
          <Link href="/markets" className="text-teal-700 font-semibold mt-3 inline-block">
            ← Back to Markets
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const up = quote.changePct >= 0;
  const nativeBal =
    user?.cashBalances.find((b) => b.currency === asset.currency)?.amountCents ?? 0;

  const estOrderCents =
    sizingMode === "AMOUNT"
      ? Math.round((Number(amountInput) || 0) * 100)
      : Math.round((Number(sharesInput) || 0) * quote.priceCents);
  const needsAutoFx = side === "BUY" && estOrderCents > nativeBal;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{asset.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-200 text-slate-800">
                {asset.ticker}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {asset.exchange} · {asset.currency}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-2 tabular-nums">
              <span className="text-3xl font-bold text-slate-900">
                {formatMoney(quote.priceCents, asset.currency)}
              </span>
              <span
                className={`text-sm font-semibold ${
                  up ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatMoney(quote.changeCents, asset.currency, { showSign: true })} (
                {formatPct(quote.changePct)})
              </span>
            </div>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addToWatchlist}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Bookmark className="w-3.5 h-3.5 text-teal-700" />
                <span>{watchlisted ? "Watchlisted" : "Add to Watchlist"}</span>
              </button>
              <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1">
                <input
                  type="number"
                  step="0.01"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="w-20 text-xs font-mono px-1.5 py-1 focus:outline-none"
                  aria-label="Alert price"
                />
                <button
                  type="button"
                  onClick={createAlert}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                >
                  <Bell className="w-3 h-3" />
                  <span>Alert</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart & Stats */}
          <div className="lg:col-span-8 space-y-6">
            <PriceChart
              bars={bars}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              isPositive={up}
            />

            {/* Position card if held */}
            {position && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Your Position
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">
                    {formatShares(position.quantityDecimal)} {asset.ticker}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-xs text-slate-500">Market Value</div>
                  <div className="text-lg font-bold text-slate-900">
                    {formatMoney(
                      Math.round(position.quantityDecimal * quote.priceCents),
                      asset.currency
                    )}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-xs text-slate-500">Avg Cost</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {formatMoney(position.avgCostCents, asset.currency)}
                  </div>
                </div>
              </div>
            )}

            {/* Key Stats & About */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Key Statistics & Profile</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm tabular-nums">
                <div>
                  <div className="text-xs text-slate-500">Day High</div>
                  <div className="font-semibold text-slate-900">
                    {formatMoney(quote.dayHighCents, asset.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Day Low</div>
                  <div className="font-semibold text-slate-900">
                    {formatMoney(quote.dayLowCents, asset.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">52W Range</div>
                  <div className="font-semibold text-slate-900">
                    {formatMoney(asset.low52wCents, asset.currency)} –{" "}
                    {formatMoney(asset.high52wCents, asset.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">P/E / Yield</div>
                  <div className="font-semibold text-slate-900">
                    {asset.peRatio ? `${asset.peRatio}x` : "—"} /{" "}
                    {asset.dividendYield ? `${asset.dividendYield}%` : "—"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {asset.description}
              </p>
            </div>

            {/* News Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-teal-700" />
                <h2 className="text-base font-semibold text-slate-900">
                  Latest {asset.ticker} News
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {news.map((n) => (
                  <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{n.source}</span>
                      <span>{formatDateTime(n.publishedAt)}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    <p className="text-xs text-slate-600 mt-1">{n.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Ticket */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 sticky top-24 space-y-5 shadow-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                {(["BUY", "SELL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSide(s);
                      setReviewing(false);
                    }}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                      side === s
                        ? s === "BUY"
                          ? "bg-teal-700 text-white"
                          : "bg-rose-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {s === "BUY" ? `Buy ${asset.ticker}` : `Sell ${asset.ticker}`}
                  </button>
                ))}
              </div>

              {orderMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    orderMsg.type === "ok"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {orderMsg.type === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{orderMsg.text}</span>
                </div>
              )}

              {!user ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-slate-600">
                    Sign in or open a free demo account to trade {asset.ticker}.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="flex-1 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              ) : user.kycStatus !== "APPROVED" ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
                  <div className="font-semibold">Verification Required</div>
                  <p>Complete your quick KYC & risk profile to unlock trading.</p>
                  <Link
                    href="/onboarding"
                    className="inline-block px-3.5 py-2 rounded-lg bg-amber-700 text-white font-semibold"
                  >
                    Complete Onboarding
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["MARKET", "LIMIT", "STOP"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setOrderType(t);
                          setReviewing(false);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border ${
                          orderType === t
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {orderType !== "MARKET" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {orderType === "LIMIT" ? "Limit Price" : "Stop Price"} ({asset.currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={triggerPriceInput}
                        onChange={(e) => setTriggerPriceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">Order Size</label>
                      <button
                        type="button"
                        onClick={() =>
                          setSizingMode(sizingMode === "AMOUNT" ? "SHARES" : "AMOUNT")
                        }
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Switch to {sizingMode === "AMOUNT" ? "Shares" : asset.currency}
                      </button>
                    </div>
                    {sizingMode === "AMOUNT" ? (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm tabular-nums"
                        placeholder={`Amount in ${asset.currency}`}
                      />
                    ) : (
                      <input
                        type="number"
                        min="0.0001"
                        step="0.01"
                        value={sharesInput}
                        onChange={(e) => setSharesInput(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm tabular-nums"
                        placeholder="Number of shares"
                      />
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5 tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{asset.currency} Wallet</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(nativeBal, asset.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Total</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(estOrderCents, asset.currency)}
                      </span>
                    </div>
                    {needsAutoFx && (
                      <div className="text-[11px] text-amber-700 pt-1 border-t border-slate-200">
                        Auto-FX conversion ({BRAND.fxSpreadPct * 100}% spread) will convert from your funded wallet.
                      </div>
                    )}
                  </div>

                  {!reviewing ? (
                    <button
                      type="button"
                      onClick={() => setReviewing(true)}
                      className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-colors ${
                        side === "BUY"
                          ? "bg-teal-700 hover:bg-teal-800"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      Review {side} Order
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="text-xs text-slate-600">
                        Confirm {orderType} {side} of{" "}
                        <strong>
                          {sizingMode === "AMOUNT"
                            ? formatMoney(estOrderCents, asset.currency)
                            : `${sharesInput} ${asset.ticker}`}
                        </strong>
                        ?
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewing(false)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={submitOrder}
                          className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                        >
                          {submitting ? "Submitting..." : "Confirm Order"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AssetDetailInner params={params} />
    </Suspense>
  );
}
