"use client";

import { useRouter } from "next/navigation";
import { OfficeFloorPlan } from "@/components/office-floor-plan";
import { useBoard } from "@/components/board-provider";
import {
  DEFAULT_KIOSK_FLOOR,
  isFloorId,
} from "@/lib/floor-plan";

export default function DashboardPage() {
  const router = useRouter();
  const { board } = useBoard();
  const kioskFloorId = isFloorId(board?.kioskFloorId)
    ? board.kioskFloorId
    : DEFAULT_KIOSK_FLOOR;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-3">
      <OfficeFloorPlan
        kioskFloorId={kioskFloorId}
        selectedRoomId={null}
        onSelectFloor={(floorId) =>
          router.push(`/rooms?floor=${encodeURIComponent(floorId)}`)
        }
        onSelectRoom={(roomId) => {
          if (!roomId) return;
          const room = board?.rooms.find((item) => item.id === roomId);
          const floor =
            room && isFloorId(room.floor) ? room.floor : kioskFloorId;
          router.push(
            `/rooms?floor=${encodeURIComponent(floor)}&room=${encodeURIComponent(roomId)}`,
          );
        }}
      />
    </div>
  );
}
