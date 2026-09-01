"use client";

import { HubFeed } from "@/components/feeds";
import { PageIntro, SectionFrame } from "@/components/page-hero";

export default function HubPage() {
  return (
    <div>
      <PageIntro
        eyebrow="HSH Hub"
        title="Workplace notices"
        lede="Stories from HSH Hub, shown the same way on every wall PC."
      />
      <SectionFrame>
        <HubFeed />
      </SectionFrame>
    </div>
  );
}
