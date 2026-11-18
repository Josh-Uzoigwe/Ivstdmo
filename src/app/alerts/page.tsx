"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

interface AlertItem {
  id: string;
  direction: string;
  targetPriceCents: number;
  isActive: boolean;
  triggeredAt: string | null;
  asset: { ticker: string; currency: string };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    const [aRes, nRes] = await Promise.all([
      fetch("/api/alerts"),
      fetch("/api/notifications"),
    ]);
    if (aRes.status === 401) {
      router.push("/login");
      return;
    }
    const aData = await aRes.json();
    const nData = await nRes.json();
    setAlerts(aData.alerts || []);
    setNotifications(nData.notifications || []);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    load();
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Alerts & Notifications</h1>
            <p className="text-sm text-slate-500">
              Monitor price triggers, order fills, and wallet activity.
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <CheckCheck className="w-4 h-4 text-teal-700" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-700" />
              <span>Price Alerts</span>
            </h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No price alerts yet. Set one from any asset page.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {alerts.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {a.asset.ticker} {a.direction}{" "}
                        {formatMoney(a.targetPriceCents, a.asset.currency)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.isActive
                          ? "Active"
                          : `Triggered ${a.triggeredAt ? formatDateTime(a.triggeredAt) : ""}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAlert(a.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Notification Feed</h2>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-3 px-2 rounded-lg ${n.isRead ? "" : "bg-teal-50/40"}`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-teal-800">{n.type}</span>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
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
