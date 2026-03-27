"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { type Goal, type Task } from "@/lib/types";
import { getAllGoals, getAllTasks } from "@/lib/data";
import { differenceInDays, parseISO, startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";

export function DashboardGoalVelocity() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [g, t] = await Promise.all([getAllGoals(), getAllTasks()]);
            setGoals(g || []);
            setTasks(t || []);
            setLoading(false);
        };
        load();
    }, []);

    const data = useMemo(() => {
        const activeGoals = goals.filter(g => g.status === 'active');
        const today = startOfDay(new Date());

        return activeGoals.map(goal => {
            // Calculate Tasks Completion %
            const goalTasks = tasks.filter(t => t.goalId === goal.id);
            let completionPercent = 0;
            if (goalTasks.length > 0) {
                const completedCount = goalTasks.filter(t => t.status === 'done').length;
                completionPercent = Math.round((completedCount / goalTasks.length) * 100);
            }

            // Calculate Time Elapsed %
            let timeElapsedPercent = 0;
            if (goal.startDate && goal.deadline) {
                const start = parseISO(goal.startDate);
                const end = parseISO(goal.deadline);
                const totalDays = differenceInDays(end, start);
                const daysPassed = differenceInDays(today, start);

                if (totalDays > 0) {
                    // Cap elapsed time at 100% just in case deadline is past
                    timeElapsedPercent = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
                }
            } else {
                // Cannot calculate time elapsed without dates
                timeElapsedPercent = 0;
            }

            return {
                name: goal.title.length > 15 ? goal.title.substring(0, 15) + '...' : goal.title,
                fullTitle: goal.title,
                'Tasks Completed (%)': completionPercent,
                'Time Elapsed (%)': timeElapsedPercent
            };
        });
    }, [goals, tasks]);

    if (loading) {
        return (
            <Card className="flex flex-col h-full border-border/50 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Goal Velocity</CardTitle>
                    <CardDescription>Pace vs Deadline</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[300px]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-full border-border/50 shadow-sm transition-all hover:shadow-md animate-fade-in">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Goal Velocity</CardTitle>
                <CardDescription>
                    Compare your task completion pace against the elapsed timeline for active goals.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center min-h-[350px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTitle || label}
                                cursor={{ fill: 'hsl(var(--secondary))' }}
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Bar dataKey="Tasks Completed (%)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Time Elapsed (%)" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                        <p>No active goals found.</p>
                        <p className="text-xs opacity-70">Add an active goal with a start date and deadline to see velocity.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
