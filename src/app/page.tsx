import { Suspense } from "react";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { TickerStrip } from "@/components/TickerStrip";
import { ReturnsCalculator } from "@/components/ReturnsCalculator";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { BentoShowcase } from "@/components/BentoShowcase";
import { MarketPreviewTable } from "@/components/MarketPreviewTable";
import {
  HomeHero,
  StatsLabels,
  FeaturesHeading,
  PlansHeading,
  ReferralBanner,
} from "@/components/HomeSections";

async function PlatformStats() {
  try {
    const [assetCount, userCount, filledOrderCount] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count({ where: { status: "FILLED" } }),
    ]);

    return (
      <StatsLabels
        assetCount={assetCount}
        filledOrderCount={filledOrderCount}
        userCount={userCount}
      />
    );
  } catch {
    return <StatsLabels assetCount={35} filledOrderCount={0} userCount={1} />;
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TickerStrip />
      <Navbar />

      <HomeHero />

      <Suspense
        fallback={
          <section className="bg-slate-900 text-white py-8 border-b border-slate-800 h-28" />
        }
      >
        <PlatformStats />
      </Suspense>

      {/* Live Market Screener Preview */}
      <section className="pt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <MarketPreviewTable />
      </section>

      {/* Architectural Pillars & FX Desk */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <FeaturesHeading />
        <BentoShowcase />
      </section>

      {/* Managed Portfolio Tiers */}
      <section id="plans" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <PlansHeading />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BRAND.managedPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      {plan.riskLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {plan.annualFeePct}% fee/yr
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{plan.tagline}</p>

                  {/* Segmented Allocation Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                      {plan.allocation.map((a) => (
                        <div
                          key={a.label}
                          style={{ width: `${a.pct}%`, backgroundColor: a.color }}
                          title={`${a.label}: ${a.pct}%`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      {plan.allocation.map((a) => (
                        <div key={a.label} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: a.color }}
                            />
                            {a.label}
                          </span>
                          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            {a.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scenario Matrix */}
                  <div className="mt-5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Modeled Annual Range (Not Guaranteed)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
                      <div>
                        <div className="text-[11px] text-slate-500">Downside</div>
                        <div className="text-sm font-semibold text-rose-600">
                          {plan.projectedAnnualReturn.worst}%
                        </div>
                      </div>
                      <div className="border-x border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500">Typical</div>
                        <div className="text-sm font-bold text-teal-700 dark:text-teal-400">
                          +{plan.projectedAnnualReturn.typical}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Favorable</div>
                        <div className="text-sm font-semibold text-emerald-600">
                          +{plan.projectedAnnualReturn.best}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href="/plans"
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-teal-700 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-teal-800 transition-colors"
                  >
                    Select {plan.name}
                  </Link>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-snug">
                    {plan.disclosure}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <ReturnsCalculator />
        </div>
      </section>

      <ReferralBanner />

      <Footer />
      <ChatWidget />
    </div>
  );
}
