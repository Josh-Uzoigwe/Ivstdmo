"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/config/brand";

const FAQS = [
  {
    q: `How do I fund my ${BRAND.name} demo account?`,
    a: "Sign up, complete the quick onboarding flow, and open Wallet & FX. Click 'Add Demo Funds' to credit USD, EUR, or GBP instantly with no real money required.",
  },
  {
    q: "What order types are supported?",
    a: "You can place Market orders (filled immediately at the live simulated quote), Limit orders, and Stop orders. Both dollar-based fractional orders and share-count orders are supported.",
  },
  {
    q: "How does multi-currency FX work?",
    a: "Each asset trades in its listing currency (USD for US stocks & crypto, EUR for Xetra/Euronext, GBP for LSE). If you don't hold enough of that currency, Northstone automatically converts from your funded wallet at a 0.25% spread.",
  },
  {
    q: "Are managed portfolio returns guaranteed?",
    a: "No. Managed portfolios display hypothetical downside, typical, and favorable annual ranges based on historical asset-class modeling. Capital is always at risk.",
  },
  {
    q: "Can I enable Two-Factor Authentication (2FA)?",
    a: "Yes. Go to Security & 2FA in your dashboard to scan a real TOTP QR code with Google Authenticator, Authy, or 1Password.",
  },
  {
    q: "Can I export my transaction history?",
    a: "Yes. Visit History & Export to filter your ledger or download a CSV statement, or use your browser's print-to-PDF statement view.",
  },
];

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-slate-600 mb-8">
          Everything you need to know about using the {BRAND.name} brokerage demo.
        </p>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.q}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-medium text-slate-900 hover:bg-slate-50"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
