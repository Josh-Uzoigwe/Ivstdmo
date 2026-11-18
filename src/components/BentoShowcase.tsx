"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight } from "lucide-react";
import { BRAND, CurrencyCode } from "@/config/brand";
import { convertCurrency } from "@/lib/fx";

export function BentoShowcase() {
  const [fxFrom, setFxFrom] = useState<CurrencyCode>("USD");
  const [fxTo, setFxTo] = useState<CurrencyCode>("EUR");
  const [fxAmount, setFxAmount] = useState(2500);

  const conv = convertCurrency(fxAmount * 100, fxFrom, fxTo, true);

  return (
    <div className="space-y-8">
      {/* Architectural 3-Column Pillars — No generic icon boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-7 space-y-3"
        >
          <div className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400">
            01 / MULTI-CURRENCY SETTLEMENT
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Hold USD, EUR & GBP natively
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Avoid forced conversions on every trade. Fund in your local currency or convert anytime with a flat 0.25% spread shown upfront.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="p-7 space-y-3"
        >
          <div className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400">
            02 / PRECISION ORDER ROUTING
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Market, Limit & Stop Orders
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Buy by cash notional or fractional shares down to 6 decimals. Pending limit and stop orders monitor live ticks and execute automatically.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          className="p-7 space-y-3"
        >
          <div className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400">
            03 / AUTOMATION & CUSTODY
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Auto-Invest, Alerts & 2FA
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Schedule recurring DCA buys, set price triggers, export CSV/PDF statements, and secure your account with TOTP authenticator 2FA.
          </p>
        </motion.div>
      </div>

      {/* Interactive FX Desk + Security Vault Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live FX Desk
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Test cross-border conversion rates
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Transparent 0.25% spread over mid-market rates when converting between USD, EUR, and GBP.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                value={fxAmount}
                onChange={(e) => setFxAmount(Math.max(1, Number(e.target.value)))}
                className="w-28 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold tabular-nums"
                aria-label="FX amount"
              />
              <select
                value={fxFrom}
                onChange={(e) => setFxFrom(e.target.value as CurrencyCode)}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold"
                aria-label="From currency"
              >
                {BRAND.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
              <ArrowLeftRight className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span className="tabular-nums">{conv.effectiveRate.toFixed(4)}</span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {BRAND.currencySymbols[fxTo]}
                {(conv.convertedCents / 100).toFixed(2)}
              </span>
              <select
                value={fxTo}
                onChange={(e) => setFxTo(e.target.value as CurrencyCode)}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold"
                aria-label="To currency"
              >
                {BRAND.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 sm:p-8 flex items-center justify-between gap-5 overflow-hidden">
          <div className="space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-wider text-teal-400">
              Account Protection
            </div>
            <h3 className="text-xl font-bold">
              TOTP 2FA & KYC Suitability
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enroll with any authenticator app via QR code, complete guided risk profiling, and export full audit-ready CSV or PDF statements.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/security-vault.jpg"
            alt="Security vault"
            className="w-28 h-28 rounded-xl object-cover shrink-0 border border-white/15 shadow-lg hidden sm:block"
          />
        </div>
      </div>
    </div>
  );
}
