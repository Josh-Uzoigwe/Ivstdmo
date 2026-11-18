"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, AreaSeries, CandlestickSeries, Time } from "lightweight-charts";
import type { PriceBar, Timeframe } from "@/lib/market-data/types";
import { usePreferences } from "./PreferencesProvider";

interface PriceChartProps {
  bars: PriceBar[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  isPositive: boolean;
}

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "1Y", "ALL"];

export function PriceChart({
  bars,
  timeframe,
  onTimeframeChange,
  isPositive,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartMode, setChartMode] = useState<"area" | "candles">("area");
  const { theme } = usePreferences();

  useEffect(() => {
    const el = containerRef.current;
    if (!el || bars.length === 0) return;

    const isDark = theme === "dark";
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#94a3b8" : "#64748b",
      },
      grid: {
        vertLines: { color: isDark ? "#1e293b" : "#f1f5f9" },
        horzLines: { color: isDark ? "#1e293b" : "#f1f5f9" },
      },
      width: el.clientWidth,
      height: 340,
      timeScale: {
        timeVisible: timeframe === "1D" || timeframe === "1W",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
      },
      rightPriceScale: {
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
      },
    });

    const accent = isPositive ? "#0f766e" : "#dc2626";

    if (chartMode === "area") {
      const series = chart.addSeries(AreaSeries, {
        lineColor: accent,
        topColor: isPositive ? "rgba(15, 118, 110, 0.18)" : "rgba(220, 38, 38, 0.18)",
        bottomColor: "rgba(255, 255, 255, 0.0)",
        lineWidth: 2,
      });
      series.setData(
        bars.map((b) => ({
          time: b.time as Time,
          value: b.close,
        }))
      );
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#16a34a",
        downColor: "#dc2626",
        borderVisible: false,
        wickUpColor: "#16a34a",
        wickDownColor: "#dc2626",
      });
      series.setData(
        bars.map((b) => ({
          time: b.time as Time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [bars, chartMode, isPositive, timeframe, theme]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                timeframe === tf
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setChartMode("area")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              chartMode === "area"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Line
          </button>
          <button
            type="button"
            onClick={() => setChartMode("candles")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              chartMode === "candles"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Candles
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-[340px]" />
    </div>
  );
}
