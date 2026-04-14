"use client";

import { useMemo } from "react";
import { FocusSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface PeakProductivityProps {
  focusSessions: FocusSession[];
}

const HOUR_LABELS: Record<number, string> = {
  0: '12a', 1: '1a', 2: '2a', 3: '3a', 4: '4a', 5: '5a',
  6: '6a', 7: '7a', 8: '8a', 9: '9a', 10: '10a', 11: '11a',
  12: '12p', 13: '1p', 14: '2p', 15: '3p', 16: '4p', 17: '5p',
  18: '6p', 19: '7p', 20: '8p', 21: '9p', 22: '10p', 23: '11p',
};

export function DashboardPeakHours({ focusSessions }: PeakProductivityProps) {
  const analysis = useMemo(() => {
    const completedSessions = focusSessions.filter(s => s.status === 'completed' && s.startTime);

    if (completedSessions.length < 3) return null;

    // Bucket by hour of day
    const hourBuckets: { count: number; totalDuration: number; highProductivity: number }[] =
      Array.from({ length: 24 }, () => ({ count: 0, totalDuration: 0, highProductivity: 0 }));

    completedSessions.forEach(s => {
      const hour = parseISO(s.startTime).getHours();
      hourBuckets[hour].count++;
      hourBuckets[hour].totalDuration += s.duration;
      if (s.productivityScore === 'high') {
        hourBuckets[hour].highProductivity++;
      }
    });

    // Find active hours (at least 1 session)
    const activeHours = hourBuckets
      .map((b, hour) => ({
        hour,
        ...b,
        avgDuration: b.count > 0 ? Math.round(b.totalDuration / b.count) : 0,
        productivityRate: b.count > 0 ? Math.round((b.highProductivity / b.count) * 100) : 0,
      }))
      .filter(h => h.count > 0);

    // Find peak hour (highest productivity rate, breaking ties with count)
    const peakHour = [...activeHours].sort((a, b) => {
      if (b.productivityRate !== a.productivityRate) return b.productivityRate - a.productivityRate;
      return b.count - a.count;
    })[0];

    // Max count for scaling
    const maxCount = Math.max(...activeHours.map(h => h.count), 1);

    return {
      hourBuckets: hourBuckets.map((b, hour) => ({
        hour,
        ...b,
        avgDuration: b.count > 0 ? Math.round(b.totalDuration / b.count) : 0,
        productivityRate: b.count > 0 ? Math.round((b.highProductivity / b.count) * 100) : 0,
      })),
      peakHour,
      maxCount,
      totalSessions: completedSessions.length,
    };
  }, [focusSessions]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Peak Productivity Hours
            <WidgetInfo description={WIDGET_DESCRIPTIONS["peak-hours"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Complete a few more focus sessions to discover your peak hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Peak Productivity Hours
          {analysis.peakHour && (
            <span className="ml-auto text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
              <Zap className="h-3 w-3 inline mr-0.5" />
              Peak: {HOUR_LABELS[analysis.peakHour.hour]}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hour grid — show 6am to 11pm */}
        <div className="space-y-1">
          <div className="grid grid-cols-18 gap-[2px]" style={{ gridTemplateColumns: 'repeat(18, 1fr)' }}>
            {analysis.hourBuckets.slice(6, 24).map((h) => {
              const intensity = h.count > 0 ? Math.max(0.15, h.count / analysis.maxCount) : 0;
              const isHighProd = h.productivityRate >= 60;
              return (
                <div
                  key={h.hour}
                  className={cn(
                    "aspect-square rounded-sm transition-all duration-300 relative group cursor-default",
                    h.count === 0 && "bg-muted/20",
                  )}
                  style={h.count > 0 ? {
                    backgroundColor: isHighProd
                      ? `rgba(251, 191, 36, ${intensity})`
                      : `rgba(148, 163, 184, ${intensity})`,
                    boxShadow: isHighProd && intensity > 0.5 ? '0 0 8px rgba(251, 191, 36, 0.3)' : 'none',
                  } : undefined}
                  title={`${HOUR_LABELS[h.hour]}: ${h.count} sessions, ${h.productivityRate}% high-productivity`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 whitespace-nowrap bg-popover text-popover-foreground border border-border rounded-md px-2 py-1 text-[9px] shadow-md">
                    <strong>{HOUR_LABELS[h.hour]}</strong>: {h.count} sessions · {h.productivityRate}% productive
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/40 px-0.5">
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400/60" /> High productivity
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-400/40" /> Regular
          </div>
          <span className="ml-auto opacity-60">{analysis.totalSessions} sessions tracked</span>
        </div>

        {/* Top 3 peak hours */}
        <div className="space-y-1.5 pt-1 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Best hours</p>
          {[...analysis.hourBuckets]
            .filter(h => h.count > 0)
            .sort((a, b) => b.productivityRate - a.productivityRate || b.count - a.count)
            .slice(0, 3)
            .map((h, i) => (
              <div key={h.hour} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "font-black text-sm w-6",
                  i === 0 ? "text-amber-400" : "text-muted-foreground"
                )}>
                  {HOUR_LABELS[h.hour]}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      i === 0 ? "bg-amber-400" : "bg-muted-foreground/40"
                    )}
                    style={{ width: `${h.productivityRate}%`, minWidth: h.productivityRate > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 text-right">
                  {h.productivityRate}% · {h.count}x
                </span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
