"use client";

import { PageHero, SectionFrame } from "@/components/page-hero";
import { RoomDayBoard } from "@/components/room-day-board";
import { StripNews } from "@/components/feeds";
import { useBoard } from "@/components/board-provider";
import { formatDayLabel } from "@/lib/time";

export default function RoomsPage() {
  const { board } = useBoard();

  return (
    <div>
      <PageHero
        image="/heritage/entrance.jpg"
        eyebrow="Meeting rooms"
        title={board ? formatDayLabel(board.date) : "Today’s rooms"}
        lede="Live Outlook calendars for every HSH room, on every wall PC. Tap a free slot to book without opening a laptop."
      />
      <SectionFrame>
        <StripNews />
        <div className="mt-10">
          <RoomDayBoard />
        </div>
      </SectionFrame>
      <section className="relative h-40 overflow-hidden md:h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/heritage/pool.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-[#004b49]/45" />
        <p className="relative z-10 flex h-full items-center justify-center px-6 text-center text-[11px] tracking-[0.35em] text-[#c5a44e] uppercase">
          One URL for every kiosk · Outlook remains the source of truth
        </p>
      </section>
    </div>
  );
}
