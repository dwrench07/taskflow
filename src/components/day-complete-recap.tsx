"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ListTodo, Repeat, Frown, Timer, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

interface DayCompleteRecapProps {
  open: boolean;
  onClose: () => void;
  tasksCompleted: number;
  tasksTotal: number;
  choresCompleted: number;
  choresTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  frogsDone: number;
  focusMinutes: number;
  streaksActive: number;
  xpEarned: number;
  level: number;
}

export function DayCompleteRecap({
  open,
  onClose,
  tasksCompleted,
  tasksTotal,
  choresCompleted,
  choresTotal,
  habitsCompleted,
  habitsTotal,
  frogsDone,
  focusMinutes,
  streaksActive,
  xpEarned,
  level,
}: DayCompleteRecapProps) {
  const stats: StatItem[] = [
    {
      icon: <ListTodo className="h-4 w-4" />,
      value: `${tasksCompleted}/${tasksTotal}`,
      label: "Tasks",
      color: "text-blue-400",
    },
    {
      icon: <Repeat className="h-4 w-4" />,
      value: `${choresCompleted}/${choresTotal}`,
      label: "Chores",
      color: "text-cyan-400",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      value: `${habitsCompleted}/${habitsTotal}`,
      label: "Habits",
      color: "text-green-400",
    },
  ];

  // Conditional stats — only show if there's something to highlight
  if (frogsDone > 0) {
    stats.push({
      icon: <Frown className="h-4 w-4" />,
      value: `${frogsDone}`,
      label: frogsDone === 1 ? "Frog Eaten" : "Frogs Eaten",
      color: "text-emerald-400",
    });
  }

  if (focusMinutes > 0) {
    const hours = Math.floor(focusMinutes / 60);
    const mins = focusMinutes % 60;
    stats.push({
      icon: <Timer className="h-4 w-4" />,
      value: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      label: "Focused",
      color: "text-amber-400",
    });
  }

  if (streaksActive > 0) {
    stats.push({
      icon: <Flame className="h-4 w-4" />,
      value: `${streaksActive}`,
      label: streaksActive === 1 ? "Streak" : "Streaks",
      color: "text-orange-400",
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm [&>button:last-child]:hidden overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/15 to-transparent -z-10" />

        <div className="flex flex-col items-center text-center pt-4 space-y-5">
          {/* Icon */}
          <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Day Complete</h2>
            <p className="text-sm text-muted-foreground">Everything done. Here's what you accomplished.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "p-3 bg-muted/20 rounded-xl text-center",
                  "animate-fade-in opacity-0"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn("mx-auto mb-1", stat.color)}>
                  {stat.icon}
                </div>
                <p className="text-lg font-black">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* XP & Level */}
          {xpEarned > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl w-full animate-fade-in opacity-0"
                 style={{ animationDelay: `${stats.length * 100}ms` }}>
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <div className="flex items-center justify-between w-full text-sm">
                <span className="font-bold text-primary">+{xpEarned} XP</span>
                <span className="text-muted-foreground text-xs">Level {level}</span>
              </div>
            </div>
          )}

          {/* Dismiss */}
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
