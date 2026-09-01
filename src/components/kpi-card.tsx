import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  loading,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "warn" | "ok";
  loading?: boolean;
}) {
  return (
    <Card size="sm" className="shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight",
              tone === "warn" && "text-red-700",
              tone === "ok" && "text-teal-800",
            )}
          >
            {value}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
