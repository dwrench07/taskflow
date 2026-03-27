"use client";

import { FocusSession } from "@/lib/types";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Brain, Zap, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function FocusDetail({ sessions }: { sessions: FocusSession[] }) {
  const todaySessions = sessions.filter(s => {
      const date = parseISO(s.startTime);
      return isSameDay(date, new Date());
  });

  const totalMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const totalDistractions = todaySessions.reduce((acc, s) => acc + (s.distractions?.length || 0), 0);

  if (todaySessions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No focus sessions recorded today</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      <div className="p-4 grid grid-cols-2 gap-4 bg-white/5">
        <div className="flex flex-col bg-background/40 p-3 rounded-xl border border-white/5">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Time</span>
            <div className="flex items-end gap-1">
                <span className="text-2xl font-black italic tracking-tighter text-primary">{totalMinutes}</span>
                <span className="text-[10px] text-muted-foreground font-bold pb-1 underline decoration-primary/30">MINS</span>
            </div>
        </div>
        <div className="flex flex-col bg-background/40 p-3 rounded-xl border border-white/5">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Distractions</span>
            <div className="flex items-end gap-1">
                <span className="text-2xl font-black italic tracking-tighter text-cyan-400">{totalDistractions}</span>
                <span className="text-[10px] text-muted-foreground font-bold pb-1 underline decoration-cyan-500/30">INCIDENTS</span>
            </div>
        </div>
      </div>
      {todaySessions.map(session => (
        <div key={session.id} className="p-4 flex items-center justify-between group/session hover:bg-white/5 transition-colors">
          <div className="flex flex-col min-w-0 flex-1 mr-4">
            {session.taskId ? (
              <Link href={`/focus?taskId=${session.taskId}`} className="text-sm font-bold truncate group-hover/session:text-primary transition-colors hover:underline">{session.taskTitle || "General Focus"}</Link>
            ) : (
              <span className="text-sm font-bold truncate group-hover/session:text-primary transition-colors">{session.taskTitle || "General Focus"}</span>
            )}
            <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase">
                    {format(parseISO(session.startTime), "h:mm a")} • {session.duration}m
                </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-[9px] px-2 py-0 h-4 font-black uppercase tracking-tighter bg-primary/10 text-primary border-primary/20">
            {session.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

