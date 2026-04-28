"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bug, TrendingUp, ArrowRight } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface FrogCompletionProps {
  allTasks: Task[];
}

export function DashboardFrogCompletion({ allTasks }: FrogCompletionProps) {
  const analysis = useMemo(() => {
    const frogs = allTasks.filter(t => t.isFrog && !t.isHabit);
    const frogSubtasks = allTasks.flatMap(t => t.subtasks.filter(s => s.isFrog));

    if (frogs.length === 0 && frogSubtasks.length === 0) return null;

    // Frog task stats
    const frogsDone = frogs.filter(t => t.status === 'done').length;
    const frogsAbandoned = frogs.filter(t => t.status === 'abandoned').length;
    const frogsActive = frogs.filter(t => t.status !== 'done' && t.status !== 'abandoned').length;
    const frogCompletionRate = frogs.length > 0 ? Math.round((frogsDone / frogs.length) * 100) : 0;

    // Non-frog comparison
    const nonFrogs = allTasks.filter(t => !t.isFrog && !t.isHabit);
    const nonFrogsDone = nonFrogs.filter(t => t.status === 'done').length;
    const nonFrogCompletionRate = nonFrogs.length > 0 ? Math.round((nonFrogsDone / nonFrogs.length) * 100) : 0;

    // Push comparison: frogs vs non-frogs
    const frogAvgPush = frogs.length > 0
      ? Math.round(frogs.reduce((sum, t) => sum + (t.pushCount || 0), 0) / frogs.length * 10) / 10
      : 0;
    const nonFrogAvgPush = nonFrogs.length > 0
      ? Math.round(nonFrogs.reduce((sum, t) => sum + (t.pushCount || 0), 0) / nonFrogs.length * 10) / 10
      : 0;

    // Frog subtask stats
    const frogSubDone = frogSubtasks.filter(s => s.completed).length;
    const frogSubRate = frogSubtasks.length > 0 ? Math.round((frogSubDone / frogSubtasks.length) * 100) : 0;

    return {
      totalFrogs: frogs.length,
      frogsDone,
      frogsAbandoned,
      frogsActive,
      frogCompletionRate,
      nonFrogCompletionRate,
      frogAvgPush,
      nonFrogAvgPush,
      frogSubtasks: frogSubtasks.length,
      frogSubRate,
    };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bug className="h-4 w-4 text-emerald-500" />
            Frog Completion
            <WidgetInfo description={WIDGET_DESCRIPTIONS["frog-completion"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No frogs tagged yet. Mark your most dreaded tasks as &quot;Frogs&quot; to track your courage.
          </p>
        </CardContent>
      </Card>
    );
  }

  const frogBetter = analysis.frogCompletionRate >= analysis.nonFrogCompletionRate;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Bug className="h-4 w-4 text-emerald-500" />
          Frog Completion
          <Badge variant="secondary" className="ml-auto text-[11px]">
            {analysis.totalFrogs} frogs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion rate comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <p className="text-2xl font-black text-emerald-400">{analysis.frogCompletionRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">🐸 Frogs completed</p>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-xl">
            <p className="text-2xl font-black text-muted-foreground">{analysis.nonFrogCompletionRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">Regular tasks</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{analysis.frogsDone} done</span>
            <span>{analysis.frogsActive} active</span>
            <span>{analysis.frogsAbandoned} dropped</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex bg-muted/20">
            <div
              className="bg-emerald-400/70 transition-all duration-700"
              style={{ width: `${(analysis.frogsDone / analysis.totalFrogs) * 100}%` }}
            />
            <div
              className="bg-amber-400/50 transition-all duration-700"
              style={{ width: `${(analysis.frogsActive / analysis.totalFrogs) * 100}%` }}
            />
            <div
              className="bg-red-400/40 transition-all duration-700"
              style={{ width: `${(analysis.frogsAbandoned / analysis.totalFrogs) * 100}%` }}
            />
          </div>
        </div>

        {/* Push comparison */}
        <div className="flex items-center gap-2 text-xs bg-muted/10 rounded-lg px-3 py-2 border border-border/20">
          <span className="text-muted-foreground">Avg pushes:</span>
          <span className="font-bold">🐸 {analysis.frogAvgPush}x</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
          <span className="font-bold text-muted-foreground">{analysis.nonFrogAvgPush}x regular</span>
        </div>

        {/* Insight */}
        <div className={cn(
          "text-xs rounded-xl px-4 py-3 border",
          frogBetter
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
            : "bg-amber-500/5 border-amber-500/20 text-amber-300"
        )}>
          {frogBetter
            ? "You're great at eating frogs — the hard tasks don't scare you as much as you think!"
            : "Frogs get pushed more than other tasks. Try tackling them first thing in the morning."}
        </div>
      </CardContent>
    </Card>
  );
}
