"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACTION_STATUS_LABELS,
  INCIDENT_STATUS_LABELS,
  INSPECTION_STATUS_LABELS,
  SEVERITY_LABELS,
  type ActionStatus,
  type IncidentStatus,
  type InspectionStatus,
  type Severity,
} from "@/lib/types";

const severityClass: Record<Severity, string> = {
  critical: "border-transparent bg-red-700 text-white",
  high: "border-transparent bg-orange-100 text-orange-950",
  medium: "border-transparent bg-amber-100 text-amber-950",
  low: "border-transparent bg-slate-100 text-slate-700",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge className={cn("font-medium", severityClass[severity])}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge
      variant={status === "closed" ? "secondary" : "outline"}
      className={cn(
        status === "open" && "border-teal-300 bg-teal-50 text-teal-900",
        status === "investigating" &&
          "border-sky-300 bg-sky-50 text-sky-950",
      )}
    >
      {INCIDENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function InspectionStatusBadge({
  status,
}: {
  status: InspectionStatus;
}) {
  return (
    <Badge
      variant={status === "complete" ? "secondary" : "outline"}
      className={cn(
        status === "overdue" && "border-red-300 bg-red-50 text-red-800",
        status === "upcoming" && "border-teal-300 bg-teal-50 text-teal-900",
      )}
    >
      {INSPECTION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return (
    <Badge
      variant={status === "done" ? "secondary" : "outline"}
      className={cn(
        status === "overdue" && "border-red-300 bg-red-50 text-red-800",
        status === "open" && "border-teal-300 bg-teal-50 text-teal-900",
      )}
    >
      {ACTION_STATUS_LABELS[status]}
    </Badge>
  );
}
