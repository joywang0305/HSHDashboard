"use client";

import { SharePointFeed } from "@/components/feeds";
import { PageHero, SectionFrame } from "@/components/page-hero";

export default function SharePointPage() {
  return (
    <div>
      <PageHero
        image="/heritage/night.jpg"
        eyebrow="SharePoint"
        title="Site files and pages"
        lede="Recent documents and pages from the HSH SharePoint site, read through Microsoft Graph."
        compact
      />
      <SectionFrame>
        <SharePointFeed />
      </SectionFrame>
    </div>
  );
}
