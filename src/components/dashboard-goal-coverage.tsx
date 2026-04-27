"use client";

import { useMemo, useState, useEffect } from "react";
import { Task, Goal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllGoals } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Target, AlertCircle } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface GoalCoverageProps {
  allTasks: Task[];
}

export function DashboardGoalCoverage({ allTasks }: GoalCoverageProps) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    getAllGoals().then(g => setGoals(g || []));
  }, []);

  const analysis = useMemo(() => {
    const tasks = allTasks.filter(t => (t.category !== "habit") && t.status !== 'abandoned');
    if (tasks.length < 3) return null;

    const withGoal = tasks.filter(t => t.goalId);
    const withoutGoal = tasks.filter(t => !t.goalId);

    const alignmentRate = Math.round((withGoal.length / tasks.length) * 100);

    // Completion rate comparison
    const goalDone = withGoal.filter(t => t.status === 'done').length;
    const noGoalDone = withoutGoal.filter(t => t.status === 'done').length;
    const goalCompletionRate = withGoal.length > 0 ? Math.round((goalDone / withGoal.length) * 100) : 0;
    const noGoalCompletionRate = withoutGoal.length > 0 ? Math.round((noGoalDone / withoutGoal.length) * 100) : 0;

    // Goal coverage — which goals have the most tasks?
    const goalTaskCounts: Record<string, number> = {};
    withGoal.forEach(t => {
      goalTaskCounts[t.goalId!] = (goalTaskCounts[t.goalId!] || 0) + 1;
    });

    const goalBreakdown = goals
      .filter(g => g.status === 'active')
      .map(g => ({
        id: g.id,
        title: g.title,
        taskCount: goalTaskCounts[g.id] || 0,
      }))
      .sort((a, b) => b.taskCount - a.taskCount);

    const neglectedGoals = goalBreakdown.filter(g => g.taskCount === 0);

    return {
      totalTasks: tasks.length,
      aligned: withGoal.length,
      unaligned: withoutGoal.length,
      alignmentRate,
      goalCompletionRate,
      noGoalCompletionRate,
      goalBreakdown,
      neglectedGoals,
    };
  }, [allTasks, goals]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Goal Coverage
            <WidgetInfo description={WIDGET_DESCRIPTIONS["goal-coverage"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Add goals and link tasks to them to see your alignment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-500" />
          Goal Coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alignment donut-like indicator */}
        <div className="text-center p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
          <p className="text-3xl font-black text-purple-400">{analysis.alignmentRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            of your tasks are linked to a goal
          </p>
        </div>

        {/* Stacked bar */}
        <div className="space-y-1">
          <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/20">
            <div
              className="bg-purple-400/70 transition-all duration-700"
              style={{ width: `${analysis.alignmentRate}%` }}
            />
            <div
              className="bg-slate-400/30 transition-all duration-700"
              style={{ width: `${100 - analysis.alignmentRate}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="text-purple-400">{analysis.aligned} goal-linked</span>
            <span>{analysis.unaligned} goalless</span>
          </div>
        </div>

        {/* Completion comparison */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <p className="text-sm font-black text-purple-400">{analysis.goalCompletionRate}%</p>
            <p className="text-[9px] text-muted-foreground">Goal-linked done</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <p className="text-sm font-black text-muted-foreground">{analysis.noGoalCompletionRate}%</p>
            <p className="text-[9px] text-muted-foreground">Goalless done</p>
          </div>
        </div>

        {/* Neglected goals */}
        {analysis.neglectedGoals.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-400" /> Goals with no tasks
            </p>
            {analysis.neglectedGoals.slice(0, 3).map(g => (
              <div key={g.id} className="text-xs text-amber-300/70 truncate">
                • {g.title}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
