"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/config/brand";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
      } else if (data.requires2FA) {
        setRequires2FA(true);
      } else {
        router.push(data.user?.role === "ADMIN" ? "/admin" : "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid 2FA code.");
      } else {
        router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {requires2FA ? "Two-Factor Verification" : `Sign in to ${BRAND.name}`}
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={submitLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={submit2FA} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-200">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Enter the 6-digit code from your authenticator app.</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600 mt-5">
          New to {BRAND.name}?{" "}
          <Link href="/signup" className="text-teal-700 font-semibold hover:underline">
            Open an account
          </Link>
        </p>
      </div>
    </div>
  );
}
