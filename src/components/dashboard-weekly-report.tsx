"use client";

import { useMemo } from "react";
import { Task, FocusSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, Flame, Brain, Bug, ArrowRightCircle, TrendingUp, TrendingDown } from "lucide-react";
import { subDays, isSameDay, parseISO, startOfDay, isWithinInterval, startOfWeek, endOfWeek, format } from "date-fns";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface WeeklyReportProps {
  allTasks: Task[];
  focusSessions: FocusSession[];
}

export function DashboardWeeklyReport({ allTasks, focusSessions }: WeeklyReportProps) {
  const report = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const prevWeekStart = subDays(weekStart, 7);
    const prevWeekEnd = subDays(weekStart, 1);

    const inThisWeek = (dateStr: string) => {
      try {
        const d = parseISO(dateStr);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      } catch { return false; }
    };
    const inPrevWeek = (dateStr: string) => {
      try {
        const d = parseISO(dateStr);
        return isWithinInterval(d, { start: prevWeekStart, end: prevWeekEnd });
      } catch { return false; }
    };

    // Tasks completed this week
    const tasksCompletedThisWeek = allTasks.filter(t =>
      !t.isHabit && t.status === 'done' && t.endDate && inThisWeek(t.endDate)
    ).length;
    const tasksCompletedPrevWeek = allTasks.filter(t =>
      !t.isHabit && t.status === 'done' && t.endDate && inPrevWeek(t.endDate)
    ).length;

    // Habits maintained
    const habits = allTasks.filter(t => t.isHabit);
    const habitsDoneThisWeek = habits.filter(t =>
      t.completionHistory?.some(d => inThisWeek(d))
    ).length;

    // Focus hours
    const focusThisWeek = focusSessions
      .filter(s => inThisWeek(s.startTime))
      .reduce((sum, s) => sum + s.duration, 0);
    const focusPrevWeek = focusSessions
      .filter(s => inPrevWeek(s.startTime))
      .reduce((sum, s) => sum + s.duration, 0);
    const focusHours = Math.round(focusThisWeek / 60 * 10) / 10;

    // Frogs eaten
    const frogsEaten = allTasks.filter(t =>
      t.isFrog && t.status === 'done' && t.endDate && inThisWeek(t.endDate)
    ).length;

    // Pushes this week
    const pushesThisWeek = allTasks.reduce((sum, t) => {
      return sum + (t.pushHistory || []).filter(p => inThisWeek(p.date)).length;
    }, 0);

    // Trends
    const taskTrend = tasksCompletedThisWeek - tasksCompletedPrevWeek;
    const focusTrend = focusThisWeek - focusPrevWeek;

    return {
      weekLabel: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
      tasksCompleted: tasksCompletedThisWeek,
      taskTrend,
      habitsMaintained: habitsDoneThisWeek,
      habitsTotal: habits.length,
      focusHours,
      focusTrend: Math.round(focusTrend / 60 * 10) / 10,
      frogsEaten,
      pushes: pushesThisWeek,
    };
  }, [allTasks, focusSessions]);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-emerald-400" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-400" />;
    return null;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Weekly Report Card
          <WidgetInfo description={WIDGET_DESCRIPTIONS["weekly-report"]} />
          <Badge variant="secondary" className="ml-auto text-[10px]">{report.weekLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Tasks */}
          <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xl font-black text-blue-400">{report.tasksCompleted}</span>
              <TrendIcon value={report.taskTrend} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tasks done</p>
          </div>

          {/* Focus */}
          <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-center">
            <div className="flex items-center justify-center gap-1">
              <Brain className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xl font-black text-cyan-400">{report.focusHours}h</span>
              <TrendIcon value={report.focusTrend} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Focus time</p>
          </div>

          {/* Habits */}
          <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xl font-black text-green-400">{report.habitsMaintained}/{report.habitsTotal}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Habits active</p>
          </div>

          {/* Frogs */}
          <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-center">
            <div className="flex items-center justify-center gap-1">
              <Bug className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xl font-black text-emerald-400">{report.frogsEaten}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Frogs eaten</p>
          </div>

          {/* Pushes */}
          <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-center">
            <div className="flex items-center justify-center gap-1">
              <ArrowRightCircle className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xl font-black text-orange-400">{report.pushes}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pushes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
