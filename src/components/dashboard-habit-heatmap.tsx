"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { type Task } from "@/lib/types";
import { Flame } from "lucide-react";
import { subDays, isSameDay, parseISO, format } from "date-fns";

export function DashboardHabitHeatmap({ allTasks }: { allTasks: Task[] }) {
    const habits = useMemo(() => {
        return (Array.isArray(allTasks) ? allTasks : []).filter(t => t.isHabit);
    }, [allTasks]);

    // Calculate completions for the last 30 days
    const heatmapData = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = subDays(today, i);
            let completions = 0;

            habits.forEach(habit => {
                const isCompletedToday = habit.completionHistory?.some(c => {
                    const compDate = typeof c === 'string' ? parseISO(c) : new Date(c);
                    return isSameDay(compDate, date);
                });
                if (isCompletedToday) completions++;
            });

            days.push({
                date,
                completions,
            });
        }
        return days;
    }, [habits]);

    const maxCompletions = Math.max(...heatmapData.map(d => d.completions), 1); // Avoid division by 0

    const getIntensityColor = (completions: number) => {
        if (completions === 0) return "bg-muted/30 border-border/50";
        const ratio = completions / maxCompletions;
        if (ratio < 0.3) return "bg-green-500/30 border-green-500/20";
        if (ratio < 0.7) return "bg-green-500/60 border-green-500/40";
        return "bg-green-500 border-green-600 shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    };

    return (
        <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-sm transition-all hover:shadow-md animate-fade-in">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
                    <Flame className="h-5 w-5 text-orange-500" /> Habit Consistency (Last 30 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1.5 pt-2">
                    {heatmapData.map((day, i) => (
                        <div
                            key={i}
                            title={`${format(day.date, 'MMM do')}: ${day.completions} habits`}
                            className={`w-4 h-4 sm:w-6 sm:h-6 rounded-sm border ${getIntensityColor(day.completions)} transition-colors duration-300 hover:scale-110 cursor-help`}
                        />
                    ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground w-full">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm border bg-muted/30 border-border/50"></div>
                        <div className="w-3 h-3 rounded-sm border bg-green-500/30 border-green-500/20"></div>
                        <div className="w-3 h-3 rounded-sm border bg-green-500/60 border-green-500/40"></div>
                        <div className="w-3 h-3 rounded-sm border bg-green-500 border-green-600"></div>
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}
