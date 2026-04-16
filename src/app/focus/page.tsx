"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    FocusSession,
    FocusMode,
    ProductivityScore,
    EnergyLevel,
    Task,
    EmotionCheckIn as EmotionCheckInType
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getFocusSessions, addFocusSession, getAllTasks, getActiveFocusSession, startFocusSession, updateActiveFocusSession, updateFocusSession, getFocusReminders, saveFocusReminders, saveUserProgress } from "@/lib/data";
import type { FocusReminders } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/context/GamificationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Square, Pause, Flame, Medal, CheckCircle2, Sparkles, AlertCircle, Bell, BellOff, Plus, X, Settings2, Search, Target, Zap } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { FocusAnalyticsChart } from "@/components/focus-analytics-chart";
import { DashboardEmotionTrends } from "@/components/dashboard-emotion-trends";
import { EmotionCheckInModal, EmotionCheckInInline } from "@/components/emotion-check-in";
import { StartAssist } from "@/components/start-assist";
import { buildJotString, stripAllMetadata } from "@/lib/jots";

export default function FocusPage() {
    const searchParams = useSearchParams();
    const initialTaskId = searchParams?.get('taskId');
    const { toast } = useToast();
    const { celebrate, refreshGamification, userProgress, refreshProgress } = useGamification();

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
    const [jotCategory, setJotCategory] = useState<'worry' | 'todo' | 'idea' | 'random'>('random');

    // Post-Session Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productivity, setProductivity] = useState<ProductivityScore>("medium");
    const [energy, setEnergy] = useState<EnergyLevel>("medium");
    const [isSaving, setIsSaving] = useState(false);
    
    // Strategy Step State
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [strategyInput, setStrategyInput] = useState("");

    // Emotion Check-In
    const [showPreEmotion, setShowPreEmotion] = useState(false);
    const [preEmotion, setPreEmotion] = useState<EmotionCheckInType | null>(null);
    const [postEmotion, setPostEmotion] = useState<EmotionCheckInType | null>(null);
    const [showStartAssist, setShowStartAssist] = useState(false);
    const pendingStartRef = useRef<{ strategy?: string } | null>(null);

    // Mindfulness Reminders
    const [reminderSettings, setReminderSettings] = useState<FocusReminders | null>(null);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [showReminderSettings, setShowReminderSettings] = useState(false);
    const [newReminderText, setNewReminderText] = useState("");
    const [activeReminder, setActiveReminder] = useState<string | null>(null);
    const lastReminderTime = useRef<number>(0);
    const pendingAutoStop = useRef<number | null>(null);

    // Task Picker
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [taskSearch, setTaskSearch] = useState("");

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

                const task = fetchedTasks.find(t => t.id === activeSession.taskId);
                const limit = task?.timeLimit || (activeSession.mode === 'pomodoro' ? 25 : (activeSession.mode === 'countdown' ? customMinutes : null));

                if (limit && activeSession.expectedEndTime) {
                    const remainingMs = new Date(activeSession.expectedEndTime).getTime() - Date.now();
                    if (remainingMs <= 0) {
                        // Timer expired while the user was away — auto-stop instead of resuming
                        // with a negative countdown showing "Time is Expanding!"
                        const expiredElapsedMs = new Date(activeSession.expectedEndTime).getTime() - new Date(activeSession.startTime).getTime();
                        setElapsedTime(Math.floor(expiredElapsedMs / 1000));
                        setTimeRemaining(0);
                        pendingAutoStop.current = Math.floor(expiredElapsedMs / 1000);
                        // Do NOT set isActive — the useEffect below will call handleStop after load
                    } else {
                        setTimeRemaining(Math.floor(remainingMs / 1000));
                        const elapsedMs = Date.now() - new Date(activeSession.startTime).getTime();
                        setElapsedTime(Math.floor(elapsedMs / 1000));
                        setIsActive(true);
                    }
                } else {
                    const elapsedMs = Date.now() - new Date(activeSession.startTime).getTime();
                    setElapsedTime(Math.floor(elapsedMs / 1000));
                    setIsActive(true);
                }
            }

            // Load reminder settings
            const reminders = await getFocusReminders();
            if (reminders) {
                setReminderSettings(reminders);
                setReminderEnabled(reminders.enabled);
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

                    if (mode !== 'stopwatch' || selectedTask?.timeLimit) {
                        setTimeRemaining(prev => {
                            const newRemaining = prev - secondsPassed;
                            if (newRemaining <= 0 && mode !== 'stopwatch') {
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

    // Auto-stop when the timer expired while the user was away from the page
    useEffect(() => {
        if (!loading && pendingAutoStop.current !== null) {
            const elapsed = pendingAutoStop.current;
            pendingAutoStop.current = null;
            handleStop(elapsed);
        }
    }, [loading]);

    // Mindfulness reminder timer
    useEffect(() => {
        if (!isActive || !reminderEnabled || !reminderSettings?.reminders?.length) {
            setActiveReminder(null);
            return;
        }

        const intervalMs = (reminderSettings.intervalMinutes || 15) * 60 * 1000;

        const check = setInterval(() => {
            const now = Date.now();
            if (now - lastReminderTime.current >= intervalMs) {
                const reminders = reminderSettings.reminders;
                const picked = reminders[Math.floor(Math.random() * reminders.length)];
                setActiveReminder(picked);
                lastReminderTime.current = now;
                // Auto-dismiss after 5 seconds
                setTimeout(() => setActiveReminder(null), 5000);
            }
        }, 5000);

        // Set initial time if not set
        if (lastReminderTime.current === 0) {
            lastReminderTime.current = Date.now();
        }

        return () => clearInterval(check);
    }, [isActive, reminderEnabled, reminderSettings]);

    const handleSaveReminders = async (updated: FocusReminders) => {
        setReminderSettings(updated);
        await saveFocusReminders(updated);
    };

    const addReminder = async () => {
        if (!newReminderText.trim()) return;
        const current = reminderSettings || { id: `fr-${Date.now()}`, reminders: [], intervalMinutes: 15, enabled: true };
        const updated = { ...current, reminders: [...current.reminders, newReminderText.trim()] };
        await handleSaveReminders(updated);
        setNewReminderText("");
    };

    const removeReminder = async (index: number) => {
        if (!reminderSettings) return;
        const updated = { ...reminderSettings, reminders: reminderSettings.reminders.filter((_, i) => i !== index) };
        await handleSaveReminders(updated);
    };

    const toggleReminders = async (enabled: boolean) => {
        setReminderEnabled(enabled);
        const current = reminderSettings || { id: `fr-${Date.now()}`, reminders: [], intervalMinutes: 15, enabled };
        const updated = { ...current, enabled };
        await handleSaveReminders(updated);
        if (!enabled) {
            setActiveReminder(null);
            lastReminderTime.current = 0;
        } else {
            lastReminderTime.current = Date.now();
        }
    };

    const handleModeChange = (newMode: FocusMode) => {
        if (isActive) return;
        setMode(newMode);
        if (newMode === 'pomodoro') setTimeRemaining(25 * 60);
        else if (newMode === 'countdown') setTimeRemaining(customMinutes * 60);
        else setTimeRemaining(0); // Stopwatch starts at 0 visually
        setElapsedTime(0);
        setDistractions([]);
    };

    const handlePreEmotionComplete = (checkIn: EmotionCheckInType) => {
        setPreEmotion(checkIn);
        setShowPreEmotion(false);

        // If high tension, show Start Assist breathing exercise
        if (checkIn.bodyTension >= 7) {
            setShowStartAssist(true);
            return;
        }

        // Continue to strategy or start
        proceedAfterEmotion();
    };

    const proceedAfterEmotion = (strategyOverride?: string) => {
        const strategy = strategyOverride || pendingStartRef.current?.strategy;
        // Check if strategy step is needed (for M, L, XL tasks)
        if (!strategy && selectedTask && (selectedTask.tShirtSize === 'M' || selectedTask.tShirtSize === 'L' || selectedTask.tShirtSize === 'XL')) {
            setIsStrategyModalOpen(true);
            return;
        }
        performStart(strategy);
    };

    const handleStart = async () => {
        if (!sessionStartTime) {
            // Show pre-task emotion check-in first
            setShowPreEmotion(true);
            return;
        } else {
            await updateActiveFocusSession('resume');
            setIsActive(true);
        }
    };

    const performStart = async (strategy?: string) => {
        setSessionStartTime(new Date());

        // Parkinson's Law: Use task time limit if available
        const limit = selectedTask?.timeLimit;
        const expectedDuration = limit || (mode === 'pomodoro' ? 25 : (mode === 'countdown' ? customMinutes : 120));

        if (limit) {
            setTimeRemaining(limit * 60);
        }

        const newSession = await startFocusSession({
            mode,
            expectedDuration,
            taskId: targetTaskId,
            strategy,
            preEmotion: preEmotion || undefined,
        });
        setActiveSessionId(newSession.id);
        setIsActive(true);
        if (strategy) {
            toast({ title: "Strategy set!", description: "Focus on your first step." });
        }
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
                deepWorkScore,
                postEmotion: postEmotion || undefined,
            });

            const isDeepWork = elapsedTime >= 45 * 60;
            const isSolid = elapsedTime >= 30 * 60;
            toast({ title: isDeepWork ? "Deep work session complete!" : isSolid ? "Solid focus session!" : "Session Saved!", description: "Great job focusing!" });
            celebrate({ reason: 'focus-complete', title: isDeepWork ? 'Deep work complete!' : 'Focus session complete!', intensity: isDeepWork ? 'big' : isSolid ? 'medium' : 'small' });

            // Gamification: evaluate focus-completed triggers
            if (userProgress) {
                const completedSessions = await getFocusSessions();
                const savedSession = completedSessions[0]; // most recent
                if (savedSession) {
                    const ideaJots = distractions.filter(d => d.includes('{category:idea}')).length;
                    // Poker Face: high/urgent task started within 5 min of session start
                    const taskForSession = tasks.find(t => t.id === targetTaskId);
                    const isHighPriority = taskForSession?.priority === 'urgent' || taskForSession?.priority === 'high';
                    const sessionAgeMinutes = sessionStartTime ? (Date.now() - sessionStartTime.getTime()) / 60000 : 999;
                    const startedQuickly = isHighPriority && sessionAgeMinutes <= (elapsedTime / 60 + 5);
                    import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
                        const tempProgress = JSON.parse(JSON.stringify(userProgress));
                        const updates = evaluateGamificationTriggers(
                            { type: 'focus-completed', session: savedSession, jotsLogged: ideaJots, startedQuickly, preEmotion: preEmotion ?? undefined },
                            tempProgress
                        );
                        if (updates.length > 0) {
                            await saveUserProgress(tempProgress);
                            await refreshProgress();
                            updates.forEach((u, idx) => {
                                setTimeout(() => {
                                    toast({ title: `🎁 ${u.message}`, description: u.detail });
                                }, idx * 1500);
                            });
                        }
                    });
                }
            }

            refreshGamification();

            // Re-fetch to update charts (later)
            const fetchedSessions = await getFocusSessions();
            setSessions(fetchedSessions || []);

            // Reset
            setIsModalOpen(false);
            setSessionStartTime(null);
            setActiveSessionId(null);
            setElapsedTime(0);
            setDistractions([]);
            setPreEmotion(null);
            setPostEmotion(null);
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
        <div className="h-full flex flex-col max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in pb-20 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-primary">Focus Mode</h1>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                        <DashboardEmotionTrends focusSessions={sessions} />
                    </div>

                    {/* Right Column: Timer & Notes */}
                    <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-4">
                        {/* Timer Card */}
                        <Card className={cn(
                            "flex flex-col items-center justify-center p-4 sm:p-6 border-border bg-card shadow-sm rounded-[2rem] relative overflow-hidden transition-all duration-500",
                            isActive && timeRemaining < 300 && timeRemaining > 0 && "border-red-500/50",
                            isActive && timeRemaining <= 0 && "border-red-500 bg-red-500/5"
                        )}>

                            {selectedTask?.timeLimit && (
                                <Badge variant="outline" className="absolute top-6 right-8 animate-pulse border-red-500/50 text-red-500 gap-1">
                                    <AlertCircle className="h-3 w-3" /> Parkinson's Limit: {selectedTask.timeLimit}m
                                </Badge>
                            )}

                            <Tabs value={mode} onValueChange={(v) => handleModeChange(v as FocusMode)} className="w-full max-w-md mb-12 relative z-10">
                                <TabsList className="grid w-full grid-cols-3 h-12 rounded-full bg-muted/30 p-1 border shadow-inner">
                                    <TabsTrigger value="pomodoro" disabled={isActive} className="rounded-full">Pomodoro</TabsTrigger>
                                    <TabsTrigger value="stopwatch" disabled={isActive} className="rounded-full">Stopwatch</TabsTrigger>
                                    <TabsTrigger value="countdown" disabled={isActive} className="rounded-full">Custom</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="relative mb-10 group">
                                <div className={cn(
                                    "text-[4rem] sm:text-[5rem] md:text-[6rem] font-black tracking-tighter tabular-nums text-primary leading-none transition-transform duration-300 relative z-10",
                                    isActive && "scale-105",
                                    isActive && timeRemaining < 60 && "text-red-500 animate-pulse",
                                    isActive && timeRemaining <= 0 && "text-red-600"
                                )}>
                                    {mode === 'stopwatch' && !selectedTask?.timeLimit ? formatTime(elapsedTime) : formatTime(timeRemaining)}
                                </div>
                                {isActive && timeRemaining <= 0 && (
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500 uppercase tracking-widest animate-bounce">
                                        Time is Expanding!
                                    </div>
                                )}
                            </div>

                            {mode === 'countdown' && !isActive && elapsedTime === 0 && (
                                <div className="flex items-center gap-3 mb-8 bg-muted/20 px-6 py-3 rounded-full border shadow-sm">
                                    <Label htmlFor="custom-mins" className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Target Mins:</Label>
                                    <Input
                                        id="custom-mins"
                                        type="number"
                                        min={0}
                                        max={120}
                                        value={customMinutes}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            setCustomMinutes(val);
                                            setTimeRemaining(val * 60);
                                        }}
                                        className="w-20 text-center font-bold text-lg h-9 border-0 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                                    />
                                </div>
                            )}

                            {selectedTask ? (
                                <div className="flex flex-col items-center gap-3 mb-10 w-full max-w-lg">
                                    <div className="flex items-center gap-2 bg-muted/50 px-5 py-2.5 rounded-2xl border border-border/50 text-sm font-medium text-foreground/80 text-center w-full justify-center shadow-sm">
                                        <span className="opacity-70">Focusing on:</span> <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">{selectedTask.title}</span>
                                        {selectedTask.priority === 'high' && <Flame className="h-4 w-4 text-orange-500 animate-pulse ml-1 shrink-0" />}
                                        {!isActive && (
                                            <button onClick={() => { setTargetTaskId(undefined); setShowTaskPicker(false); }} className="ml-1 opacity-50 hover:opacity-100 transition-opacity shrink-0">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    {selectedTask.endDate && new Date(selectedTask.endDate) < new Date() && (
                                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 px-3 py-1 font-semibold">
                                            Overdue task — Eat the Frog!
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full max-w-md mb-10 space-y-3">
                                    {!showTaskPicker ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowTaskPicker(true)}
                                                disabled={isActive}
                                                className="h-14 w-full rounded-2xl text-base bg-muted/20 border-border/50 shadow-inner hover:bg-muted/40 gap-2"
                                            >
                                                <Search className="h-4 w-4 opacity-50" />
                                                Pick a task to focus on...
                                            </Button>
                                            <span className="text-xs text-muted-foreground">or</span>
                                            <Input
                                                placeholder="Type a freeform goal"
                                                value={sessionGoal}
                                                onChange={(e) => setSessionGoal(e.target.value)}
                                                disabled={isActive}
                                                className="text-center bg-muted/10 border-border/30 h-10 rounded-xl text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                                                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Search tasks..."
                                                    value={taskSearch}
                                                    onChange={(e) => setTaskSearch(e.target.value)}
                                                    autoFocus
                                                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
                                                />
                                                <button onClick={() => { setShowTaskPicker(false); setTaskSearch(""); }} className="text-muted-foreground hover:text-foreground transition-colors">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {(() => {
                                                    const today = new Date();
                                                    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'abandoned' && !t.isHabit);
                                                    const search = taskSearch.toLowerCase().trim();
                                                    const filtered = search
                                                        ? activeTasks.filter(t => t.title.toLowerCase().includes(search))
                                                        : activeTasks;

                                                    // Categorize
                                                    const frogs = filtered.filter(t => t.isFrog);
                                                    const todayTasks = filtered.filter(t =>
                                                        !t.isFrog &&
                                                        ((t.doDate && isSameDay(parseISO(t.doDate), today)) ||
                                                         (t.endDate && isSameDay(parseISO(t.endDate), today)))
                                                    );
                                                    const urgent = filtered.filter(t =>
                                                        !t.isFrog &&
                                                        !todayTasks.includes(t) &&
                                                        (t.priority === 'urgent' || t.priority === 'high')
                                                    );
                                                    const rest = filtered.filter(t =>
                                                        !frogs.includes(t) && !todayTasks.includes(t) && !urgent.includes(t)
                                                    );

                                                    const renderSection = (label: string, icon: React.ReactNode, items: Task[]) => {
                                                        if (items.length === 0) return null;
                                                        return (
                                                            <div key={label}>
                                                                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                                                    {icon} {label}
                                                                </div>
                                                                {items.slice(0, 5).map(t => (
                                                                    <button
                                                                        key={t.id}
                                                                        onClick={() => {
                                                                            setTargetTaskId(t.id);
                                                                            setShowTaskPicker(false);
                                                                            setTaskSearch("");
                                                                        }}
                                                                        className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors flex items-center gap-3 text-sm"
                                                                    >
                                                                        <div className="flex-1 truncate">
                                                                            <span className="font-medium">{t.title}</span>
                                                                            {t.tShirtSize && (
                                                                                <span className="ml-2 text-[10px] text-muted-foreground opacity-60">{t.tShirtSize}</span>
                                                                            )}
                                                                        </div>
                                                                        {t.priority === 'urgent' && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">urgent</Badge>}
                                                                        {t.priority === 'high' && <Badge className="text-[9px] px-1.5 py-0 bg-orange-500/10 text-orange-400 border-orange-500/30">high</Badge>}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        );
                                                    };

                                                    const hasResults = frogs.length + todayTasks.length + urgent.length + rest.length > 0;

                                                    return hasResults ? (
                                                        <>
                                                            {renderSection("Frogs", <Zap className="h-3 w-3 text-emerald-500" />, frogs)}
                                                            {renderSection("Today", <Target className="h-3 w-3 text-blue-500" />, todayTasks)}
                                                            {renderSection("High Priority", <Flame className="h-3 w-3 text-orange-500" />, urgent)}
                                                            {renderSection("Other", <CheckCircle2 className="h-3 w-3 text-muted-foreground" />, rest)}
                                                        </>
                                                    ) : (
                                                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                            No tasks found
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
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
                                {/* Category quick-tags */}
                                <div className="flex gap-1.5 mb-3">
                                    {([['random', '💭'], ['todo', '✅'], ['idea', '💡'], ['worry', '😟']] as const).map(([cat, icon]) => (
                                        <button
                                            key={cat}
                                            onClick={() => setJotCategory(cat)}
                                            disabled={!isActive}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                                                jotCategory === cat
                                                    ? "bg-primary/15 border-primary/40 text-primary"
                                                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {icon} {cat}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    placeholder={jotCategory === 'worry' ? "What's worrying you?" : jotCategory === 'todo' ? "What needs doing?" : jotCategory === 'idea' ? "What's the idea?" : "What's on your mind?"}
                                    value={currentDistraction}
                                    onChange={e => setCurrentDistraction(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && currentDistraction.trim()) {
                                            let text = currentDistraction.trim();
                                            let cat = jotCategory;

                                            // Detect slash commands
                                            if (text.startsWith('/idea ')) {
                                                cat = 'idea';
                                                text = text.replace('/idea ', '');
                                            } else if (text.startsWith('/todo ')) {
                                                cat = 'todo';
                                                text = text.replace('/todo ', '');
                                            } else if (text.startsWith('/worry ')) {
                                                cat = 'worry';
                                                text = text.replace('/worry ', '');
                                            } else if (text.startsWith('/random ')) {
                                                cat = 'random';
                                                text = text.replace('/random ', '');
                                            } else if (text.startsWith('/note ')) {
                                                cat = 'random';
                                                text = text.replace('/note ', '');
                                            }

                                            const timeStamp = mode === 'stopwatch' ? formatTime(elapsedTime) : formatTime(timeRemaining);
                                            const jotStr = buildJotString(text, cat, timeStamp);
                                            const newDistractions = [...distractions, jotStr];
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
                                    {distractions.map((d, i) => {
                                        // Extract category for color-coding
                                        const catMatch = d.match(/\{category:(\w+)\}/);
                                        const cat = catMatch?.[1];
                                        const catColors: Record<string, string> = {
                                            worry: 'border-l-red-500/50',
                                            todo: 'border-l-blue-500/50',
                                            idea: 'border-l-yellow-500/50',
                                            random: 'border-l-slate-500/50',
                                        };
                                        const catIcons: Record<string, string> = { worry: '😟', todo: '✅', idea: '💡', random: '💭' };
                                        return (
                                            <div key={i} className={cn("text-sm bg-card border border-border p-3 rounded-xl shadow-sm animate-fade-in", cat ? catColors[cat] : '')}>
                                                {cat && <span className="mr-1.5">{catIcons[cat]}</span>}
                                                {stripAllMetadata(d)}
                                            </div>
                                        );
                                    })}
                                    {distractions.length === 0 && isActive && (
                                        <div className="flex flex-col items-center justify-center p-6 text-center bg-muted/20 border border-border/30 rounded-xl border-dashed">
                                            <p className="text-sm text-foreground/80 font-medium flex items-center gap-2 mb-1"><Flame className="h-5 w-5 text-orange-500 animate-pulse" /> Keep the streak zero!</p>
                                            <p className="text-xs text-muted-foreground">Maintain absolute focus for a Deep Work bonus.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mindfulness Reminders */}
                        <Card className="border-border/50 bg-muted/5 rounded-3xl overflow-hidden shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-4 w-4 text-violet-400" />
                                        <div>
                                            <p className="text-sm font-semibold">Mindfulness Reminders</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Periodic nudges during focus sessions
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowReminderSettings(!showReminderSettings)}
                                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleReminders(!reminderEnabled)}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                                                reminderEnabled ? "bg-violet-500" : "bg-muted-foreground/30"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                    reminderEnabled ? "translate-x-5" : "translate-x-0"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {showReminderSettings && (
                                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Interval setting */}
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="text-muted-foreground text-xs">Remind every</span>
                                            <select
                                                value={reminderSettings?.intervalMinutes || 15}
                                                onChange={async (e) => {
                                                    const interval = parseInt(e.target.value);
                                                    const current = reminderSettings || { id: `fr-${Date.now()}`, reminders: [], intervalMinutes: 15, enabled: reminderEnabled };
                                                    await handleSaveReminders({ ...current, intervalMinutes: interval });
                                                }}
                                                className="bg-background border border-border/50 rounded-lg px-2 py-1 text-xs"
                                            >
                                                <option value={10}>10 min</option>
                                                <option value={15}>15 min</option>
                                                <option value={20}>20 min</option>
                                                <option value={30}>30 min</option>
                                            </select>
                                        </div>

                                        {/* Saved reminders */}
                                        <div className="space-y-1.5">
                                            {reminderSettings?.reminders?.map((r, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 text-sm group">
                                                    <span className="flex-1">{r}</span>
                                                    <button
                                                        onClick={() => removeReminder(i)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!reminderSettings?.reminders || reminderSettings.reminders.length === 0) && (
                                                <p className="text-xs text-muted-foreground/60 text-center py-2">No reminders yet. Add one below.</p>
                                            )}
                                        </div>

                                        {/* Add new reminder */}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g., What are your hands doing?"
                                                value={newReminderText}
                                                onChange={(e) => setNewReminderText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') addReminder();
                                                }}
                                                className="h-9 text-sm bg-background"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={addReminder}
                                                disabled={!newReminderText.trim()}
                                                className="h-9 px-3 shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Mindfulness Reminder Toast */}
            {activeReminder && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-card border border-border rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3 max-w-md">
                        <Bell className="h-5 w-5 text-violet-400 shrink-0 animate-pulse" />
                        <p className="text-sm font-medium">{activeReminder}</p>
                        <button onClick={() => setActiveReminder(null)} className="text-muted-foreground hover:text-foreground ml-2 shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Pre-Task Emotion Check-In */}
            <EmotionCheckInModal
                open={showPreEmotion}
                onComplete={handlePreEmotionComplete}
                onSkip={() => { setShowPreEmotion(false); proceedAfterEmotion(); }}
                title="How are you feeling right now?"
                description="Naming your emotion reduces its intensity by ~30%. Be honest — no wrong answers."
            />

            {/* Start Assist (breathing + 2-min commit) — triggered by high tension */}
            <StartAssist
                open={showStartAssist}
                onComplete={() => { setShowStartAssist(false); proceedAfterEmotion(); }}
                onSkip={() => { setShowStartAssist(false); proceedAfterEmotion(); }}
            />

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

                        {/* Post-session emotion check-in */}
                        <div className="space-y-3">
                            <Label>How do you feel now?</Label>
                            <EmotionCheckInInline onComplete={(checkIn) => setPostEmotion(checkIn)} />
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

            {/* Strategy Step Modal */}
            <Dialog open={isStrategyModalOpen} onOpenChange={setIsStrategyModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-6 w-6" />
                            Strategy Step
                        </DialogTitle>
                        <DialogDescription>
                            This is a {selectedTask?.tShirtSize} task. Thinking before acting increases success. 
                            What is your one-sentence strategy for this session?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            placeholder="e.g., Skeleton out the main API route first."
                            value={strategyInput}
                            onChange={(e) => setStrategyInput(e.target.value)}
                            className="h-12 text-lg"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && strategyInput.trim()) {
                                    setIsStrategyModalOpen(false);
                                    performStart(strategyInput);
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="default"
                            className="w-full h-12 text-lg font-bold"
                            disabled={!strategyInput.trim()}
                            onClick={() => {
                                setIsStrategyModalOpen(false);
                                performStart(strategyInput);
                            }}
                        >
                            Start with Strategy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
