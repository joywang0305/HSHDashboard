"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RoomsSplitView } from "@/components/rooms-split-view";
import { useBoard } from "@/components/board-provider";
import {
  DEFAULT_KIOSK_FLOOR,
  isFloorId,
  type FloorId,
} from "@/lib/floor-plan";

function RoomsLoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-[#f7f3eb]">
      <p className="text-xs tracking-[0.28em] text-[#004b49] uppercase">
        Loading meeting rooms
      </p>
    </div>
  );
}

function RoomsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { board } = useBoard();
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

  function writeSelection(floorId: FloorId, roomId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("floor", floorId);
    if (roomId) params.set("room", roomId);
    else params.delete("room");
    router.replace(`/rooms?${params.toString()}`, { scroll: false });
  }

  return (
    <RoomsSplitView
      floorId={activeFloorId}
      roomId={selectedRoomId}
      onSelectFloor={(floorId) => {
        setSelectedFloorId(floorId);
        const selected = board?.rooms.find((room) => room.id === selectedRoomId);
        writeSelection(
          floorId,
          selected && selected.floor === floorId ? selectedRoomId : null,
        );
      }}
      onSelectRoom={(roomId) => {
        setSelectedRoomId(roomId);
        const room = board?.rooms.find((item) => item.id === roomId);
        const floor =
          room && isFloorId(room.floor) ? room.floor : activeFloorId;
        if (room && isFloorId(room.floor)) {
          setSelectedFloorId(room.floor);
        }
        writeSelection(floor, roomId);
      }}
    />
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<RoomsLoadingFallback />}>
      <RoomsPageInner />
    </Suspense>
  );
}
