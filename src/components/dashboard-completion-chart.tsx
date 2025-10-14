
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
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
        const tasksCompleted = allTasks.filter(task => 
            task.status === "done" && 
            !task.isHabit &&
            task.endDate && 
            isSameDay(parseISO(task.endDate), day)
        ).length;
        
        const habitsCompleted = allTasks.filter(task => 
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
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Weekly Productivity</CardTitle>
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
                <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
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
                <Legend />
                <Bar dataKey="Tasks Completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Habits Completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
