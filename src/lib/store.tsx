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
import { seedData, STORAGE_KEY } from "@/lib/seed-data";
import type {
  CorrectiveAction,
  DashboardData,
  Incident,
  Inspection,
} from "@/lib/types";

type StoreValue = DashboardData & {
  hydrated: boolean;
  addIncident: (
    input: Omit<Incident, "id" | "reportedAt" | "status"> & {
      status?: Incident["status"];
    },
  ) => Incident;
  updateIncidentStatus: (id: string, status: Incident["status"]) => void;
  completeInspection: (id: string, score: number) => void;
  completeAction: (id: string) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function nextId(prefix: string, existing: { id: string }[]) {
  const max = existing.reduce((acc, item) => {
    const n = Number.parseInt(item.id.replace(`${prefix}-`, ""), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 1000);
  return `${prefix}-${max + 1}`;
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== "object") return false;
  const data = value as DashboardData;
  return (
    Array.isArray(data.incidents) &&
    Array.isArray(data.inspections) &&
    Array.isArray(data.actions)
  );
}

function readStore(): DashboardData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData;
    const parsed = JSON.parse(raw) as unknown;
    if (isDashboardData(parsed)) return parsed;
  } catch {
    return seedData;
  }
  return seedData;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(seedData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Client-only read of saved board. Seed data is already on screen so a
    // failed or delayed read never leaves the main area blank.
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    setData(readStore());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const addIncident = useCallback<StoreValue["addIncident"]>((input) => {
    let created: Incident | undefined;
    setData((current) => {
      created = {
        ...input,
        id: nextId("INC", current.incidents),
        status: input.status ?? "open",
        reportedAt: new Date().toISOString(),
      };
      return { ...current, incidents: [created, ...current.incidents] };
    });
    if (!created) {
      throw new Error("Failed to log incident");
    }
    return created;
  }, []);

  const updateIncidentStatus = useCallback<StoreValue["updateIncidentStatus"]>(
    (id, status) => {
      setData((current) => ({
        ...current,
        incidents: current.incidents.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      }));
    },
    [],
  );

  const completeInspection = useCallback<StoreValue["completeInspection"]>(
    (id, score) => {
      setData((current) => ({
        ...current,
        inspections: current.inspections.map((item) =>
          item.id === id ? { ...item, status: "complete", score } : item,
        ),
      }));
    },
    [],
  );

  const completeAction = useCallback<StoreValue["completeAction"]>((id) => {
    setData((current) => ({
      ...current,
      actions: current.actions.map((item) =>
        item.id === id ? { ...item, status: "done" } : item,
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    setData(seedData);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      addIncident,
      updateIncidentStatus,
      completeInspection,
      completeAction,
      reset,
    }),
    [
      data,
      hydrated,
      addIncident,
      updateIncidentStatus,
      completeInspection,
      completeAction,
      reset,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return value;
}

export function useKpis() {
  const { incidents, inspections, actions, hydrated } = useStore();
  const now = new Date();

  const openIncidents = incidents.filter((item) => item.status !== "closed");
  const overdueInspections = inspections.filter(
    (item) => item.status === "overdue",
  );
  const openActions = actions.filter((item) => item.status !== "done");
  const overdueActions = actions.filter((item) => item.status === "overdue");

  const lastLti = incidents
    .filter(
      (item) =>
        item.category === "injury" &&
        (item.severity === "high" || item.severity === "critical") &&
        item.status === "closed",
    )
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))[0];

  const ltiFreeDays = lastLti
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(lastLti.reportedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const hygieneScores = inspections
    .filter((item) => item.type === "hygiene" && item.status === "complete")
    .map((item) => item.score ?? 0);
  const hygieneScore =
    hygieneScores.length > 0
      ? Math.round(
          hygieneScores.reduce((sum, score) => sum + score, 0) /
            hygieneScores.length,
        )
      : 0;

  return {
    hydrated,
    openIncidents: openIncidents.length,
    overdueInspections: overdueInspections.length,
    openActions: openActions.length,
    overdueActions: overdueActions.length,
    ltiFreeDays,
    hygieneScore,
  };
}

export type { CorrectiveAction, Incident, Inspection };
