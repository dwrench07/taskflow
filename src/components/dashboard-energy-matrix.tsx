"use client";

import { useMemo } from "react";
import { FocusSession, EnergyLevel, ProductivityScore } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface EnergyMatrixProps {
  focusSessions: FocusSession[];
}

const ENERGY_LABELS: Record<EnergyLevel, string> = {
  high: 'High Energy',
  medium: 'Med Energy',
  low: 'Low Energy',
};
const PROD_LABELS: Record<ProductivityScore, string> = {
  high: 'High Output',
  medium: 'Med Output',
  low: 'Low Output',
};
const ENERGY_ORDER: EnergyLevel[] = ['high', 'medium', 'low'];
const PROD_ORDER: ProductivityScore[] = ['high', 'medium', 'low'];

export function DashboardEnergyMatrix({ focusSessions }: EnergyMatrixProps) {
  const analysis = useMemo(() => {
    const tracked = focusSessions.filter(
      s => s.status === 'completed' && s.energyLevel && s.productivityScore
    );

    if (tracked.length < 5) return null;

    // Build 3x3 matrix
    const matrix: Record<string, number> = {};
    let maxCount = 0;

    for (const e of ENERGY_ORDER) {
      for (const p of PROD_ORDER) {
        const key = `${e}-${p}`;
        const count = tracked.filter(s => s.energyLevel === e && s.productivityScore === p).length;
        matrix[key] = count;
        if (count > maxCount) maxCount = count;
      }
    }

    // Find the dominant cell
    const dominantKey = Object.entries(matrix).sort((a, b) => b[1] - a[1])[0];
    const [domEnergy, domProd] = dominantKey[0].split('-') as [EnergyLevel, ProductivityScore];

    // Insights
    const highEHighP = matrix['high-high'];
    const lowEHighP = matrix['low-high'];
    const highELowP = matrix['high-low'];

    let insight = '';
    if (lowEHighP > highEHighP && lowEHighP > 0) {
      insight = "Surprisingly, you produce great work even at low energy. Don't wait for motivation!";
    } else if (highEHighP > 0 && highEHighP >= lowEHighP) {
      insight = "You do your best work at high energy. Protect your peak hours for important tasks.";
    } else if (highELowP > highEHighP && highELowP > 0) {
      insight = "High energy doesn't guarantee output. Try pairing energy with clear tasks.";
    }

    return { matrix, maxCount, dominantEnergy: domEnergy, dominantProd: domProd, insight, total: tracked.length };
  }, [focusSessions]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-500" />
            Energy vs Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Complete more focus sessions with energy check-ins to map your energy-productivity patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCellColor = (energy: EnergyLevel, prod: ProductivityScore, intensity: number) => {
    if (energy === 'high' && prod === 'high') return `rgba(52, 211, 153, ${intensity})`; // emerald
    if (energy === 'low' && prod === 'high') return `rgba(251, 191, 36, ${intensity})`; // amber (surprising!)
    if (energy === 'high' && prod === 'low') return `rgba(248, 113, 113, ${intensity})`; // red (wasted energy)
    return `rgba(148, 163, 184, ${intensity})`; // slate
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-500" />
          Energy vs Output
          <span className="ml-auto text-[10px] text-muted-foreground">{analysis.total} sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 3x3 Matrix Grid */}
        <div className="space-y-1">
          {/* Column headers */}
          <div className="grid grid-cols-4 gap-1">
            <div /> {/* empty corner */}
            {PROD_ORDER.map(p => (
              <div key={p} className="text-center text-[9px] text-muted-foreground uppercase tracking-wider font-bold pb-1">
                {PROD_LABELS[p].split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {ENERGY_ORDER.map(energy => (
            <div key={energy} className="grid grid-cols-4 gap-1">
              <div className="flex items-center text-[9px] text-muted-foreground uppercase tracking-wider font-bold pr-1">
                {ENERGY_LABELS[energy].split(' ')[0]}
              </div>
              {PROD_ORDER.map(prod => {
                const key = `${energy}-${prod}`;
                const count = analysis.matrix[key];
                const intensity = count > 0 ? Math.max(0.2, count / analysis.maxCount) : 0;
                const isDominant = energy === analysis.dominantEnergy && prod === analysis.dominantProd;

                return (
                  <div
                    key={key}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all duration-300 relative",
                      count === 0 && "bg-muted/10 text-muted-foreground/20",
                      isDominant && "ring-2 ring-primary/50",
                    )}
                    style={count > 0 ? {
                      backgroundColor: getCellColor(energy, prod, intensity),
                      color: intensity > 0.5 ? 'white' : undefined,
                    } : undefined}
                    title={`${ENERGY_LABELS[energy]} × ${PROD_LABELS[prod]}: ${count} sessions`}
                  >
                    {count > 0 ? count : '·'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Axis labels */}
        <div className="flex justify-between text-[9px] text-muted-foreground/40">
          <span>← Energy</span>
          <span>Output →</span>
        </div>

        {/* Insight */}
        {analysis.insight && (
          <div className="text-xs text-muted-foreground bg-cyan-500/5 border border-cyan-500/15 rounded-xl px-4 py-3">
            {analysis.insight}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
