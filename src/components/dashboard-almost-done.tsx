"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface DashboardAlmostDoneProps {
  allTasks: Task[];
}

export function DashboardAlmostDone({ allTasks }: DashboardAlmostDoneProps) {
  const almostDoneTasks = useMemo(() => {
    return allTasks
      .filter(t => {
        if (t.isHabit || t.status === 'done' || t.status === 'abandoned') return false;
        if (!t.subtasks || t.subtasks.length < 2) return false;

        const completed = t.subtasks.filter(s => s.completed).length;
        const total = t.subtasks.length;
        const pct = completed / total;

        // At least 60% done with at least 2 subtasks completed
        return pct >= 0.6 && pct < 1 && completed >= 2;
      })
      .map(t => {
        const completed = t.subtasks.filter(s => s.completed).length;
        const total = t.subtasks.length;
        const remaining = t.subtasks.filter(s => !s.completed);
        return {
          task: t,
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
          remaining,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [allTasks]);

  if (almostDoneTasks.length === 0) return null;

  return (
    <Card className="border-border/50 border-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Almost Done
          <WidgetInfo description={WIDGET_DESCRIPTIONS["almost-done"]} />
          <Badge variant="secondary" className="ml-auto text-[11px] bg-green-500/10 text-green-500">{almostDoneTasks.length} tasks</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">These are 60%+ complete. Just finish them.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {almostDoneTasks.slice(0, 5).map(({ task, completed, total, percentage, remaining }) => (
          <div key={task.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/focus?taskId=${task.id}`} className="text-sm font-medium truncate hover:text-primary transition-colors">{task.title}</Link>
              <Badge variant="outline" className="text-[11px] shrink-0 text-green-500 border-green-500/30">
                {completed}/{total} ({percentage}%)
              </Badge>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500/60 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {/* Remaining subtasks */}
            <div className="pl-2 space-y-1">
              {remaining.slice(0, 3).map(sub => (
                <div key={sub.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Circle className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{sub.title}</span>
                </div>
              ))}
              {remaining.length > 3 && (
                <span className="text-[11px] text-muted-foreground pl-4">+{remaining.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
