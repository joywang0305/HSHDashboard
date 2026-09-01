"use client";

import { useBoard } from "@/components/board-provider";
import { formatClock, formatShortDate } from "@/lib/time";

export function HubFeed() {
  const { board, loading, error } = useBoard();

  if (loading && !board) {
    return <div className="h-48 animate-pulse rounded-xl bg-stone-300/80" />;
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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Stories from HSH Hub. On production this feed is the Hub API or a
        SharePoint news web part, cached for every kiosk.
      </p>
      <ul className="grid gap-3">
        {board.hub.map((story) => (
          <li
            key={story.id}
            className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <p className="text-xs font-medium tracking-wide text-teal-800 uppercase">
              {story.author} · {formatShortDate(story.publishedAt)}{" "}
              {formatClock(story.publishedAt)}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{story.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{story.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SharePointFeed() {
  const { board, loading, error } = useBoard();

  if (loading && !board) {
    return <div className="h-48 animate-pulse rounded-xl bg-stone-300/80" />;
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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Recent files and pages from the HSH SharePoint site, read through
        Microsoft Graph. Every wall PC sees the same snapshot.
      </p>
      <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {board.sharepoint.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <p className="font-medium">{item.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kindLabel[item.kind]} · {item.library} · {item.modifiedBy} ·{" "}
              {formatShortDate(item.modifiedAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StripNews() {
  const { board } = useBoard();
  if (!board) return null;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {board.hub.slice(0, 3).map((story) => (
        <div
          key={story.id}
          className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
        >
          <p className="text-[11px] font-medium tracking-wide text-teal-800 uppercase">
            HSH Hub
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">{story.title}</p>
        </div>
      ))}
    </div>
  );
}
