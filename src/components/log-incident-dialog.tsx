"use client";

import { useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { AppModal } from "@/components/app-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
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
      <button
        type="button"
        className={buttonVariants({ variant })}
        onClick={() => setOpen(true)}
      >
        Log incident
      </button>
      <AppModal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Log an incident"
        description="File a near miss, injury, hygiene failure, or property event. Keep it factual — investigation details can follow."
      >
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
              <Label htmlFor="incident-site">Site</Label>
              <NativeSelect
                id="incident-site"
                value={form.site}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    site: event.target.value as Site,
                  }))
                }
              >
                {SITES.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="incident-category">Category</Label>
              <NativeSelect
                id="incident-category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as IncidentCategory,
                  }))
                }
              >
                {INCIDENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="incident-severity">Severity</Label>
              <NativeSelect
                id="incident-severity"
                value={form.severity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    severity: event.target.value as Severity,
                  }))
                }
              >
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {SEVERITY_LABELS[severity]}
                  </option>
                ))}
              </NativeSelect>
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
          <div className="-mx-4 -mb-4 flex justify-end border-t bg-muted/50 p-4">
          <button
            type="submit"
            className={buttonVariants()}
          >
            Save report
          </button>
          </div>
        </form>
      </AppModal>
    </>
  );
}
