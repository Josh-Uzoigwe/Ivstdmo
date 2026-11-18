import Link from "next/link";
import { Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/config/brand";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Transparent, straightforward pricing
          </h1>
          <p className="text-slate-600 mt-3">
            Zero commission on US, EU, and UK stock & ETF trades. Clear 0.25% FX conversion spread when switching currencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Self-Directed Trading
            </div>
            <div className="text-3xl font-bold text-slate-900">$0</div>
            <p className="text-sm text-slate-600">Commission per stock & ETF order.</p>
            <ul className="space-y-2 text-sm text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-700" /> Fractional shares from $1</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-700" /> Market, Limit & Stop orders</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-700" /> Unlimited watchlists & alerts</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Multi-Currency FX
            </div>
            <div className="text-3xl font-bold text-slate-900">0.25%</div>
            <p className="text-sm text-slate-600">Flat spread over mid-market rate.</p>
            <ul className="space-y-2 text-sm text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-700" /> USD, EUR, and GBP wallets</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-700" /> Preview FX fee before trade</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-700" /> Instant wallet-to-wallet conversion</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Managed Portfolios
            </div>
            <div className="text-3xl font-bold text-slate-900">0.25%–0.45%</div>
            <p className="text-sm text-slate-600">Annual management fee by tier.</p>
            <ul className="space-y-2 text-sm text-slate-700 pt-2 border-t border-slate-100">
              {BRAND.managedPlans.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-700" />
                  <span>{p.name}: {p.annualFeePct}%/yr</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex px-6 py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors"
          >
            Open a Free Demo Account
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
