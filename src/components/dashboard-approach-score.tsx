"use client";

import { useMemo } from "react";
import { Task, FocusSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield, Flame, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { isSameDay, parseISO, subDays, startOfToday } from "date-fns";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface ApproachScoreProps {
  allTasks: Task[];
  focusSessions: FocusSession[];
}

export function DashboardApproachScore({ allTasks, focusSessions }: ApproachScoreProps) {
  const analysis = useMemo(() => {
    const today = startOfToday();

    // Approach points: completed focus sessions where pre-task anxiety > 5
    // (anxiety emotions: dread, anxiety, resistance, overwhelm)
    const anxiousEmotions = ['dread', 'anxiety', 'resistance', 'overwhelm'];

    const approachSessions = focusSessions.filter(s =>
      s.status === 'completed' &&
      s.preEmotion &&
      (s.preEmotion.bodyTension >= 6 || anxiousEmotions.includes(s.preEmotion.emotion))
    );

    // Avoidance points: pushed tasks with emotional reasons
    const emotionalPushReasons = ['too-scary', 'too-boring'];
    const allPushEntries = allTasks.flatMap(t =>
      (t.pushHistory || []).map(p => ({ ...p, taskId: t.id, taskTitle: t.title }))
    );
    const emotionalPushes = allPushEntries.filter(e => emotionalPushReasons.includes(e.reason));

    // Daily scores for last 14 days
    const dailyScores: { date: Date; approach: number; avoidance: number; net: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i);

      const dayApproach = approachSessions.filter(s =>
        isSameDay(parseISO(s.startTime), day)
      ).length;

      const dayAvoidance = emotionalPushes.filter(e =>
        isSameDay(parseISO(e.date), day)
      ).length;

      dailyScores.push({
        date: day,
        approach: dayApproach,
        avoidance: dayAvoidance,
        net: dayApproach - dayAvoidance,
      });
    }

    // Today's score
    const todayScore = dailyScores[dailyScores.length - 1];

    // Approach streak: consecutive days with at least 1 approach and net positive
    let approachStreak = 0;
    for (let i = dailyScores.length - 1; i >= 0; i--) {
      if (dailyScores[i].approach > 0 && dailyScores[i].net >= 0) {
        approachStreak++;
      } else {
        break;
      }
    }

    // Total approach vs avoidance
    const totalApproach = dailyScores.reduce((sum, d) => sum + d.approach, 0);
    const totalAvoidance = dailyScores.reduce((sum, d) => sum + d.avoidance, 0);

    // Tasks that were pushed with "too-scary" but eventually completed
    const scaredButDone = allTasks.filter(t =>
      t.status === 'done' &&
      t.pushHistory?.some(p => p.reason === 'too-scary')
    );

    return {
      todayScore,
      approachStreak,
      totalApproach,
      totalAvoidance,
      dailyScores,
      scaredButDone: scaredButDone.length,
      totalScaredPushed: allTasks.filter(t => t.pushHistory?.some(p => p.reason === 'too-scary')).length,
    };
  }, [allTasks, focusSessions]);

  const hasData = analysis.totalApproach > 0 || analysis.totalAvoidance > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          Approach vs Avoidance
          <WidgetInfo description={WIDGET_DESCRIPTIONS["approach-score"]} />
          {analysis.approachStreak > 0 && (
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] gap-1">
              <Flame className="h-3 w-3" /> {analysis.approachStreak}-day streak
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <p className="text-xs text-muted-foreground">
            Complete focus sessions with emotion check-ins to start tracking your approach score.
          </p>
        ) : (
          <>
            {/* Today's score */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Today</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-lg font-black text-emerald-400">{analysis.todayScore.approach}</span>
                    <span className="text-[11px] text-muted-foreground">approach</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-lg font-black text-red-400">{analysis.todayScore.avoidance}</span>
                    <span className="text-[11px] text-muted-foreground">avoid</span>
                  </div>
                </div>
              </div>
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black",
                analysis.todayScore.net > 0 ? "bg-emerald-500/10 text-emerald-400" :
                analysis.todayScore.net < 0 ? "bg-red-500/10 text-red-400" :
                "bg-muted/30 text-muted-foreground"
              )}>
                {analysis.todayScore.net > 0 ? '+' : ''}{analysis.todayScore.net}
              </div>
            </div>

            {/* 14-day mini chart */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Last 14 days</p>
              <div className="flex items-end gap-0.5 h-12">
                {analysis.dailyScores.map((d, i) => {
                  const maxVal = Math.max(
                    ...analysis.dailyScores.map(s => Math.max(s.approach, s.avoidance, 1))
                  );
                  const approachH = (d.approach / maxVal) * 100;
                  const avoidH = (d.avoidance / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-px" title={`${d.date.toLocaleDateString()}: +${d.approach} approach, -${d.avoidance} avoid`}>
                      {d.approach > 0 && (
                        <div
                          className="w-full bg-emerald-400/60 rounded-sm min-h-[2px]"
                          style={{ height: `${approachH}%` }}
                        />
                      )}
                      {d.avoidance > 0 && (
                        <div
                          className="w-full bg-red-400/60 rounded-sm min-h-[2px]"
                          style={{ height: `${avoidH}%` }}
                        />
                      )}
                      {d.approach === 0 && d.avoidance === 0 && (
                        <div className="w-full bg-muted-foreground/10 rounded-sm h-[2px]" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>14d ago</span>
                <span>today</span>
              </div>
            </div>

            {/* 14-day totals */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="text-center p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <p className="text-xl font-black text-emerald-400">{analysis.totalApproach}</p>
                <p className="text-[11px] text-muted-foreground">Times you faced discomfort</p>
              </div>
              <div className="text-center p-2.5 bg-red-500/5 rounded-xl border border-red-500/10">
                <p className="text-xl font-black text-red-400">{analysis.totalAvoidance}</p>
                <p className="text-[11px] text-muted-foreground">Times you avoided</p>
              </div>
            </div>

            {/* Scared but done insight */}
            {analysis.totalScaredPushed > 0 && (
              <div className="text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                <span className="font-semibold text-emerald-400">{analysis.scaredButDone}</span>
                <span className="text-muted-foreground"> of {analysis.totalScaredPushed} &quot;too scary&quot; tasks were eventually completed — </span>
                {analysis.scaredButDone > 0 ? (
                  <span className="font-medium text-emerald-400">
                    {Math.round((analysis.scaredButDone / analysis.totalScaredPushed) * 100)}% were actually fine once started.
                  </span>
                ) : (
                  <span className="text-muted-foreground">start one today?</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
