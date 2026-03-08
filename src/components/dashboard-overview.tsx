import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ListTodo, Loader, CalendarCheck, Trophy, Flame } from "lucide-react";
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
      <Card className="transition-all duration-300 ease-in-out animate-fade-in hover:shadow-md hover:border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">To-Do</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todoCount}</div>
          <p className="text-xs text-muted-foreground">Tasks waiting to be started</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-300 ease-in-out animate-fade-in hover:shadow-md hover:border-primary/50" style={{ animationDelay: '50ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Loader className="h-4 w-4 text-muted-foreground animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressCount}</div>
          <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-300 ease-in-out animate-fade-in hover:shadow-md hover:border-primary/50" style={{ animationDelay: '100ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tasksDueToday}</div>
          <p className="text-xs text-muted-foreground">Tasks with a deadline for today</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-300 ease-in-out animate-fade-in hover:shadow-md hover:border-primary/50" style={{ animationDelay: '150ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Habit Goals Met</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{habitGoalsMet}/{totalHabitsWithGoals}</div>
          <p className="text-xs text-muted-foreground">Habit streak goals achieved</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-300 ease-in-out animate-fade-in hover:shadow-md hover:border-primary/50" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeStreaksCount}</div>
          <p className="text-xs text-muted-foreground">Habits with streaks &gt; 2 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
