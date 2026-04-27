"use client";

import { useState, useEffect } from "react";
import { getAllTasks, startFocusSession } from "@/lib/data";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Play, Info, Flame, Ghost, AlertTriangle, HelpCircle, Maximize2, Coffee, Clock, ChevronDown, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getFrogDecayLevel } from "@/lib/habits";
import { PushReason } from "@/lib/types";

const PUSH_REASON_LABELS: Record<PushReason, { label: string; icon: React.ReactNode }> = {
  'too-scary': { label: 'Too Scary', icon: <AlertTriangle className="h-3 w-3" /> },
  'too-vague': { label: 'Too Vague', icon: <HelpCircle className="h-3 w-3" /> },
  'too-big': { label: 'Too Big', icon: <Maximize2 className="h-3 w-3" /> },
  'too-boring': { label: 'Too Boring', icon: <Coffee className="h-3 w-3" /> },
  'ran-out-of-time': { label: 'No Time', icon: <Clock className="h-3 w-3" /> },
  'deprioritized': { label: 'Deprioritized', icon: <ChevronDown className="h-3 w-3" /> },
};

const PUSH_INTERVENTIONS: Record<PushReason, string> = {
  'too-scary': "Start with just 2 minutes. Fear shrinks once you begin.",
  'too-vague': "Spend 5 minutes defining the very first step before starting.",
  'too-big': "Break this into subtasks — you need smaller bites.",
  'too-boring': "Pair with music or batch with other boring tasks. Power through.",
  'ran-out-of-time': "Schedule a specific time block for this today.",
  'deprioritized': "Is this still needed? Consider dropping it if it keeps getting pushed.",
};

