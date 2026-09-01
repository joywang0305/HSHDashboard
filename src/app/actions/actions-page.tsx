"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ActionStatusBadge, SeverityBadge } from "@/components/status-badges";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  ACTION_STATUS_LABELS,
  ACTION_STATUSES,
  type ActionStatus,
} from "@/lib/types";

export function ActionsPage() {
  const { actions, completeAction } = useStore();
  const [status, setStatus] = useState<ActionStatus | "all">("all");

  const rows = useMemo(() => {
    return actions
      .filter((item) => (status === "all" ? true : item.status === status))
      .sort((a, b) => {
        if (a.status === "overdue" && b.status !== "overdue") return -1;
        if (b.status === "overdue" && a.status !== "overdue") return 1;
        return a.due.localeCompare(b.due);
      });
  }, [actions, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Corrective actions
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Work that must happen after an incident or failed walk. Overdue
            items stay at the top until someone owns the close-out.
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) setStatus(value as ActionStatus | "all");
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ACTION_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {ACTION_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No actions in this filter"
          description="Closed actions drop out of the open view. Switch to All statuses to see the full trail."
        />
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Close out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="max-w-md whitespace-normal">
                    <p className="font-medium">{action.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.id} · linked to {action.relatedTo}
                    </p>
                  </TableCell>
                  <TableCell>{action.owner}</TableCell>
                  <TableCell>{formatDate(action.due)}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={action.priority} />
                  </TableCell>
                  <TableCell>
                    <ActionStatusBadge status={action.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {action.status !== "done" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          completeAction(action.id);
                          toast.success(`${action.id} closed out`);
                        }}
                      >
                        Mark done
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Closed
                      </span>
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
