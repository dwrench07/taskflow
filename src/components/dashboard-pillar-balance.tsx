"use client";

import { useMemo, useState, useEffect } from "react";
import { Task, Pillar, FocusSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAllPillars, getAllGoals } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";
import type { Goal } from "@/lib/types";

interface PillarBalanceProps {
  allTasks: Task[];
  focusSessions: FocusSession[];
}

export function DashboardPillarBalance({ allTasks, focusSessions }: PillarBalanceProps) {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    Promise.all([getAllPillars(), getAllGoals()]).then(([p, g]) => {
      setPillars(p || []);
      setGoals(g || []);
    });
  }, []);

  const analysis = useMemo(() => {
    if (pillars.length === 0) return null;

    // Map goals to pillars, then tasks to goals to pillars
    const goalPillarMap: Record<string, string> = {};
    goals.forEach(g => {
      if (g.pillarId) goalPillarMap[g.id] = g.pillarId;
    });

    const pillarStats: Record<string, { tasks: number; done: number; focusMinutes: number }> = {};
    pillars.forEach(p => {
      pillarStats[p.id] = { tasks: 0, done: 0, focusMinutes: 0 };
    });

    // Count tasks per pillar (via goalId → pillarId)
    allTasks.filter(t => !t.isHabit).forEach(t => {
      if (t.goalId && goalPillarMap[t.goalId]) {
        const pillarId = goalPillarMap[t.goalId];
        if (pillarStats[pillarId]) {
          pillarStats[pillarId].tasks++;
          if (t.status === 'done') pillarStats[pillarId].done++;
        }
      }
    });

    // Count focus minutes per pillar
    focusSessions.forEach(s => {
      if (s.taskId) {
        const task = allTasks.find(t => t.id === s.taskId);
        if (task?.goalId && goalPillarMap[task.goalId]) {
          const pillarId = goalPillarMap[task.goalId];
          if (pillarStats[pillarId]) {
            pillarStats[pillarId].focusMinutes += s.duration;
          }
        }
      }
    });

    const pillarData = pillars.map(p => ({
      id: p.id,
      title: p.title,
      color: p.color || 'hsl(var(--primary))',
      tasks: pillarStats[p.id]?.tasks || 0,
      done: pillarStats[p.id]?.done || 0,
      focusHours: Math.round((pillarStats[p.id]?.focusMinutes || 0) / 60 * 10) / 10,
    }));

    const maxTasks = Math.max(...pillarData.map(p => p.tasks), 1);
    const totalTasks = pillarData.reduce((s, p) => s + p.tasks, 0);
    const hasMeaningfulData = totalTasks > 0;

    return { pillarData, maxTasks, totalTasks, hasMeaningfulData };
  }, [pillars, goals, allTasks, focusSessions]);

  if (!analysis || pillars.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-500" />
            Pillar Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Create Life Pillars and link goals to them to see your effort balance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-500" />
          Pillar Balance
        </CardTitle>
        {analysis.hasMeaningfulData && (
          <CardDescription className="text-[10px]">
            {analysis.totalTasks} tasks across {pillars.length} life pillars
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis.hasMeaningfulData ? (
          <>
            {/* Horizontal bar chart */}
            <div className="space-y-2">
              {analysis.pillarData
                .sort((a, b) => b.tasks - a.tasks)
                .map(pillar => {
                  const barWidth = (pillar.tasks / analysis.maxTasks) * 100;
                  const pct = analysis.totalTasks > 0 ? Math.round((pillar.tasks / analysis.totalTasks) * 100) : 0;

                  return (
                    <div key={pillar.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: pillar.color }}
                          />
                          {pillar.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {pillar.tasks} tasks · {pillar.focusHours}h · {pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: pillar.color,
                            opacity: 0.6,
                            minWidth: pillar.tasks > 0 ? '4px' : '0',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Balance hint */}
            {(() => {
              const sorted = [...analysis.pillarData].sort((a, b) => b.tasks - a.tasks);
              const top = sorted[0];
              const bottom = sorted[sorted.length - 1];
              if (top && bottom && top.tasks > 0 && bottom.tasks === 0) {
                return (
                  <div className="text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                    ⚠️ <strong>{bottom.title}</strong> has no tasks. Consider if this pillar needs attention.
                  </div>
                );
              }
              return null;
            })()}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Link tasks to goals, and goals to pillars, to see your effort distribution.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
