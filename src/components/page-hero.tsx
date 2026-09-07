"use client";

import { useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDayLabel, formatNumericDate } from "@/lib/time";

export function PageIntro({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <section className="border-b border-[#d9cdb8] bg-white px-4 py-10 text-center md:px-8 md:py-12">
      <p className="text-[11px] tracking-[0.42em] text-[#c5a44e] uppercase">
        {eyebrow}
      </p>
      <span className="my-3 mx-auto block h-px w-16 bg-[#c5a44e]" />
      <h1
        className="text-3xl font-medium italic leading-tight text-[#004b49] md:text-5xl"
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        {title}
      </h1>
      {lede ? (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6b6458]">
          {lede}
        </p>
      ) : null}
    </section>
  );
}

export function DayIntro({
  eyebrow,
  date,
  onPrev,
  onNext,
  onPick,
  compact = false,
}: {
  eyebrow?: string;
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onPick: (date: string) => void;
  compact?: boolean;
}) {
  const picker = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = picker.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Chromium on Linux rejects showPicker unless the field is visible.
      }
    }
    input.focus();
  }

  return (
    <section
      className={
        compact
          ? "shrink-0 border-b border-[#d9cdb8] bg-white px-4 py-2 text-center md:px-6"
          : "border-b border-[#d9cdb8] bg-white px-4 py-10 text-center md:px-8 md:py-12"
      }
    >
      {eyebrow ? (
        <>
          <p className="text-[11px] tracking-[0.42em] text-[#c5a44e] uppercase">
            {eyebrow}
          </p>
          <span
            className={
              compact
                ? "my-1.5 mx-auto block h-px w-12 bg-[#c5a44e]"
                : "my-3 mx-auto block h-px w-16 bg-[#c5a44e]"
            }
          />
        </>
      ) : null}
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <button
          type="button"
          aria-label="Previous day"
          className={
            compact
              ? "flex size-9 shrink-0 items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] hover:text-[#c5a44e]"
              : "flex size-11 shrink-0 items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] hover:text-[#c5a44e]"
          }
          onClick={onPrev}
        >
          <ChevronLeft className={compact ? "size-4" : "size-5"} />
        </button>
        <h1
          className={
            compact
              ? "min-w-0 px-1 text-xl font-medium italic leading-tight text-[#004b49] md:text-2xl"
              : "min-w-0 px-1 text-xl font-medium italic leading-tight text-[#004b49] sm:text-3xl md:text-5xl"
          }
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          {formatDayLabel(date)}
        </h1>
        <div
          className={
            compact
              ? "group relative h-9 w-[11rem] shrink-0"
              : "group relative h-11 w-[11.5rem] shrink-0"
          }
        >
          <div
            className="pointer-events-none flex h-full items-center justify-between border border-[#d9cdb8] bg-white px-3 text-sm text-[#004b49] group-focus-within:border-[#c5a44e]"
            aria-hidden="true"
          >
            <span>{formatNumericDate(date)}</span>
            <Calendar className="size-4" />
          </div>
          <input
            ref={picker}
            type="date"
            lang="en-HK"
            value={date}
            onChange={(event) => {
              if (event.target.value) onPick(event.target.value);
            }}
            onClick={openPicker}
            aria-label="Choose a date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <button
          type="button"
          aria-label="Next day"
          className={
            compact
              ? "flex size-9 shrink-0 items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] hover:text-[#c5a44e]"
              : "flex size-11 shrink-0 items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] hover:text-[#c5a44e]"
          }
          onClick={onNext}
        >
          <ChevronRight className={compact ? "size-4" : "size-5"} />
        </button>
      </div>
    </section>
  );
}

export function SectionFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      {children}
    </div>
  );
}
