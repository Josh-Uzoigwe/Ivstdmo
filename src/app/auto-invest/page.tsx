"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatDateShort } from "@/lib/utils";
import { Repeat, Trash2, Pause, Play } from "lucide-react";

interface RecurringPlan {
  id: string;
  amountCents: number;
  currency: string;
  frequency: string;
  nextRunAt: string;
  isActive: boolean;
  asset: { id: string; ticker: string; name: string; currency: string };
}

interface AssetOption {
  id: string;
  ticker: string;
  name: string;
  currency: string;
}

export default function AutoInvestPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [assetId, setAssetId] = useState("");
  const [amount, setAmount] = useState("100");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");

  const load = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      fetch("/api/recurring"),
      fetch("/api/markets"),
    ]);
    if (pRes.status === 401) {
      router.push("/login");
      return;
    }
    const pData = await pRes.json();
    const mData = await mRes.json();
    setPlans(pData.plans || []);
    const list = mData.items || [];
    setAssets(list);
    if (!assetId && list.length > 0) setAssetId(list[0].id);
  }, [router, assetId]);

  useEffect(() => {
    load();
  }, [load]);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = assets.find((a) => a.id === assetId);
    if (!selected) return;
    await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId,
        amountCents: Math.round(Number(amount) * 100),
        currency: selected.currency,
        frequency,
      }),
    });
    load();
  };

  const togglePlan = async (id: string, isActive: boolean) => {
    await fetch("/api/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    load();
  };

  const deletePlan = async (id: string) => {
    await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recurring Investments (Auto-Invest)</h1>
          <p className="text-sm text-slate-500">
            Schedule automated dollar-cost averaging into any stock, ETF, or crypto asset.
          </p>
        </div>

        <form
          onSubmit={createPlan}
          className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Asset</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ticker} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Cadence</label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!assetId}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-50"
          >
            <Repeat className="w-4 h-4" />
            <span>Schedule Buy</span>
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Active Schedules</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No recurring schedules yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {plans.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {p.asset.ticker} · {formatMoney(p.amountCents, p.currency)} / {p.frequency}
                    </div>
                    <div className="text-xs text-slate-500">
                      Next run: {formatDateShort(p.nextRunAt)} ·{" "}
                      <span className={p.isActive ? "text-emerald-600" : "text-slate-400"}>
                        {p.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlan(p.id, p.isActive)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label={p.isActive ? "Pause" : "Resume"}
                    >
                      {p.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePlan(p.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
