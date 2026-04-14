"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link2, Unlock, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface BlockerInsightsProps {
  allTasks: Task[];
}

export function DashboardBlockerInsights({ allTasks }: BlockerInsightsProps) {
  const analysis = useMemo(() => {
    const activeTasks = allTasks.filter(t => !t.isHabit && t.status !== 'done' && t.status !== 'abandoned');

    // Build blocker graph
    const blockingMap: Record<string, string[]> = {}; // taskId -> tasks it blocks
    const blockedByMap: Record<string, string[]> = {}; // taskId -> tasks blocking it

    activeTasks.forEach(task => {
      if (task.blocks && task.blocks.length > 0) {
        // Only count active downstream tasks
        const activeBlocks = task.blocks.filter(id =>
          activeTasks.some(t => t.id === id)
        );
        if (activeBlocks.length > 0) {
          blockingMap[task.id] = activeBlocks;
        }
      }
      if (task.blockedBy && task.blockedBy.length > 0) {
        const activeBlockers = task.blockedBy.filter(id =>
          allTasks.some(t => t.id === id && t.status !== 'done' && t.status !== 'abandoned')
        );
        if (activeBlockers.length > 0) {
          blockedByMap[task.id] = activeBlockers;
        }
      }
    });

    const hasBlockers = Object.keys(blockingMap).length > 0 || Object.keys(blockedByMap).length > 0;
    if (!hasBlockers) return null;

    // Count how many tasks each task transitively unblocks
    const getTransitiveUnblockCount = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const directBlocks = blockingMap[taskId] || [];
      let count = directBlocks.length;
      for (const blockedId of directBlocks) {
        count += getTransitiveUnblockCount(blockedId, visited);
      }
      return count;
    };

    // Rank tasks by unblock impact
    const impactRanking = activeTasks
      .filter(t => blockingMap[t.id])
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        directBlocks: (blockingMap[t.id] || []).length,
        transitiveBlocks: getTransitiveUnblockCount(t.id),
      }))
      .sort((a, b) => b.transitiveBlocks - a.transitiveBlocks)
      .slice(0, 5);

    // Tasks that are blocked (stuck)
    const blockedTasks = activeTasks
      .filter(t => blockedByMap[t.id] && blockedByMap[t.id].length > 0)
      .map(t => {
        const blockerIds = blockedByMap[t.id];
        const blockerTitles = blockerIds.map(id => {
          const task = allTasks.find(at => at.id === id);
          return task?.title || 'Unknown';
        });
        return { id: t.id, title: t.title, blockerCount: blockerIds.length, blockerTitles };
      })
      .sort((a, b) => b.blockerCount - a.blockerCount)
      .slice(0, 3);

    return {
      totalBlocking: Object.keys(blockingMap).length,
      totalBlocked: Object.keys(blockedByMap).length,
      impactRanking,
      blockedTasks,
    };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-sky-500" />
            Blocker Insights
            <WidgetInfo description={WIDGET_DESCRIPTIONS["blocker-insights"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No task dependencies found. Link tasks with &quot;blocks&quot; and &quot;blocked by&quot; to see chain insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-sky-500" />
          Blocker Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2.5 bg-sky-500/5 rounded-xl border border-sky-500/10">
            <div className="flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xl font-black text-sky-400">{analysis.totalBlocked}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tasks blocked</p>
          </div>
          <div className="text-center p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <div className="flex items-center justify-center gap-1.5">
              <Unlock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xl font-black text-emerald-400">{analysis.totalBlocking}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Key blockers</p>
          </div>
        </div>

        {/* Highest impact tasks */}
        {analysis.impactRanking.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              Complete these to unblock the most
            </p>
            {analysis.impactRanking.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black shrink-0",
                  i === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/30 text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <Link
                  href={`/tasks?taskId=${t.id}`}
                  className="truncate font-medium hover:text-primary transition-colors flex-1"
                >
                  {t.title}
                </Link>
                <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                  <Unlock className="h-2.5 w-2.5" /> {t.transitiveBlocks}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Stuck tasks */}
        {analysis.blockedTasks.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              Currently stuck
            </p>
            {analysis.blockedTasks.map(t => (
              <div key={t.id} className="text-xs bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-red-400 shrink-0" />
                  <span className="font-medium truncate">{t.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 pl-[18px]">
                  Waiting on: {t.blockerTitles.slice(0, 2).join(', ')}
                  {t.blockerTitles.length > 2 && ` +${t.blockerTitles.length - 2} more`}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
