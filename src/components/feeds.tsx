"use client";

import { useBoard } from "@/components/board-provider";
import { formatClock, formatShortDate } from "@/lib/time";

export function HubFeed() {
  const { board, loading, error } = useBoard();

  if (loading && !board) {
    return <div className="h-48 animate-pulse bg-[#efe8da]" />;
  }
  if (error && !board) {
    return (
      <p role="alert" className="text-sm text-red-800">
        {error}
      </p>
    );
  }
  if (!board) return null;

  return (
    <ul className="grid gap-8">
      {board.hub.map((story) => (
        <li
          key={story.id}
          className="grid overflow-hidden border border-[#d9cdb8] bg-white md:grid-cols-[18rem_1fr]"
        >
          <div className="relative min-h-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.image}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-8 md:px-10">
            <p className="text-[11px] tracking-[0.28em] text-[#c5a44e] uppercase">
              {story.author} · {formatShortDate(story.publishedAt)}{" "}
              {formatClock(story.publishedAt)}
            </p>
            <h2
              className="mt-3 text-3xl font-medium italic leading-tight"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {story.title}
            </h2>
            <span className="my-4 block h-px w-12 bg-[#c5a44e]" />
            <p className="max-w-xl text-sm leading-relaxed text-[#6b6458]">
              {story.summary}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SharePointFeed() {
  const { board, loading, error } = useBoard();

  if (loading && !board) {
    return <div className="h-48 animate-pulse bg-[#efe8da]" />;
  }
  if (error && !board) {
    return (
      <p role="alert" className="text-sm text-red-800">
        {error}
      </p>
    );
  }
  if (!board) return null;

  const kindLabel = {
    page: "Site page",
    document: "Document",
    list: "List",
  } as const;

  return (
    <ul className="divide-y divide-[#d9cdb8] border border-[#d9cdb8] bg-white">
      {board.sharepoint.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-[10px] tracking-[0.24em] text-[#c5a44e] uppercase">
              {kindLabel[item.kind]}
            </p>
            <p
              className="mt-1 text-xl"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {item.name}
            </p>
            <p className="mt-1 text-xs tracking-[0.04em] text-[#6b6458]">
              {item.library} · {item.modifiedBy} · {formatShortDate(item.modifiedAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StripNews() {
  const { board } = useBoard();
  if (!board) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {board.hub.slice(0, 3).map((story) => (
        <div key={story.id} className="group relative min-h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.image}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#004b49] via-[#004b49]/40 to-transparent" />
          <div className="relative z-10 flex h-full min-h-44 flex-col justify-end p-4 text-white">
            <p className="text-[10px] tracking-[0.28em] text-[#c5a44e] uppercase">
              HSH Hub
            </p>
            <p
              className="mt-1 text-xl leading-snug italic"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {story.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
