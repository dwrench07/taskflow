"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RefreshCw, Flame, TrendingUp } from "lucide-react";
import { parseISO, differenceInDays, isSameDay, subDays, startOfDay } from "date-fns";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface HabitResilienceProps {
  allTasks: Task[];
}

interface HabitData {
  id: string;
  title: string;
  totalBreaks: number;
  avgRecovery: number;
  resilience: number;
  completions: number;
}

export function DashboardHabitResilience({ allTasks }: HabitResilienceProps) {
  const analysis = useMemo(() => {
    const habits = allTasks.filter(t => t.isHabit && t.completionHistory && t.completionHistory.length >= 5);
    if (habits.length === 0) return null;

    const habitData: HabitData[] = [];

    habits.forEach(habit => {
      const history = (habit.completionHistory || [])
        .map(d => startOfDay(parseISO(d)))
        .sort((a, b) => a.getTime() - b.getTime());

      if (history.length < 3) return;

      const gaps: { gapDays: number; recoveryDays: number }[] = [];

      for (let i = 1; i < history.length; i++) {
        const daysBetween = differenceInDays(history[i], history[i - 1]);
        if (daysBetween > 1) {
          gaps.push({ gapDays: daysBetween - 1, recoveryDays: daysBetween - 1 });
        }
      }

      if (gaps.length === 0) return;

      const avgRecovery = Math.round(
        gaps.reduce((s, g) => s + g.recoveryDays, 0) / gaps.length * 10
      ) / 10;
      const quickRecoveries = gaps.filter(g => g.recoveryDays <= 2).length;
      const resilience = Math.round((quickRecoveries / gaps.length) * 100);

      habitData.push({
        id: habit.id,
        title: habit.title,
        totalBreaks: gaps.length,
        avgRecovery,
        resilience,
        completions: history.length,
      });
    });

    if (habitData.length === 0) return null;

    habitData.sort((a, b) => b.resilience - a.resilience);

    const overallResilience = Math.round(
      habitData.reduce((s, h) => s + h.resilience, 0) / habitData.length
    );

    return { habits: habitData, overallResilience };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            Habit Resilience
            <WidgetInfo description={WIDGET_DESCRIPTIONS["habit-resilience"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Build more habit history to measure how quickly you bounce back after breaks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-blue-500" />
          Habit Resilience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall score */}
        <div className="text-center p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
          <p className="text-3xl font-black text-blue-400">{analysis.overallResilience}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            bounce-back rate (recovered within 2 days)
          </p>
        </div>

        {/* Per-habit breakdown */}
        <div className="space-y-2">
          {analysis.habits.slice(0, 5).map((habit: any) => (
            <div key={habit.id} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate flex-1">{habit.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{habit.totalBreaks} breaks</span>
                  <span className={cn(
                    "font-bold text-[10px]",
                    habit.resilience >= 70 ? "text-blue-400" :
                    habit.resilience >= 40 ? "text-amber-400" : "text-red-400"
                  )}>
                    {habit.resilience}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    habit.resilience >= 70 ? "bg-blue-400/60" :
                    habit.resilience >= 40 ? "bg-amber-400/50" : "bg-red-400/50"
                  )}
                  style={{ width: `${habit.resilience}%`, minWidth: habit.resilience > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className={cn(
          "text-xs rounded-xl px-4 py-3 border",
          analysis.overallResilience >= 60
            ? "bg-blue-500/5 border-blue-500/20 text-blue-300"
            : "bg-amber-500/5 border-amber-500/20 text-amber-300"
        )}>
          {analysis.overallResilience >= 60
            ? "You bounce back quickly from habit breaks. Your consistency muscle is strong!"
            : "When habits break, they tend to stay broken for a while. Try the \"never miss twice\" rule."}
        </div>
      </CardContent>
    </Card>
  );
}
