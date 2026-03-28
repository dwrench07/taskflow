"use client";

import { useState, useEffect, useMemo } from "react";
import { getFocusSessions, getAllTasks, updateFocusSession, addTask, addBackOfMindItem } from "@/lib/data";
import { FocusSession, Task, JotCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    StickyNote, Loader2, Calendar, Search, ListTodo, Lightbulb,
    AlertTriangle, MessageCircle, Filter, ArrowRightLeft, ShieldCheck,
    ShieldAlert, HelpCircle, X, Brain
} from "lucide-react";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { parseJotString, parseAllJots, calculateFearVsReality, type ParsedJot } from "@/lib/jots";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_CONFIG: Record<JotCategory, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    worry: { label: 'Worry', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
    todo: { label: 'Todo', icon: <ListTodo className="h-3.5 w-3.5" />, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
    idea: { label: 'Idea', icon: <Lightbulb className="h-3.5 w-3.5" />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
    random: { label: 'Random', icon: <MessageCircle className="h-3.5 w-3.5" />, color: 'text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/30' },
    untagged: { label: 'Untagged', icon: <StickyNote className="h-3.5 w-3.5" />, color: 'text-muted-foreground', bgColor: 'bg-muted/30 border-border/50' },
};

export default function JotsPage() {
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<JotCategory | 'all'>('all');
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [fetchedSessions, fetchedTasks] = await Promise.all([
                getFocusSessions(),
                getAllTasks(),
            ]);

            const sessionsWithJots = (fetchedSessions || []).filter(s => s.distractions && s.distractions.length > 0);
            sessionsWithJots.sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime());

            setSessions(sessionsWithJots);
            setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const taskTitleMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const t of tasks) map[t.id] = t.title;
        return map;
    }, [tasks]);

    const allJots = useMemo(() => parseAllJots(sessions, taskTitleMap), [sessions, taskTitleMap]);

    const filteredJots = useMemo(() => {
        let jots = allJots;
        if (categoryFilter !== 'all') {
            jots = jots.filter(j => j.category === categoryFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            jots = jots.filter(j => j.text.toLowerCase().includes(q));
        }
        return jots;
    }, [allJots, categoryFilter, searchQuery]);

    const fearStats = useMemo(() => calculateFearVsReality(allJots), [allJots]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allJots.length };
        for (const j of allJots) {
            counts[j.category] = (counts[j.category] || 0) + 1;
        }
        return counts;
    }, [allJots]);

    const handleToggleJot = async (sessionId: string, jotText: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const jotIndex = session.distractions.findIndex(d => d.includes(jotText));
        if (jotIndex === -1) return;

        const newDistractions = [...session.distractions];
        const currentJot = newDistractions[jotIndex];

        if (currentJot.startsWith('[ ]')) {
            newDistractions[jotIndex] = currentJot.replace('[ ]', '[x]');
        } else if (currentJot.startsWith('[x]')) {
            newDistractions[jotIndex] = currentJot.replace('[x]', '[ ]');
        }

        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, distractions: newDistractions } : s));

        try {
            await updateFocusSession(sessionId, { distractions: newDistractions });
        } catch {
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, distractions: session.distractions } : s));
        }
    };

    const handleMoveToDeepStore = async (jot: ParsedJot) => {
        try {
            // Map JotCategory to BackOfMindCategory
            const categoryMap: Record<JotCategory, string> = {
                worry: 'worry',
                idea: 'idea',
                todo: 'task-idea',
                random: 'other',
                untagged: 'other'
            };

            await addBackOfMindItem({
                content: jot.text,
                category: categoryMap[jot.category],
                relevanceScore: 5, // Default relevance
            });

            // Mark the jot as done
            await handleToggleJot(jot.sessionId, jot.text);

            toast({ title: "Promoted to Deep Store!", description: `"${jot.text}" is now in your Back of Mind.` });
        } catch {
            toast({ variant: "destructive", title: "Failed to promote to Deep Store" });
        }
    };

    const handleConvertToTask = async (jot: ParsedJot) => {
        try {
            await addTask({
                title: jot.text,
                description: `Converted from jot captured during "${jot.taskTitle || 'focus session'}" on ${format(parseISO(jot.sessionDate), 'MMM d, yyyy')}`,
                priority: 'medium',
                status: 'todo',
                subtasks: [],
                notes: [],
                doDate: new Date().toISOString(),
            });

            // Mark the jot as done
            await handleToggleJot(jot.sessionId, jot.text);

            toast({ title: "Task created!", description: `"${jot.text}" added to your tasks.` });
        } catch {
            toast({ variant: "destructive", title: "Failed to create task" });
        }
    };

    // Group filtered jots by session date
    const groupedJots = useMemo(() => {
        const groups: { date: string; jots: ParsedJot[] }[] = [];
        const dateMap = new Map<string, ParsedJot[]>();

        for (const jot of filteredJots) {
            const dateKey = format(parseISO(jot.sessionDate), 'yyyy-MM-dd');
            if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
            dateMap.get(dateKey)!.push(jot);
        }

        for (const [date, jots] of dateMap) {
            groups.push({ date, jots });
        }

        return groups.sort((a, b) => b.date.localeCompare(a.date));
    }, [filteredJots]);

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 py-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Jots & Notes</h1>
                <p className="text-muted-foreground">Thoughts captured during focus sessions, organized and actionable.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : allJots.length === 0 ? (
                <Card className="border-dashed bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                        <StickyNote className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold">No Jots Found</h3>
                        <p className="text-muted-foreground max-w-md mt-2">
                            Start a focus session and jot down thoughts to see them here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Fear vs Reality card (only show if there are worry jots) */}
                    {fearStats.totalWorries > 0 && (
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        {fearStats.accuracyRate >= 70 ? (
                                            <ShieldCheck className="h-6 w-6 text-green-400" />
                                        ) : fearStats.resolved > 0 ? (
                                            <ShieldAlert className="h-6 w-6 text-yellow-400" />
                                        ) : (
                                            <HelpCircle className="h-6 w-6 text-red-400" />
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h3 className="font-bold text-sm">Fear vs Reality</h3>
                                        <p className="text-xs text-muted-foreground">
                                            You&apos;ve had <span className="text-foreground font-semibold">{fearStats.totalWorries}</span> worried thoughts.
                                            {fearStats.resolved > 0 ? (
                                                <> Of the {fearStats.resolved} you&apos;ve followed up on, <span className="text-green-400 font-semibold">{fearStats.didntHappen} never happened</span> ({fearStats.accuracyRate}%).</>
                                            ) : (
                                                <> Follow up on them to build your Fear vs Reality score.</>
                                            )}
                                        </p>
                                        {fearStats.resolved > 0 && (
                                            <div className="flex gap-3 mt-2 text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-green-400">Didn&apos;t happen: {fearStats.didntHappen}</span>
                                                <span className="text-yellow-400">Partially: {fearStats.partially}</span>
                                                <span className="text-red-400">Happened: {fearStats.happened}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search jots..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-10"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            <button
                                onClick={() => setCategoryFilter('all')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                    categoryFilter === 'all'
                                        ? "bg-primary/15 border-primary/40 text-primary"
                                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <Filter className="h-3 w-3 inline mr-1" />
                                All ({categoryCounts.all || 0})
                            </button>
                            {(['worry', 'todo', 'idea', 'random', 'untagged'] as JotCategory[]).map(cat => {
                                const config = CATEGORY_CONFIG[cat];
                                const count = categoryCounts[cat] || 0;
                                if (count === 0) return null;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                            categoryFilter === cat
                                                ? `${config.bgColor} ${config.color}`
                                                : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {config.icon}
                                        <span className="ml-1">{config.label} ({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="text-xs text-muted-foreground">
                        Showing {filteredJots.length} of {allJots.length} jots
                    </div>

                    {/* Jot list grouped by date */}
                    {groupedJots.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No jots match your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedJots.map(group => (
                                <div key={group.date}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {format(parseISO(group.date), 'EEEE, MMM d, yyyy')}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px]">{group.jots.length}</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {group.jots.map((jot, i) => {
                                            const config = CATEGORY_CONFIG[jot.category] || CATEGORY_CONFIG.untagged;
                                            return (
                                                <div
                                                    key={`${jot.sessionId}-${i}`}
                                                    className={cn(
                                                        "flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group",
                                                        config.bgColor,
                                                        jot.isDone && "opacity-50"
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={jot.isDone}
                                                        onCheckedChange={() => handleToggleJot(jot.sessionId, jot.text)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-start gap-2">
                                                            <span className={cn(
                                                                "text-sm break-words flex-1",
                                                                jot.isDone && "line-through text-muted-foreground"
                                                            )}>
                                                                {jot.text}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className={cn("text-[10px] gap-1", config.color)}>
                                                                {config.icon}
                                                                {config.label}
                                                            </Badge>
                                                            {jot.timestamp && (
                                                                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                                    {jot.timestamp}
                                                                </span>
                                                            )}
                                                            {jot.taskTitle && (
                                                                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                                    {jot.taskTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!jot.isDone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-[10px] text-violet-400 hover:text-violet-300"
                                                                onClick={() => handleMoveToDeepStore(jot)}
                                                                title="Move to Deep Store"
                                                            >
                                                                <Brain className="h-3 w-3 mr-1" />
                                                                Brain
                                                            </Button>
                                                        )}
                                                        {jot.category === 'todo' && !jot.isDone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-[10px] text-blue-400 hover:text-blue-300"
                                                                onClick={() => handleConvertToTask(jot)}
                                                                title="Convert to task"
                                                            >
                                                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                                                Task
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
