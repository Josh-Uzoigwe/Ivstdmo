import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/config/brand";
import { ShieldCheck, Layers, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">About {BRAND.name}</h1>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            {BRAND.name} is a modern multi-currency brokerage demonstration platform designed to showcase clean, transparent investing across US, European, UK, and digital asset markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <ShieldCheck className="w-6 h-6 text-teal-700" />
            <h2 className="font-semibold text-slate-900">Honest Risk Modeling</h2>
            <p className="text-sm text-slate-600">
              Every managed portfolio displays downside, typical, and favorable scenario ranges rather than misleading guaranteed returns.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <Globe className="w-6 h-6 text-teal-700" />
            <h2 className="font-semibold text-slate-900">Multi-Currency Native</h2>
            <p className="text-sm text-slate-600">
              Hold USD, EUR, and GBP balances natively with automatic FX conversion and a visible 0.25% spread before execution.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <Layers className="w-6 h-6 text-teal-700" />
            <h2 className="font-semibold text-slate-900">Swappable Market Data</h2>
            <p className="text-sm text-slate-600">
              Powered by a deterministic market simulator today, behind a clean provider interface ready for live market feeds.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
