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
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/feedback";
import { useStore } from "@/lib/store";
import {
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  SEVERITIES,
  SEVERITY_LABELS,
  SITES,
  type IncidentCategory,
  type Severity,
  type Site,
} from "@/lib/types";

const emptyForm = {
  title: "",
  site: "North Wharf" as Site,
  category: "near-miss" as IncidentCategory,
  severity: "medium" as Severity,
  reportedBy: "",
  description: "",
};

export function LogIncidentButton({
  variant = "default",
}: {
  variant?: "default" | "outline";
}) {
  const { addIncident } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      form.title.trim().length > 3 &&
      form.reportedBy.trim().length > 1 &&
      form.description.trim().length > 8,
    [form],
  );

  function reset() {
    setForm(emptyForm);
    setError(null);
  }

  function submit() {
    if (!form.title.trim()) {
      setError("Give the report a short title so the shift lead can scan it.");
      return;
    }
    if (!form.reportedBy.trim()) {
      setError("Who is filing this report?");
      return;
    }
    if (form.description.trim().length < 8) {
      setError("Add what happened, where, and who was involved.");
      return;
    }

    addIncident({
      title: form.title.trim(),
      site: form.site,
      category: form.category,
      severity: form.severity,
      reportedBy: form.reportedBy.trim(),
      description: form.description.trim(),
    });
    toast.success("Incident logged", {
      description: "It is now on the open incidents board.",
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        Log incident
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log an incident</DialogTitle>
          <DialogDescription>
            File a near miss, injury, hygiene failure, or property event. Keep
            it factual — investigation details can follow.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {error ? <ErrorBanner message={error} /> : null}
          <div className="grid gap-1.5">
            <Label htmlFor="incident-title">Title</Label>
            <Input
              id="incident-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="What happened, in one line"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Site</Label>
              <Select
                value={form.site}
                onValueChange={(value) => {
                  if (!value) return;
                  setForm((current) => ({ ...current, site: value as Site }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITES.map((site) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => {
                  if (!value) return;
                  setForm((current) => ({
                    ...current,
                    category: value as IncidentCategory,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(value) => {
                  if (!value) return;
                  setForm((current) => ({
                    ...current,
                    severity: value as Severity,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {SEVERITY_LABELS[severity]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="incident-reporter">Reported by</Label>
              <Input
                id="incident-reporter"
                value={form.reportedBy}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reportedBy: event.target.value,
                  }))
                }
                placeholder="Shift lead or witness"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="incident-notes">What happened</Label>
            <Textarea
              id="incident-notes"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Facts only: location, people, immediate controls"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit && !error}>
              Save report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
