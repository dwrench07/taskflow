"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Ruler, AlertTriangle, CheckCircle2 } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface TShirtAccuracyProps {
  allTasks: Task[];
}

type TSize = 'S' | 'M' | 'L' | 'XL';
const SIZES: TSize[] = ['S', 'M', 'L', 'XL'];

const SIZE_CONFIG: Record<TSize, { label: string; expectedDays: string; color: string }> = {
  S: { label: 'Small', expectedDays: '< 1 day', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  M: { label: 'Medium', expectedDays: '1-3 days', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  L: { label: 'Large', expectedDays: '4-7 days', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  XL: { label: 'X-Large', expectedDays: '1+ weeks', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

export function DashboardTShirtAccuracy({ allTasks }: TShirtAccuracyProps) {
  const analysis = useMemo(() => {
    const sized = allTasks.filter(
      t => !t.isHabit && t.tShirtSize && t.status === 'done' && t.startDate && t.endDate
    );

    if (sized.length < 3) return null;

    const sizeStats: Record<TSize, { count: number; totalDays: number; avgDays: number }> = {
      S: { count: 0, totalDays: 0, avgDays: 0 },
      M: { count: 0, totalDays: 0, avgDays: 0 },
      L: { count: 0, totalDays: 0, avgDays: 0 },
      XL: { count: 0, totalDays: 0, avgDays: 0 },
    };

    sized.forEach(t => {
      const size = t.tShirtSize as TSize;
      const days = Math.max(0, differenceInDays(parseISO(t.endDate!), parseISO(t.startDate!)));
      sizeStats[size].count++;
      sizeStats[size].totalDays += days;
    });

    // Calculate averages
    for (const size of SIZES) {
      if (sizeStats[size].count > 0) {
        sizeStats[size].avgDays = Math.round((sizeStats[size].totalDays / sizeStats[size].count) * 10) / 10;
      }
    }

    // Check calibration: is S < M < L < XL in actual time?
    const activeSizes = SIZES.filter(s => sizeStats[s].count > 0);
    let calibrated = true;
    for (let i = 1; i < activeSizes.length; i++) {
      if (sizeStats[activeSizes[i]].avgDays < sizeStats[activeSizes[i - 1]].avgDays) {
        calibrated = false;
        break;
      }
    }

    // Find the max avg for bar scaling
    const maxAvg = Math.max(...SIZES.map(s => sizeStats[s].avgDays), 1);

    return { sizeStats, calibrated, maxAvg, total: sized.length };
  }, [allTasks]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Ruler className="h-4 w-4 text-indigo-500" />
            T-Shirt Size Accuracy
            <WidgetInfo description={WIDGET_DESCRIPTIONS["tshirt-accuracy"]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Complete more tasks with T-shirt size estimates to track your estimation accuracy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Ruler className="h-4 w-4 text-indigo-500" />
          T-Shirt Size Accuracy
          <Badge
            variant="outline"
            className={cn(
              "ml-auto text-[10px] gap-1",
              analysis.calibrated
                ? "text-green-400 border-green-500/30 bg-green-500/10"
                : "text-amber-400 border-amber-500/30 bg-amber-500/10"
            )}
          >
            {analysis.calibrated ? (
              <><CheckCircle2 className="h-3 w-3" /> Calibrated</>
            ) : (
              <><AlertTriangle className="h-3 w-3" /> Miscalibrated</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Size breakdown */}
        {SIZES.map(size => {
          const stats = analysis.sizeStats[size];
          if (stats.count === 0) return null;
          const barWidth = (stats.avgDays / analysis.maxAvg) * 100;

          return (
            <div key={size} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px] font-black px-1.5", SIZE_CONFIG[size].color)}>
                    {size}
                  </Badge>
                  <span className="text-muted-foreground">{SIZE_CONFIG[size].expectedDays}</span>
                </span>
                <span className="font-bold">
                  {stats.avgDays} days <span className="text-muted-foreground font-normal">({stats.count} tasks)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-indigo-400/60"
                  style={{ width: `${barWidth}%`, minWidth: stats.avgDays > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
          );
        })}

        {/* Calibration insight */}
        <div className={cn(
          "text-xs rounded-xl px-4 py-3 border mt-2",
          analysis.calibrated
            ? "bg-green-500/5 border-green-500/20 text-green-300"
            : "bg-amber-500/5 border-amber-500/20 text-amber-300"
        )}>
          {analysis.calibrated
            ? "✅ Your estimates are calibrated — S tasks actually take less time than L tasks!"
            : "⚠️ Your sizes don't scale linearly. An \"M\" might be taking as long as an \"L\". Consider re-calibrating."}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">{analysis.total} completed tasks analyzed</p>
      </CardContent>
    </Card>
  );
}
