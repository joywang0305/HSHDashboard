"use client";

import { SharePointFeed } from "@/components/feeds";

export default function SharePointPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-teal-800 uppercase">
          SharePoint
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Site files and pages
        </h1>
      </div>
      <SharePointFeed />
    </div>
  );
}
