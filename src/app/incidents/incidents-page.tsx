"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback";
import { LogIncidentButton } from "@/components/log-incident-dialog";
import {
  IncidentStatusBadge,
  SeverityBadge,
} from "@/components/status-badges";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUSES,
  SEVERITIES,
  SEVERITY_LABELS,
  SITES,
  type IncidentCategory,
  type IncidentStatus,
  type Severity,
  type Site,
} from "@/lib/types";

export function IncidentsPage() {
  const { incidents, updateIncidentStatus } = useStore();
  const [query, setQuery] = useState("");
  const [site, setSite] = useState<Site | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [category, setCategory] = useState<IncidentCategory | "all">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incidents.filter((item) => {
      if (site !== "all" && item.site !== site) return false;
      if (severity !== "all" && item.severity !== severity) return false;
      if (status !== "all" && item.status !== status) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.reportedBy.toLowerCase().includes(q)
      );
    });
  }, [incidents, query, site, severity, status, category]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Filter the board, update status as investigations move, and file a
            new report without leaving the page.
          </p>
        </div>
        <LogIncidentButton />
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, ID, or reporter"
          aria-label="Search incidents"
        />
        <Select
          value={site}
          onValueChange={(value) => {
            if (value) setSite(value as Site | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sites</SelectItem>
            {SITES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(value) => {
            if (value) setCategory(value as IncidentCategory | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {INCIDENT_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {CATEGORY_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={severity}
          onValueChange={(value) => {
            if (value) setSeverity(value as Severity | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {SEVERITIES.map((item) => (
              <SelectItem key={item} value={item}>
                {SEVERITY_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) setStatus(value as IncidentStatus | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INCIDENT_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {INCIDENT_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No matching incidents"
          description="Widen the filters, clear the search, or log a report if the board should not be empty."
          action={<LogIncidentButton variant="outline" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Move</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="max-w-md whitespace-normal">
                    <p className="font-medium">{incident.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {incident.id} · {CATEGORY_LABELS[incident.category]} ·{" "}
                      {incident.reportedBy} · {formatDateTime(incident.reportedAt)}
                    </p>
                  </TableCell>
                  <TableCell>{incident.site}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={incident.severity} />
                  </TableCell>
                  <TableCell>
                    <IncidentStatusBadge status={incident.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {incident.status !== "closed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next =
                            incident.status === "open"
                              ? "investigating"
                              : "closed";
                          updateIncidentStatus(incident.id, next);
                          toast.success(
                            next === "investigating"
                              ? `${incident.id} is now under investigation`
                              : `${incident.id} closed`,
                          );
                        }}
                      >
                        {incident.status === "open"
                          ? "Start investigation"
                          : "Close"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Done</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
