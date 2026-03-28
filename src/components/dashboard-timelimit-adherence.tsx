"use client";

import { useMemo } from "react";
import { Task, FocusSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Timer, CheckCircle2, XCircle } from "lucide-react";

interface TimeLimitAdherenceProps {
  allTasks: Task[];
  focusSessions: FocusSession[];
}

export function DashboardTimeLimitAdherence({ allTasks, focusSessions }: TimeLimitAdherenceProps) {
  const analysis = useMemo(() => {
    // Find tasks/subtasks with time limits
    const timeboxedTasks = allTasks.filter(t => t.timeLimit && t.timeLimit > 0 && !t.isHabit);
    const timeboxedSubtasks = allTasks.flatMap(t =>
      t.subtasks.filter(s => s.timeLimit && s.timeLimit > 0)
    );

    if (timeboxedTasks.length === 0 && timeboxedSubtasks.length === 0) return null;

    // For tasks with time limits, compare allocated time vs actual focus time
    const taskAnalysis = timeboxedTasks.map(task => {
      const taskSessions = focusSessions.filter(s => s.taskId === task.id && s.status === 'completed');
      const totalFocusMinutes = taskSessions.reduce((sum, s) => sum + s.duration, 0);

      return {
        id: task.id,
        title: task.title,
        timeLimit: task.timeLimit!,
        actualMinutes: totalFocusMinutes,
        withinLimit: totalFocusMinutes <= task.timeLimit!,
        ratio: task.timeLimit! > 0 ? Math.round((totalFocusMinutes / task.timeLimit!) * 100) : 0,
        status: task.status,
      };
    }).filter(t => t.actualMinutes > 0); // Only tasks that have focus session data

    if (taskAnalysis.length === 0) {
      // Show summary of timebox usage even without focus sessions
      return {
        totalTimeboxed: timeboxedTasks.length + timeboxedSubtasks.length,
        taskAnalysis: [],
        withinLimitRate: 0,
        avgRatio: 0,
        hasSessionData: false,
      };
    }

    const withinLimit = taskAnalysis.filter(t => t.withinLimit).length;
    const withinLimitRate = Math.round((withinLimit / taskAnalysis.length) * 100);
    const avgRatio = Math.round(
      taskAnalysis.reduce((sum, t) => sum + t.ratio, 0) / taskAnalysis.length
    );

    return {
      totalTimeboxed: timeboxedTasks.length + timeboxedSubtasks.length,
      taskAnalysis: taskAnalysis.sort((a, b) => a.ratio - b.ratio),
      withinLimitRate,
      avgRatio,
      hasSessionData: true,
    };
  }, [allTasks, focusSessions]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Timer className="h-4 w-4 text-rose-500" />
            Time Limit Adherence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Set Parkinson&apos;s Law time limits on tasks to track if timeboxing helps you work faster.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatMinutes = (m: number) => {
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Timer className="h-4 w-4 text-rose-500" />
          Time Limit Adherence
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {analysis.totalTimeboxed} timeboxed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis.hasSessionData ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-2xl font-black text-rose-500">{analysis.withinLimitRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Within time limit</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-xl border border-border">
                <p className="text-2xl font-black text-muted-foreground">{analysis.avgRatio}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Avg time used</p>
              </div>
            </div>

            {/* Per-task breakdown */}
            <div className="space-y-2">
              {analysis.taskAnalysis.slice(0, 5).map(task => (
                <div key={task.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="truncate font-medium flex-1">{task.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {task.withinLimit ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatMinutes(task.actualMinutes)} / {formatMinutes(task.timeLimit)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        task.ratio <= 100 ? "bg-green-500" :
                        task.ratio <= 150 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(task.ratio, 100)}%`, minWidth: '4px' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Insight */}
            <div className={cn(
              "text-xs rounded-xl px-4 py-3 border",
              analysis.withinLimitRate >= 60
                ? "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                : "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
            )}>
              {analysis.withinLimitRate >= 60
                ? "⏱️ Timeboxing is working! You're completing most tasks within their limits."
                : "⚠️ You're consistently exceeding time limits. Try setting slightly longer timeboxes."}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {analysis.totalTimeboxed} tasks have time limits set. Complete focus sessions on them to see adherence data.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
