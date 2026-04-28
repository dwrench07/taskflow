"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Filter, Skull } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface PushFunnelProps {
  allTasks: Task[];
}

export function DashboardPushFunnel({ allTasks }: PushFunnelProps) {
  const analysis = useMemo(() => {
    const tasks = allTasks.filter(t => !t.isHabit);
    if (tasks.length < 5) return null;

    const total = tasks.length;
    const pushed1 = tasks.filter(t => (t.pushCount || 0) >= 1).length;
    const pushed2 = tasks.filter(t => (t.pushCount || 0) >= 2).length;
    const pushed3 = tasks.filter(t => (t.pushCount || 0) >= 3).length;
    const pushed5 = tasks.filter(t => (t.pushCount || 0) >= 5).length;

    // Of heavily pushed tasks (3+), how many got done vs abandoned?
    const heavilyPushed = tasks.filter(t => (t.pushCount || 0) >= 3);
    const heavyDone = heavilyPushed.filter(t => t.status === 'done').length;
    const heavyAbandoned = heavilyPushed.filter(t => t.status === 'abandoned').length;
    const heavyStillOpen = heavilyPushed.filter(t => t.status !== 'done' && t.status !== 'abandoned').length;

    // Average pushes before completion
    const completedWithPushes = tasks.filter(t => t.status === 'done' && (t.pushCount || 0) > 0);
    const avgPushesBeforeDone = completedWithPushes.length > 0
      ? Math.round(completedWithPushes.reduce((s, t) => s + (t.pushCount || 0), 0) / completedWithPushes.length * 10) / 10
      : 0;

    // "Death zone" — tasks pushed 5+ times that are still open
    const zombieTasks = tasks
      .filter(t => (t.pushCount || 0) >= 5 && t.status !== 'done' && t.status !== 'abandoned')
      .sort((a, b) => (b.pushCount || 0) - (a.pushCount || 0))
      .slice(0, 3);

    const funnel = [
      { label: 'All Tasks', count: total, pct: 100 },
      { label: 'Pushed 1+', count: pushed1, pct: Math.round((pushed1 / total) * 100) },
      { label: 'Pushed 2+', count: pushed2, pct: Math.round((pushed2 / total) * 100) },
      { label: 'Pushed 3+', count: pushed3, pct: Math.round((pushed3 / total) * 100) },
      { label: 'Pushed 5+', count: pushed5, pct: Math.round((pushed5 / total) * 100) },
    ];

    return { funnel, heavyDone, heavyAbandoned, heavyStillOpen, avgPushesBeforeDone, zombieTasks, total: heavilyPushed.length };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="h-4 w-4 text-orange-500" />
            Push-to-Done Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Not enough task data yet to show the push funnel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Filter className="h-4 w-4 text-orange-500" />
          Push-to-Done Funnel
          {analysis.avgPushesBeforeDone > 0 && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              Avg {analysis.avgPushesBeforeDone} pushes before done
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Funnel bars */}
        <div className="space-y-1.5">
          {analysis.funnel.map((step, i) => (
            <div key={step.label} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className={cn("font-medium", i === 0 ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
                <span className="text-muted-foreground">{step.count} ({step.pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    i <= 1 ? "bg-blue-400/60" :
                    i === 2 ? "bg-amber-400/60" :
                    i === 3 ? "bg-orange-400/60" :
                    "bg-red-400/60"
                  )}
                  style={{ width: `${step.pct}%`, minWidth: step.count > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 3+ pushes outcome */}
        {analysis.total > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/30">
            <div className="text-center p-2 bg-emerald-500/5 rounded-lg">
              <p className="text-sm font-black text-emerald-400">{analysis.heavyDone}</p>
              <p className="text-[11px] text-muted-foreground">Done</p>
            </div>
            <div className="text-center p-2 bg-amber-500/5 rounded-lg">
              <p className="text-sm font-black text-amber-400">{analysis.heavyStillOpen}</p>
              <p className="text-[11px] text-muted-foreground">Still open</p>
            </div>
            <div className="text-center p-2 bg-red-500/5 rounded-lg">
              <p className="text-sm font-black text-red-400">{analysis.heavyAbandoned}</p>
              <p className="text-[11px] text-muted-foreground">Abandoned</p>
            </div>
          </div>
        )}

        {/* Zombie tasks */}
        {analysis.zombieTasks.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
              <Skull className="h-3 w-3 text-red-400" /> Zombie tasks (5+ pushes, still open)
            </p>
            {analysis.zombieTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs bg-red-500/5 rounded-lg px-3 py-1.5">
                <span className="truncate font-medium">{t.title}</span>
                <Badge variant="destructive" className="text-[11px] shrink-0">{t.pushCount}x</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
