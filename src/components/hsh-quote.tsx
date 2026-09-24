"use client";

import { useEffect, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { HshQuote } from "@/lib/hsh-quote";

const POLL_MS = 2 * 60_000;

function formatChangePercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function HshQuote() {
  const [quote, setQuote] = useState<HshQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/quote", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as HshQuote;
        if (!cancelled) setQuote(payload);
      } catch {
        // Keep the last price on the kiosk if the quote feed is briefly unreachable.
      }
    }
    void load();
    const id = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!quote) {
    return (
      <p className="whitespace-nowrap text-[13px] font-medium tracking-[0.1em] text-[#6b6458] uppercase">
        HSH 00045
      </p>
    );
  }

  const direction =
    quote.changePercent > 0.005 ? "up" : quote.changePercent < -0.005 ? "down" : "flat";
  const Icon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const changeClass =
    direction === "up"
      ? "text-[#004b49]"
      : direction === "down"
        ? "text-[#8b3a3a]"
        : "text-[#6b6458]";

  return (
    <p
      className="flex items-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-[0.1em] text-[#6b6458] uppercase"
      title={`${quote.name} · HKEX ${quote.symbol} · delayed`}
    >
      <Icon className="size-4 shrink-0 text-[#c5a44e]" aria-hidden />
      <span>
        HSH {quote.price.toFixed(2)} ·{" "}
        <span className={changeClass}>{formatChangePercent(quote.changePercent)}</span>
      </span>
    </p>
  );
}
