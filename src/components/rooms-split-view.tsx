"use client";

import { DayIntro } from "@/components/page-hero";
import { RoomDayBoard } from "@/components/room-day-board";
import { useBoard } from "@/components/board-provider";
import {
  DEFAULT_KIOSK_FLOOR,
  isFloorId,
  OFFICE_FLOORS,
  roomsOnFloor,
  type FloorId,
  type OfficeFloor,
} from "@/lib/floor-plan";
import {
  occupancyWord,
  OCCUPANCY_FILL,
  roomOccupancy,
} from "@/lib/room-occupancy";
import { shiftDate, todayInZone } from "@/lib/time";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RoomsSplitView({
  floorId,
  roomId,
  onSelectFloor,
  onSelectRoom,
}: {
  floorId?: FloorId | null;
  roomId?: string | null;
  onSelectFloor?: (floorId: FloorId) => void;
  onSelectRoom?: (roomId: string | null) => void;
}) {
  const { board, viewDate, setViewDate, now } = useBoard();
  const kioskFloorId = isFloorId(board?.kioskFloorId)
    ? board.kioskFloorId
    : DEFAULT_KIOSK_FLOOR;
  const activeFloorId = floorId ?? kioskFloorId;
  const activeFloor = OFFICE_FLOORS.find((floor) => floor.id === activeFloorId);
  const floorRooms =
    board && activeFloor ? roomsOnFloor(activeFloor, board.rooms) : [];

  function selectFloor(nextFloorId: FloorId) {
    onSelectFloor?.(nextFloorId);
    const selected = board?.rooms.find((room) => room.id === roomId);
    if (selected && selected.floor !== nextFloorId) {
      onSelectRoom?.(null);
    }
  }

  function selectRoom(nextRoomId: string | null) {
    if (!nextRoomId) {
      onSelectRoom?.(null);
      return;
    }
    const room = board?.rooms.find((item) => item.id === nextRoomId);
    if (room && isFloorId(room.floor)) {
      onSelectFloor?.(room.floor);
    }
    onSelectRoom?.(nextRoomId);
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
          <FloorRoomDirectory
            selectedFloorId={activeFloorId}
            selectedRoomId={roomId ?? null}
            now={now}
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
            selectedRoomId={roomId ?? null}
            onSelectRoom={selectRoom}
          />
        </div>
      </div>
    </div>
  );
}

function FloorRoomDirectory({
  selectedFloorId,
  selectedRoomId,
  now,
  onSelectFloor,
  onSelectRoom,
}: {
  selectedFloorId: FloorId;
  selectedRoomId: string | null;
  now: Date;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
}) {
  const { board, loading, error } = useBoard();
  const viewingToday = board?.date === todayInZone(board?.timezone, now);

  if (loading && !board) {
    return (
      <div className="h-full min-h-64 animate-pulse bg-[#efe8da]" aria-busy="true" />
    );
  }

  if ((error && !board) || !board) {
    return (
      <p className="border border-[#d9cdb8] bg-white px-4 py-6 text-sm text-[#6b6458]">
        Room list unavailable until the board feed loads.
      </p>
    );
  }

  return (
    <section
      aria-label="Meeting rooms by floor"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {OFFICE_FLOORS.map((floor) => (
          <FloorBlock
            key={floor.id}
            floor={floor}
            rooms={roomsOnFloor(floor, board.rooms)}
            selected={selectedFloorId === floor.id}
            selectedRoomId={selectedRoomId}
            viewingToday={viewingToday}
            now={now}
            onSelectFloor={onSelectFloor}
            onSelectRoom={onSelectRoom}
          />
        ))}
      </div>
      <div className="mt-2 flex shrink-0 flex-wrap items-center gap-3 border border-[#d9cdb8] bg-white px-3 py-2 text-[10px] tracking-[0.16em] text-[#6b6458] uppercase">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 bg-[#004b49]/30 ring-1 ring-[#004b49]" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="floor-legend-pulse size-3 bg-[#004b49] ring-1 ring-[#004b49]" />
          In use
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 bg-[#9b2c2c]/50 ring-1 ring-[#9b2c2c]" />
          Booked
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="floor-legend-pulse size-3 bg-[#9b2c2c] ring-1 ring-[#9b2c2c]" />
          Occupied
        </span>
      </div>
    </section>
  );
}

function FloorBlock({
  floor,
  rooms,
  selected,
  selectedRoomId,
  viewingToday,
  now,
  onSelectFloor,
  onSelectRoom,
}: {
  floor: OfficeFloor;
  rooms: Room[];
  selected: boolean;
  selectedRoomId: string | null;
  viewingToday: boolean;
  now: Date;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
}) {
  const { board } = useBoard();
  const columns = rooms.length >= 6 ? 3 : rooms.length >= 2 ? 2 : 1;

  return (
    <article
      className={cn(
        "border bg-white",
        selected
          ? "border-[#c5a44e] ring-1 ring-[#c5a44e]"
          : "border-[#d9cdb8]",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectFloor(floor.id)}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left outline-none",
          selected ? "bg-[#004b49]" : "bg-[#f7f3eb] hover:bg-[#efe8da]",
        )}
      >
        <span
          className={cn(
            "text-base leading-tight",
            selected ? "text-[#f7f3eb]" : "text-[#004b49]",
          )}
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          {floor.shortLabel}
        </span>
        <span
          className={cn(
            "text-[10px] tracking-[0.14em] uppercase",
            selected ? "text-[#c5a44e]" : "text-[#6b6458]",
          )}
        >
          {floor.building}
        </span>
      </button>
      <div
        className="grid gap-1.5 p-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {rooms.map((room) => {
          const occupancy = roomOccupancy(
            room.id,
            board?.bookings ?? [],
            now,
            viewingToday,
            board?.inUseRoomIds ?? [],
          );
          const roomSelected = selectedRoomId === room.id;
          const fill = OCCUPANCY_FILL[occupancy.kind];
          return (
            <button
              key={room.id}
              type="button"
              onClick={() =>
                onSelectRoom(roomSelected ? null : room.id)
              }
              aria-pressed={roomSelected}
              className={cn(
                "border px-2 py-1.5 text-left outline-none",
                roomSelected
                  ? "border-[#c5a44e] ring-1 ring-[#c5a44e]"
                  : "border-[#d9cdb8]",
                occupancy.occupied && "floor-room-busy",
              )}
              style={{
                backgroundColor: occupancy.occupied
                  ? fill
                  : occupancy.kind === "booked"
                    ? "rgba(155, 44, 44, 0.5)"
                    : occupancy.kind === "in-use"
                      ? fill
                      : "rgba(0, 75, 73, 0.15)",
                color: occupancy.occupied
                  ? "#f7f3eb"
                  : occupancy.kind === "booked"
                    ? "#9b2c2c"
                    : "#004b49",
              }}
            >
              <p
                className="truncate text-sm leading-tight"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {room.name}
              </p>
              <p className="text-[10px] tracking-[0.1em] uppercase opacity-80">
                {room.capacity} seats · {occupancyWord(occupancy.kind)}
              </p>
            </button>
          );
        })}
        {rooms.length === 0 ? (
          <p className="col-span-full px-1 py-2 text-sm text-[#6b6458]">
            No meeting rooms listed on this floor.
          </p>
        ) : null}
      </div>
    </article>
  );
}
