"use client";

import { useMemo } from "react";
import { FocusSession, Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseAllJots } from "@/lib/jots";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface WorryTrackerProps {
  focusSessions: FocusSession[];
  allTasks: Task[];
}

export function DashboardWorryTracker({ focusSessions, allTasks }: WorryTrackerProps) {
  const analysis = useMemo(() => {
    // Build a task title map for jot parsing
    const taskTitleMap: Record<string, string> = {};
    allTasks.forEach(t => { taskTitleMap[t.id] = t.title; });

    const allJots = parseAllJots(focusSessions, taskTitleMap);
    const worryJots = allJots.filter(j => j.category === 'worry');

    if (worryJots.length === 0) return null;

    const resolved = worryJots.filter(j => j.followUpResult);
    const happened = resolved.filter(j => j.followUpResult === 'happened').length;
    const didntHappen = resolved.filter(j => j.followUpResult === 'didnt-happen').length;
    const partially = resolved.filter(j => j.followUpResult === 'partially').length;
    const unresolved = worryJots.filter(j => !j.followUpResult).length;

    const totalResolved = resolved.length;
    const neverHappenedRate = totalResolved > 0
      ? Math.round((didntHappen / totalResolved) * 100)
      : 0;

    return {
      total: worryJots.length,
      happened,
      didntHappen,
      partially,
      unresolved,
      totalResolved,
      neverHappenedRate,
      recentWorries: worryJots.slice(-5).reverse(),
    };
  }, [focusSessions, allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-violet-500" />
            Worry Accuracy
            <WidgetInfo description={WIDGET_DESCRIPTIONS["worry-accuracy"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No worry jots recorded yet. Tag distracting thoughts as &quot;worry&quot; during focus sessions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-violet-500" />
          Worry Accuracy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big insight */}
        {analysis.totalResolved > 0 && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3 text-center">
            <p className="text-3xl font-black text-violet-400">{analysis.neverHappenedRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              of your worries <span className="font-semibold text-violet-300">never actually happened</span>
            </p>
          </div>
        )}

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-3 w-3 text-green-400" />
              <span className="text-lg font-black text-green-400">{analysis.didntHappen}</span>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Didn&apos;t happen</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <HelpCircle className="h-3 w-3 text-yellow-400" />
              <span className="text-lg font-black text-yellow-400">{analysis.partially}</span>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Partially</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-red-400" />
              <span className="text-lg font-black text-red-400">{analysis.happened}</span>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Happened</p>
          </div>
        </div>

        {/* Stacked bar */}
        {analysis.totalResolved > 0 && (
          <div className="space-y-1">
            <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/20">
              <div
                className="bg-green-400/70 transition-all duration-700"
                style={{ width: `${(analysis.didntHappen / analysis.totalResolved) * 100}%` }}
              />
              <div
                className="bg-yellow-400/70 transition-all duration-700"
                style={{ width: `${(analysis.partially / analysis.totalResolved) * 100}%` }}
              />
              <div
                className="bg-red-400/70 transition-all duration-700"
                style={{ width: `${(analysis.happened / analysis.totalResolved) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {analysis.totalResolved} resolved · {analysis.unresolved} pending follow-up
            </p>
          </div>
        )}

        {/* Coaching insight */}
        {analysis.neverHappenedRate >= 70 && (
          <p className="text-xs text-violet-300/80 italic border-t border-border/30 pt-2">
            Most of your fears are false alarms. Remember this next time anxiety spikes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
