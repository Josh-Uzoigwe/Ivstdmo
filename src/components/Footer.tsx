import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M17 7h4v4" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">{BRAND.name}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {BRAND.tagline} Multi-currency brokerage featuring equities, ETFs, digital assets, and transparent managed portfolios.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/markets" className="hover:text-white">Markets</Link></li>
              <li><Link href="/#plans" className="hover:text-white">Managed Plans</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing & FX</Link></li>
              <li><Link href="/referrals" className="hover:text-white">Referral Program</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-white">About {BRAND.name}</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/legal" className="hover:text-white">Risk & Legal Disclosures</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Global Coverage
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>US Equities & ETFs (USD)</li>
              <li>European Markets (EUR)</li>
              <li>UK Equities (GBP)</li>
              <li>Major Digital Assets</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-500">
          <p>
            © {BRAND.foundedYear} {BRAND.legalName} All rights reserved.
          </p>
          <p>
            Capital at risk. Investments can go down as well as up; past or modeled performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
