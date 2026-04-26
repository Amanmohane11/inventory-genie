import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon, trend, accent = "primary",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: { value: string; positive?: boolean };
  accent?: "primary" | "secondary" | "success" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary-soft text-primary",
    secondary: "bg-secondary-soft text-secondary",
    success: "bg-success-soft text-success",
    destructive: "bg-destructive-soft text-destructive",
  } as const;

  return (
    <div className="rounded-xl border bg-card p-5 card-elevated card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", accentMap[accent])}>
          {icon}
        </div>
      </div>
      {trend && (
        <p className={cn(
          "mt-3 text-xs font-medium",
          trend.positive ? "text-success" : "text-destructive"
        )}>
          {trend.positive ? "▲" : "▼"} {trend.value} vs previous
        </p>
      )}
    </div>
  );
}
