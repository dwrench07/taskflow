"use client";

import { Task } from "@/lib/types";
import { Badge } from "./ui/badge";
import { CheckCircle2, Circle, Flame, TrendingUp } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";

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
    <div className="divide-y divide-border/50">
      {habits.map(habit => {
        const isDoneToday = habit.completionHistory?.some(d => isSameDay(parseISO(d), today));
        const streak = habit.streak || 0;

        return (
          <div key={habit.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm">{habit.title}</span>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {streak} day streak
                </span>
                {habit.habitFrequency && (
                    <>
                        <span>•</span>
                        <span>{habit.habitFrequency}</span>
                    </>
                )}
              </div>
            </div>
            {isDoneToday ? (
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground/30 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
