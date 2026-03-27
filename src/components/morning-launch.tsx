"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sunrise, Play, CheckCircle2, Flame, ChevronRight } from "lucide-react";
import { isSameDay, parseISO, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { EnergyIndicator } from "@/components/energy-check-in";
import { getTodayEnergy, getEnergyMatch } from "@/lib/energy";
import { calculateStreak } from "@/lib/habits";
import Link from "next/link";

interface MorningLaunchProps {
  allTasks: Task[];
  onDismiss: () => void;
}

export function MorningLaunch({ allTasks, onDismiss }: MorningLaunchProps) {
  const today = startOfToday();
  const currentEnergy = getTodayEnergy();

  const { topTasks, habitsDue, warmupTask } = useMemo(() => {
    // Get today's tasks (scheduled for today via doDate or endDate)
    const todayTasks = allTasks.filter(t =>
      !t.isHabit && t.status !== 'done' && t.status !== 'abandoned' &&
      ((t.doDate && isSameDay(parseISO(t.doDate), today)) ||
       (t.endDate && isSameDay(parseISO(t.endDate), today)))
    );

    // Sort: low energy first (warmup), then by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...todayTasks].sort((a, b) => {
      // If we have energy data, put matching tasks first
      if (currentEnergy) {
        const aMatch = getEnergyMatch(a.energyLevel, currentEnergy);
        const bMatch = getEnergyMatch(b.energyLevel, currentEnergy);
        if (aMatch !== bMatch) {
          const matchOrder = { match: 0, 'slight-mismatch': 1, mismatch: 2 };
          return matchOrder[aMatch] - matchOrder[bMatch];
        }
      }
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    // Find a warmup task (low energy, small size)
    const warmup = sorted.find(t =>
      t.energyLevel === 'low' || t.tShirtSize === 'S'
    ) || sorted[0];

    // Habits due today
    const habits = allTasks.filter(t =>
      t.isHabit && t.status !== 'abandoned' &&
      !t.completionHistory?.some(d => isSameDay(parseISO(d), today))
    );

    return {
      topTasks: sorted.slice(0, 3),
      habitsDue: habits.slice(0, 5),
      warmupTask: warmup,
    };
  }, [allTasks, today, currentEnergy]);

  const totalItems = topTasks.length + habitsDue.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6">
      {/* Morning header */}
      <div className="text-center space-y-3 py-4">
        <div className="flex items-center justify-center gap-3">
          <Sunrise className="h-10 w-10 text-amber-400" />
          <h1 className="text-3xl font-black tracking-tight">Good Morning</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {totalItems === 0
            ? "Nothing scheduled for today. Enjoy the calm."
            : `${topTasks.length} task${topTasks.length !== 1 ? 's' : ''} and ${habitsDue.length} habit${habitsDue.length !== 1 ? 's' : ''} for today. Start simple.`
          }
        </p>
        <EnergyIndicator />
      </div>

      {/* Warmup task — the first thing to do */}
      {warmupTask && (
        <Card className="border-2 border-amber-500/20 bg-amber-500/5 shadow-lg shadow-amber-500/5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold tracking-wider">
                Start Here
              </Badge>
              {warmupTask.tShirtSize && (
                <Badge variant="outline" className="text-[10px]">Size: {warmupTask.tShirtSize}</Badge>
              )}
            </div>
            <h2 className="text-xl font-bold">{warmupTask.title}</h2>
            {warmupTask.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{warmupTask.description}</p>
            )}
            <Link href={`/focus?taskId=${warmupTask.id}`}>
              <Button className="w-full h-12 text-base font-bold gap-2 mt-2">
                <Play className="h-4 w-4 fill-current" />
                Start Focus Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Other tasks for today */}
      {topTasks.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Also Today</h3>
          {topTasks.filter(t => t.id !== warmupTask?.id).map(task => {
            const energyMatch = currentEnergy ? getEnergyMatch(task.energyLevel, currentEnergy) : null;
            return (
              <Card key={task.id} className={cn(
                "transition-all",
                energyMatch === 'match' && "border-green-500/20",
                energyMatch === 'mismatch' && "border-red-500/20 opacity-60"
              )}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{task.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
                      {task.energyLevel && (
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          energyMatch === 'match' && "text-green-400 border-green-500/30",
                          energyMatch === 'slight-mismatch' && "text-yellow-400 border-yellow-500/30",
                          energyMatch === 'mismatch' && "text-red-400 border-red-500/30"
                        )}>
                          {task.energyLevel} energy
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/focus?taskId=${task.id}`}>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Habits due */}
      {habitsDue.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Habits Due</h3>
          <Card>
            <CardContent className="p-4 space-y-2">
              {habitsDue.map(habit => {
                const streak = calculateStreak(habit);
                return (
                  <div key={habit.id} className="flex items-center gap-3 py-1">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-sm flex-1">{habit.title}</span>
                    {streak > 0 && (
                      <span className="text-xs text-orange-400 flex items-center gap-1">
                        <Flame className="h-3 w-3" /> {streak}d
                      </span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Switch to full dashboard */}
      <div className="text-center pt-2">
        <Button variant="ghost" onClick={onDismiss} className="text-xs text-muted-foreground gap-1">
          Switch to full dashboard <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
