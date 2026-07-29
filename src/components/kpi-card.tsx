import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive?: boolean | null };
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("panel p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
            {label}
          </p>
          <p className="mt-2 tabular text-2xl font-semibold tracking-tight text-fg sm:text-[1.75rem]">
            {value}
          </p>
        </div>
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-fg-muted">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {delta ? (
          <span
            className={cn(
              "tabular font-medium",
              delta.positive === true && "text-positive",
              delta.positive === false && "text-negative",
              delta.positive == null && "text-fg-muted",
            )}
          >
            {delta.value}
          </span>
        ) : null}
        {hint ? <span className="text-fg-subtle">{hint}</span> : null}
      </div>
    </div>
  );
}
