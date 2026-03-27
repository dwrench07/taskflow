import { useState, useEffect } from "react";
import { type Goal } from "@/lib/types";
import { getAllGoals, getAllTasks } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, Loader2 } from "lucide-react";
import Link from "next/link";

export function DashboardGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
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

    const calculateProgress = (goalId: string) => {
        const goalTasks = tasks.filter(t => t.goalId === goalId);
        if (goalTasks.length === 0) return 0;
        const completedTasks = goalTasks.filter(t => t.status === 'done').length;
        return Math.round((completedTasks / goalTasks.length) * 100);
    };

    if (loading) {
        return (
            <Card className="col-span-1 border-border/50 shadow-sm h-full flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    const activeGoals = goals.filter(g => g.status === 'active').slice(0, 4);

    return (
        <Card className="col-span-1 border-border/50 shadow-sm transition-all hover:shadow-md animate-fade-in">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" /> Active Goals
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activeGoals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No active goals found.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeGoals.map(goal => {
                            const progress = calculateProgress(goal.id);
                            return (
                                <div key={goal.id} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <Link href="/goals" className="truncate pr-4 hover:text-primary transition-colors">{goal.title}</Link>
                                        <span className="text-muted-foreground shrink-0">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
