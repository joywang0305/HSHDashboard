"use client";

import { DayIntro } from "@/components/page-hero";
import { OfficeFloorPlan } from "@/components/office-floor-plan";
import { RoomDayBoard } from "@/components/room-day-board";
import { useBoard } from "@/components/board-provider";
import {
  DEFAULT_KIOSK_FLOOR,
  isFloorId,
  OFFICE_FLOORS,
  floorTitle,
  roomsOnFloor,
  type FloorId,
  type OfficeFloor,
} from "@/lib/floor-plan";
import {
  OCCUPANCY_CSS,
  occupancyPaint,
  occupancyWord,
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
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 md:grid-cols-2 md:gap-3 md:p-3">
        <div className="h-full min-h-0">
          <FloorAndPlanPane
            kioskFloorId={kioskFloorId}
            selectedFloorId={activeFloorId}
            selectedRoomId={roomId ?? null}
            now={now}
            onSelectFloor={selectFloor}
            onSelectRoom={selectRoom}
          />
        </div>
        <div className="h-full min-h-0">
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

const DIRECTORY_ROWS: FloorId[][] = [
  ["POT4F", "POT5F"],
  ["POT12F"],
  ["POT14F"],
  ["SGB8F"],
];

function roomColumns(count: number) {
  if (count <= 1) return 1;
  if (count <= 6) return count;
  return Math.ceil(count / 2);
}

function FloorAndPlanPane({
  kioskFloorId,
  selectedFloorId,
  selectedRoomId,
  now,
  onSelectFloor,
  onSelectRoom,
}: {
  kioskFloorId: FloorId;
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
      aria-label="Meeting rooms and floor plan"
      className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div className="flex h-[90%] min-h-0 flex-col gap-1">
          {DIRECTORY_ROWS.map((row) => (
            <div
              key={row.join("-")}
              className="flex min-h-0 flex-1 gap-1 overflow-hidden"
            >
              {row.map((floorId) => {
                const floor = OFFICE_FLOORS.find((item) => item.id === floorId);
                if (!floor) return null;
                const rooms = roomsOnFloor(floor, board.rooms);
                return (
                  <FloorBlock
                    key={floor.id}
                    floor={floor}
                    rooms={rooms}
                    selected={selectedFloorId === floor.id}
                    selectedRoomId={selectedRoomId}
                    viewingToday={viewingToday}
                    now={now}
                    shareRow={row.length > 1}
                    flexGrow={row.length > 1 ? Math.max(rooms.length, 2) : 1}
                    onSelectFloor={onSelectFloor}
                    onSelectRoom={onSelectRoom}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-1 overflow-hidden">
        <FloorElevation
          floor={
            OFFICE_FLOORS.find((item) => item.id === selectedFloorId) ??
            OFFICE_FLOORS[0]
          }
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <OfficeFloorPlan
            embedded
            kioskFloorId={kioskFloorId}
            viewingFloorId={selectedFloorId}
            selectedRoomId={selectedRoomId}
            onSelectFloor={onSelectFloor}
            onSelectRoom={onSelectRoom}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border border-[#d9cdb8] bg-white px-2 py-1 text-[10px] tracking-[0.16em] text-[#6b6458] uppercase">
        <span className="inline-flex items-center gap-2">
          <span
            className="size-3 ring-1 ring-[#004b49]"
            style={{ backgroundImage: OCCUPANCY_CSS.free }}
          />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="floor-legend-pulse size-3 ring-1 ring-[#004b49]"
            style={{ backgroundImage: OCCUPANCY_CSS["in-use"] }}
          />
          In use
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="size-3 ring-1 ring-[#9b2c2c]"
            style={{ backgroundImage: OCCUPANCY_CSS.booked }}
          />
          Booked
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="floor-legend-pulse size-3 ring-1 ring-[#9b2c2c]"
            style={{ backgroundImage: OCCUPANCY_CSS.busy }}
          />
          Occupied
        </span>
      </div>
    </section>
  );
}

function FloorElevation({ floor }: { floor: OfficeFloor }) {
  if (!floor.elevation) return null;

  return (
    <aside
      aria-label={`${floor.building} ${floor.shortLabel} elevation`}
      className="flex w-[28%] max-w-[16rem] min-w-[8.5rem] shrink-0 overflow-hidden border border-[#d9cdb8] bg-[#fffcf7]"
    >
      <img
        src={floor.elevation}
        alt={`${floor.building} ${floor.shortLabel}`}
        className="h-full w-full object-contain"
        decoding="async"
        fetchPriority="high"
      />
    </aside>
  );
}

function FloorBlock({
  floor,
  rooms,
  selected,
  selectedRoomId,
  viewingToday,
  now,
  shareRow,
  flexGrow,
  onSelectFloor,
  onSelectRoom,
}: {
  floor: OfficeFloor;
  rooms: Room[];
  selected: boolean;
  selectedRoomId: string | null;
  viewingToday: boolean;
  now: Date;
  shareRow: boolean;
  flexGrow: number;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
}) {
  const { board } = useBoard();
  const columns = roomColumns(rooms.length);

  return (
    <article
      className={cn(
        "flex min-h-0 min-w-0 flex-row overflow-hidden border bg-white",
        shareRow ? null : "flex-1",
        selected
          ? "border-[#c5a44e] ring-1 ring-[#c5a44e]"
          : "border-[#d9cdb8]",
      )}
      style={shareRow ? { flexGrow, flexBasis: 0 } : undefined}
    >
      <button
        type="button"
        onClick={() => onSelectFloor(floor.id)}
        aria-pressed={selected}
        aria-label={`${floor.building} ${floor.shortLabel}`}
        className={cn(
          "flex w-9 shrink-0 items-center justify-center outline-none",
          selected ? "text-[#f7f3eb]" : "bg-[#f7f3eb] hover:bg-[#efe8da]",
        )}
        style={
          selected
            ? { backgroundImage: "linear-gradient(180deg, #0a5c59 0%, #004b49 55%, #003835 100%)" }
            : undefined
        }
      >
        <span
          className={cn(
            "text-sm leading-none tracking-[0.08em] whitespace-nowrap",
            selected ? "text-[#f7f3eb]" : "text-[#004b49]",
          )}
          style={{
            fontFamily: "var(--font-cormorant), serif",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          {floorTitle(floor)}
        </span>
      </button>
      <div
        className="grid min-h-0 min-w-0 flex-1 gap-1 p-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(0, 1fr)",
        }}
      >
        {rooms.map((room) => {
          const occupancy = roomOccupancy(
            room.id,
            board?.bookings ?? [],
            now,
            viewingToday,
            board?.inUseRoomIds ?? [],
          );
          const paint = occupancyPaint(occupancy);
          const roomSelected = selectedRoomId === room.id;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(roomSelected ? null : room.id)}
              aria-pressed={roomSelected}
              className={cn(
                "flex min-h-0 flex-col justify-center overflow-hidden border px-2 py-1 text-left outline-none",
                roomSelected
                  ? "border-[#c5a44e] ring-1 ring-[#c5a44e]"
                  : "border-[#d9cdb8]",
                occupancy.occupied && "floor-room-busy",
              )}
              style={{
                backgroundImage: paint.backgroundImage,
                color: paint.color,
              }}
            >
              <p
                className="truncate text-sm leading-tight"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {room.name}
              </p>
              <p className="truncate text-[10px] tracking-[0.1em] uppercase opacity-80">
                {room.capacity} seats · {occupancyWord(occupancy.kind)}
              </p>
            </button>
          );
        })}
        {rooms.length === 0 ? (
          <p className="col-span-full px-1 py-1 text-sm text-[#6b6458]">
            No meeting rooms listed on this floor.
          </p>
        ) : null}
      </div>
    </article>
  );
}
