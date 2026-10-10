import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatAccent = "default" | "primary" | "success" | "warning" | "info" | "destructive";

const accentText: Record<StatAccent, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
};

const accentIcon: Record<StatAccent, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
};

interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  /** Small trailing delta/trend text, e.g. "+12%". */
  delta?: React.ReactNode;
  accent?: StatAccent;
  className?: string;
  onClick?: () => void;
}

/**
 * A single KPI tile: uppercase label, large tabular-nums value, optional icon,
 * delta and hint. The data-forward building block for the command-center look.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  accent = "default",
  className,
  onClick,
}: StatTileProps) {
  const interactive = typeof onClick === "function";
  const Comp: any = interactive ? "button" : "div";
  return (
    <Comp
      data-slot="stat"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-left transition-colors",
        interactive &&
          "hover:border-ring/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className={cn("h-4 w-4 shrink-0", accentIcon[accent])} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", accentText[accent])}>
          {value}
        </span>
        {delta && <span className="text-xs font-medium text-muted-foreground">{delta}</span>}
      </div>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </Comp>
  );
}
