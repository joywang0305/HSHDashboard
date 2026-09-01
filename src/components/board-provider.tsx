"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { POLL_MS } from "@/lib/time";
import type { BoardPayload, CreateBookingInput } from "@/lib/types";

type BoardContextValue = {
  board: BoardPayload | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  book: (input: CreateBookingInput) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/board", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("The board feed is unavailable.");
      }
      const payload = (await response.json()) as BoardPayload;
      setBoard(payload);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load the board.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- load and poll the shared board feed */
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => window.clearInterval(timer);
  }, [refresh]);

  const book = useCallback(
    async (input: CreateBookingInput) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Booking failed.");
      }
      await refresh();
    },
    [refresh],
  );

  const resetDemo = useCallback(async () => {
    await fetch("/api/board/reset", { method: "POST" });
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ board, error, loading, refresh, book, resetDemo }),
    [board, error, loading, refresh, book, resetDemo],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

export function useBoard() {
  const value = useContext(BoardContext);
  if (!value) {
    throw new Error("useBoard must be used inside BoardProvider");
  }
  return value;
}
