import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/config/brand";

export default function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Risk & Legal Disclosures</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>Demo Environment Notice:</strong> {BRAND.name} ({BRAND.legalName}) is a demonstration web application. Market prices, historical charts, news items, and account balances are simulated. No real money is accepted, no real securities or digital assets are custodied, and no orders are routed to live exchanges.
          </p>
          <p>
            <strong>Investment Risk:</strong> In live financial markets, the value of investments and the income from them can fall as well as rise. Investors may get back less than they originally invested. Past performance or modeled scenario ranges are not a reliable indicator of future results.
          </p>
          <p>
            <strong>Foreign Exchange Risk:</strong> Investing in assets denominated in a currency other than your base currency exposes returns to exchange rate fluctuations.
          </p>
          <p>
            <strong>Digital Assets:</strong> Cryptocurrencies such as Bitcoin, Ethereum, and Solana exhibit high price volatility and carry distinct operational and regulatory risks.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
