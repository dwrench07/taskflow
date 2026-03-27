"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tag, TrendingUp } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface TagHeatmapProps {
  allTasks: Task[];
}

export function DashboardTagHeatmap({ allTasks }: TagHeatmapProps) {
  const analysis = useMemo(() => {
    const tasks = allTasks.filter(t => !t.isHabit && t.tags && t.tags.length > 0);
    if (tasks.length < 5) return null;

    const tagStats: Record<string, {
      total: number; done: number; abandoned: number;
      totalDays: number; doneWithDates: number;
      totalPushes: number;
    }> = {};

    tasks.forEach(t => {
      const tags = t.tags || [];
      tags.forEach(tag => {
        if (!tagStats[tag]) {
          tagStats[tag] = { total: 0, done: 0, abandoned: 0, totalDays: 0, doneWithDates: 0, totalPushes: 0 };
        }
        tagStats[tag].total++;
        tagStats[tag].totalPushes += t.pushCount || 0;
        if (t.status === 'done') {
          tagStats[tag].done++;
          if (t.startDate && t.endDate) {
            const days = Math.max(0, differenceInDays(parseISO(t.endDate), parseISO(t.startDate)));
            tagStats[tag].totalDays += days;
            tagStats[tag].doneWithDates++;
          }
        }
        if (t.status === 'abandoned') tagStats[tag].abandoned++;
      });
    });

    const entries = Object.entries(tagStats)
      .filter(([, s]) => s.total >= 2)
      .map(([tag, s]) => ({
        tag,
        total: s.total,
        completionRate: Math.round((s.done / s.total) * 100),
        avgDays: s.doneWithDates > 0 ? Math.round((s.totalDays / s.doneWithDates) * 10) / 10 : null,
        avgPushes: Math.round((s.totalPushes / s.total) * 10) / 10,
        abandonRate: Math.round((s.abandoned / s.total) * 100),
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    if (entries.length === 0) return null;

    const bestTag = entries[0];
    const worstTag = entries[entries.length - 1];

    return { entries, bestTag, worstTag };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Tag className="h-4 w-4 text-teal-500" />
            Tag Productivity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Tag more tasks to see which categories you excel at.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Tag className="h-4 w-4 text-teal-500" />
          Tag Productivity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tag rows */}
        <div className="space-y-2">
          {analysis.entries.slice(0, 8).map((entry, i) => {
            const isTop = i === 0;
            const isBottom = i === analysis.entries.length - 1 && analysis.entries.length > 1;
            return (
              <div key={entry.tag} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      "font-semibold",
                      isTop ? "text-teal-400" : isBottom ? "text-red-400" : "text-foreground"
                    )}>
                      #{entry.tag}
                    </span>
                    <span className="text-muted-foreground/50">({entry.total})</span>
                  </span>
                  <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {entry.avgDays !== null && <span>{entry.avgDays}d avg</span>}
                    <span className={cn(
                      "font-bold",
                      entry.completionRate >= 70 ? "text-teal-400" :
                      entry.completionRate >= 40 ? "text-amber-400" : "text-red-400"
                    )}>
                      {entry.completionRate}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      entry.completionRate >= 70 ? "bg-teal-400/60" :
                      entry.completionRate >= 40 ? "bg-amber-400/50" : "bg-red-400/50"
                    )}
                    style={{ width: `${entry.completionRate}%`, minWidth: entry.completionRate > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight */}
        {analysis.bestTag && analysis.worstTag && analysis.bestTag.tag !== analysis.worstTag.tag && (
          <div className="text-xs text-muted-foreground bg-teal-500/5 border border-teal-500/15 rounded-xl px-4 py-3">
            <TrendingUp className="h-3 w-3 inline text-teal-400 mr-1" />
            You excel at <strong className="text-teal-400">#{analysis.bestTag.tag}</strong> ({analysis.bestTag.completionRate}%)
            but struggle with <strong className="text-red-400">#{analysis.worstTag.tag}</strong> ({analysis.worstTag.completionRate}%).
          </div>
        )}
      </CardContent>
    </Card>
  );
}
