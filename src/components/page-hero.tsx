import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDayLabel } from "@/lib/time";

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
}: {
  eyebrow: string;
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onPick: (date: string) => void;
}) {
  return (
    <section className="border-b border-[#d9cdb8] bg-white px-4 py-10 text-center md:px-8 md:py-12">
      <p className="text-[11px] tracking-[0.42em] text-[#c5a44e] uppercase">
        {eyebrow}
      </p>
      <span className="my-3 mx-auto block h-px w-16 bg-[#c5a44e]" />
      <div className="flex items-center justify-center gap-3 md:gap-6">
        <button
          type="button"
          aria-label="Previous day"
          className="flex size-11 shrink-0 items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] hover:text-[#c5a44e]"
          onClick={onPrev}
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="relative min-w-0">
          <span
            className="block px-2 text-2xl font-medium italic leading-tight text-[#004b49] sm:text-3xl md:text-5xl"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {formatDayLabel(date)}
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              if (event.target.value) onPick(event.target.value);
            }}
            aria-label="Choose a date"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </h1>
        <button
          type="button"
          aria-label="Next day"
          className="flex size-11 shrink-0 items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] hover:text-[#c5a44e]"
          onClick={onNext}
        >
          <ChevronRight className="size-5" />
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
