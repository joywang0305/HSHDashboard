"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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
const CHANGE_EVENT = "hsh-dashboard-updated";

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

let cachedRaw: string | null | undefined;
let cachedData: DashboardData = seedData;

function readStore(): DashboardData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedData;
    cachedRaw = raw;
    if (!raw) {
      cachedData = seedData;
      return cachedData;
    }
    const parsed = JSON.parse(raw) as unknown;
    cachedData = isDashboardData(parsed) ? parsed : seedData;
    return cachedData;
  } catch {
    cachedRaw = null;
    cachedData = seedData;
    return cachedData;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function persist(next: DashboardData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function updateStore(updater: (current: DashboardData) => DashboardData) {
  persist(updater(readStore()));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(subscribe, readStore, () => seedData);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const addIncident = useCallback<StoreValue["addIncident"]>((input) => {
    let created: Incident | undefined;
    updateStore((current) => {
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
      updateStore((current) => ({
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
      updateStore((current) => ({
        ...current,
        inspections: current.inspections.map((item) =>
          item.id === id ? { ...item, status: "complete", score } : item,
        ),
      }));
    },
    [],
  );

  const completeAction = useCallback<StoreValue["completeAction"]>((id) => {
    updateStore((current) => ({
      ...current,
      actions: current.actions.map((item) =>
        item.id === id ? { ...item, status: "done" } : item,
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    persist(seedData);
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
