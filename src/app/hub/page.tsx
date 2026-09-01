"use client";

import { HubFeed } from "@/components/feeds";

export default function HubPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-teal-800 uppercase">
          HSH Hub
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Workplace notices
        </h1>
      </div>
      <HubFeed />
    </div>
  );
}
