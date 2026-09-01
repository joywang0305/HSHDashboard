"use client";

import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { IncidentTrend } from "@/components/incident-trend";
import { KpiCard } from "@/components/kpi-card";
import { LogIncidentButton } from "@/components/log-incident-dialog";
import {
  IncidentStatusBadge,
  InspectionStatusBadge,
  SeverityBadge,
} from "@/components/status-badges";
import { formatDate, formatDateTime } from "@/lib/format";
import { useKpis, useStore } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OverviewPage() {
  const { incidents, inspections, actions } = useStore();
  const kpis = useKpis();

  const recent = [...incidents]
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .slice(0, 5);
  const dueInspections = inspections
    .filter((item) => item.status !== "complete")
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const hotActions = actions
    .filter((item) => item.status !== "done")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return a.due.localeCompare(b.due);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-teal-800 uppercase">
            Live board · 1 Sep 2026
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
            Site health at a glance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Open incidents, overdue inspections, and corrective actions across
            Northline Works. Log issues as they happen — do not wait for the
            end of shift.
          </p>
        </div>
        <LogIncidentButton />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open incidents"
          value={kpis.openIncidents}
          hint="Not yet closed on the board"
          tone={kpis.openIncidents > 0 ? "warn" : "ok"}
        />
        <KpiCard
          label="Days LTI-free"
          value={kpis.ltiFreeDays}
          hint="Since the last lost-time injury"
          tone="ok"
        />
        <KpiCard
          label="Overdue inspections"
          value={kpis.overdueInspections}
          hint="Walks that missed their date"
          tone={kpis.overdueInspections > 0 ? "warn" : "ok"}
        />
        <KpiCard
          label="Hygiene score"
          value={`${kpis.hygieneScore}%`}
          hint="Average of completed hygiene walks"
          tone={kpis.hygieneScore < 80 ? "warn" : "ok"}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Incident reports by week</CardTitle>
            <CardDescription>
              Includes near misses, injuries, hygiene, and property events.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <IncidentTrend incidents={incidents} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Corrective actions</CardTitle>
            <CardDescription>
              {kpis.overdueActions} overdue · {kpis.openActions} still open
            </CardDescription>
            <CardAction>
              <Link
                href="/actions"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-3">
            {hotActions.length === 0 ? (
              <EmptyState
                title="No open actions"
                description="Every corrective action is closed. Keep logging near misses so this stays true."
              />
            ) : (
              <ul className="divide-y">
                {hotActions.slice(0, 4).map((action) => (
                  <li key={action.id} className="py-3">
                    <p className="font-medium text-foreground">{action.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.owner} · due {formatDate(action.due)} ·{" "}
                      {action.relatedTo}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Latest incidents</CardTitle>
            <CardDescription>Most recent reports, any status.</CardDescription>
            <CardAction>
              <Link
                href="/incidents"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Incident board
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2">
            {recent.length === 0 ? (
              <EmptyState
                title="No incidents logged"
                description="That is unusual for a working site. Restore demo data or file the first report."
                action={<LogIncidentButton variant="outline" />}
              />
            ) : (
              <ul className="divide-y">
                {recent.map((incident) => (
                  <li
                    key={incident.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{incident.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {incident.id} · {incident.site} ·{" "}
                        {CATEGORY_LABELS[incident.category]} ·{" "}
                        {formatDateTime(incident.reportedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <SeverityBadge severity={incident.severity} />
                      <IncidentStatusBadge status={incident.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Inspections still due</CardTitle>
            <CardDescription>
              Overdue items sit at the top of the list.
            </CardDescription>
            <CardAction>
              <Link
                href="/inspections"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Schedule
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2">
            {dueInspections.length === 0 ? (
              <EmptyState
                title="Nothing waiting"
                description="All scheduled walks are complete. Book the next hygiene round while the board is quiet."
              />
            ) : (
              <ul className="divide-y">
                {dueInspections.map((inspection) => (
                  <li
                    key={inspection.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{inspection.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {inspection.site} · {inspection.inspector} ·{" "}
                        {formatDate(inspection.scheduledFor)}
                      </p>
                    </div>
                    <InspectionStatusBadge status={inspection.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
