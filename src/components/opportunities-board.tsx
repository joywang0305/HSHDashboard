"use client";

import { useState, type KeyboardEvent } from "react";
import { AppModal } from "@/components/app-modal";
import {
  currentOpenings,
  formatOpportunityDate,
  hasOpportunityDetails,
  MOCK_OPPORTUNITIES_BOARD,
  type Opportunity,
} from "@/lib/opportunities";
import { cn } from "@/lib/utils";

function OpeningCard({
  opening,
  onOpen,
}: {
  opening: Opportunity;
  onOpen: (opening: Opportunity) => void;
}) {
  const detailed = hasOpportunityDetails(opening);
  return (
    <article
      className={cn(
        "flex min-h-0 flex-col border border-[#d9cdb8] bg-white px-4 py-4 text-left xl:px-5 xl:py-5",
        detailed &&
          "cursor-pointer transition-colors hover:border-[#c5a44e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5a44e]",
      )}
      {...(detailed
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick: () => onOpen(opening),
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(opening);
              }
            },
          }
        : {})}
    >
      <p className="text-[11px] tracking-[0.18em] text-[#c5a44e] uppercase xl:text-xs">
        {opening.location}
        {opening.department ? ` · ${opening.department}` : ""}
      </p>
      <h3
        className="mt-1.5 text-2xl leading-snug font-medium text-[#004b49] xl:text-3xl"
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        {opening.title}
      </h3>
      <p className="mt-2 text-sm text-[#6b6458] xl:text-base">
        {opening.operation}
      </p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <p className="text-xs tracking-[0.1em] text-[#6b6458] uppercase xl:text-sm">
          Posted {formatOpportunityDate(opening.postStartDate)} · closes{" "}
          {formatOpportunityDate(opening.postEndDate)}
        </p>
        {detailed ? (
          <span className="shrink-0 text-[11px] tracking-[0.16em] text-[#004b49] uppercase">
            Details
          </span>
        ) : null}
      </div>
    </article>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.28em] text-[#c5a44e] uppercase">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[#1c1914]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-[#c5a44e]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpportunityDetailModal({
  opening,
  onClose,
}: {
  opening: Opportunity | null;
  onClose: () => void;
}) {
  return (
    <AppModal
      open={opening !== null}
      onClose={onClose}
      eyebrow="Opportunity"
      title={opening?.title ?? "Opportunity"}
      description={
        opening
          ? `${opening.operation} · ${opening.location}${
              opening.department ? ` · ${opening.department}` : ""
            }`
          : undefined
      }
      className="max-h-[min(90vh,44rem)] max-w-2xl"
    >
      {opening ? (
        <div className="space-y-5">
          <p className="text-xs tracking-[0.12em] text-[#6b6458] uppercase">
            Posted {formatOpportunityDate(opening.postStartDate)} · closes{" "}
            {formatOpportunityDate(opening.postEndDate)}
          </p>
          {opening.summary ? (
            <p className="text-base leading-relaxed text-[#1c1914]">
              {opening.summary}
            </p>
          ) : null}
          {opening.responsibilities?.length ? (
            <DetailList title="Responsibilities" items={opening.responsibilities} />
          ) : null}
          {opening.requirements?.length ? (
            <DetailList title="Requirements" items={opening.requirements} />
          ) : null}
          {opening.howToApply ? (
            <div>
              <p className="text-[10px] tracking-[0.28em] text-[#c5a44e] uppercase">
                How to apply
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1914]">
                {opening.howToApply}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            className="w-full cursor-pointer border border-[#004b49] bg-[#004b49] px-4 py-3 text-xs tracking-[0.22em] text-[#f7f3eb] uppercase hover:bg-[#003835]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      ) : null}
    </AppModal>
  );
}

export function OpportunitiesBoard() {
  const board = MOCK_OPPORTUNITIES_BOARD;
  const openings = currentOpenings(board.openings);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f3eb]">
      <header className="shrink-0 border-b border-[#d9cdb8] bg-white px-4 py-2.5 text-center xl:py-3">
        <p className="text-xs tracking-[0.32em] text-[#c5a44e] uppercase xl:text-sm">
          Careers across the Group
        </p>
        <h1
          className="text-3xl font-medium italic leading-tight text-[#004b49] xl:text-4xl 2xl:text-5xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          Opportunities
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
        {openings.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center border border-[#d9cdb8] bg-white">
            <p className="text-sm tracking-[0.16em] text-[#6b6458] uppercase">
              No current openings
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:gap-3">
            {openings.map((opening) => (
              <OpeningCard
                key={opening.id}
                opening={opening}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}
      </div>
      <OpportunityDetailModal
        opening={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
