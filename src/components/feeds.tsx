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
    <ul className="divide-y divide-[#d9cdb8] border border-[#d9cdb8] bg-white">
      {board.hub.map((story) => (
        <li key={story.id} className="px-6 py-7">
          <p className="text-[11px] tracking-[0.28em] text-[#c5a44e] uppercase">
            {story.author} · {formatShortDate(story.publishedAt)}{" "}
            {formatClock(story.publishedAt)}
          </p>
          <h2
            className="mt-2 text-2xl font-medium italic leading-tight text-[#004b49] md:text-3xl"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {story.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6b6458]">
            {story.summary}
          </p>
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
        <li key={item.id} className="px-5 py-5">
          <p className="text-[10px] tracking-[0.24em] text-[#c5a44e] uppercase">
            {kindLabel[item.kind]}
          </p>
          <p
            className="mt-1 text-xl text-[#004b49]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {item.name}
          </p>
          <p className="mt-1 text-xs tracking-[0.04em] text-[#6b6458]">
            {item.library} · {item.modifiedBy} · {formatShortDate(item.modifiedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function StripNews() {
  const { board } = useBoard();
  if (!board) return null;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {board.hub.slice(0, 3).map((story) => (
        <div key={story.id} className="border border-[#d9cdb8] bg-white px-4 py-4">
          <p className="text-[10px] tracking-[0.28em] text-[#c5a44e] uppercase">
            HSH Hub
          </p>
          <p
            className="mt-2 text-lg leading-snug italic text-[#004b49]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {story.title}
          </p>
        </div>
      ))}
    </div>
  );
}
