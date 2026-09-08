"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DayIntro } from "@/components/page-hero";
import { RoomDayBoard } from "@/components/room-day-board";
import { useBoard } from "@/components/board-provider";
import {
  DEFAULT_KIOSK_FLOOR,
  isFloorId,
  OFFICE_FLOORS,
  roomsOnFloor,
  type FloorId,
} from "@/lib/floor-plan";
import { shiftDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { board, viewDate, setViewDate } = useBoard();
  const kioskFloorId = isFloorId(board?.kioskFloorId)
    ? board.kioskFloorId
    : DEFAULT_KIOSK_FLOOR;
  const floorFromUrl = searchParams.get("floor");
  const roomFromUrl = searchParams.get("room");
  const urlFloor = isFloorId(floorFromUrl) ? floorFromUrl : null;
  const [selectedFloorId, setSelectedFloorId] = useState<FloorId | null>(
    urlFloor,
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    roomFromUrl,
  );
  const activeFloorId = selectedFloorId ?? urlFloor ?? kioskFloorId;
  const activeFloor = OFFICE_FLOORS.find((floor) => floor.id === activeFloorId);
  const floorRooms =
    board && activeFloor ? roomsOnFloor(activeFloor, board.rooms) : [];

  function setFloor(floorId: FloorId) {
    setSelectedFloorId(floorId);
    const selected = board?.rooms.find((room) => room.id === selectedRoomId);
    if (selected && selected.floor !== floorId) {
      setSelectedRoomId(null);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("floor", floorId);
    params.delete("room");
    router.replace(`/rooms?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <DayIntro
        compact
        date={viewDate}
        onPrev={() => setViewDate(shiftDate(viewDate, -1))}
        onNext={() => setViewDate(shiftDate(viewDate, 1))}
        onPick={setViewDate}
      />
      <div className="flex shrink-0 items-center gap-2 border-b border-[#d9cdb8] bg-white px-3 py-2">
        {OFFICE_FLOORS.map((floor) => {
          const selected = activeFloorId === floor.id;
          return (
            <button
              key={floor.id}
              type="button"
              onClick={() => setFloor(floor.id)}
              className={cn(
                "border px-3 py-1.5 text-left outline-none",
                selected
                  ? "border-[#c5a44e] bg-[#004b49] ring-1 ring-[#c5a44e]"
                  : "border-[#d9cdb8] bg-[#f7f3eb] hover:border-[#c5a44e]",
              )}
            >
              <p
                className={cn(
                  "text-sm leading-tight",
                  selected ? "text-[#f7f3eb]" : "text-[#004b49]",
                )}
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {floor.shortLabel}
              </p>
              <p
                className={cn(
                  "text-[10px] tracking-[0.12em] uppercase",
                  selected ? "text-[#c5a44e]" : "text-[#6b6458]",
                )}
              >
                {floor.building}
              </p>
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 p-3">
        <RoomDayBoard
          rooms={floorRooms}
          floorLabel={
            activeFloor
              ? `${activeFloor.id} · ${activeFloor.building}`
              : activeFloorId
          }
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />
      </div>
    </div>
  );
}
