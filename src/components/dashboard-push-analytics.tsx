"use client";

import { useMemo } from "react";
import { Task, PushReason } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightCircle, AlertTriangle, HelpCircle, Maximize2, Coffee, Clock, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

const REASON_CONFIG: Record<PushReason, { label: string; icon: React.ReactNode; color: string; insight: string }> = {
  'too-scary': { label: 'Too Scary', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-red-600 dark:text-red-400 bg-red-500/10', insight: 'Your main blocker is fear, not ability. Try smaller first steps.' },
  'too-vague': { label: 'Too Vague', icon: <HelpCircle className="h-3.5 w-3.5" />, color: 'text-purple-500 bg-purple-500/10', insight: 'You need more clarity before starting. Spend 5 min defining step 1.' },
  'too-big': { label: 'Too Big', icon: <Maximize2 className="h-3.5 w-3.5" />, color: 'text-orange-500 bg-orange-500/10', insight: 'Break tasks into subtasks more often. Big = paralysis for you.' },
  'too-boring': { label: 'Too Boring', icon: <Coffee className="h-3.5 w-3.5" />, color: 'text-yellow-500 bg-yellow-500/10', insight: 'Batch boring tasks together or pair with music/rewards.' },
  'ran-out-of-time': { label: 'No Time', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-blue-500 bg-blue-500/10', insight: 'Your daily plan may be too ambitious. Try planning fewer tasks.' },
  'deprioritized': { label: 'Deprioritized', icon: <ChevronDown className="h-3.5 w-3.5" />, color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10', insight: 'This is healthy prioritization — but check if these tasks should be dropped entirely.' },
};

interface DashboardPushAnalyticsProps {
  allTasks: Task[];
}

export function DashboardPushAnalytics({ allTasks }: DashboardPushAnalyticsProps) {
  const analytics = useMemo(() => {
    const activeTasks = allTasks.filter(t => (t.category !== "habit") && t.status !== 'done' && t.status !== 'abandoned');

    // Collect all push history entries
    const allEntries = activeTasks.flatMap(t => t.pushHistory || []);

    if (allEntries.length === 0) return null;

    // Count by reason
    const reasonCounts: Record<string, number> = {};
    for (const entry of allEntries) {
      reasonCounts[entry.reason] = (reasonCounts[entry.reason] || 0) + 1;
    }

    // Sort reasons by frequency
    const sortedReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason: reason as PushReason, count, percentage: Math.round((count / allEntries.length) * 100) }));

    // Top pushed tasks (active tasks with highest push count that have history)
    const chronicPushers = activeTasks
      .filter(t => (t.pushCount || 0) >= 3 && t.pushHistory && t.pushHistory.length > 0)
      .sort((a, b) => (b.pushCount || 0) - (a.pushCount || 0))
      .slice(0, 3);

    // Emotional vs Practical split
    const emotionalReasons = ['too-scary', 'too-boring'];
    const practicalReasons = ['ran-out-of-time', 'deprioritized', 'too-big', 'too-vague'];
    const emotionalCount = allEntries.filter(e => emotionalReasons.includes(e.reason)).length;
    const practicalCount = allEntries.filter(e => practicalReasons.includes(e.reason)).length;

    return {
      totalPushes: allEntries.length,
      sortedReasons,
      topReason: sortedReasons[0],
      chronicPushers,
      emotionalVsPractical: {
        emotional: emotionalCount,
        practical: practicalCount,
        emotionalPct: Math.round((emotionalCount / allEntries.length) * 100),
      },
    };
  }, [allTasks]);

  if (!analytics) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-orange-500" />
            Push Analytics
            <WidgetInfo description={WIDGET_DESCRIPTIONS["push-analytics"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No push data yet. Push reasons will appear here after your next daily review.</p>
        </CardContent>
      </Card>
    );
  }

  const topConfig = REASON_CONFIG[analytics.topReason.reason];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ArrowRightCircle className="h-4 w-4 text-orange-500" />
          Push Analytics
          <Badge variant="secondary" className="ml-auto text-[10px]">{analytics.totalPushes} total pushes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main insight */}
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {topConfig.icon}
            <span>Your #1 push reason: <span className={topConfig.color.split(' ')[0]}>{topConfig.label}</span></span>
            <span className="text-muted-foreground ml-1">({analytics.topReason.percentage}%)</span>
          </div>
          <p className="text-xs text-muted-foreground">{topConfig.insight}</p>
        </div>

        {/* Reason breakdown bars */}
        <div className="space-y-2">
          {analytics.sortedReasons.map(({ reason, count, percentage }) => {
            const config = REASON_CONFIG[reason];
            return (
              <div key={reason} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    {config.icon}
                    {config.label}
                  </span>
                  <span className="text-muted-foreground">{count}x ({percentage}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.color.split(' ')[1]}`}
                    style={{ width: `${percentage}%`, minWidth: percentage > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Emotional vs Practical */}
        <div className="flex items-center gap-3 text-xs pt-2 border-t border-border">
          {analytics.emotionalVsPractical.emotionalPct > 50 ? (
            <>
              <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-muted-foreground">
                <span className="text-red-500 dark:text-red-400 font-semibold">{analytics.emotionalVsPractical.emotionalPct}% emotional</span> — fear and boredom are your main blockers, not logistics
              </span>
            </>
          ) : (
            <>
              <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span className="text-muted-foreground">
                <span className="text-green-500 dark:text-green-400 font-semibold">{100 - analytics.emotionalVsPractical.emotionalPct}% practical</span> — your pushes are mostly rational, not fear-based
              </span>
            </>
          )}
        </div>

        {/* Chronic pushers */}
        {analytics.chronicPushers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chronically Pushed</p>
            {analytics.chronicPushers.map(task => {
              const topReason = task.pushHistory?.[task.pushHistory.length - 1]?.reason;
              const reasonConfig = topReason ? REASON_CONFIG[topReason] : null;
              return (
                <div key={task.id} className="flex items-center justify-between text-xs gap-2">
                  <Link href={`/focus?taskId=${task.id}`} className="truncate font-medium hover:text-primary transition-colors">{task.title}</Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {reasonConfig && (
                      <Badge variant="outline" className={`text-[10px] ${reasonConfig.color}`}>
                        {reasonConfig.label}
                      </Badge>
                    )}
                    <Badge variant="destructive" className="text-[10px]">{task.pushCount}x</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
