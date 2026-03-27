"use client";

import { useGamification } from "@/context/GamificationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, Flame, Trophy, Brain, Zap, Layers } from "lucide-react";
import { getLevel } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";

export function DashboardDailyWins() {
  const { dailyWins, todayXP, totalXP, level } = useGamification();

  const hasActivity = dailyWins.tasksCompleted > 0 || dailyWins.habitsCompleted > 0 ||
                      dailyWins.focusMinutes > 0 || dailyWins.subtasksCompleted > 0;

  const wins: { icon: React.ReactNode; text: string }[] = [];

  if (dailyWins.tasksCompleted > 0)
    wins.push({ icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />, text: `Completed ${dailyWins.tasksCompleted} task${dailyWins.tasksCompleted > 1 ? 's' : ''}` });
  if (dailyWins.subtasksCompleted > 0)
    wins.push({ icon: <Layers className="h-3.5 w-3.5 text-indigo-400" />, text: `Knocked out ${dailyWins.subtasksCompleted} subtask${dailyWins.subtasksCompleted > 1 ? 's' : ''}` });
  if (dailyWins.habitsCompleted > 0)
    wins.push({ icon: <Flame className="h-3.5 w-3.5 text-orange-400" />, text: `Maintained ${dailyWins.habitsCompleted} habit${dailyWins.habitsCompleted > 1 ? 's' : ''}` });
  if (dailyWins.frogsEaten > 0)
    wins.push({ icon: <Zap className="h-3.5 w-3.5 text-yellow-400" />, text: `Ate ${dailyWins.frogsEaten} frog${dailyWins.frogsEaten > 1 ? 's' : ''}` });
  if (dailyWins.streaksMaintained > 0)
    wins.push({ icon: <Trophy className="h-3.5 w-3.5 text-amber-400" />, text: `${dailyWins.streaksMaintained} streak${dailyWins.streaksMaintained > 1 ? 's' : ''} alive` });
  if (dailyWins.focusMinutes > 0)
    wins.push({ icon: <Brain className="h-3.5 w-3.5 text-cyan-400" />, text: `${Math.round(dailyWins.focusMinutes)} min deep work` });

  return (
    <Card className="border-border/50 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Today&apos;s Wins
          {todayXP > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary">
              +{todayXP} XP
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasActivity ? (
          <p className="text-xs text-muted-foreground">No wins yet today. You got this.</p>
        ) : (
          <>
            {/* Positive-only framing */}
            <div className="space-y-2">
              {wins.map((win, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {win.icon}
                  <span className="text-foreground/80">{win.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* XP / Level bar */}
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-muted-foreground uppercase tracking-wider">
              Level {level.level}
            </span>
            <span className="text-muted-foreground">
              {level.currentXP} / {level.nextLevelXP} XP
            </span>
          </div>
          <Progress value={level.progress} className="h-1.5" />
          <div className="text-[10px] text-muted-foreground text-right">
            {totalXP.toLocaleString()} XP total
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
