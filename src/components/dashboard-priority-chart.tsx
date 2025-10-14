
"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { Priority, Task } from "@/lib/types";

const COLORS: Record<Priority, string> = {
  high: "hsl(var(--chart-5))",
  medium: "hsl(var(--chart-4))",
  low: "hsl(var(--chart-2))",
};

const priorityLabels: Record<Priority, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
}

export function DashboardPriorityChart({ allTasks }: { allTasks: Task[] }) {
  const data = useMemo(() => {
    const priorityCounts: Record<Priority, number> = { high: 0, medium: 0, low: 0 };
    
    allTasks
      .filter(task => task.status !== 'done' && !task.isHabit)
      .forEach(task => {
        priorityCounts[task.priority]++;
      });

    return (["high", "medium", "low"] as Priority[]).map(priority => ({
      name: priorityLabels[priority],
      value: priorityCounts[priority],
      fill: COLORS[priority],
    })).filter(item => item.value > 0);
  }, [allTasks]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Active Task Priority</CardTitle>
            <CardDescription>Distribution of priorities for non-completed tasks.</CardDescription>
        </CardHeader>
        <CardContent>
             {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--secondary))' }}
                            contentStyle={{ 
                                background: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)'
                            }}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                                );
                            }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No active tasks to display.
                </div>
            )}
        </CardContent>
    </Card>
  );
}
