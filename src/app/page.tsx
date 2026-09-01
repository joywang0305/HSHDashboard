"use client";

import { DayIntro, SectionFrame } from "@/components/page-hero";
import { RoomDayBoard } from "@/components/room-day-board";
import { StripNews } from "@/components/feeds";
import { useBoard } from "@/components/board-provider";
import { shiftDate } from "@/lib/time";

export default function RoomsPage() {
  const { viewDate, setViewDate } = useBoard();

  return (
    <div>
      <DayIntro
        eyebrow="Meeting rooms"
        date={viewDate}
        onPrev={() => setViewDate(shiftDate(viewDate, -1))}
        onNext={() => setViewDate(shiftDate(viewDate, 1))}
        onPick={setViewDate}
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
