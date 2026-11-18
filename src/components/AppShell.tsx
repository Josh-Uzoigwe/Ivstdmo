"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Bookmark,
  Repeat,
  Bell,
  FileText,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";
import type { LangCode } from "@/lib/i18n";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  baseCurrency: string;
  kycStatus: string;
  unreadNotifications: number;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t, theme, toggleTheme } = usePreferences();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t.app.overview, icon: LayoutDashboard },
    { href: "/markets", label: t.app.markets, icon: TrendingUp },
    { href: "/wallet", label: t.app.wallet, icon: Wallet },
    { href: "/plans", label: t.app.plans, icon: Briefcase },
    { href: "/watchlists", label: t.app.watchlists, icon: Bookmark },
    { href: "/auto-invest", label: t.app.autoInvest, icon: Repeat },
    { href: "/alerts", label: t.app.alerts, icon: Bell },
    { href: "/history", label: t.app.history, icon: FileText },
    { href: "/referrals", label: t.app.referrals, icon: Users },
    { href: "/settings", label: t.app.settings, icon: Settings },
  ];

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center border-b border-slate-200 dark:border-slate-800">
          <Logo href="/dashboard" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-teal-700 dark:text-teal-400" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-3 border-t border-slate-100 dark:border-slate-800 pt-3",
                pathname.startsWith("/admin")
                  ? "bg-slate-900 dark:bg-teal-700 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.nav.admin}</span>
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          {user && (
            <div className="px-3 py-2 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.app.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="lg:hidden">
              <Logo href="/dashboard" />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user && user.kycStatus !== "APPROVED" && (
              <Link
                href="/onboarding"
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
              >
                {user.kycStatus === "PENDING" ? "KYC Pending" : "Complete Onboarding"}
              </Link>
            )}
            {user && (
              <span className="hidden sm:inline-flex text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Base: {user.baseCurrency}
              </span>
            )}
            <div className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangCode)}
                aria-label="Language"
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="EN">EN</option>
                <option value="FR">FR</option>
                <option value="DE">DE</option>
                <option value="ES">ES</option>
              </select>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/alerts"
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {user && user.unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {user.unreadNotifications > 9 ? "9+" : user.unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t.nav.admin}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.app.signOut}</span>
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
