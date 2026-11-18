"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BRAND, CurrencyCode } from "@/config/brand";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { ArrowLeftRight, PlusCircle, ArrowDownToLine, Sparkles } from "lucide-react";

interface Balance {
  currency: string;
  amountCents: number;
}

interface Tx {
  id: string;
  type: string;
  currency: string;
  amountCents: number;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>("USD");
  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Forms
  const [depositCur, setDepositCur] = useState<CurrencyCode>("USD");
  const [depositAmt, setDepositAmt] = useState("1000");
  const [withdrawCur, setWithdrawCur] = useState<CurrencyCode>("USD");
  const [withdrawAmt, setWithdrawAmt] = useState("100");
  const [fxFrom, setFxFrom] = useState<CurrencyCode>("USD");
  const [fxTo, setFxTo] = useState<CurrencyCode>("EUR");
  const [fxAmt, setFxAmt] = useState("500");

  const loadWallet = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const d = await res.json();
    setBalances(d.balances || []);
    setTransactions(d.transactions || []);
    setBaseCurrency(d.baseCurrency || "USD");
    setFxRates(d.fxRates || {});
  }, [router]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const postAction = async (payload: Record<string, unknown>, successText: string) => {
    setMsg("");
    setErr("");
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) {
      setErr(d.error || "Action failed.");
    } else {
      setMsg(successText);
      loadWallet();
    }
  };

  const midRate =
    fxRates[fxTo] && fxRates[fxFrom] ? fxRates[fxTo] / fxRates[fxFrom] : 1;
  const estConverted = Number(fxAmt || 0) * midRate * (1 - BRAND.fxSpreadPct);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Multi-Currency Wallet & FX</h1>
            <p className="text-sm text-slate-500">
              Manage USD, EUR, and GBP cash balances or credit instant demo funds.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Reporting Currency:</span>
            <select
              value={baseCurrency}
              onChange={(e) =>
                postAction(
                  { action: "set_base_currency", baseCurrency: e.target.value },
                  `Base reporting currency updated to ${e.target.value}.`
                )
              }
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
            >
              {BRAND.currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {msg}
          </div>
        )}
        {err && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {err}
          </div>
        )}

        {/* Quick Demo Funds Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Instant Demo Funding</span>
            </div>
            <h2 className="text-lg font-semibold">Need virtual cash to start trading?</h2>
            <p className="text-xs text-slate-300">
              Credit simulated funds into your USD wallet in one click.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {BRAND.demoDepositPresetsCents.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() =>
                  postAction(
                    { action: "deposit", currency: "USD", amountCents: cents, isDemo: true },
                    `Credited ${formatMoney(cents, "USD")} demo funds.`
                  )
                }
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold tabular-nums transition-colors"
              >
                + {formatMoney(cents, "USD")}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BRAND.currencies.map((cur) => {
            const bal = balances.find((b) => b.currency === cur)?.amountCents ?? 0;
            return (
              <div key={cur} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {cur} Wallet
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
                  {formatMoney(bal, cur)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deposit */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              postAction(
                {
                  action: "deposit",
                  currency: depositCur,
                  amountCents: Math.round(Number(depositAmt) * 100),
                },
                `Deposited ${depositAmt} ${depositCur}.`
              );
            }}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <PlusCircle className="w-4 h-4 text-teal-700" />
              <span>Deposit Funds</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={depositCur}
                onChange={(e) => setDepositCur(e.target.value as CurrencyCode)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {BRAND.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
            >
              Simulate Bank Deposit
            </button>
          </form>

          {/* FX Convert */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              postAction(
                {
                  action: "fx_convert",
                  fromCurrency: fxFrom,
                  toCurrency: fxTo,
                  amountCents: Math.round(Number(fxAmt) * 100),
                },
                `Converted ${fxAmt} ${fxFrom} to ${fxTo}.`
              );
            }}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ArrowLeftRight className="w-4 h-4 text-teal-700" />
              <span>Convert Currency (0.25% FX)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={fxFrom}
                onChange={(e) => setFxFrom(e.target.value as CurrencyCode)}
                className="px-2.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {BRAND.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={fxTo}
                onChange={(e) => setFxTo(e.target.value as CurrencyCode)}
                className="px-2.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {BRAND.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={fxAmt}
                onChange={(e) => setFxAmt(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              Est. receive: <strong>{estConverted.toFixed(2)} {fxTo}</strong> (rate {midRate.toFixed(4)})
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Convert Now
            </button>
          </form>

          {/* Withdraw */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              postAction(
                {
                  action: "withdraw",
                  currency: withdrawCur,
                  amountCents: Math.round(Number(withdrawAmt) * 100),
                },
                `Withdrew ${withdrawAmt} ${withdrawCur}.`
              );
            }}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ArrowDownToLine className="w-4 h-4 text-slate-700" />
              <span>Withdraw Funds</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={withdrawCur}
                onChange={(e) => setWithdrawCur(e.target.value as CurrencyCode)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {BRAND.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
            >
              Withdraw to Linked Bank
            </button>
          </form>
        </div>

        {/* Recent Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Recent Wallet Activity</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No wallet activity yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {transactions.slice(0, 12).map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{t.description}</div>
                    <div className="text-xs text-slate-500">
                      {t.type} · {formatDateTime(t.createdAt)}
                    </div>
                  </div>
                  <div
                    className={`font-semibold tabular-nums ${
                      t.amountCents >= 0 ? "text-emerald-600" : "text-slate-900"
                    }`}
                  >
                    {formatMoney(t.amountCents, t.currency, { showSign: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
