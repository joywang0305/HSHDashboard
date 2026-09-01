"use client";

import { PageIntro, SectionFrame } from "@/components/page-hero";
import { RoomDayBoard } from "@/components/room-day-board";
import { StripNews } from "@/components/feeds";
import { useBoard } from "@/components/board-provider";
import { formatDayLabel } from "@/lib/time";

export default function RoomsPage() {
  const { board } = useBoard();

  return (
    <div>
      <PageIntro
        eyebrow="Meeting rooms"
        title={board ? formatDayLabel(board.date) : "Today’s rooms"}
        lede="Live Outlook calendars for every meeting room, on every wall PC. Tap a free slot to book without opening a laptop."
      />
      <SectionFrame>
        <StripNews />
        <div className="mt-8">
          <RoomDayBoard />
        </div>
      </SectionFrame>
    </div>
  );
}
