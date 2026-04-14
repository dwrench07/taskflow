"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from 'react';
import { Task } from "@/lib/types";
import { differenceInDays, parseISO } from 'date-fns';
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

export function DashboardTaskVelocity({ allTasks }: { allTasks: Task[] }) {

    const data = useMemo(() => {
        // Find tasks that are done and have a startDate
        const completedTasks = allTasks.filter(t => !t.isHabit && t.status === "done" && t.startDate && t.endDate);

        if (completedTasks.length === 0) return [];

        // Distribute completion times into buckets (e.g., Same Day, 1 Day, 2-3 Days, 4-7 Days, 1+ Week)
        const buckets = {
            "Same Day": 0,
            "1 Day": 0,
            "2-3 Days": 0,
            "4-7 Days": 0,
            "1+ Weeks": 0
        };

        completedTasks.forEach(task => {
            // Ideally, we'd use 'createdAt' and 'completedAt'. 
            // Here we use 'startDate' as creation proxy, and 'endDate' or current time as completion proxy.
            const start = parseISO(task.startDate!);
            const end = task.endDate ? parseISO(task.endDate) : new Date(); // Fallback

            const daysToComplete = differenceInDays(end, start);

            if (daysToComplete <= 0) buckets["Same Day"]++;
            else if (daysToComplete === 1) buckets["1 Day"]++;
            else if (daysToComplete <= 3) buckets["2-3 Days"]++;
            else if (daysToComplete <= 7) buckets["4-7 Days"]++;
            else buckets["1+ Weeks"]++;
        });

        return Object.entries(buckets).map(([name, count]) => ({
            name,
            Tasks: count
        }));

    }, [allTasks]);

    // Average calculation
    const averageDays = useMemo(() => {
        const completedTasks = allTasks.filter(t => !t.isHabit && t.status === "done" && t.startDate);
        if (completedTasks.length === 0) return 0;

        const totalDays = completedTasks.reduce((acc, task) => {
            const start = parseISO(task.startDate!);
            const end = task.endDate ? parseISO(task.endDate) : new Date();
            const diff = differenceInDays(end, start);
            return acc + (diff >= 0 ? diff : 0);
        }, 0);

        return (totalDays / completedTasks.length).toFixed(1);
    }, [allTasks]);

    return (
        <Card className="flex flex-col h-full transition-all duration-500 ease-in-out hover:shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Task Velocity</CardTitle>
                <WidgetInfo description={WIDGET_DESCRIPTIONS["task-velocity"]} />
                <CardDescription>
                    Time taken to complete tasks
                    {Number(averageDays) > 0 && <span className="block mt-1 font-semibold text-primary">Average: {averageDays} days</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center min-h-[350px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--secondary))' }}
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Bar dataKey="Tasks" fill="hsl(var(--purple-500))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                        <p>Not enough data yet.</p>
                        <p className="text-xs opacity-70">Complete normal tasks to track your average turnaround speed.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
