"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { format, parseISO, isFuture, isPast, isSameDay } from "date-fns";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Priority, Task } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

const priorityStyles: Record<Priority, string> = {
    urgent: "bg-red-600/30 text-red-500 border-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    low: "bg-green-500/20 text-green-500 border-green-500/30",
};

export function DashboardPointOfNoReturn({ allTasks }: { allTasks: Task[] }) {

    const pnrTasks = useMemo(() => {
        const now = new Date();
        return (Array.isArray(allTasks) ? allTasks : [])
            .filter(task =>
                task.doDate &&
                task.status !== 'done' &&
                !task.isHabit
            )
            .sort((a, b) => parseISO(a.doDate!).getTime() - parseISO(b.doDate!).getTime())
            .slice(0, 5); 
    }, [allTasks]);

    return (
        <Card className="border-primary/20 bg-primary/5 transition-all duration-500 ease-in-out animate-fade-in hover:shadow-lg" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary animate-pulse" />
                    <CardTitle className="text-lg sm:text-xl font-semibold text-primary">Point of No Return</CardTitle>
                    <WidgetInfo description={WIDGET_DESCRIPTIONS["point-of-no-return"]} />
                </div>
                <CardDescription>Tasks approaching or past their Drop Dead Date.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-4 pt-2">
                        {pnrTasks.length > 0 ? (
                            pnrTasks.map(task => {
                                const doDate = parseISO(task.doDate!);
                                const isOverdue = isPast(doDate) && !isSameDay(doDate, new Date());
                                
                                return (
                                    <Link 
                                        href={`/tasks?taskId=${task.id}`} 
                                        key={task.id} 
                                        className={cn(
                                            "block p-4 rounded-xl border transition-all duration-300 group hover:scale-[1.02]",
                                            isOverdue 
                                                ? "bg-red-500/10 border-red-500/30 hover:border-red-500" 
                                                : "bg-background border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className={cn("font-bold text-base transition-colors", isOverdue ? "text-red-600" : "group-hover:text-primary")}>
                                                {task.title}
                                            </p>
                                            <Badge variant="outline" className={cn("capitalize text-[11px] font-bold", priorityStyles[task.priority])}>
                                                {task.priority}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className={cn("w-3.5 h-3.5", isOverdue ? "text-red-500" : "text-muted-foreground")} />
                                            <span className={cn(
                                                "font-semibold",
                                                isOverdue ? "text-red-500" : "text-muted-foreground"
                                            )}>
                                                {isOverdue ? 'MISSED DROP DEAD: ' : 'Drop Dead: '} 
                                                {format(doDate, "MMM d, h:mm a")}
                                            </span>
                                        </div>
                                        {task.endDate && (
                                            <p className="text-[11px] text-muted-foreground mt-1 opacity-70">
                                                Final Deadline: {format(parseISO(task.endDate), "MMM d")}
                                            </p>
                                        )}
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground gap-2">
                                <Clock className="w-10 h-10 opacity-20" />
                                <p className="text-sm font-medium">No urgent Drop Dead Dates</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
