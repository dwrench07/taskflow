
"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { subDays, isAfter, startOfDay, parseISO } from 'date-fns';
import { type Task, DailyHabitStatus } from "@/lib/types";

const statusColors: Record<Exclude<DailyHabitStatus, 'not recorded'>, string> = {
    'changes observed': 'hsl(var(--chart-2))', // Green
    'no changes': 'hsl(var(--chart-4))', // Yellow
    'negative': 'hsl(var(--chart-5))', // Red
};

export function HabitAnalyticsChart({ habit }: { habit: Task }) {
    const data = useMemo(() => {
        const last30Days = startOfDay(subDays(new Date(), 29));
        const relevantStatuses = habit.dailyStatus?.filter(ds => 
            isAfter(parseISO(ds.date), last30Days) && ds.status !== 'not recorded'
        ) || [];

        const statusCounts = relevantStatuses.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<DailyHabitStatus, number>);

        const chartData = [
            {
                name: 'Observations',
                'Changes Observed': statusCounts['changes observed'] || 0,
                'No Changes': statusCounts['no changes'] || 0,
                'Negative': statusCounts['negative'] || 0,
            }
        ];
        
        return chartData;

    }, [habit.dailyStatus]);

    const totalObservations = data[0]['Changes Observed'] + data[0]['No Changes'] + data[0]['Negative'];

    if (totalObservations === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-center text-sm p-4 rounded-lg bg-muted/50">
                No observation data recorded for this habit in the last 30 days.
            </div>
        );
    }

    return (
        <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--secondary))' }}
                        contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                        }}
                    />
                    <Legend />
                    <Bar dataKey="Changes Observed" stackId="a" fill={statusColors['changes observed']} radius={[4, 0, 0, 4]} />
                    <Bar dataKey="No Changes" stackId="a" fill={statusColors['no changes']} />
                    <Bar dataKey="Negative" stackId="a" fill={statusColors['negative']} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

    