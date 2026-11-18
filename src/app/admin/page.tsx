"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { ShieldCheck, Activity, Pause, Play, Zap, RotateCcw } from "lucide-react";

interface AdminData {
  metrics: {
    totalUsers: number;
    pendingKyc: number;
    totalAumUsdCents: number;
    totalVolumeUsdCents: number;
    totalOrders: number;
  };
  users: {
    id: string;
    email: string;
    name: string;
    role: string;
    baseCurrency: string;
    createdAt: string;
    kycProfile: { status: string; riskTolerance: string | null } | null;
    orderCount: number;
  }[];
  orders: {
    id: string;
    side: string;
    orderType: string;
    status: string;
    filledPriceCents: number | null;
    filledQuantityDecimal: number | null;
    createdAt: string;
    asset: { ticker: string; currency: string };
    user: { email: string; name: string };
  }[];
  simState: {
    isPaused: boolean;
    volatilityMultiplier: number;
    activeEventName: string | null;
  } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (res.status === 401 || res.status === 403) {
      router.push("/dashboard");
      return;
    }
    const d = await res.json();
    setData(d);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const reviewKyc = async (userId: string, decision: "APPROVED" | "REJECTED") => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kyc_review", userId, decision }),
    });
    setMsg(`User KYC marked ${decision}.`);
    load();
  };

  const updateSim = async (patch: Record<string, unknown>, note: string) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "market_sim", ...patch }),
    });
    setMsg(note);
    load();
  };

  if (!data) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-slate-500">Loading admin console...</div>
      </AppShell>
    );
  }

  const pendingUsers = data.users.filter((u) => u.kycProfile?.status === "PENDING");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Admin Console</h1>
          <p className="text-sm text-slate-500">
            Monitor AUM, review KYC submissions, inspect orders, and control the market simulator.
          </p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm">
            {msg}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 uppercase font-semibold">Platform AUM (USD)</div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
              {formatMoney(data.metrics.totalAumUsdCents, "USD")}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 uppercase font-semibold">Traded Volume</div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
              {formatMoney(data.metrics.totalVolumeUsdCents, "USD")}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 uppercase font-semibold">Registered Users</div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
              {data.metrics.totalUsers}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 uppercase font-semibold">Pending KYC</div>
            <div className="text-2xl font-bold tabular-nums text-amber-600 mt-1">
              {data.metrics.pendingKyc}
            </div>
          </div>
        </div>

        {/* Market Simulator Controls */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Live Market Simulator Controls</span>
            </div>
            <div className="text-sm text-slate-300 mt-1">
              Status: <strong>{data.simState?.isPaused ? "Paused" : "Streaming"}</strong> ·
              Volatility: <strong>{data.simState?.volatilityMultiplier ?? 1}x</strong>
              {data.simState?.activeEventName ? ` · Event: ${data.simState.activeEventName}` : ""}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                updateSim(
                  { isPaused: !data.simState?.isPaused },
                  data.simState?.isPaused ? "Market stream resumed." : "Market stream paused."
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
            >
              {data.simState?.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{data.simState?.isPaused ? "Resume" : "Pause"}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateSim(
                  { volatilityMultiplier: 3.0, activeEventName: "High Volatility Shock", bumpSeed: true },
                  "Triggered 3x volatility event."
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trigger Volatility (3x)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateSim(
                  { isPaused: false, volatilityMultiplier: 1.0, activeEventName: null },
                  "Simulator reset to normal 1x."
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Normal</span>
            </button>
          </div>
        </div>

        {/* KYC Review Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>KYC Review Queue ({pendingUsers.length})</span>
          </h2>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No pending KYC submissions.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">
                      {u.email} · Risk: {u.kycProfile?.riskTolerance || "N/A"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reviewKyc(u.id, "APPROVED")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewKyc(u.id, "REJECTED")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">All Accounts</h2>
            <div className="divide-y divide-slate-100 text-sm">
              {data.users.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {u.name}{" "}
                      {u.role === "ADMIN" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white ml-1">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      KYC: {u.kycProfile?.status || "NONE"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Recent Platform Orders</h2>
            {data.orders.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No orders placed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {data.orders.slice(0, 12).map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {o.side} {o.asset.ticker} ({o.orderType})
                      </div>
                      <div className="text-xs text-slate-500">
                        {o.user.email} · {formatDateTime(o.createdAt)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
