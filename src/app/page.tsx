"use client";

import { RoomDayBoard } from "@/components/room-day-board";
import { StripNews } from "@/components/feeds";
import { useBoard } from "@/components/board-provider";
import { formatDayLabel } from "@/lib/time";

export default function RoomsPage() {
  const { board } = useBoard();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-teal-800 uppercase">
          Meeting rooms
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {board ? formatDayLabel(board.date) : "Today’s rooms"}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Live Outlook calendars for every HSH room, on every wall PC. Tap a
          free slot to book without opening a laptop.
        </p>
      </div>
      <StripNews />
      <RoomDayBoard />
    </div>
  );
}
