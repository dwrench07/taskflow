
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { format, parseISO, isFuture } from "date-fns";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Priority, Task } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

const priorityStyles: Record<Priority, string> = {
    urgent: "bg-red-600/30 text-red-500 border-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    low: "bg-green-500/20 text-green-500 border-green-500/30",
};

export function DashboardUpcomingPNRs({ allTasks }: { allTasks: Task[] }) {

    const upcomingTasks = useMemo(() => {
        const today = new Date();
        return (Array.isArray(allTasks) ? allTasks : [])
            .filter(task =>
                (task.doDate || task.startDate) &&
                task.status !== 'done' &&
                !task.isHabit
            )
            .sort((a, b) => {
                const dateA = parseISO(a.doDate || a.startDate!);
                const dateB = parseISO(b.doDate || b.startDate!);
                return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 5); // Limit to the next 5 tasks
    }, [allTasks]);

    return (
        <Card className="transition-all duration-500 ease-in-out animate-fade-in hover:shadow-md border-border/50" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
            <CardHeader>
                <CardTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Upcoming Drop Dead Dates
                </CardTitle>
                <CardDescription>Your next five points of no return.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[250px] pr-2">
                    <div className="space-y-4">
                        {upcomingTasks.length > 0 ? (
                            upcomingTasks.map(task => {
                                const targetDate = task.doDate || task.startDate!;
                                return (
                                    <Link href={`/tasks?taskId=${task.id}`} key={task.id} className="block p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/50 hover:scale-[1.01] transition-all duration-300">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">{task.title}</p>
                                            <Badge variant="outline" className={cn("capitalize text-xs", priorityStyles[task.priority])}>
                                                {task.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                                            Execute by: {format(parseISO(targetDate), "MMM d, h:mm a")}
                                            {task.doDate ? "" : " (Start Date)"}
                                        </p>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                                <Calendar className="w-10 h-10 opacity-20" />
                                <p>No upcoming drop dead dates.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
