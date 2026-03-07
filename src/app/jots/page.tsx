"use client";

import { useState, useEffect } from "react";
import { getFocusSessions, getAllTasks } from "@/lib/data";
import { FocusSession, Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Loader2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function JotsPage() {
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const fetchedSessions = await getFocusSessions();
            const fetchedTasks = await getAllTasks();

            // Filter only sessions that have distractions/jots
            const sessionsWithJots = (fetchedSessions || []).filter(s => s.distractions && s.distractions.length > 0);

            // Sort by most recent
            sessionsWithJots.sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime());

            setSessions(sessionsWithJots);
            setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getTaskTitle = (taskId?: string) => {
        if (!taskId) return "General Focus Session";
        const task = tasks.find(t => t.id === taskId);
        return task?.title || "Unknown Task";
    }

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jots & Notes</h1>
                    <p className="text-muted-foreground">Review thoughts and distractions captured during your deep work sessions.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : sessions.length === 0 ? (
                <Card className="border-dashed bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                        <StickyNote className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold">No Jots Found</h3>
                        <p className="text-muted-foreground max-w-md mt-2">
                            You haven't recorded any notes or distractions during your focus sessions yet. Head over to the Focus timer to start capturing them!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {sessions.map((session) => (
                        <Card key={session.id} className="break-inside-avoid hover:shadow-md transition-shadow border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader className="pb-3 border-b bg-muted/10">
                                <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="font-medium text-xs">
                                        {format(parseISO(session.startTime), "MMM d, yyyy")}
                                    </Badge>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(parseISO(session.startTime), "h:mm a")}
                                    </div>
                                </div>
                                <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 mt-2">
                                    {getTaskTitle(session.taskId)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 pb-2 px-1">
                                <ul className="space-y-2">
                                    {session.distractions.map((jot, i) => {
                                        // The jot is stored as "[MM:SS] text", let's make it look nicer
                                        const match = jot.match(/^\[(\d{2}:\d{2})\]\s*(.*)$/);
                                        if (match) {
                                            return (
                                                <li key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors">
                                                    <span className="text-xs font-mono text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded shrink-0 self-start mt-0.5">
                                                        {match[1]}
                                                    </span>
                                                    <span className="text-sm text-foreground/90">{match[2]}</span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={i} className="text-sm px-3 py-2 rounded-md hover:bg-muted/50 transition-colors">
                                                {jot}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
