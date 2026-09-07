"use client";

import { useBoard } from "@/components/board-provider";
import {
  FLOOR_PLAN_VIEWBOX,
  OFFICE_FLOORS,
  shapesForFloor,
  type FloorId,
  type OfficeFloor,
} from "@/lib/floor-plan";
import {
  occupancyFillOpacity,
  occupancyWord,
  OCCUPANCY_FILL,
  OCCUPANCY_STROKE,
  roomOccupancy,
} from "@/lib/room-occupancy";
import { todayInZone } from "@/lib/time";
import type { Booking, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLOOR_SURFACE = {
  default: {
    plate: "#f7f3eb",
    inner: "#fffcf7",
    amenity: "#f7f3eb",
    amenityStroke: "#d9cdb8",
    corridor: "#efe8da",
    desk: "#efe8da",
  },
  location: {
    plate: "#e8efe9",
    inner: "#f3f7f4",
    amenity: "#e4ebe5",
    amenityStroke: "#c5d0c8",
    corridor: "#d7e2db",
    desk: "#d7e2db",
  },
} as const;

type FloorSurface = (typeof FLOOR_SURFACE)[keyof typeof FLOOR_SURFACE];

type OfficeFloorPlanProps = {
  selectedFloorId: FloorId;
  kioskFloorId: FloorId;
  selectedRoomId: string | null;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
};

export function OfficeFloorPlan({
  selectedFloorId,
  kioskFloorId,
  selectedRoomId,
  onSelectFloor,
  onSelectRoom,
}: OfficeFloorPlanProps) {
  const { board, loading, error, now } = useBoard();
  const viewingToday = board?.date === todayInZone(board?.timezone, now);

  if (loading && !board) {
    return (
      <div className="h-full min-h-64 animate-pulse bg-[#efe8da]" aria-busy="true" />
    );
  }

  if ((error && !board) || !board) {
    return (
      <p className="border border-[#d9cdb8] bg-white px-4 py-6 text-sm text-[#6b6458]">
        Floor plan unavailable until the board feed loads.
      </p>
    );
  }

  const roomsById = new Map(board.rooms.map((room) => [room.id, room]));

  return (
    <section
      aria-label="Office floor plans with meeting rooms coloured by occupancy"
      className="flex h-full min-h-[22rem] flex-col border border-[#d9cdb8] bg-white"
    >
      <div className="flex shrink-0 items-end justify-between gap-3 border-b border-[#d9cdb8] px-4 py-2">
        <div>
          <p className="text-[10px] tracking-[0.28em] text-[#c5a44e] uppercase">
            Office plates
          </p>
          <h2
            className="text-lg leading-tight text-[#004b49] md:text-xl"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Floor plans
          </h2>
        </div>
        <p className="text-right text-[10px] tracking-[0.12em] text-[#6b6458] uppercase">
          Tap a floor to book its rooms
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        {OFFICE_FLOORS.map((floor) => (
          <FloorCard
            key={floor.id}
            floor={{ ...floor, rooms: shapesForFloor(floor, board.rooms) }}
            roomsById={roomsById}
            bookings={board.bookings}
            inUseRoomIds={board.inUseRoomIds}
            now={now}
            viewingToday={viewingToday}
            selected={selectedFloorId === floor.id}
            isKioskFloor={kioskFloorId === floor.id}
            selectedRoomId={selectedRoomId}
            onSelectFloor={onSelectFloor}
            onSelectRoom={onSelectRoom}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#d9cdb8] px-4 py-2">
        <div className="flex items-center gap-4 text-[10px] tracking-[0.16em] text-[#6b6458] uppercase">
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
        <p className="text-[10px] tracking-[0.08em] text-[#6b6458]">
          Gold frame is the floor on the day board
        </p>
      </div>
    </section>
  );
}

function FloorCard({
  floor,
  roomsById,
  bookings,
  inUseRoomIds,
  now,
  viewingToday,
  selected,
  isKioskFloor,
  selectedRoomId,
  onSelectFloor,
  onSelectRoom,
}: {
  floor: OfficeFloor;
  roomsById: Map<string, Room>;
  bookings: Booking[];
  inUseRoomIds: string[];
  now: Date;
  viewingToday: boolean;
  selected: boolean;
  isKioskFloor: boolean;
  selectedRoomId: string | null;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${floor.id}, ${floor.building}${isKioskFloor ? ", your location" : ""}`}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden border text-left outline-none",
        selected && "border-[#c5a44e] ring-1 ring-[#c5a44e]",
        !selected && "border-[#d9cdb8] hover:border-[#c5a44e]/70",
        isKioskFloor
          ? "bg-[#e8efe9]"
          : selected
            ? "bg-[#efe8da]/50"
            : "bg-[#fffcf7]",
      )}
      onClick={() => onSelectFloor(floor.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectFloor(floor.id);
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1">
        <div className="min-w-0">
          <p
            className="text-base leading-tight text-[#004b49]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {floor.id}
          </p>
          <p className="truncate text-[10px] tracking-[0.12em] text-[#6b6458] uppercase">
            {floor.building}
          </p>
        </div>
        {isKioskFloor ? (
          <span className="shrink-0 bg-[#004b49] px-2 py-0.5 text-[9px] font-medium tracking-[0.16em] text-[#f7f3eb] uppercase">
            Your location
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 px-2 pb-2">
        <FloorPlateSvg
          floor={floor}
          roomsById={roomsById}
          bookings={bookings}
          inUseRoomIds={inUseRoomIds}
          now={now}
          viewingToday={viewingToday}
          selectedRoomId={selectedRoomId}
          isKioskFloor={isKioskFloor}
          onSelectFloor={onSelectFloor}
          onSelectRoom={onSelectRoom}
        />
      </div>
    </div>
  );
}

function FloorPlateSvg({
  floor,
  roomsById,
  bookings,
  inUseRoomIds,
  now,
  viewingToday,
  selectedRoomId,
  isKioskFloor,
  onSelectFloor,
  onSelectRoom,
}: {
  floor: OfficeFloor;
  roomsById: Map<string, Room>;
  bookings: Booking[];
  inUseRoomIds: string[];
  now: Date;
  viewingToday: boolean;
  selectedRoomId: string | null;
  isKioskFloor: boolean;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
}) {
  const surface = isKioskFloor ? FLOOR_SURFACE.location : FLOOR_SURFACE.default;
  return (
    <svg
      viewBox={`0 0 ${FLOOR_PLAN_VIEWBOX.width} ${FLOOR_PLAN_VIEWBOX.height}`}
      className="h-full w-full max-h-full max-w-full"
      preserveAspectRatio="none"
    >
      <rect width="2000" height="780" fill={surface.plate} />
      <rect
        x="28"
        y="28"
        width="1944"
        height="724"
        fill={surface.inner}
        stroke="#004b49"
        strokeWidth="6"
      />
      <rect
        x="40"
        y="40"
        width="1920"
        height="700"
        fill="none"
        stroke="#004b49"
        strokeWidth="1.25"
      />
      <FloorAmenities layout={floor.layout} surface={surface} />
      {floor.rooms.map((shape) => {
        const room = roomsById.get(shape.roomId);
        if (!room) return null;
        const occupancy = roomOccupancy(
          room.id,
          bookings,
          now,
          viewingToday,
          inUseRoomIds,
        );
        const selected = selectedRoomId === room.id;
        const fill = OCCUPANCY_FILL[occupancy.kind];
        const stroke =
          selected ? "#c5a44e" : OCCUPANCY_STROKE[occupancy.kind];
        return (
          <g key={room.id}>
            <rect
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              className={cn(occupancy.occupied && "floor-room-busy")}
              fill={fill}
              fillOpacity={occupancyFillOpacity(occupancy)}
              stroke={stroke}
              strokeWidth={selected ? 5 : 2.25}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${room.name}, ${occupancyWord(occupancy.kind).toLowerCase()}. ${occupancy.label}`}
              style={{ cursor: "pointer" }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectFloor(floor.id);
                onSelectRoom(selected ? null : room.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectFloor(floor.id);
                  onSelectRoom(selected ? null : room.id);
                }
              }}
            />
            <text
              x={shape.labelX}
              y={shape.labelY - 10}
              textAnchor="middle"
              fill="#1c1914"
              fontSize={shape.width < 220 || shape.height < 140 ? 14 : 18}
              style={{ fontFamily: "var(--font-cormorant), serif", pointerEvents: "none" }}
            >
              {room.name}
            </text>
            <text
              x={shape.labelX}
              y={shape.labelY + 12}
              textAnchor="middle"
              fill={
                occupancy.kind === "booked" ? "#9b2c2c" : "#004b49"
              }
              fontSize="11"
              letterSpacing="0.18em"
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                pointerEvents: "none",
              }}
            >
              {occupancyWord(occupancy.kind)}
            </text>
            <text
              x={shape.labelX}
              y={shape.labelY + 28}
              textAnchor="middle"
              fill="#6b6458"
              fontSize="10"
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                pointerEvents: "none",
              }}
            >
              {room.capacity} seats
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FloorAmenities({
  layout,
  surface,
}: {
  layout: OfficeFloor["layout"];
  surface: FloorSurface;
}) {
  if (layout === "pot14") {
    return (
      <>
        <AmenitySpace surface={surface} x={268} y={56} width={1168} height={300} label="Open office" />
        <DeskGrid surface={surface} x={300} y={84} cols={8} />
        <AmenitySpace surface={surface} x={720} y={292} width={100} height={80} label="Lift" />
        <AmenitySpace surface={surface} x={828} y={292} width={90} height={80} label="Stairs" />
        <StairMarks surface={surface} x={840} y={308} />
        <AmenitySpace surface={surface} x={926} y={292} width={74} height={80} label="WC" />
        <Corridor surface={surface} />
        <AmenitySpace surface={surface} x={268} y={444} width={280} height={280} label="Pantry" />
        <AmenitySpace surface={surface} x={564} y={444} width={320} height={280} label="Reception" />
        <AmenitySpace surface={surface} x={900} y={444} width={492} height={280} label="Lounge" />
        <NorthMark surface={surface} x={1080} y={700} />
      </>
    );
  }

  if (layout === "sgb") {
    return null;
  }

  return (
    <>
      <AmenitySpace surface={surface} x={564} y={56} width={1168} height={300} label="Open office" />
      <DeskGrid surface={surface} x={596} y={84} cols={8} />
      <AmenitySpace surface={surface} x={900} y={292} width={100} height={80} label="Lift" />
      <rect x="930" y="314" width="40" height="40" fill="none" stroke="#d9cdb8" strokeWidth="1.5" />
      <line x1="930" y1="314" x2="970" y2="354" stroke="#d9cdb8" strokeWidth="1.5" />
      <line x1="970" y1="314" x2="930" y2="354" stroke="#d9cdb8" strokeWidth="1.5" />
      <AmenitySpace surface={surface} x={1008} y={292} width={90} height={80} label="Stairs" />
      <StairMarks surface={surface} x={1020} y={308} />
      <AmenitySpace surface={surface} x={1106} y={292} width={74} height={80} label="WC" />
      <Corridor surface={surface} />
      <AmenitySpace surface={surface} x={608} y={444} width={280} height={280} label="Pantry" />
      <AmenitySpace surface={surface} x={904} y={444} width={320} height={280} label="Reception" />
      <AmenitySpace surface={surface} x={1240} y={444} width={492} height={280} label="Lounge" />
      <NorthMark surface={surface} x={1080} y={700} />
    </>
  );
}

