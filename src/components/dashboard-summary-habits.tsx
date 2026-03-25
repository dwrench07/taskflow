"use client";

import { Task } from "@/lib/types";
import { Badge } from "./ui/badge";
import { CheckCircle2, Circle, Flame, TrendingUp, Clock } from "lucide-react";
import { isSameDay, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateStreak } from "@/lib/habits";

export function HabitDetail({ tasks }: { tasks: Task[] }) {
  const habits = tasks.filter(t => t.isHabit);
  const today = new Date();

  if (habits.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Circle className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No habits established yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {habits.map(habit => {
        const isDoneToday = habit.completionHistory?.some(d => isSameDay(parseISO(d), today));
        const streak = calculateStreak(habit);
        const lastCompletion = habit.completionHistory && habit.completionHistory.length > 0 
            ? parseISO(habit.completionHistory[0]) 
            : null;

        return (
          <div key={habit.id} className="p-4 flex items-center justify-between gap-4 group/habit hover:bg-white/5 transition-colors">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("font-bold text-sm truncate", isDoneToday && "text-primary")}>{habit.title}</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 uppercase tracking-tighter opacity-50">
                    {habit.habitFrequency || "daily"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">
                    <Flame className="w-2.5 h-2.5" />
                    {streak}D STREAK
                </span>
                <span className="text-muted-foreground/60 flex items-center gap-1 uppercase tracking-widest">
                    <Clock className="w-2.5 h-2.5" />
                    {lastCompletion ? `Last: ${format(lastCompletion, "MMM d")}` : "Never"}
                </span>
              </div>
            </div>
            
            <div className="shrink-0">
                {isDoneToday ? (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/habit:border-white/20 transition-all">
                    <Circle className="w-5 h-5 text-muted-foreground/20" />
                </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
