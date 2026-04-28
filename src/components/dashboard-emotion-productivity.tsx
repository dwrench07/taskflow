"use client";

import { useMemo } from "react";
import { FocusSession, EmotionLabel, ProductivityScore } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmotionConfig } from "@/components/emotion-check-in";
<WidgetInfo description={WIDGET_DESCRIPTIONS["emotion-productivity"]} />
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";

interface EmotionProductivityProps {
  focusSessions: FocusSession[];
}

const PROD_COLORS: Record<ProductivityScore, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-red-400',
};

export function DashboardEmotionProductivity({ focusSessions }: EmotionProductivityProps) {
  const analysis = useMemo(() => {
    const tracked = focusSessions.filter(
      s => s.status === 'completed' && s.preEmotion && s.productivityScore
    );

    if (tracked.length < 5) return null;

    // Group by pre-emotion → productivity distribution
    const emotionStats: Record<string, { total: number; high: number; medium: number; low: number }> = {};

    tracked.forEach(s => {
      const emotion = s.preEmotion!.emotion;
      if (!emotionStats[emotion]) {
        emotionStats[emotion] = { total: 0, high: 0, medium: 0, low: 0 };
      }
      emotionStats[emotion].total++;
      emotionStats[emotion][s.productivityScore!]++;
    });

    const entries = Object.entries(emotionStats)
      .filter(([, s]) => s.total >= 2)
      .map(([emotion, s]) => ({
        emotion: emotion as EmotionLabel,
        total: s.total,
        highRate: Math.round((s.high / s.total) * 100),
        medRate: Math.round((s.medium / s.total) * 100),
        lowRate: Math.round((s.low / s.total) * 100),
      }))
      .sort((a, b) => b.highRate - a.highRate);

    if (entries.length === 0) return null;

    // Surprise finding: negative emotions with high productivity
    const negativeEmotions: EmotionLabel[] = ['dread', 'anxiety', 'resistance', 'overwhelm'];
    const surprisePerformers = entries.filter(e =>
      negativeEmotions.includes(e.emotion) && e.highRate >= 40
    );

    return { entries, surprisePerformers, totalSessions: tracked.length };
  }, [focusSessions]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" />
            Emotion → Productivity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Complete more focus sessions with emotion check-ins to map this correlation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-500" />
          Emotion → Productivity
          <span className="ml-auto text-[11px] text-muted-foreground">{analysis.totalSessions} sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Emotion rows with stacked bars */}
        <div className="space-y-2">
          {analysis.entries.map(entry => {
            const config = getEmotionConfig(entry.emotion);
            return (
              <div key={entry.emotion} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span>{config.emoji}</span>
                    <span className="font-medium">{config.label}</span>
                    <span className="text-muted-foreground/40">({entry.total})</span>
                  </span>
                  <span className={cn("font-bold text-[11px]", PROD_COLORS.high)}>
                    {entry.highRate}% high
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex bg-muted/20">
                  <div
                    className="bg-emerald-400/70 transition-all duration-700"
                    style={{ width: `${entry.highRate}%` }}
                  />
                  <div
                    className="bg-amber-400/50 transition-all duration-700"
                    style={{ width: `${entry.medRate}%` }}
                  />
                  <div
                    className="bg-red-400/40 transition-all duration-700"
                    style={{ width: `${entry.lowRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-400/70" /> High</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-400/50" /> Med</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-400/40" /> Low</div>
        </div>

        {/* Surprise insight */}
        {analysis.surprisePerformers.length > 0 && (
          <div className="text-xs text-pink-300/80 bg-pink-500/5 border border-pink-500/15 rounded-xl px-4 py-3">
            💡 Surprise: You still produce <strong>high-quality work</strong> even when feeling{' '}
            {analysis.surprisePerformers.map(s => getEmotionConfig(s.emotion).label.toLowerCase()).join(' or ')}.
            The feeling lies.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
