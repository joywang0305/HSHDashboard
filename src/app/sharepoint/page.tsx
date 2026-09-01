"use client";

import { SharePointFeed } from "@/components/feeds";
import { PageIntro, SectionFrame } from "@/components/page-hero";

export default function SharePointPage() {
  return (
    <div>
      <PageIntro
        eyebrow="SharePoint"
        title="Site files and pages"
        lede="Recent documents and pages from the SharePoint site, read through Microsoft Graph."
      />
      <SectionFrame>
        <SharePointFeed />
      </SectionFrame>
    </div>
  );
}
