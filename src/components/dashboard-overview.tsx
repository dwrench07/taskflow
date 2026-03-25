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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="glass-morphism border-primary/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">To-Do</CardTitle>
          <ListTodo className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tighter">{todoCount}</div>
          <p className="text-[10px] text-muted-foreground/60 font-medium italic">Pending objectives</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-accent/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] hover:border-accent/30" style={{ animationDelay: '50ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">In Progress</CardTitle>
          <Loader className="h-4 w-4 text-accent animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tighter">{inProgressCount}</div>
          <p className="text-[10px] text-muted-foreground/60 font-medium italic">Active focus</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-blue-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-blue-500/30" style={{ animationDelay: '100ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Today</CardTitle>
          <CalendarCheck className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tighter">{tasksDueToday}</div>
          <p className="text-[10px] text-muted-foreground/60 font-medium italic">Deadlines approaching</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-yellow-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:border-yellow-500/30" style={{ animationDelay: '150ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Habit Goals</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tighter">{habitGoalsMet}/{totalHabitsWithGoals}</div>
          <p className="text-[10px] text-muted-foreground/60 font-medium italic">Milestones achieved</p>
        </CardContent>
      </Card>
      <Card className="glass-morphism border-orange-500/10 transition-all duration-300 animate-fade-in hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:border-orange-500/30" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Longevity</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tighter">{activeStreaksCount}</div>
          <p className="text-[10px] text-muted-foreground/60 font-medium italic">Habits &gt; 3 days streak</p>
        </CardContent>
      </Card>
    </div>
  );
}
