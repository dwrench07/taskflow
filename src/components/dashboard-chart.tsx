
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { allTasks } from "@/lib/data";
import { useMemo } from 'react';
import { subDays, format, parseISO, isSameDay } from 'date-fns';

export function DashboardCompletionChart() {

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
    
    const completedTasks = allTasks.filter(
        (t) => t.status === "done" && t.endDate && !t.isHabit
    );

    return last7Days.map(day => {
        const completedCount = completedTasks.filter(task => isSameDay(parseISO(task.endDate!), day)).length;
        return {
            date: format(day, 'EEE'),
            'Tasks Completed': completedCount
        }
    });
  }, []);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Weekly Productivity</CardTitle>
            <CardDescription>Tasks completed in the last 7 days.</CardDescription>
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
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
