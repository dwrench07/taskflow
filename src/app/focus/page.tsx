"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    FocusSession,
    FocusMode,
    ProductivityScore,
    EnergyLevel,
    Task
} from "@/lib/types";
import { getFocusSessions, addFocusSession, getAllTasks } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Square, Pause, Flame, Medal, CheckCircle2 } from "lucide-react";
import { FocusAnalyticsChart } from "@/components/focus-analytics-chart";

export default function FocusPage() {
    const searchParams = useSearchParams();
    const initialTaskId = searchParams?.get('taskId');
    const { toast } = useToast();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Timer State
    const [mode, setMode] = useState<FocusMode>("pomodoro");
    const [isActive, setIsActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(25 * 60); // Default 25m
    const [customMinutes, setCustomMinutes] = useState(15);
    const [elapsedTime, setElapsedTime] = useState(0); // For stopwatch and tracking total
    const [targetTaskId, setTargetTaskId] = useState<string | undefined>(initialTaskId || undefined);
    const [sessionGoal, setSessionGoal] = useState<string>("");
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

    // Distraction Log
    const [distractions, setDistractions] = useState<string[]>([]);
    const [currentDistraction, setCurrentDistraction] = useState("");

    // Post-Session Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productivity, setProductivity] = useState<ProductivityScore>("medium");
    const [energy, setEnergy] = useState<EnergyLevel>("medium");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const fetchedTasks = await getAllTasks();
            const fetchedSessions = await getFocusSessions();
            setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
            setSessions(fetchedSessions || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);

                if (mode !== 'stopwatch') {
                    setTimeRemaining(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            handleStop();
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, mode]);

    const handleModeChange = (newMode: FocusMode) => {
        if (isActive) return;
        setMode(newMode);
        if (newMode === 'pomodoro') setTimeRemaining(25 * 60);
        else if (newMode === 'countdown') setTimeRemaining(customMinutes * 60);
        else setTimeRemaining(0); // Stopwatch starts at 0 visually
        setElapsedTime(0);
        setDistractions([]);
    };

    const handleStart = () => {
        if (!sessionStartTime) {
            setSessionStartTime(new Date());
        }
        setIsActive(true);
    };

    const handlePause = () => {
        setIsActive(false);
    }

    const handleStop = () => {
        setIsActive(false);
        if (elapsedTime > 60) { // Only prompt if > 1 minute tracked
            setIsModalOpen(true);
        } else {
            // Reset if too short
            setSessionStartTime(null);
            setElapsedTime(0);
            handleModeChange(mode);
        }
    };

    const handleSaveSession = async () => {
        if (!sessionStartTime) return;
        setIsSaving(true);

        try {
            const deepWorkScore = distractions.length === 0 && elapsedTime >= (30 * 60) ? 2 : 1; // 2x multiplier for 30m+ pure focus

            await addFocusSession({
                taskId: targetTaskId,
                startTime: sessionStartTime.toISOString(),
                endTime: new Date().toISOString(),
                duration: Math.ceil(elapsedTime / 60), // in minutes
                mode,
                productivityScore: productivity,
                energyLevel: energy,
                distractions,
                deepWorkScore
            });

            toast({ title: "Session Saved!", description: "Great job focusing!" });

            // Re-fetch to update charts (later)
            const fetchedSessions = await getFocusSessions();
            setSessions(fetchedSessions || []);

            // Reset
            setIsModalOpen(false);
            setSessionStartTime(null);
            setElapsedTime(0);
            setDistractions([]);
            handleModeChange(mode);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to save session" });
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const selectedTask = tasks.find(t => t.id === targetTaskId);

    return (
        <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Focus</h1>
                    <p className="text-muted-foreground">Deep work sessions tracking and analytics.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="text-muted-foreground animate-pulse">Loading focus data...</div>
                </div>
            ) : (
                <>
                    <Card className="max-w-xl mx-auto mb-6">
                        <CardHeader>
                            <CardTitle className="text-xl">Focus Analytics</CardTitle>
                            <CardDescription>Your deep work sessions over the last 5 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FocusAnalyticsChart sessions={sessions} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Active Timer Section */}
                        <Card className="flex flex-col items-center p-8 border-primary/20">
                            <Tabs value={mode} onValueChange={(v) => handleModeChange(v as FocusMode)} className="w-full mb-8">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="pomodoro" disabled={isActive}>Pomodoro</TabsTrigger>
                                    <TabsTrigger value="stopwatch" disabled={isActive}>Stopwatch</TabsTrigger>
                                    <TabsTrigger value="countdown" disabled={isActive}>Custom</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="text-8xl font-bold tracking-tighter tabular-nums mb-4 text-primary">
                                {mode === 'stopwatch' ? formatTime(elapsedTime) : formatTime(timeRemaining)}
                            </div>

                            {mode === 'countdown' && !isActive && elapsedTime === 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <Label htmlFor="custom-mins" className="text-muted-foreground text-sm">Minutes:</Label>
                                    <Input
                                        id="custom-mins"
                                        type="number"
                                        min={1}
                                        max={120}
                                        value={customMinutes}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setCustomMinutes(val);
                                            setTimeRemaining(val * 60);
                                        }}
                                        className="w-20 text-center"
                                    />
                                </div>
                            )}

                            {selectedTask ? (
                                <div className="flex flex-col items-center gap-2 mb-6">
                                    <Badge variant="outline" className="px-4 py-1.5 flex items-center gap-2 text-sm bg-muted/50">
                                        Focusing on: <span className="font-semibold">{selectedTask.title}</span>
                                        {selectedTask.priority === 'high' && <Flame className="h-4 w-4 text-orange-500" />}
                                    </Badge>
                                    {selectedTask.endDate && new Date(selectedTask.endDate) < new Date() && (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white animate-pulse">
                                            🐸 Frog Eater Bonus Active!
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full max-w-xs mb-6 px-4">
                                    <Input
                                        placeholder="What are you focusing on?"
                                        value={sessionGoal}
                                        onChange={(e) => setSessionGoal(e.target.value)}
                                        disabled={isActive}
                                        className="text-center bg-transparent border-dashed h-10"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                {!isActive && elapsedTime === 0 ? (
                                    <Button size="lg" className="w-32 h-14 text-lg rounded-full shadow-lg transition-transform hover:scale-105" onClick={handleStart}>
                                        <Play className="mr-2 h-5 w-5 fill-current" /> Start
                                    </Button>
                                ) : !isActive && elapsedTime > 0 ? (
                                    <>
                                        <Button size="lg" className="w-32 h-14 text-lg rounded-full shadow-lg transition-transform hover:scale-105" onClick={handleStart}>
                                            <Play className="mr-2 h-5 w-5 fill-current" /> Resume
                                        </Button>
                                        <Button size="lg" variant="destructive" className="w-32 h-14 text-lg rounded-full shadow-lg transition-transform hover:scale-105" onClick={handleStop}>
                                            <Square className="mr-2 h-5 w-5 fill-current" /> End
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="lg" variant="outline" className="w-32 h-14 text-lg rounded-full transition-transform hover:scale-105" onClick={handlePause}>
                                            <Pause className="mr-2 h-5 w-5 fill-current" /> Pause
                                        </Button>
                                        <Button size="lg" variant="destructive" className="w-32 h-14 text-lg rounded-full shadow-lg transition-transform hover:scale-105" onClick={handleStop}>
                                            <Square className="mr-2 h-5 w-5 fill-current" /> End
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Distraction & Analytics Split */}
                        <div className="space-y-6 flex flex-col">
                            <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="text-xl">Session Notes & Distractions</CardTitle>
                                    <CardDescription>Jot down passing thoughts or session notes to clear your mind.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder="e.g., Buy groceries later..."
                                        value={currentDistraction}
                                        onChange={e => setCurrentDistraction(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && currentDistraction.trim()) {
                                                const timeStamp = mode === 'stopwatch' ? formatTime(elapsedTime) : formatTime(timeRemaining);
                                                setDistractions([...distractions, `[${timeStamp}] ${currentDistraction.trim()}`]);
                                                setCurrentDistraction("");
                                            }
                                        }}
                                        disabled={!isActive}
                                    />
                                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                                        {distractions.map((d, i) => (
                                            <div key={i} className="text-sm bg-muted/50 p-2 rounded-md">{d}</div>
                                        ))}
                                        {distractions.length === 0 && isActive && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" /> Keep the streak zero for a Deep Work bonus!</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* Post-Session Evaluation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            Session Complete!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm border-b pb-1 mb-1 text-muted-foreground">Duration</p>
                                <p className="text-2xl font-bold tabular-nums">{Math.ceil(elapsedTime / 60)}m</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm border-b pb-1 mb-1 text-muted-foreground">Distractions</p>
                                <p className="text-2xl font-bold tabular-nums">{distractions.length}</p>
                            </div>
                            {distractions.length === 0 && elapsedTime >= (30 * 60) && (
                                <div className="text-center text-orange-500">
                                    <p className="text-sm border-b border-orange-200 pb-1 mb-1">Score</p>
                                    <p className="text-2xl font-bold flex items-center"><Flame className="h-5 w-5 mr-1" /> 2x</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label>How productive was this session?</Label>
                            <Select value={productivity} onValueChange={(v) => setProductivity(v as ProductivityScore)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High - Completely focused, great progress</SelectItem>
                                    <SelectItem value="medium">Medium - Good, but mildly distracted</SelectItem>
                                    <SelectItem value="low">Low - Struggled to make progress</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>What is your current energy level?</Label>
                            <Select value={energy} onValueChange={(v) => setEnergy(v as EnergyLevel)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High - Ready for more!</SelectItem>
                                    <SelectItem value="medium">Medium - Feeling okay</SelectItem>
                                    <SelectItem value="low">Low - Need a break</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="default"
                            className="w-full"
                            onClick={handleSaveSession}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Session"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
