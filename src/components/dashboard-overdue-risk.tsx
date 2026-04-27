"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock } from "lucide-react";
import { parseISO, differenceInDays, startOfDay, format } from "date-fns";
import Link from "next/link";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface OverdueRiskProps {
  allTasks: Task[];
}

interface RiskTask {
  id: string;
  title: string;
  risk: number; // 0-100
  riskLabel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  daysUntilDeadline: number | null;
}

export function DashboardOverdueRisk({ allTasks }: OverdueRiskProps) {
  const analysis = useMemo(() => {
    const today = startOfDay(new Date());
    const activeTasks = allTasks.filter(t =>
      (t.category !== "habit") && t.status !== 'done' && t.status !== 'abandoned'
    );

    if (activeTasks.length < 3) return null;

    // Calculate historical velocity (avg days to complete)
    const completedTasks = allTasks.filter(t =>
      (t.category !== "habit") && t.status === 'done' && t.startDate && t.endDate
    );
    const avgCompletionDays = completedTasks.length > 0
      ? completedTasks.reduce((s, t) =>
          s + Math.max(0, differenceInDays(parseISO(t.endDate!), parseISO(t.startDate!))), 0
        ) / completedTasks.length
      : 7; // default assumption

    const riskTasks: RiskTask[] = activeTasks.map(task => {
      let risk = 0;
      const factors: string[] = [];

      // Factor 1: Push count (each push adds risk)
      const pushes = task.pushCount || 0;
      if (pushes >= 5) { risk += 30; factors.push(`Pushed ${pushes}x`); }
      else if (pushes >= 3) { risk += 20; factors.push(`Pushed ${pushes}x`); }
      else if (pushes >= 1) { risk += 10; }

      // Factor 2: Deadline proximity
      const deadline = task.doDate || task.endDate;
      let daysUntil: number | null = null;
      if (deadline) {
        daysUntil = differenceInDays(parseISO(deadline), today);
        if (daysUntil < 0) { risk += 40; factors.push('Overdue'); }
        else if (daysUntil <= 1) { risk += 30; factors.push('Due tomorrow'); }
        else if (daysUntil <= 3) { risk += 20; factors.push(`Due in ${daysUntil}d`); }
        else if (daysUntil <= 7) { risk += 10; }
      }

      // Factor 3: Task age (how long since start)
      if (task.startDate) {
        const age = differenceInDays(today, parseISO(task.startDate));
        if (age > avgCompletionDays * 2) { risk += 15; factors.push('Stale'); }
        else if (age > avgCompletionDays) { risk += 10; }
      }

      // Factor 4: High priority but not started
      if (task.priority === 'urgent') { risk += 15; factors.push('Urgent'); }
      else if (task.priority === 'high') { risk += 10; }

      // Factor 5: Blocked by other tasks
      if (task.blockedBy && task.blockedBy.length > 0) {
        const activeBlockers = task.blockedBy.filter(id =>
          allTasks.some(t => t.id === id && t.status !== 'done')
        );
        if (activeBlockers.length > 0) {
          risk += 15;
          factors.push(`Blocked by ${activeBlockers.length}`);
        }
      }

      // Factor 6: Large standalone task (not broken into a Project with child Tasks)
      if ((task.tShirtSize === 'L' || task.tShirtSize === 'XL') && !task.projectId) {
        risk += 10;
        factors.push('Large, not broken down');
      }

      risk = Math.min(risk, 100);
      const riskLabel: RiskTask['riskLabel'] =
        risk >= 70 ? 'critical' : risk >= 50 ? 'high' : risk >= 30 ? 'medium' : 'low';

      return { id: task.id, title: task.title, risk, riskLabel, factors, daysUntilDeadline: daysUntil };
    });

    // Sort by risk descending
    riskTasks.sort((a, b) => b.risk - a.risk);

    const criticalCount = riskTasks.filter(t => t.riskLabel === 'critical').length;
    const highCount = riskTasks.filter(t => t.riskLabel === 'high').length;

    return { riskTasks: riskTasks.slice(0, 5), criticalCount, highCount, total: riskTasks.length };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Overdue Risk
            <WidgetInfo description={WIDGET_DESCRIPTIONS["overdue-risk"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Not enough tasks to calculate overdue risk.</p>
        </CardContent>
      </Card>
    );
  }

  const RISK_STYLES: Record<RiskTask['riskLabel'], string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/40',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Overdue Risk
          {analysis.criticalCount > 0 && (
            <Badge variant="destructive" className="ml-auto text-[10px] animate-pulse">
              {analysis.criticalCount} critical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {analysis.riskTasks.map(task => (
          <Link
            href={`/tasks?taskId=${task.id}`}
            key={task.id}
            className={cn(
              "block p-3 rounded-xl border transition-all hover:scale-[1.01]",
              RISK_STYLES[task.riskLabel]
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs truncate">{task.title}</span>
              <Badge variant="outline" className={cn("text-[10px] shrink-0 font-black", RISK_STYLES[task.riskLabel])}>
                {task.risk}%
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.factors.map((f, i) => (
                <span key={i} className="text-[9px] bg-background/30 rounded px-1.5 py-0.5">{f}</span>
              ))}
            </div>
          </Link>
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          {analysis.total} active tasks scored · {analysis.highCount + analysis.criticalCount} at risk
        </p>
      </CardContent>
    </Card>
  );
}
