"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMemo } from 'react';
import { FocusSession } from "@/lib/types";
import { subDays, format, parseISO, isSameDay, startOfDay } from 'date-fns';

export function DashboardDistractionScore({ focusSessions }: { focusSessions: FocusSession[] }) {

    const data = useMemo(() => {
        const today = startOfDay(new Date());
        // Last 7 days
        const days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

        return days.map(day => {
            const sessionsOnDay = focusSessions.filter(s => isSameDay(parseISO(s.startTime), day));

            const totalDurationMinutes = sessionsOnDay.reduce((acc, s) => acc + s.duration, 0);
            const totalJots = sessionsOnDay.reduce((acc, s) => acc + (s.distractions?.length || 0), 0);

            // Jots per hour 
            let jotsPerHour = 0;
            if (totalDurationMinutes > 0) {
                jotsPerHour = totalJots / (totalDurationMinutes / 60);
            }

            return {
                date: format(day, 'EEE'),
                fullDate: format(day, 'MMM d, yyyy'),
                JotsPerHour: Number(jotsPerHour.toFixed(1)),
                TotalFocusTime: totalDurationMinutes
            }
        });
    }, [focusSessions]);

    // Check if there is barely any data
    const hasData = useMemo(() => data.some(d => d.TotalFocusTime > 0), [data]);

    return (
        <Card className="flex flex-col h-full transition-all duration-500 ease-in-out hover:shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Distractor Score</CardTitle>
                <CardDescription>
                    Average Jots (distractions) per hour of Focus
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center min-h-[300px]">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
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
                                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="JotsPerHour"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                                activeDot={{ r: 6 }}
                                name="Jots / hr"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                        <p>No focus sessions in the last 7 days.</p>
                        <p className="text-xs opacity-70">Complete focus sessions to see your score.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
