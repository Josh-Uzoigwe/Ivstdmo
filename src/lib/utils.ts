import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BRAND, CurrencyCode } from "@/config/brand";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  cents: number,
  currency: CurrencyCode | string = "USD",
  options?: { compact?: boolean; showSign?: boolean }
): string {
  const code = (currency in BRAND.currencySymbols ? currency : "USD") as CurrencyCode;
  const value = cents / 100;
  const absValue = Math.abs(value);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: options?.compact && absValue >= 10000 ? "compact" : "standard",
    minimumFractionDigits: options?.compact && absValue >= 10000 ? 1 : 2,
    maximumFractionDigits: options?.compact && absValue >= 10000 ? 2 : 2,
  });

  if (options?.showSign) {
    if (cents > 0) return `+${formatter.format(value)}`;
    if (cents < 0) return formatter.format(value);
  }
  return formatter.format(value);
}

export function formatPct(pct: number, showSign = true): string {
  const formatted = Math.abs(pct).toFixed(2);
  if (!showSign) return `${pct.toFixed(2)}%`;
  if (pct > 0) return `+${formatted}%`;
  if (pct < 0) return `-${formatted}%`;
  return `0.00%`;
}

export function formatShares(qty: number): string {
  if (Number.isInteger(qty)) return qty.toString();
  return qty.toFixed(6).replace(/\.?0+$/, "");
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
