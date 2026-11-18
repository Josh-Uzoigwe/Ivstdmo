"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { Download, Printer } from "lucide-react";

interface Tx {
  id: string;
  type: string;
  currency: string;
  amountCents: number;
  description: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.transactions) setTransactions(d.transactions);
      });
  }, [router]);

  const filtered =
    filter === "ALL" ? transactions : transactions.filter((t) => t.type === filter);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transaction History & Statements</h1>
            <p className="text-sm text-slate-500">
              Audit every deposit, FX conversion, order fill, and auto-invest execution.
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <a
              href="/api/history/export"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 print:hidden">
          {["ALL", "DEPOSIT", "WITHDRAWAL", "FX_CONVERT", "BUY", "SELL", "AUTO_INVEST"].map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  filter === t
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No transactions match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{t.description}</td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          t.amountCents >= 0 ? "text-emerald-600" : "text-slate-900"
                        }`}
                      >
                        {formatMoney(t.amountCents, t.currency, { showSign: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
