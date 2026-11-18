"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ShieldCheck, KeyRound } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/2fa/setup");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const d = await res.json();
    setEnabled(Boolean(d.enabled));
    setQrDataUrl(d.qrDataUrl || "");
    setSecret(d.secret || "");
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const enable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    const res = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, code }),
    });
    const d = await res.json();
    if (!res.ok) {
      setErr(d.error || "Invalid code.");
    } else {
      setEnabled(true);
      setCode("");
      setMsg("Two-Factor Authentication (2FA) is now enabled.");
    }
  };

  const disable2fa = async () => {
    setMsg("");
    setErr("");
    await fetch("/api/auth/2fa/setup", { method: "DELETE" });
    setMsg("Two-Factor Authentication disabled.");
    load();
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security & Two-Factor Auth</h1>
          <p className="text-sm text-slate-500">
            Protect your account with TOTP authenticator verification.
          </p>
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

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <div>
                <h2 className="font-semibold text-slate-900">Authenticator App (TOTP)</h2>
                <p className="text-xs text-slate-500">
                  Works with Google Authenticator, Authy, or 1Password.
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                enabled
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {enabled ? (
            <button
              type="button"
              onClick={disable2fa}
              className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-50"
            >
              Disable 2FA
            </button>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {qrDataUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="2FA QR Code"
                    className="w-40 h-40 rounded-xl border border-slate-200 p-2 bg-white"
                  />
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>1. Scan this QR code with your authenticator app.</p>
                    <p>
                      Or enter secret manually:{" "}
                      <code className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-900">
                        {secret}
                      </code>
                    </p>
                    <p>2. Enter the 6-digit code below to activate.</p>
                  </div>
                </div>
              )}

              <form onSubmit={enable2fa} className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                >
                  Enable 2FA
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
