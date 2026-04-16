"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DailyProgressMeterProps {
  totalItems: number;
  completedItems: number;
}

export function DailyProgressMeter({ totalItems, completedItems }: DailyProgressMeterProps) {
  const pct = totalItems === 0 ? 0 : Math.min(100, Math.round((completedItems / totalItems) * 100));
  const prevPct = useRef(pct);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (pct === 100 && prevPct.current < 100) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 3500);
      return () => clearTimeout(t);
    }
    prevPct.current = pct;
  }, [pct]);

  if (totalItems === 0) return null;

  const label =
    pct === 100
      ? "Perfect day — everything done!"
      : pct >= 75
      ? "Almost there, keep going"
      : pct >= 50
      ? "Good momentum, halfway through"
      : pct >= 25
      ? "Getting started"
      : "Day just beginning";

  return (
    <div className={cn(
      "relative rounded-xl px-4 py-3 border transition-all duration-500",
      celebrating
        ? "border-yellow-400/60 bg-yellow-400/5 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
        : pct === 100
        ? "border-emerald-500/40 bg-emerald-500/5"
        : "border-border/40 bg-muted/20"
    )}>
      {/* Celebration shimmer */}
      {celebrating && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_1.5s_ease-in-out_2]"
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-widest",
          pct === 100 ? "text-emerald-500" : "text-muted-foreground"
        )}>
          {pct === 100 ? "Day Complete" : "Today's Progress"}
        </span>
        <span className={cn(
          "text-sm font-black tabular-nums",
          pct === 100 ? "text-emerald-500" : pct >= 75 ? "text-primary" : "text-foreground"
        )}>
          {pct}%
          <span className="text-[10px] font-medium text-muted-foreground ml-1.5">
            {completedItems}/{totalItems}
          </span>
        </span>
      </div>

      <Progress
        value={pct}
        className={cn(
          "h-2 transition-all duration-700",
          pct === 100 ? "[&>div]:bg-emerald-500" : pct >= 75 ? "[&>div]:bg-primary" : ""
        )}
      />

      <p className={cn(
        "text-[10px] mt-1.5 font-medium",
        pct === 100 ? "text-emerald-500/80" : "text-muted-foreground/70"
      )}>
        {label}
      </p>
    </div>
  );
}
