"use client";

import { useState } from "react";
import { DayIntro } from "@/components/page-hero";
import { OfficeFloorPlan } from "@/components/office-floor-plan";
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

export default function RoomsPage() {
  const { board, viewDate, setViewDate } = useBoard();
  const kioskFloorId = isFloorId(board?.kioskFloorId)
    ? board.kioskFloorId
    : DEFAULT_KIOSK_FLOOR;
  const [selectedFloorId, setSelectedFloorId] = useState<FloorId | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const activeFloorId = selectedFloorId ?? kioskFloorId;
  const activeFloor = OFFICE_FLOORS.find((floor) => floor.id === activeFloorId);
  const floorRooms = board && activeFloor ? roomsOnFloor(activeFloor, board.rooms) : [];

  function selectFloor(floorId: FloorId) {
    setSelectedFloorId(floorId);
    const selected = board?.rooms.find((room) => room.id === selectedRoomId);
    if (selected && selected.floor !== floorId) {
      setSelectedRoomId(null);
    }
  }

  function selectRoom(roomId: string | null) {
    setSelectedRoomId(roomId);
    if (!roomId) return;
    const room = board?.rooms.find((item) => item.id === roomId);
    if (room && isFloorId(room.floor)) {
      setSelectedFloorId(room.floor);
    }
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
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-2 md:gap-4 md:overflow-hidden md:p-3">
        <div className="h-full min-h-[22rem] md:min-h-0">
          <OfficeFloorPlan
            selectedFloorId={activeFloorId}
            kioskFloorId={kioskFloorId}
            selectedRoomId={selectedRoomId}
            onSelectFloor={selectFloor}
            onSelectRoom={selectRoom}
          />
        </div>
        <div className="h-full min-h-[24rem] md:min-h-0">
          <RoomDayBoard
            rooms={floorRooms}
            floorLabel={
              activeFloor
                ? `${activeFloor.id} · ${activeFloor.building}`
                : activeFloorId
            }
            selectedRoomId={selectedRoomId}
            onSelectRoom={selectRoom}
          />
        </div>
      </div>
    </div>
  );
}
