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

export function SectionFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      {children}
    </div>
  );
}
