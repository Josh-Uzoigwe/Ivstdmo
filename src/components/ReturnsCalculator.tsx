"use client";

import { useState } from "react";
import { BRAND } from "@/config/brand";
import { formatMoney } from "@/lib/utils";
import { Info } from "lucide-react";

export function ReturnsCalculator() {
  const [selectedPlanId, setSelectedPlanId] = useState(BRAND.managedPlans[1].id);
  const [initialDeposit, setInitialDeposit] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(250);
  const [years, setYears] = useState(5);

  const plan =
    BRAND.managedPlans.find((p) => p.id === selectedPlanId) || BRAND.managedPlans[1];

  const projectValue = (annualPct: number) => {
    const netAnnual = (annualPct - plan.annualFeePct) / 100;
    const monthlyRate = netAnnual / 12;
    const months = years * 12;
    let total = initialDeposit;
    for (let i = 0; i < months; i++) {
      total = total * (1 + monthlyRate) + monthlyContribution;
    }
    return Math.round(total * 100);
  };

  const totalContributedCents = (initialDeposit + monthlyContribution * years * 12) * 100;
  const worstCents = projectValue(plan.projectedAnnualReturn.worst);
  const typicalCents = projectValue(plan.projectedAnnualReturn.typical);
  const bestCents = projectValue(plan.projectedAnnualReturn.best);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Scenario & Projection Calculator
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Model conservative, typical, and favorable market outcomes — never a single guaranteed rate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BRAND.managedPlans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlanId(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p.id === selectedPlanId
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
            <span>Initial Deposit</span>
            <span className="tabular-nums font-semibold">
              ${initialDeposit.toLocaleString()}
            </span>
          </label>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(Number(e.target.value))}
            className="w-full accent-teal-700"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
            <span>Monthly Auto-Invest</span>
            <span className="tabular-nums font-semibold">
              ${monthlyContribution.toLocaleString()}/mo
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={2500}
            step={50}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full accent-teal-700"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
            <span>Time Horizon</span>
            <span className="tabular-nums font-semibold">{years} years</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-teal-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Contributed
          </div>
          <div className="text-lg font-semibold text-slate-900 tabular-nums mt-1">
            {formatMoney(totalContributedCents, "USD")}
          </div>
          <div className="text-xs text-slate-500 mt-1">Principal over {years}y</div>
        </div>

        <div className="rounded-xl bg-rose-50/60 border border-rose-200 p-4">
          <div className="text-xs font-medium text-rose-700 uppercase tracking-wider">
            Downside ({plan.projectedAnnualReturn.worst}%/yr)
          </div>
          <div className="text-lg font-semibold text-slate-900 tabular-nums mt-1">
            {formatMoney(worstCents, "USD")}
          </div>
          <div className="text-xs text-rose-700 mt-1">Stress-market scenario</div>
        </div>

        <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-4">
          <div className="text-xs font-medium text-teal-800 uppercase tracking-wider">
            Typical ({plan.projectedAnnualReturn.typical}%/yr)
          </div>
          <div className="text-xl font-bold text-teal-900 tabular-nums mt-1">
            {formatMoney(typicalCents, "USD")}
          </div>
          <div className="text-xs text-teal-800 mt-1">Net of {plan.annualFeePct}% fee</div>
        </div>

        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-4">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Favorable ({plan.projectedAnnualReturn.best}%/yr)
          </div>
          <div className="text-lg font-semibold text-slate-900 tabular-nums mt-1">
            {formatMoney(bestCents, "USD")}
          </div>
          <div className="text-xs text-emerald-700 mt-1">Bull-market scenario</div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>{plan.disclosure}</span>
      </div>
    </div>
  );
}