function Corridor({ surface }: { surface: FloorSurface }) {
  return (
    <>
      <rect x="40" y="372" width="1920" height="56" fill={surface.corridor} />
      <text
        x="1000"
        y="406"
        textAnchor="middle"
        fill="#6b6458"
        fontSize="11"
        letterSpacing="0.28em"
        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
      >
        CORRIDOR
      </text>
    </>
  );
}

function NorthMark({
  x,
  y,
  surface,
}: {
  x: number;
  y: number;
  surface: FloorSurface;
}) {
  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r="22" fill={surface.inner} stroke="#004b49" strokeWidth="1.25" />
      <polygon
        points={`${x},${y - 18} ${x + 5},${y} ${x},${y - 4} ${x - 5},${y}`}
        fill="#004b49"
      />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        fill="#004b49"
        fontSize="10"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        N
      </text>
    </g>
  );
}

function AmenitySpace({
  x,
  y,
  width,
  height,
  label,
  surface,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  surface: FloorSurface;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={surface.amenity}
        stroke={surface.amenityStroke}
        strokeWidth="1.5"
      />
      <text
        x={x + width / 2}
        y={y + 22}
        textAnchor="middle"
        fill="#6b6458"
        fontSize="11"
        letterSpacing="0.2em"
        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

function DeskGrid({
  x,
  y,
  rows = 4,
  cols = 3,
  surface,
}: {
  x: number;
  y: number;
  rows?: number;
  cols?: number;
  surface: FloorSurface;
}) {
  const desks = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const left = x + col * 118;
      const top = y + row * 52;
      desks.push(
        <g key={`${row}-${col}`}>
          <rect
            x={left}
            y={top}
            width={48}
            height={20}
            fill={surface.desk}
            stroke={surface.amenityStroke}
          />
          <rect
            x={left + 54}
            y={top}
            width={48}
            height={20}
            fill={surface.desk}
            stroke={surface.amenityStroke}
          />
        </g>,
      );
    }
  }
  return <g>{desks}</g>;
}

function StairMarks({
  x,
  y,
  surface,
}: {
  x: number;
  y: number;
  surface: FloorSurface;
}) {
  return (
    <g>
      {Array.from({ length: 7 }, (_, index) => (
        <line
          key={index}
          x1={x}
          y1={y + index * 7}
          x2={x + 66}
          y2={y + index * 7}
          stroke={surface.amenityStroke}
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
}
