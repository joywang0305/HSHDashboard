"use client";

import { useState } from "react";
import { RoomsSplitView } from "@/components/rooms-split-view";
import { useBoard } from "@/components/board-provider";
import {
  DEFAULT_KIOSK_FLOOR,
  isFloorId,
  type FloorId,
} from "@/lib/floor-plan";

export default function DashboardPage() {
  const { board } = useBoard();
  const kioskFloorId = isFloorId(board?.kioskFloorId)
    ? board.kioskFloorId
    : DEFAULT_KIOSK_FLOOR;
  const [selectedFloorId, setSelectedFloorId] = useState<FloorId | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  return (
    <RoomsSplitView
      floorId={selectedFloorId ?? kioskFloorId}
      roomId={selectedRoomId}
      onSelectFloor={setSelectedFloorId}
      onSelectRoom={setSelectedRoomId}
    />
  );
}
