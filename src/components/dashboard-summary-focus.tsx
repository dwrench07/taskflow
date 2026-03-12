"use client";

import { FocusSession } from "@/lib/types";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Brain, Zap, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="divide-y divide-border/50">
      <div className="p-4 grid grid-cols-2 gap-4 bg-muted/20">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Time</span>
            <span className="text-lg font-bold">{totalMinutes}m</span>
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Distractions</span>
            <span className="text-lg font-bold">{totalDistractions}</span>
        </div>
      </div>
      {todaySessions.map(session => (
        <div key={session.id} className="p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{session.taskTitle || "General Focus"}</span>
            <span className="text-[11px] text-muted-foreground">
                {format(parseISO(session.startTime), "h:mm a")} • {session.duration}m
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">
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

import { Badge } from "./ui/badge";