function getTopPushReason(task: Task): PushReason | null {
  const history = task.pushHistory || [];
  if (history.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const entry of history) {
    counts[entry.reason] = (counts[entry.reason] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as PushReason;
}

export default function FrogsPage() {
    const [frogs, setFrogs] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchFrogs = async () => {
            setLoading(true);
            const allTasks = await getAllTasks();
            
            // Define what makes a "Frog"
            // 1. Manually marked as frog
            // 2. High push count (> 3)
            // 3. Urgent Priority AND High Energy Level
            const identifiedFrogs = (allTasks || []).filter(t => 
                t.status !== 'done' && t.status !== 'abandoned' && (t.category !== "habit") && (
                    t.isFrog || 
                    (t.pushCount && t.pushCount >= 3) || 
                    (t.priority === 'urgent' && t.energyLevel === 'high')
                )
            );

            // Sort by "Resistance"
            identifiedFrogs.sort((a, b) => {
                const aScore = (a.isFrog ? 10 : 0) + (a.pushCount || 0) + (a.priority === 'urgent' ? 5 : 0);
                const bScore = (b.isFrog ? 10 : 0) + (b.pushCount || 0) + (b.priority === 'urgent' ? 5 : 0);
                return bScore - aScore;
            });

            setFrogs(identifiedFrogs);
            setLoading(false);
        };
        fetchFrogs();
    }, []);

    const handleEatFrog = async (task: Task) => {
        try {
            await startFocusSession({
                mode: 'pomodoro',
                taskId: task.id,
                strategy: 'Eat the Frog',
                expectedDuration: task.timeLimit || 25
            });
            router.push('/focus');
        } catch (error) {
            console.error("Failed to start frog session:", error);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4 md:py-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-3">
                    <span className="text-5xl">🐸</span> Eat the Frog
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Mark Twain said: "Eat a live frog first thing in the morning and nothing worse will happen to you the rest of the day."
                </p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map(i => <Card key={i} className="h-64 animate-pulse bg-muted/20" />)}
                </div>
            ) : frogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed text-center">
                    <Ghost className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-2xl font-bold">No Frogs in the Pond</h2>
                    <p className="text-muted-foreground mt-2">You've either cleared your resistance or haven't marked any difficult tasks yet.</p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {/* The Biggest Frog */}
                    <Card className={cn(
                        "border-2 bg-card shadow-lg overflow-hidden relative",
                        getFrogDecayLevel(frogs[0]) === 'rotting' ? "border-red-500" : getFrogDecayLevel(frogs[0]) === 'aging' ? "border-amber-500" : "border-primary"
                    )}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Flame className="h-24 w-24 text-primary" />
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge className="bg-primary text-primary-foreground mb-2">The Biggest Frog</Badge>
                                {frogs[0].pushCount && frogs[0].pushCount > 0 && (
                                    <Badge variant="outline" className="text-red-500 border-red-500/50">
                                        Avoided {frogs[0].pushCount} times
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight">{frogs[0].title}</CardTitle>
                            <CardDescription className="text-lg line-clamp-2">{frogs[0].description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-wrap gap-4 text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    Priority: <span className="capitalize">{frogs[0].priority}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-blue-500" />
                                    Resistance: <span className="text-primary">Very High</span>
                                </div>
                                {getTopPushReason(frogs[0]) && (
                                    <div className="flex items-center gap-2">
                                        {PUSH_REASON_LABELS[getTopPushReason(frogs[0])!].icon}
                                        Pattern: <span className="text-orange-400">{PUSH_REASON_LABELS[getTopPushReason(frogs[0])!].label}</span>
                                    </div>
                                )}
                            </div>
                            {/* Smart intervention based on push reason */}
                            {getTopPushReason(frogs[0]) && (
                                <div className="flex items-start gap-2 text-sm text-foreground bg-muted border border-border rounded-lg px-4 py-3">
                                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>{PUSH_INTERVENTIONS[getTopPushReason(frogs[0])!]}</span>
                                </div>
                            )}
                            <Button
                                size="lg"
                                className="w-full text-xl h-16 font-black gap-3 shadow-sm hover:scale-[1.01] transition-transform"
                                onClick={() => handleEatFrog(frogs[0])}
                            >
                                <Play className="fill-current" /> EAT THIS FROG NOW
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Other Frogs */}
                    {frogs.length > 1 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold px-1">Other Frogs in Waiting</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {frogs.slice(1).map(frog => (
                                    <Card key={frog.id} className={cn(
                                        "bg-card border transition-all hover:shadow-md",
                                        getFrogDecayLevel(frog) === 'rotting' ? "border-red-500/50 bg-red-500/5" : getFrogDecayLevel(frog) === 'aging' ? "border-amber-500/50 bg-amber-500/5" : "border-border hover:border-primary"
                                    )}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                                    {frog.priority}
                                                </Badge>
                                                <div className="flex items-center gap-1.5">
                                                    {frog.pushCount && frog.pushCount > 0 && (
                                                        <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/50">
                                                            {frog.pushCount}x pushed
                                                        </Badge>
                                                    )}
                                                    {getTopPushReason(frog) && (
                                                        <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30">
                                                            {PUSH_REASON_LABELS[getTopPushReason(frog)!].icon}
                                                            <span className="ml-1">{PUSH_REASON_LABELS[getTopPushReason(frog)!].label}</span>
                                                        </Badge>
                                                    )}
                                                    {frog.isFrog && <span title="Manually marked">🐸</span>}
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg font-bold truncate">{frog.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pb-4 space-y-3">
                                            {getTopPushReason(frog) && (
                                                <div className="flex items-start gap-1.5 text-xs text-foreground bg-muted border border-border rounded-lg px-3 py-2">
                                                    <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                                    <span>{PUSH_INTERVENTIONS[getTopPushReason(frog)!]}</span>
                                                </div>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full group hover:bg-primary/10 hover:border-primary/30"
                                                onClick={() => handleEatFrog(frog)}
                                            >
                                                Start This Frog <Play className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-12 p-6 rounded-3xl bg-muted/5 border border-border/50">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary" /> Why "Eat the Frog"?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Productivity research shows that we have a limited supply of willpower each day. By tackling your most difficult, 
                    dread-inducing task (your "Frog") first, you eliminate the mental drag of procrastination and ensure your highest 
                    energy is spent on your most impactful work.
                </p>
            </div>
        </div>
    );
}
