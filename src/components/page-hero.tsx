import { cn } from "@/lib/utils";

export function PageHero({
  image,
  eyebrow,
  title,
  lede,
  compact = false,
}: {
  image: string;
  eyebrow: string;
  title: string;
  lede?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        compact
          ? "h-[32vh] min-h-56 md:h-[36vh]"
          : "h-[46vh] min-h-72 md:h-[54vh]",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#004b49] via-[#004b49]/55 to-[#004b49]/25" />
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-10 text-center text-white md:pb-14">
        <p className="text-[11px] tracking-[0.42em] text-[#c5a44e] uppercase">
          {eyebrow}
        </p>
        <span className="my-3 block h-px w-16 bg-[#c5a44e]" />
        <h1
          className="max-w-4xl text-4xl font-medium italic leading-tight md:text-6xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          {title}
        </h1>
        {lede ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            {lede}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function SectionFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      {children}
    </div>
  );
}
