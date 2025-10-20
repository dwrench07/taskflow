
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CheckCircle, ListChecks, Repeat } from "lucide-react";
import { useMemo } from "react";
import { Task } from "@/lib/types";

export function DashboardStats({ allTasks }: { allTasks: Task[] }) {
  const stats = useMemo(() => {
    const totalTasksCompleted = (Array.isArray(allTasks) ? allTasks : []).filter(
      (task) => !task.isHabit && task.status === "done"
    ).length;

    const totalSubtasksCompleted = (Array.isArray(allTasks) ? allTasks : []).reduce((acc, task) => {
      if (!task.subtasks) return acc;
      return acc + task.subtasks.filter((subtask) => subtask.completed).length;
    }, 0);

    const totalHabitCompletions = (Array.isArray(allTasks) ? allTasks : []).reduce((acc, task) => {
      if (task.isHabit && task.completionHistory) {
        return acc + task.completionHistory.length;
      }
      return acc;
    }, 0);

    return {
      totalTasksCompleted,
      totalSubtasksCompleted,
      totalHabitCompletions,
    };
  }, [allTasks]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Overall Progress</CardTitle>
        <CardDescription>Your all-time stats.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-around">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalTasksCompleted}</p>
            <p className="text-sm text-muted-foreground">Tasks Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-accent/10 p-3 rounded-full">
            <ListChecks className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalSubtasksCompleted}</p>
            <p className="text-sm text-muted-foreground">Subtasks Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-green-500/10 p-3 rounded-full">
            <Repeat className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalHabitCompletions}</p>
            <p className="text-sm text-muted-foreground">Habit Completions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
