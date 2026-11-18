"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BRAND, CurrencyCode, ManagedPlan } from "@/config/brand";
import { formatMoney, formatDateShort } from "@/lib/utils";
import { CheckCircle2, Briefcase } from "lucide-react";

interface Subscription {
  id: string;
  planId: string;
  allocatedCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ManagedPlan[]>(BRAND.managedPlans);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({
    "starter-shield": "500",
    "core-growth": "1000",
    "global-alpha": "2500",
  });
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/plans");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const d = await res.json();
    if (d.plans) setPlans(d.plans);
    if (d.subscriptions) setSubs(d.subscriptions);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const allocate = async (planId: string) => {
    setMsg("");
    setErr("");
    const amountCents = Math.round(Number(amounts[planId] || 0) * 100);
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, amountCents, currency }),
    });
    const d = await res.json();
    if (!res.ok) {
      setErr(d.error || "Allocation failed.");
    } else {
      setMsg("Allocated funds to managed portfolio.");
      load();
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Managed Portfolio Plans</h1>
            <p className="text-sm text-slate-500">
              Diversified allocations with projected scenario ranges and transparent annual fees.
            </p>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold w-28"
          >
            {BRAND.currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {p.riskLevel}
                  </span>
                  <span className="text-xs text-slate-500">{p.annualFeePct}% fee/yr</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{p.name}</h2>
                <p className="text-sm text-slate-600">{p.tagline}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs tabular-nums">
                  <div>
                    <div className="text-slate-500">Downside</div>
                    <div className="font-semibold text-rose-600">
                      {p.projectedAnnualReturn.worst}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Typical</div>
                    <div className="font-bold text-teal-700">
                      +{p.projectedAnnualReturn.typical}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Favorable</div>
                    <div className="font-semibold text-emerald-600">
                      +{p.projectedAnnualReturn.best}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  {p.allocation.map((a) => (
                    <div key={a.label} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                        {a.label}
                      </span>
                      <span className="font-semibold tabular-nums">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={p.minInvestmentCents / 100}
                    value={amounts[p.id] || ""}
                    onChange={(e) =>
                      setAmounts((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => allocate(p.id)}
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                  >
                    Allocate
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{p.disclosure}</p>
              </div>
            </div>
          ))}
        </div>

        {subs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-700" />
              <span>Your Active Managed Allocations</span>
            </h2>
            <div className="divide-y divide-slate-100 text-sm">
              {subs.map((s) => {
                const plan = plans.find((p) => p.id === s.planId);
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{plan?.name || s.planId}</div>
                      <div className="text-xs text-slate-500">
                        Started {formatDateShort(s.createdAt)} · {s.status}
                      </div>
                    </div>
                    <div className="font-bold tabular-nums text-slate-900">
                      {formatMoney(s.allocatedCents, s.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
