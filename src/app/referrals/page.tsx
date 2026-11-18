"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatMoney, formatDateShort } from "@/lib/utils";
import { Copy, Check, Users } from "lucide-react";

interface ReferralItem {
  id: string;
  status: string;
  rewardCents: number;
  createdAt: string;
  referredUser: { name: string; createdAt: string };
}

export default function ReferralsPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setCode(d.referralCode || "");
          setReferrals(d.referrals || []);
        }
      });
  }, [router]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/signup?ref=${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referral Program</h1>
          <p className="text-sm text-slate-500">
            Share your personal invite link and track referred accounts. Terms apply.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="w-4 h-4 text-teal-700" />
            <span>Your Personal Referral Link</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono text-slate-700"
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Referral Code: <strong className="font-mono text-slate-800">{code}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Referred Users</h2>
          {referrals.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No referrals yet. Share your link to invite friends.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {referrals.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{r.referredUser.name}</div>
                    <div className="text-xs text-slate-500">
                      Joined {formatDateShort(r.createdAt)} · {r.status}
                    </div>
                  </div>
                  <div className="font-semibold text-emerald-600 tabular-nums">
                    {formatMoney(r.rewardCents, "USD")} demo credit
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
