"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Task } from "@/lib/types";
import { useMemo } from "react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

export function DashboardStatusChart({ allTasks }: { allTasks: Task[] }) {
  const data = useMemo(() => [
    { name: "To-Do", total: (Array.isArray(allTasks) ? allTasks : []).filter((t) => (t.category !== "habit") && t.status === "todo").length, fill: "hsl(var(--chart-1))" },
    { name: "In Progress", total: (Array.isArray(allTasks) ? allTasks : []).filter((t) => (t.category !== "habit") && t.status === "in-progress").length, fill: "hsl(var(--chart-2))" },
    { name: "Done", total: (Array.isArray(allTasks) ? allTasks : []).filter((t) => (t.category !== "habit") && t.status === "done").length, fill: "hsl(var(--chart-3))" },
  ], [allTasks]);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">Task Status Overview <WidgetInfo description={WIDGET_DESCRIPTIONS["status-chart"]} /></CardTitle>
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
