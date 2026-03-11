"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    FocusSession,
    FocusMode,
    ProductivityScore,
    EnergyLevel,
    Task
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getFocusSessions, addFocusSession, getAllTasks, getActiveFocusSession, startFocusSession, updateActiveFocusSession, updateFocusSession } from "@/lib/data";
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
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Distraction Log
    const [distractions, setDistractions] = useState<string[]>([]);
    const [currentDistraction, setCurrentDistraction] = useState("");

    // Post-Session Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productivity, setProductivity] = useState<ProductivityScore>("medium");
    const [energy, setEnergy] = useState<EnergyLevel>("medium");
    const [isSaving, setIsSaving] = useState(false);

    // Audio Cues
    const beepsPlayedRef = useRef(new Set<number>());

    const playBeep = (count: number) => {
        if (typeof window === 'undefined') return;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        try {
            const ctx = new AudioContext();
            for (let i = 0; i < count; i++) {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime + i * 0.4);

                gainNode.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.3);

                osc.start(ctx.currentTime + i * 0.4);
                osc.stop(ctx.currentTime + i * 0.4 + 0.3);
            }
        } catch (err) {
            console.error("Audio playback failed:", err);
        }
    };

    // Reset beeps when deactivated (e.g., manually paused or stopped)
    useEffect(() => {
        if (!isActive) {
            beepsPlayedRef.current.clear();
        }
    }, [isActive]);

    // Track elapsed time for beeping logic
    useEffect(() => {
        if (!isActive || mode === 'stopwatch') return;

        const targetSeconds = mode === 'pomodoro' ? 25 * 60 : customMinutes * 60;
        const halfTime = Math.floor(targetSeconds * 0.5);
        const eightyTime = Math.floor(targetSeconds * 0.8);

        if (elapsedTime >= targetSeconds) {
            if (!beepsPlayedRef.current.has(100)) {
                playBeep(3);
                beepsPlayedRef.current.add(100);
            }
        } else if (elapsedTime >= eightyTime && eightyTime > 0) {
            if (!beepsPlayedRef.current.has(80)) {
                playBeep(2);
                beepsPlayedRef.current.add(80);
            }
        } else if (elapsedTime >= halfTime && halfTime > 0) {
            if (!beepsPlayedRef.current.has(50)) {
                playBeep(1);
                beepsPlayedRef.current.add(50);
            }
        }
    }, [elapsedTime, isActive, mode, customMinutes]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const fetchedTasks = await getAllTasks();
            const fetchedSessions = await getFocusSessions();
            setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
            setSessions(fetchedSessions || []);

            // Resume resilient active session if it exists on backend
            const activeSession = await getActiveFocusSession();
            if (activeSession) {
                setActiveSessionId(activeSession.id);
                setSessionStartTime(new Date(activeSession.startTime));
                setMode(activeSession.mode);
                setTargetTaskId(activeSession.taskId);
                setDistractions(activeSession.distractions || []);

                if (activeSession.expectedEndTime && activeSession.mode !== 'stopwatch') {
                    const remainingMs = new Date(activeSession.expectedEndTime).getTime() - Date.now();
                    setTimeRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
                    const elapsedMs = Date.now() - new Date(activeSession.startTime).getTime();
                    setElapsedTime(Math.floor(elapsedMs / 1000));
                } else {
                    const elapsedMs = Date.now() - new Date(activeSession.startTime).getTime();
                    setElapsedTime(Math.floor(elapsedMs / 1000));
                }
                setIsActive(true);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            let lastTickTime = Date.now();
            interval = setInterval(() => {
                const now = Date.now();
                const deltaMs = now - lastTickTime;

                if (deltaMs >= 1000) {
                    const secondsPassed = Math.floor(deltaMs / 1000);
                    lastTickTime += secondsPassed * 1000;

                    let newElapsed = 0;
                    setElapsedTime(prev => {
                        newElapsed = prev + secondsPassed;
                        return newElapsed;
                    });

                    if (mode !== 'stopwatch') {
                        setTimeRemaining(prev => {
                            const newRemaining = prev - secondsPassed;
                            if (newRemaining <= 0) {
                                clearInterval(interval);
                                setTimeout(() => handleStop(newElapsed), 0);
                                return 0;
                            }
                            return newRemaining;
                        });
                    }
                }
            }, 200);
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

    const handleStart = async () => {
        if (!sessionStartTime) {
            setSessionStartTime(new Date());
            const expectedDuration = mode === 'pomodoro' ? 25 : (mode === 'countdown' ? customMinutes : 120);
            const newSession = await startFocusSession({ mode, expectedDuration, taskId: targetTaskId });
            setActiveSessionId(newSession.id);
        } else {
            await updateActiveFocusSession('resume');
        }
        setIsActive(true);
    };

    const handlePause = async () => {
        setIsActive(false);
        await updateActiveFocusSession('pause');
    }

    const handleStop = async (overrideElapsed?: any) => {
        setIsActive(false);
        await updateActiveFocusSession('pause');
        const currentElapsed = typeof overrideElapsed === 'number' ? overrideElapsed : elapsedTime;
        if (currentElapsed > 60) { // Only prompt if > 1 minute tracked
            setIsModalOpen(true);
        } else {
            // Reset if too short
            await updateActiveFocusSession('stop');
            setSessionStartTime(null);
            setActiveSessionId(null);
            setElapsedTime(0);
            handleModeChange(mode);
        }
    };

    const handleSaveSession = async () => {
        if (!sessionStartTime) return;
        setIsSaving(true);

        try {
            const deepWorkScore = distractions.length === 0 && elapsedTime >= (30 * 60) ? 2 : 1;

            await updateActiveFocusSession('stop', {
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
            setActiveSessionId(null);
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
        <div className="h-full flex flex-col max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Focus Mode</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Deep work sessions tracking and analytics.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-48 bg-muted/10 rounded-3xl border border-border/50">
                    <div className="flex flex-col items-center gap-3">
                        <Flame className="w-8 h-8 text-primary animate-pulse" />
                        <div className="text-muted-foreground font-medium animate-pulse">Loading focus environment...</div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Analytics */}
                    <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
                        <Card className="bg-muted/10 border-border/50 shadow-sm rounded-3xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent"></div>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-primary" />
                                    Focus Analytics
                                </CardTitle>
                                <CardDescription>Your deep work sessions over the last 5 days.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <FocusAnalyticsChart sessions={sessions} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Timer & Notes */}
                    <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-8">
                        {/* Timer Card */}
                        <Card className="flex flex-col items-center justify-center p-6 sm:p-8 border-primary/20 bg-background/60 backdrop-blur-md shadow-lg rounded-[2.5rem] relative overflow-hidden transition-all duration-500">
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 -z-10",
                                isActive ? "from-primary/10 via-background to-background opacity-100" : "from-transparent to-transparent opacity-0"
                            )} />

                            <Tabs value={mode} onValueChange={(v) => handleModeChange(v as FocusMode)} className="w-full max-w-md mb-12 relative z-10">
                                <TabsList className="grid w-full grid-cols-3 h-12 rounded-full bg-muted/30 p-1 border shadow-inner">
                                    <TabsTrigger value="pomodoro" disabled={isActive} className="rounded-full">Pomodoro</TabsTrigger>
                                    <TabsTrigger value="stopwatch" disabled={isActive} className="rounded-full">Stopwatch</TabsTrigger>
                                    <TabsTrigger value="countdown" disabled={isActive} className="rounded-full">Custom</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="relative mb-10 group">
                                <div className={cn(
                                    "absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-opacity duration-1000",
                                    isActive ? "opacity-100" : "opacity-0"
                                )} />
                                <div className={cn(
                                    "text-[4rem] sm:text-[5rem] md:text-[6rem] font-black tracking-tighter tabular-nums text-primary leading-none transition-transform duration-300 relative z-10",
                                    isActive && "scale-105"
                                )}>
                                    {mode === 'stopwatch' ? formatTime(elapsedTime) : formatTime(timeRemaining)}
                                </div>
                            </div>

                            {mode === 'countdown' && !isActive && elapsedTime === 0 && (
                                <div className="flex items-center gap-3 mb-8 bg-muted/20 px-6 py-3 rounded-full border shadow-sm">
                                    <Label htmlFor="custom-mins" className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Target Mins:</Label>
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
                                        className="w-20 text-center font-bold text-lg h-9 border-0 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                                    />
                                </div>
                            )}

                            {selectedTask ? (
                                <div className="flex flex-col items-center gap-3 mb-10 w-full max-w-lg">
                                    <div className="flex items-center gap-2 bg-muted/40 px-5 py-2.5 rounded-2xl border border-border/50 text-sm font-medium text-foreground/80 text-center w-full justify-center shadow-sm backdrop-blur-sm">
                                        <span className="opacity-70">Focusing on:</span> <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">{selectedTask.title}</span>
                                        {selectedTask.priority === 'high' && <Flame className="h-4 w-4 text-orange-500 animate-pulse ml-1 shrink-0" />}
                                    </div>
                                    {selectedTask.endDate && new Date(selectedTask.endDate) < new Date() && (
                                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 px-3 py-1 font-semibold">
                                            Overdue task — Eat the Frog!
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full max-w-sm mb-10">
                                    <Input
                                        placeholder="What is your main goal for this session?"
                                        value={sessionGoal}
                                        onChange={(e) => setSessionGoal(e.target.value)}
                                        disabled={isActive}
                                        className="text-center bg-muted/20 border-border/50 h-14 rounded-2xl text-lg shadow-inner"
                                    />
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 relative z-10 w-full">
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

                        {/* Distraction & Notes Card */}
                        <Card className="border-border/50 bg-muted/5 rounded-3xl overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/10 pb-4">
                                <CardTitle className="text-xl">Session Notes & Distractions</CardTitle>
                                <CardDescription>Jot down passing thoughts or session notes to clear your mind.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Input
                                    placeholder="e.g., Buy groceries later..."
                                    value={currentDistraction}
                                    onChange={e => setCurrentDistraction(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && currentDistraction.trim()) {
                                            const timeStamp = mode === 'stopwatch' ? formatTime(elapsedTime) : formatTime(timeRemaining);
                                            const newDistractions = [...distractions, `[ ] [${timeStamp}] ${currentDistraction.trim()}`];
                                            setDistractions(newDistractions);
                                            setCurrentDistraction("");
                                            if (activeSessionId) {
                                                updateFocusSession(activeSessionId, { distractions: newDistractions }).catch(console.error);
                                            }
                                        }
                                    }}
                                    disabled={!isActive}
                                    className="h-12 bg-background shadow-sm rounded-xl"
                                />
                                <div className="mt-6 space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {distractions.map((d, i) => (
                                        <div key={i} className="text-sm bg-muted/40 border border-border/50 p-3 rounded-xl shadow-sm animate-fade-in">{d}</div>
                                    ))}
                                    {distractions.length === 0 && isActive && (
                                        <div className="flex flex-col items-center justify-center p-6 text-center bg-muted/20 border border-border/30 rounded-xl border-dashed">
                                            <p className="text-sm text-foreground/80 font-medium flex items-center gap-2 mb-1"><Flame className="h-5 w-5 text-orange-500 animate-pulse" /> Keep the streak zero!</p>
                                            <p className="text-xs text-muted-foreground">Maintain absolute focus for a Deep Work bonus.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
