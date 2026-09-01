"use client";

import { useEffect, useMemo, useState } from "react";
import { BookRoomModal, type SlotDraft } from "@/components/book-room-modal";
import { useBoard } from "@/components/board-provider";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_MINUTES,
  addMinutes,
  formatClock,
  isoFromDateAndMinutes,
  minutesFromMidnight,
  rangesOverlap,
} from "@/lib/time";
import type { Booking, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, index) => DAY_START_HOUR + index,
);
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const HOUR_PX = 64;

function roomStatus(roomId: string, bookings: Booking[], now: Date) {
  const current = bookings.find(
    (item) =>
      item.roomId === roomId &&
      new Date(item.start) <= now &&
      new Date(item.end) > now,
  );
  if (current) {
    return { label: `Busy until ${formatClock(current.end)}`, busy: true };
  }
  const next = bookings
    .filter(
      (item) => item.roomId === roomId && new Date(item.start) > now,
    )
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (next) {
    return { label: `Free until ${formatClock(next.start)}`, busy: false };
  }
  return { label: "Free for the rest of the day", busy: false };
}

export function RoomDayBoard() {
  const { board, loading, error } = useBoard();
  const [now, setNow] = useState(() => new Date());
  const [draft, setDraft] = useState<SlotDraft | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop =
    ((nowMinutes - DAY_START_HOUR * 60) / TOTAL_MINUTES) * (HOURS.length * HOUR_PX);

  const hoursLabel = useMemo(
    () =>
      HOURS.map((hour) => ({
        hour,
        label: `${String(hour).padStart(2, "0")}:00`,
      })),
    [],
  );

  if (loading && !board) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-24 animate-pulse rounded-xl bg-stone-300/80" />
        <div className="h-80 animate-pulse rounded-xl bg-stone-300/80" />
      </div>
    );
  }

  if (error && !board) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800"
      >
        {error}
      </p>
    );
  }

  if (!board) return null;

  function pickSlot(room: Room, clientY: number, column: HTMLElement) {
    const rect = column.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const raw = DAY_START_HOUR * 60 + ratio * TOTAL_MINUTES;
    const snapped = Math.floor(raw / SLOT_MINUTES) * SLOT_MINUTES;
    const start = isoFromDateAndMinutes(board!.date, snapped);
    const probeEnd = addMinutes(start, SLOT_MINUTES);
    const clash = board!.bookings.some(
      (item) =>
        item.roomId === room.id &&
        rangesOverlap(item.start, item.end, start, probeEnd),
    );
    if (clash) return;
    setDraft({ room, start });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <div
          className="grid min-w-[720px]"
          style={{
            gridTemplateColumns: `4.5rem repeat(${board.rooms.length}, minmax(9rem, 1fr))`,
          }}
        >
          <div className="border-b border-border px-2 py-3 text-xs text-muted-foreground">
            Time
          </div>
          {board.rooms.map((room) => {
            const status = roomStatus(room.id, board.bookings, now);
            return (
              <div
                key={room.id}
                className="border-b border-l border-border px-3 py-3"
              >
                <p className="font-semibold text-foreground">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  {room.capacity} seats · {room.floor}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs font-medium",
                    status.busy ? "text-red-700" : "text-teal-800",
                  )}
                >
                  {status.label}
                </p>
              </div>
            );
          })}
        </div>
        <div
          className="relative grid min-w-[720px]"
          style={{
            gridTemplateColumns: `4.5rem repeat(${board.rooms.length}, minmax(9rem, 1fr))`,
          }}
        >
          <div>
            {hoursLabel.map((item) => (
              <div
                key={item.hour}
                className="border-b border-border px-2 text-[11px] text-muted-foreground"
                style={{ height: HOUR_PX }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {board.rooms.map((room) => {
            const roomBookings = board.bookings.filter(
              (item) => item.roomId === room.id,
            );
            return (
              <div
                key={room.id}
                className="relative cursor-pointer border-l border-border bg-[repeating-linear-gradient(to_bottom,transparent,transparent_63px,var(--border)_63px,var(--border)_64px)]"
                style={{ height: HOURS.length * HOUR_PX }}
                onClick={(event) =>
                  pickSlot(room, event.clientY, event.currentTarget)
                }
              >
                {roomBookings.map((booking) => (
                  <BookingBlock key={booking.id} booking={booking} />
                ))}
              </div>
            );
          })}

          {nowMinutes >= DAY_START_HOUR * 60 &&
          nowMinutes <= DAY_END_HOUR * 60 ? (
            <div
              className="pointer-events-none absolute right-0 left-0 z-10"
              style={{ top: nowTop }}
            >
              <div className="flex items-center">
                <span className="rounded bg-red-500 px-1 text-[10px] font-medium text-white">
                  Now
                </span>
                <div className="h-0.5 flex-1 bg-red-500" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Tap a free slot to book on the spot. Outlook holds the room calendars;
        this board is the shared kiosk view.
      </p>
      <BookRoomModal
        key={draft ? `${draft.room.id}-${draft.start}` : "closed"}
        draft={draft}
        onClose={() => setDraft(null)}
      />
    </div>
  );
}

function BookingBlock({ booking }: { booking: Booking }) {
  const start = minutesFromMidnight(booking.start);
  const end = minutesFromMidnight(booking.end);
  const top =
    ((start - DAY_START_HOUR * 60) / TOTAL_MINUTES) * (HOURS.length * HOUR_PX);
  const height = Math.max(
    28,
    ((end - start) / TOTAL_MINUTES) * (HOURS.length * HOUR_PX) - 4,
  );

  return (
    <button
      type="button"
      className="absolute right-1 left-1 z-20 overflow-hidden rounded-md bg-teal-800 px-2 py-1 text-left text-white shadow-sm"
      style={{ top, height }}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="truncate text-xs font-semibold">{booking.title}</p>
      <p className="truncate text-[10px] text-teal-100">
        {formatClock(booking.start)}–{formatClock(booking.end)} ·{" "}
        {booking.organizer}
      </p>
    </button>
  );
}
