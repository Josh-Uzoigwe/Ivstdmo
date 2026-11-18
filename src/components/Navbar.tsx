"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Globe, Sun, Moon } from "lucide-react";
import { Logo } from "./Logo";
import { usePreferences } from "./PreferencesProvider";
import type { LangCode } from "@/lib/i18n";

const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "EN", label: "English" },
  { code: "FR", label: "Français" },
  { code: "DE", label: "Deutsch" },
  { code: "ES", label: "Español" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t, theme, toggleTheme } = usePreferences();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="/markets" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t.nav.markets}
            </Link>
            <Link href="/#plans" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t.nav.plans}
            </Link>
            <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t.nav.pricing}
            </Link>
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t.nav.about}
            </Link>
            <Link href="/faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t.nav.faq}
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LangCode)}
              aria-label="Language"
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors"
            >
              {user.role === "ADMIN" ? t.nav.admin : t.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors shadow-sm"
              >
                {t.nav.openAccount}
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
          <Link href="/markets" onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5">
            {t.nav.markets}
          </Link>
          <Link href="/#plans" onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5">
            {t.nav.plans}
          </Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5">
            {t.nav.pricing}
          </Link>
          <Link href="/about" onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5">
            {t.nav.about}
          </Link>
          <Link href="/faq" onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5">
            {t.nav.faq}
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">Language</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LangCode)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="flex-1 text-center px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium"
              >
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium"
                >
                  {t.nav.openAccount}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
