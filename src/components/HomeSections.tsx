"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { usePreferences } from "./PreferencesProvider";
import { HeroShowcase } from "./HeroShowcase";

export function HomeHero() {
  const { t } = usePreferences();
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(email ? `/signup?email=${encodeURIComponent(email)}` : "/signup");
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-22 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-400">
            {t.hero.badge}
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-normal tracking-tight text-slate-900 dark:text-white leading-[1.08]">
            {t.hero.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            {t.hero.subtitle}
          </p>

          <form
            onSubmit={handleQuickStart}
            className="flex flex-col sm:flex-row gap-2.5 max-w-lg pt-1"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors shadow-sm shrink-0"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <Link
              href="/markets"
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-400 underline underline-offset-4"
            >
              {t.hero.ctaSecondary}
            </Link>
            <span>{t.hero.disclaimer}</span>
          </div>
        </motion.div>

        <div className="lg:col-span-5">
          <HeroShowcase />
        </div>
      </div>
    </section>
  );
}

export function StatsLabels({
  assetCount,
  filledOrderCount,
  userCount,
}: {
  assetCount: number;
  filledOrderCount: number;
  userCount: number;
}) {
  const { t } = usePreferences();

  return (
    <section className="bg-slate-900 dark:bg-slate-900 text-white py-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">{assetCount}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{t.stats.assets}</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">3</div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{t.stats.currencies}</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">{filledOrderCount}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{t.stats.orders}</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">{userCount}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{t.stats.accounts}</div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesHeading() {
  const { t } = usePreferences();
  return (
    <div className="max-w-2xl mb-10">
      <h2 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 dark:text-white">
        {t.sections.featuresTitle}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mt-2">{t.sections.featuresSubtitle}</p>
    </div>
  );
}

export function PlansHeading() {
  const { t } = usePreferences();
  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 dark:text-white">
        {t.sections.plansTitle}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mt-2">{t.sections.plansSubtitle}</p>
    </div>
  );
}

export function ReferralBanner() {
  const { t } = usePreferences();
  return (
    <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-teal-400 text-xs font-mono font-semibold uppercase tracking-wider">
            {t.sections.referralBadge}
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-normal">{t.sections.referralTitle}</h3>
          <p className="text-sm text-slate-300">{t.sections.referralDesc}</p>
        </div>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors shrink-0"
        >
          {t.sections.referralCta}
        </Link>
      </div>
    </section>
  );
}
