"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Task } from "@/lib/types";
import { useMemo } from "react";

export function DashboardStatusChart({ allTasks }: { allTasks: Task[] }) {
  const data = useMemo(() => [
    { name: "To-Do", total: allTasks.filter((t) => !t.isHabit && t.status === "todo").length, fill: "hsl(var(--chart-1))" },
    { name: "In Progress", total: allTasks.filter((t) => !t.isHabit && t.status === "in-progress").length, fill: "hsl(var(--chart-2))" },
    { name: "Done", total: allTasks.filter((t) => !t.isHabit && t.status === "done").length, fill: "hsl(var(--chart-3))" },
  ], [allTasks]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
            <CardDescription>Current breakdown of all non-habit tasks.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
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
                <Bar dataKey="total" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
