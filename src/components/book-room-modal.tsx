"use client";

import { useMemo, useState } from "react";
import { AppModal } from "@/components/app-modal";
import { KioskKeyboard } from "@/components/kiosk-keyboard";
import { NativeSelect } from "@/components/native-select";
import { useBoard } from "@/components/board-provider";
import { addMinutes, formatClock } from "@/lib/time";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SlotDraft = {
  room: Room;
  start: string;
};

const DURATIONS = [30, 60, 90, 120];

type Field = "organizer" | "title";

export function BookRoomModal({
  draft,
  onClose,
}: {
  draft: SlotDraft | null;
  onClose: () => void;
}) {
  const { book } = useBoard();
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [field, setField] = useState<Field>("organizer");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const end = useMemo(() => {
    if (!draft) return "";
    return addMinutes(draft.start, minutes);
  }, [draft, minutes]);

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
      await book({
        roomId: draft.room.id,
        title,
        organizer,
        start: draft.start,
        end,
      });
      setTitle("");
      setOrganizer("");
      setMinutes(30);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Booking failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={draft !== null}
      onClose={onClose}
      title={draft ? `Book ${draft.room.name}` : "Book a meeting room"}
      description={
        draft
          ? `${formatClock(draft.start)}–${formatClock(end)} · ${draft.room.floor} · holds ${draft.room.capacity}`
          : undefined
      }
      className="max-h-[min(92vh,52rem)] w-[calc(100%-2rem)] max-w-3xl overflow-hidden"
    >
      {error ? (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setField("organizer")}
            className={cn(
              "grid cursor-pointer gap-1.5 border bg-white px-3 py-2.5 text-left",
              field === "organizer" ? "border-[#c5a44e]" : "border-[#d9cdb8]",
            )}
          >
            <span className="text-[11px] font-medium tracking-[0.18em] text-[#004b49] uppercase">
              Booked by
            </span>
            <span
              className={cn(
                "min-h-7 text-lg leading-tight",
                organizer ? "text-[#004b49]" : "text-[#6b6458]",
              )}
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {organizer || "Name as it should appear on the board"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setField("title")}
            className={cn(
              "grid cursor-pointer gap-1.5 border bg-white px-3 py-2.5 text-left",
              field === "title" ? "border-[#c5a44e]" : "border-[#d9cdb8]",
            )}
          >
            <span className="text-[11px] font-medium tracking-[0.18em] text-[#004b49] uppercase">
              Meeting title · optional
            </span>
            <span
              className={cn(
                "min-h-7 text-lg leading-tight",
                title ? "text-[#004b49]" : "text-[#6b6458]",
              )}
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {title || "Leave blank for Ad hoc"}
            </span>
          </button>
        </div>
        <label className="grid gap-1.5 text-[11px] font-medium tracking-[0.18em] text-[#004b49] uppercase">
          Duration
          <NativeSelect
            value={String(minutes)}
            onChange={(event) => setMinutes(Number(event.target.value))}
          >
            {DURATIONS.map((item) => (
              <option key={item} value={item}>
                {item} minutes
              </option>
            ))}
          </NativeSelect>
        </label>
        <KioskKeyboard
          value={field === "organizer" ? organizer : title}
          onChange={field === "organizer" ? setOrganizer : setTitle}
        />
        <div className="-mx-6 -mb-6 flex justify-end border-t border-[#d9cdb8] bg-[#f7f3eb] p-4">
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
    </AppModal>
  );
}
