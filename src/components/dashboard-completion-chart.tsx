
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo, useState } from 'react';
import { subDays, format, parseISO, isSameDay, startOfWeek, endOfWeek, isFuture, addDays } from 'date-fns';
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "@/lib/types";

export function DashboardCompletionChart({ allTasks }: { allTasks: Task[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevWeek = () => {
        setCurrentDate(subDays(currentDate, 7));
    };

    const handleNextWeek = () => {
        setCurrentDate(addDays(currentDate, 7));
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const data = useMemo(() => {
        const daysInWeek = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

        return daysInWeek.map(day => {
            const tasksCompleted = (Array.isArray(allTasks) ? allTasks : []).filter(task =>
                task.status === "done" &&
                !task.isHabit &&
                task.endDate &&
                isSameDay(parseISO(task.endDate), day)
            ).length;

            const habitsCompleted = (Array.isArray(allTasks) ? allTasks : []).filter(task =>
                task.isHabit &&
                task.completionHistory?.some(d => isSameDay(parseISO(d), day))
            ).length;

            return {
                date: format(day, 'EEE'),
                'Tasks Completed': tasksCompleted,
                'Habits Completed': habitsCompleted,
            }
        });
    }, [weekStart, allTasks]);

    const isNextDisabled = isFuture(addDays(weekEnd, 1));

    return (
        <Card className="transition-all duration-500 ease-in-out animate-fade-in hover:shadow-md" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-semibold">Weekly Productivity</CardTitle>
                        <CardDescription>
                            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextWeek} disabled={isNextDisabled}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                            contentStyle={{
                                background: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="Tasks Completed"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'hsl(var(--chart-1))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                        <Line
                            type="monotone"
                            dataKey="Habits Completed"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'hsl(var(--chart-2))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
