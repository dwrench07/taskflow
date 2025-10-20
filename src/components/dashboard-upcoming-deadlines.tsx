
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { format, parseISO, isFuture } from "date-fns";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Priority, Task } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { Calendar } from "lucide-react";

const priorityStyles: Record<Priority, string> = {
  high: "border-red-500/50 bg-red-500/10 text-red-400",
  medium: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  low: "border-green-500/50 bg-green-500/10 text-green-400",
};

export function DashboardUpcomingDeadlines({ allTasks }: { allTasks: Task[] }) {

  const upcomingTasks = useMemo(() => {
    return (Array.isArray(allTasks) ? allTasks : [])
      .filter(task => 
        task.endDate && 
        task.status !== 'done' && 
        !task.isHabit &&
        isFuture(parseISO(task.endDate))
      )
      .sort((a, b) => parseISO(a.endDate!).getTime() - parseISO(b.endDate!).getTime())
      .slice(0, 5); // Limit to the next 5 tasks
  }, [allTasks]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Your next five tasks with approaching deadlines.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-4">
                    {upcomingTasks.length > 0 ? (
                        upcomingTasks.map(task => (
                            <Link href={`/tasks?taskId=${task.id}`} key={task.id} className="block p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold">{task.title}</p>
                                    <Badge variant="outline" className={cn("capitalize text-xs", priorityStyles[task.priority])}>
                                        {task.priority}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Due: {format(parseISO(task.endDate!), "MMMM d, yyyy 'at' h:mm a")}
                                </p>
                            </Link>
                        ))
                    ) : (
                         <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground gap-2">
                            <Calendar className="w-10 h-10" />
                            <p>No upcoming deadlines found.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
