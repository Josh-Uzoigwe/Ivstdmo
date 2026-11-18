"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatPct } from "@/lib/utils";
import { Plus, Trash2, ArrowUpRight } from "lucide-react";

interface Watchlist {
  id: string;
  name: string;
  items: {
    id: string;
    asset: {
      id: string;
      ticker: string;
      name: string;
      currency: string;
      exchange: string;
    };
  }[];
}

export default function WatchlistsPage() {
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [quotes, setQuotes] = useState<Record<string, { priceCents: number; changePct: number }>>({});
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/watchlists");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const d = await res.json();
    setWatchlists(d.watchlists || []);
    setQuotes(d.quotes || {});
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_list", name: newName }),
    });
    setNewName("");
    load();
  };

  const removeItem = async (watchlistId: string, assetId: string) => {
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_item", watchlistId, assetId }),
    });
    load();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Watchlists</h1>
            <p className="text-sm text-slate-500">Track stocks, ETFs, and crypto across custom lists.</p>
          </div>
          <form onSubmit={createList} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New watchlist name..."
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {watchlists.map((wl) => (
            <div key={wl.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{wl.name}</h2>
                <span className="text-xs text-slate-500">{wl.items.length} assets</span>
              </div>
              {wl.items.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No assets in this list yet. Open any asset in{" "}
                  <Link href="/markets" className="text-teal-700 font-semibold hover:underline">
                    Markets
                  </Link>{" "}
                  and click &quot;Add to Watchlist&quot;.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {wl.items.map(({ asset }) => {
                    const q = quotes[asset.ticker];
                    const up = (q?.changePct ?? 0) >= 0;
                    return (
                      <div key={asset.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <Link
                            href={`/markets/${asset.ticker}`}
                            className="font-semibold text-slate-900 hover:text-teal-700"
                          >
                            {asset.ticker}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {asset.name} · {asset.exchange}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 tabular-nums">
                          {q && (
                            <div className="text-right">
                              <div className="font-semibold text-slate-900">
                                {formatMoney(q.priceCents, asset.currency)}
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  up ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {formatPct(q.changePct)}
                              </div>
                            </div>
                          )}
                          <Link
                            href={`/markets/${asset.ticker}`}
                            className="p-2 rounded-lg text-teal-700 hover:bg-teal-50"
                            aria-label={`Trade ${asset.ticker}`}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(wl.id, asset.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
