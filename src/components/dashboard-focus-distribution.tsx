"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from 'react';
import { Task, FocusSession } from "@/lib/types";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))'];

export function DashboardFocusDistribution({ allTasks, focusSessions }: { allTasks: Task[], focusSessions: FocusSession[] }) {

    const data = useMemo(() => {
        const distribution: Record<string, number> = {};
        let unassignedMinutes = 0;

        focusSessions.forEach(session => {
            if (!session.taskId) {
                unassignedMinutes += session.duration;
                return;
            }

            const task = allTasks.find(t => t.id === session.taskId);
            if (!task) {
                unassignedMinutes += session.duration;
                return;
            }

            // Group by the first tag, or "Untagged" if none
            const category = task.tags && task.tags.length > 0 ? task.tags[0] : "Untagged";

            if (!distribution[category]) {
                distribution[category] = 0;
            }
            distribution[category] += session.duration;
        });

        const formattedData = Object.entries(distribution).map(([name, value]) => ({
            name,
            value: Math.round(value) // in minutes
        })).sort((a, b) => b.value - a.value); // Sort descending

        if (unassignedMinutes > 0) {
            formattedData.push({ name: "Unassigned", value: Math.round(unassignedMinutes) });
        }

        return formattedData;
    }, [allTasks, focusSessions]);

    // Format minutes into hours/minutes for tooltip
    const formatDuration = (minutes: number) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <Card className="flex flex-col h-full transition-all duration-500 ease-in-out hover:shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">Focus Distribution <WidgetInfo description={WIDGET_DESCRIPTIONS["focus-distribution"]} /></CardTitle>
                <CardDescription>
                    Where your deep work time goes (by task category)
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center min-h-[300px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [formatDuration(value), 'Time Spent']}
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center text-muted-foreground text-sm">
                        No focus sessions recorded yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
