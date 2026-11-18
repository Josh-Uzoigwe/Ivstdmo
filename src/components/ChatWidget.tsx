"use client";

import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { BRAND } from "@/config/brand";

interface Message {
  from: "bot" | "user";
  text: string;
}

const QUICK_PROMPTS = [
  "How do I fund my demo account?",
  "What currencies & markets are supported?",
  "How do limit and stop orders work?",
  "Are returns guaranteed?",
];

function getReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("fund") || q.includes("deposit") || q.includes("demo")) {
    return "After signing up and completing the 1-minute onboarding, visit Wallet and click 'Add Demo Funds' to credit USD, EUR, or GBP instantly.";
  }
  if (q.includes("currenc") || q.includes("market") || q.includes("fx")) {
    return "Northstone supports USD, EUR, and GBP wallets with US (NYSE/NASDAQ), European (Xetra/Euronext), UK (LSE), and major Crypto (BTC/ETH/SOL/USDT) assets. Cross-currency buys convert automatically at a transparent 0.25% FX spread.";
  }
  if (q.includes("limit") || q.includes("stop") || q.includes("order")) {
    return "Market orders fill immediately at the live quote. Limit and stop orders stay in Open Orders and fill automatically as soon as the simulated price crosses your trigger.";
  }
  if (q.includes("guarant") || q.includes("return") || q.includes("risk")) {
    return "No returns are guaranteed. All investments carry market risk, and our Managed Plans display downside, typical, and favorable scenario ranges.";
  }
  return `Thanks for reaching out to ${BRAND.name} Support! You can explore Markets, test multi-currency FX in Wallet, or try fractional orders in the dashboard.`;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: `Hi! Welcome to ${BRAND.name}. Ask anything about funding, multi-currency FX, order types, or managed portfolios.`,
    },
  ]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { from: "user", text: trimmed },
      { from: "bot", text: getReply(trimmed) },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{BRAND.name} Desk Support</div>
              <div className="text-[11px] text-slate-300">Demo concierge · Instant replies</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto bg-slate-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.from === "user"
                      ? "bg-teal-700 text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <span>Support</span>
        </button>
      )}
    </div>
  );
}
