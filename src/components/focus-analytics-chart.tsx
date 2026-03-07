"use client";

import { useMemo } from "react";
import { format, subDays, startOfToday, parseISO, isSameDay } from "date-fns";
import { FocusSession } from "@/lib/types";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export function FocusAnalyticsChart({ sessions }: { sessions: FocusSession[] }) {
    const chartData = useMemo(() => {
        const today = startOfToday();
        const data = [];

        // Generate the last 5 days
        for (let i = 4; i >= 0; i--) {
            const date = subDays(today, i);
            const dateString = format(date, 'MMM d');

            // Sum the duration for all sessions that started on this day
            const daySessions = sessions.filter(session => {
                const sessionDate = parseISO(session.startTime);
                return isSameDay(sessionDate, date);
            });

            const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);

            data.push({
                date: dateString,
                minutes: totalMinutes,
            });
        }
        return data;
    }, [sessions]);

    return (
        <div className="h-[200px] w-full">
            <ChartContainer
                config={{
                    minutes: {
                        label: "Minutes Focused",
                        color: "hsl(var(--primary))",
                    },
                }}
                className="h-full w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}m`}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar
                            dataKey="minutes"
                            fill="var(--color-minutes)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
