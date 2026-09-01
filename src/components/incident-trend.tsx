"use client";

import { startOfWeek, weekLabel } from "@/lib/format";
import type { Incident } from "@/lib/types";

export function IncidentTrend({ incidents }: { incidents: Incident[] }) {
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const weekStart = startOfWeek(new Date());
    weekStart.setDate(weekStart.getDate() - (7 - index) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = incidents.filter((item) => {
      const at = new Date(item.reportedAt);
      return at >= weekStart && at < weekEnd;
    }).length;
    return { label: weekLabel(weekStart), count };
  });

  const max = Math.max(1, ...weeks.map((week) => week.count));

  return (
    <div className="flex h-40 items-end gap-2">
      {weeks.map((week) => (
        <div key={week.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-md bg-teal-700/85"
              style={{ height: `${Math.max(8, (week.count / max) * 100)}%` }}
              title={`${week.count} reports`}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">{week.label}</p>
        </div>
      ))}
    </div>
  );
}
