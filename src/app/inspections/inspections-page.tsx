"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { EmptyState, ErrorBanner } from "@/components/feedback";
import { InspectionStatusBadge } from "@/components/status-badges";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUSES,
  INSPECTION_TYPE_LABELS,
  INSPECTION_TYPES,
  SITES,
  type Inspection,
  type InspectionStatus,
  type InspectionType,
  type Site,
} from "@/lib/types";

export function InspectionsPage() {
  const { inspections, completeInspection } = useStore();
  const [site, setSite] = useState<Site | "all">("all");
  const [type, setType] = useState<InspectionType | "all">("all");
  const [status, setStatus] = useState<InspectionStatus | "all">("all");
  const [pending, setPending] = useState<Inspection | null>(null);
  const [score, setScore] = useState("85");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return inspections
      .filter((item) => (site === "all" ? true : item.site === site))
      .filter((item) => (type === "all" ? true : item.type === type))
      .filter((item) => (status === "all" ? true : item.status === status))
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  }, [inspections, site, type, status]);

  function submitScore() {
    if (!pending) return;
    const value = Number(score);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError("Score must be a number from 0 to 100.");
      return;
    }
    completeInspection(pending.id, Math.round(value));
    toast.success(`${pending.id} marked complete`, {
      description: `Score recorded as ${Math.round(value)}.`,
    });
    setPending(null);
    setError(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inspections</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Hygiene, PPE, fire, equipment, and housekeeping walks. Record a score
          when the round is finished.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Select
          value={site}
          onValueChange={(value) => {
            if (value) setSite(value as Site | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
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
          value={type}
          onValueChange={(value) => {
            if (value) setType(value as InspectionType | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {INSPECTION_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {INSPECTION_TYPE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) setStatus(value as InspectionStatus | "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INSPECTION_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {INSPECTION_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No inspections in this view"
          description="Clear a filter or restore demo data if the schedule looks too empty for a working week."
        />
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Walk</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell className="max-w-md whitespace-normal">
                    <p className="font-medium">{inspection.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inspection.id} · {INSPECTION_TYPE_LABELS[inspection.type]}{" "}
                      · {inspection.inspector}
                    </p>
                  </TableCell>
                  <TableCell>{inspection.site}</TableCell>
                  <TableCell>{formatDate(inspection.scheduledFor)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InspectionStatusBadge status={inspection.status} />
                      {inspection.score != null ? (
                        <span className="text-xs text-muted-foreground">
                          {inspection.score}%
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {inspection.status !== "complete" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPending(inspection);
                          setScore("85");
                          setError(null);
                        }}
                      >
                        Mark complete
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Filed
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record inspection score</DialogTitle>
            <DialogDescription>
              {pending
                ? `${pending.title} · ${pending.site}`
                : "Choose a walk first."}
            </DialogDescription>
          </DialogHeader>
          {error ? <ErrorBanner message={error} /> : null}
          <div className="grid gap-1.5">
            <Label htmlFor="inspection-score">Score (0–100)</Label>
            <Input
              id="inspection-score"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitScore}>Save score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
