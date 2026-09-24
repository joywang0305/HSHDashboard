"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { AppModal } from "@/components/app-modal";
import { KioskKeyboard } from "@/components/kiosk-keyboard";
import { useBoard } from "@/components/board-provider";
import {
  floorTitle,
  kioskRoomsByFloor,
} from "@/lib/floor-plan";
import {
  DAY_START_HOUR,
  addMinutes,
  formatMinutesClock,
  formatNumericDate,
  isoFromDateAndMinutes,
  nextBookableStartMinutes,
  rangesOverlap,
  shiftDate,
  slotStartMinutes,
  todayInZone,
} from "@/lib/time";
import type { BoardPayload, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const DURATIONS = [30, 60, 90, 120];

type Field = "organizer" | "title";

type Draft = {
  room: Room;
  date: string;
  startMinutes: number;
  duration: number;
};

export function AdhocBookDialog({
  open,
  onClose,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  onBooked?: (room: Room) => void;
}) {
  const { board, now, viewDate, setViewDate, book } = useBoard();
  const today = todayInZone(board?.timezone, now);
  const initialDate = viewDate < today ? today : viewDate;
  const [date, setDate] = useState(initialDate);
  const [duration, setDuration] = useState(30);
  const [startMinutes, setStartMinutes] = useState(
    () =>
      nextBookableStartMinutes(now, initialDate, 30) ?? DAY_START_HOUR * 60,
  );
  const [feed, setFeed] = useState<BoardPayload | null>(
    board?.date === initialDate ? board : null,
  );
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [organizer, setOrganizer] = useState("");
  const [title, setTitle] = useState("");
  const [field, setField] = useState<Field>("organizer");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/board?date=${encodeURIComponent(date)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load rooms.");
        return (await response.json()) as BoardPayload;
      })
      .then((payload) => {
        if (!cancelled) setFeed(payload);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Could not load rooms.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, date]);

  const starts = useMemo(() => {
    const all = slotStartMinutes(duration);
    if (date > today) return all;
    if (date < today) return [];
    const nowMinutes = nextBookableStartMinutes(now, date, duration);
    if (nowMinutes == null) return [];
    return all.filter((item) => item >= nowMinutes);
  }, [date, duration, now, today]);

  useEffect(() => {
    if (starts.length === 0) return;
    if (starts.includes(startMinutes)) return;
    const earlier = [...starts].reverse().find((item) => item <= startMinutes);
    setStartMinutes(earlier ?? starts[0]);
  }, [starts, startMinutes]);

  const startIso = isoFromDateAndMinutes(date, startMinutes);
  const endIso = addMinutes(startIso, duration);
  const endMinutes = startMinutes + duration;
  const liveFeed = feed?.date === date ? feed : null;
  const viewingToday = date === today;

  const available = useMemo(() => {
    if (!liveFeed) return [];
    const groups = kioskRoomsByFloor(liveFeed.rooms);
    const slotOverlapsNow =
      viewingToday &&
      new Date(startIso).getTime() <= now.getTime() &&
      now.getTime() < new Date(endIso).getTime();
    return groups
      .map((group) => ({
        ...group,
        rooms: group.rooms.filter((room) => {
          const clash = liveFeed.bookings.some(
            (item) =>
              item.roomId === room.id &&
              rangesOverlap(item.start, item.end, startIso, endIso),
          );
          if (clash) return false;
          if (slotOverlapsNow && liveFeed.inUseRoomIds.includes(room.id)) {
            return false;
          }
          return true;
        }),
      }))
      .filter((group) => group.rooms.length > 0);
  }, [liveFeed, startIso, endIso, viewingToday, now]);

  const availableCount = available.reduce(
    (sum, group) => sum + group.rooms.length,
    0,
  );

  function pickDate(next: string) {
    if (next < today) return;
    setDate(next);
    const start = nextBookableStartMinutes(now, next, duration);
    if (start != null) setStartMinutes(start);
  }

  function stepStart(delta: number) {
    const index = starts.indexOf(startMinutes);
    const next = starts[index + delta];
    if (next != null) setStartMinutes(next);
  }

  async function submit() {
    if (!draft) return;
    if (organizer.trim().length < 2) {
      setError("Type the booker’s name.");
      setField("organizer");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const start = isoFromDateAndMinutes(draft.date, draft.startMinutes);
      await book({
        roomId: draft.room.id,
        title,
        organizer,
        start,
        end: addMinutes(start, draft.duration),
      });
      if (draft.date !== viewDate) setViewDate(draft.date);
      onBooked?.(draft.room);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Booking failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      eyebrow="Walk-in"
      title={draft ? `Book ${draft.room.name}` : "Book a meeting room"}
      description={
        draft
          ? `${formatMinutesClock(draft.startMinutes)}–${formatMinutesClock(draft.startMinutes + draft.duration)} · ${draft.room.floor} · ${draft.room.capacity} seats`
          : `${formatMinutesClock(startMinutes)}–${formatMinutesClock(endMinutes)} · ${starts.length === 0 ? "no remaining slots" : `${availableCount} room${availableCount === 1 ? "" : "s"} free`}`
      }
      className="max-h-[min(92vh,56rem)] w-[calc(100%-2rem)] max-w-6xl overflow-hidden"
    >
      {error ? (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {draft ? (
        <div className="grid min-h-0 gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <KioskField
              label="Booked by"
              value={organizer}
              placeholder="Name as it should appear on the board"
              active={field === "organizer"}
              onFocus={() => setField("organizer")}
            />
            <KioskField
              label="Meeting title · optional"
              value={title}
              placeholder="Leave blank for Ad hoc"
              active={field === "title"}
              onFocus={() => setField("title")}
            />
          </div>
          <KioskKeyboard
            value={field === "organizer" ? organizer : title}
            onChange={field === "organizer" ? setOrganizer : setTitle}
          />
          <div className="-mx-6 -mb-6 flex justify-between gap-3 border-t border-[#d9cdb8] bg-[#f7f3eb] p-4">
            <button
              type="button"
              className="cursor-pointer border border-[#d9cdb8] bg-white px-5 py-2.5 text-[11px] font-medium tracking-[0.22em] text-[#004b49] uppercase hover:border-[#c5a44e]"
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              className="min-w-32 cursor-pointer border border-[#004b49] bg-[#004b49] px-5 py-2.5 text-[11px] font-medium tracking-[0.22em] text-[#f7f3eb] uppercase hover:bg-[#0a5a57] disabled:opacity-60"
              onClick={() => void submit()}
            >
              {saving ? "Booking…" : "Book room"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <DateStepper date={date} minDate={today} onPick={pickDate} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous slot"
                disabled={starts.indexOf(startMinutes) <= 0}
                className="flex size-9 cursor-pointer items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] disabled:opacity-40"
                onClick={() => stepStart(-1)}
              >
                <ChevronLeft className="size-4" />
              </button>
              <p
                className="min-w-36 text-center text-xl font-medium italic text-[#004b49]"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {formatMinutesClock(startMinutes)}–{formatMinutesClock(endMinutes)}
              </p>
              <button
                type="button"
                aria-label="Next slot"
                disabled={starts.indexOf(startMinutes) >= starts.length - 1}
                className="flex size-9 cursor-pointer items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] disabled:opacity-40"
                onClick={() => stepStart(1)}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDuration(item)}
                  className={cn(
                    "h-9 cursor-pointer border px-3 text-[11px] font-medium tracking-[0.16em] uppercase",
                    duration === item
                      ? "border-[#004b49] bg-[#004b49] text-[#f7f3eb]"
                      : "border-[#d9cdb8] bg-white text-[#004b49] hover:border-[#c5a44e]",
                  )}
                >
                  {item} min
                </button>
              ))}
            </div>
          </div>

          {starts.length > 1 ? (
            <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
              {starts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStartMinutes(item)}
                  className={cn(
                    "h-8 cursor-pointer border px-2 text-[11px] tracking-[0.08em]",
                    item === startMinutes
                      ? "border-[#004b49] bg-[#004b49] text-[#f7f3eb]"
                      : "border-[#d9cdb8] bg-white text-[#004b49] hover:border-[#c5a44e]",
                  )}
                >
                  {formatMinutesClock(item)}
                </button>
              ))}
            </div>
          ) : null}

          <div className="max-h-[min(46vh,28rem)] min-h-40 overflow-y-auto border border-[#d9cdb8] bg-white">
            {loading && !liveFeed ? (
              <p className="px-4 py-8 text-center text-sm text-[#6b6458]">
                Checking rooms…
              </p>
            ) : starts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#6b6458]">
                No remaining slots today. Pick another date.
              </p>
            ) : availableCount === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#6b6458]">
                No rooms free at this time. Try another slot.
              </p>
            ) : (
              available.map((group) => (
                <section key={group.floor.id} className="border-b border-[#efe8da] last:border-b-0">
                  <p className="bg-[#f7f3eb] px-3 py-1.5 text-[10px] tracking-[0.2em] text-[#6b6458] uppercase">
                    {floorTitle(group.floor)} · {group.floor.building}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {group.rooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        className="cursor-pointer border-r border-b border-[#efe8da] bg-white px-3 py-3 text-left hover:bg-[#f7f3eb]"
                        onClick={() => {
                          setDraft({
                            room,
                            date,
                            startMinutes,
                            duration,
                          });
                          setField("organizer");
                          setError(null);
                        }}
                      >
                        <p
                          className="text-lg leading-tight font-medium text-[#004b49]"
                          style={{ fontFamily: "var(--font-cormorant), serif" }}
                        >
                          {room.name}
                        </p>
                        <p className="mt-1 text-[10px] tracking-[0.14em] text-[#6b6458] uppercase">
                          {room.capacity} seats · available
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </AppModal>
  );
}

function KioskField({
  label,
  value,
  placeholder,
  active,
  onFocus,
}: {
  label: string;
  value: string;
  placeholder: string;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFocus}
      className={cn(
        "grid cursor-pointer gap-1.5 border bg-white px-3 py-2.5 text-left",
        active ? "border-[#c5a44e]" : "border-[#d9cdb8]",
      )}
    >
      <span className="text-[11px] font-medium tracking-[0.18em] text-[#004b49] uppercase">
        {label}
      </span>
      <span
        className={cn(
          "min-h-7 text-lg leading-tight",
          value ? "text-[#004b49]" : "text-[#6b6458]",
        )}
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        {value || placeholder}
      </span>
    </button>
  );
}

function DateStepper({
  date,
  minDate,
  onPick,
}: {
  date: string;
  minDate: string;
  onPick: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous day"
        disabled={date <= minDate}
        className="flex size-9 cursor-pointer items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e] disabled:opacity-40"
        onClick={() => {
          const previous = shiftDate(date, -1);
          if (previous >= minDate) onPick(previous);
        }}
      >
        <ChevronLeft className="size-4" />
      </button>
      <label className="relative h-9 w-[11rem] shrink-0 cursor-pointer">
        <span className="pointer-events-none flex h-full items-center justify-between border border-[#d9cdb8] bg-white px-3 text-sm text-[#004b49]">
          {formatNumericDate(date)}
          <Calendar className="size-4" />
        </span>
        <input
          type="date"
          lang="en-GB"
          min={minDate}
          value={date}
          onChange={(event) => {
            if (event.target.value) onPick(event.target.value);
          }}
          aria-label="Choose a date"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <button
        type="button"
        aria-label="Next day"
        className="flex size-9 cursor-pointer items-center justify-center border border-[#d9cdb8] text-[#004b49] hover:border-[#c5a44e]"
        onClick={() => onPick(shiftDate(date, 1))}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
