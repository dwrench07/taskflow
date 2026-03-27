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

export function DashboardUpcomingDeadlines({ allTasks }: { allTasks: Task[] }) {

    const upcomingTasks = useMemo(() => {
        const today = new Date();
        return (Array.isArray(allTasks) ? allTasks : [])
            .filter(task =>
                task.endDate &&
                task.status !== 'done' &&
                !task.isHabit
            )
            .sort((a, b) => {
                const dateA = parseISO(a.endDate!);
                const dateB = parseISO(b.endDate!);
                return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 5); // Limit to the next 5 tasks
    }, [allTasks]);

    if (upcomingTasks.length === 0) return null;

    return (
        <Card className="transition-all duration-500 ease-in-out animate-fade-in hover:shadow-md border-primary/20 bg-background/50 backdrop-blur-sm" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
            <CardHeader className="py-4">
                <CardTitle className="text-primary flex items-center gap-2 text-sm font-bold">
                    <Calendar className="w-5 h-5" />
                    Upcoming Deadlines
                </CardTitle>
                <CardDescription className="text-xs">Final dates for completion</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="space-y-3">
                    {upcomingTasks.map(task => (
                        <Link 
                            href={`/tasks?taskId=${task.id}`} 
                            key={task.id} 
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-accent/50 hover:border-primary/30 hover:scale-[1.01] transition-all duration-300"
                        >
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm truncate">{task.title}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(parseISO(task.endDate!), "MMM d, h:mm a")}
                                </span>
                            </div>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 capitalize shrink-0 ml-2", priorityStyles[task.priority])}>
                                {task.priority}
                            </Badge>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
