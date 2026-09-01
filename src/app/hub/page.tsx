"use client";

import { HubFeed } from "@/components/feeds";
import { PageHero, SectionFrame } from "@/components/page-hero";

export default function HubPage() {
  return (
    <div>
      <PageHero
        image="/heritage/tea.jpg"
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
