import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ListTodo, Loader, CalendarCheck, Trophy, Flame, TrendingUp } from "lucide-react";
import { isToday, parseISO } from "date-fns";
import { calculateStreak } from "@/lib/habits";
import { Task } from "@/lib/types";

export function DashboardOverview({ allTasks }: { allTasks: Task[] }) {
  const nonHabitTasks = (Array.isArray(allTasks) ? allTasks : []).filter(t => !t.isHabit);
  const todoCount = nonHabitTasks.filter((t) => t.status === "todo").length;
  const inProgressCount = nonHabitTasks.filter((t) => t.status === "in-progress").length;

  const tasksDueToday = nonHabitTasks.filter(t => t.endDate && isToday(parseISO(t.endDate))).length;

  const habits = (Array.isArray(allTasks) ? allTasks : []).filter(t => t.isHabit);
  const totalHabitsWithGoals = habits.filter(h => h.streakGoal && h.streakGoal > 0).length;
  const habitGoalsMet = habits.filter(h => h.streakGoal && calculateStreak(h) >= h.streakGoal).length;
  const activeStreaksCount = habits.filter(h => calculateStreak(h) > 2).length;

  const avoidedCount = nonHabitTasks.filter(t => (t.pushCount && t.pushCount > 0)).length;

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Card className="glass-morphism border-primary/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">To-Do</CardTitle>
          <ListTodo className="h-3 w-3 text-primary" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-black tracking-tighter">{todoCount}</div>
          <p className="text-[9px] text-muted-foreground/60 font-medium italic truncate">Pending obj</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-accent/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] hover:border-accent/30" style={{ animationDelay: '50ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">In Progress</CardTitle>
          <Loader className="h-3 w-3 text-accent animate-spin" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-black tracking-tighter">{inProgressCount}</div>
          <p className="text-[9px] text-muted-foreground/60 font-medium italic truncate">Active focus</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-blue-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-blue-500/30" style={{ animationDelay: '100ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Due Today</CardTitle>
          <CalendarCheck className="h-3 w-3 text-blue-400" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-black tracking-tighter">{tasksDueToday}</div>
          <p className="text-[9px] text-muted-foreground/60 font-medium italic truncate">Deadlines near</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-yellow-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:border-yellow-500/30" style={{ animationDelay: '150ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Habit Goals</CardTitle>
          <Trophy className="h-3 w-3 text-yellow-400" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-black tracking-tighter">{habitGoalsMet}/{totalHabitsWithGoals}</div>
          <p className="text-[9px] text-muted-foreground/60 font-medium italic truncate">Hit goals</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-orange-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:border-orange-500/30" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Longevity</CardTitle>
          <TrendingUp className="h-3 w-3 text-orange-500" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-black tracking-tighter">{activeStreaksCount}</div>
          <p className="text-[9px] text-muted-foreground/60 font-medium italic truncate">Streaks &gt; 3 days</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-red-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:border-red-500/30" style={{ animationDelay: '250ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Avoided</CardTitle>
          <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-black tracking-tighter">{avoidedCount}</div>
          <p className="text-[9px] text-muted-foreground/60 font-medium italic truncate">Tasks pushed</p>
        </CardContent>
      </Card>
    </div>
  );
}
