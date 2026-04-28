"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FocusSession, EmotionLabel } from "@/lib/types";
import { getEmotionConfig, EMOTIONS } from "@/components/emotion-check-in";
import { cn } from "@/lib/utils";
import { Brain, TrendingDown, ArrowRight } from "lucide-react";

interface EmotionTrendsProps {
  focusSessions: FocusSession[];
}

const TENSION_LABELS: Record<string, string> = {
  'dread': 'Dread',
  'anxiety': 'Anxiety',
  'resistance': 'Resistance',
  'overwhelm': 'Overwhelm',
  'calm': 'Calm',
  'neutral': 'Neutral',
  'excited': 'Excited',
};

export function DashboardEmotionTrends({ focusSessions }: EmotionTrendsProps) {
  const analysis = useMemo(() => {
    // Only sessions with both pre and post emotion
    const tracked = focusSessions.filter(s => s.preEmotion && s.postEmotion);
    if (tracked.length === 0) return null;

    // Count emotion frequency (pre-task)
    const preEmotionCounts: Record<string, number> = {};
    const postEmotionCounts: Record<string, number> = {};
    let totalTensionDrop = 0;
    let tensionDropCount = 0;
    let improvedCount = 0;

    // Negative emotions that typically improve after working
    const negativeEmotions: EmotionLabel[] = ['dread', 'anxiety', 'resistance', 'overwhelm'];
    const positiveEmotions: EmotionLabel[] = ['calm', 'neutral', 'excited'];

    let negativePreCount = 0;
    let negativeImprovedCount = 0;

    tracked.forEach(s => {
      const pre = s.preEmotion!;
      const post = s.postEmotion!;

      preEmotionCounts[pre.emotion] = (preEmotionCounts[pre.emotion] || 0) + 1;
      postEmotionCounts[post.emotion] = (postEmotionCounts[post.emotion] || 0) + 1;

      // Tension change
      const tensionChange = pre.bodyTension - post.bodyTension;
      totalTensionDrop += tensionChange;
      tensionDropCount++;

      // Did emotion improve?
      const preIsNegative = negativeEmotions.includes(pre.emotion);
      const postIsPositive = positiveEmotions.includes(post.emotion);

      if (preIsNegative) {
        negativePreCount++;
        if (postIsPositive || !negativeEmotions.includes(post.emotion)) {
          negativeImprovedCount++;
        }
      }

      if (postIsPositive || (!preIsNegative && post.bodyTension < pre.bodyTension)) {
        improvedCount++;
      }
    });

    const avgTensionDrop = tensionDropCount > 0 ? totalTensionDrop / tensionDropCount : 0;
    const improvementRate = tracked.length > 0 ? Math.round((improvedCount / tracked.length) * 100) : 0;
    const fearReliefRate = negativePreCount > 0 ? Math.round((negativeImprovedCount / negativePreCount) * 100) : 0;

    // Top pre-task emotion
    const topPreEmotion = Object.entries(preEmotionCounts).sort((a, b) => b[1] - a[1])[0];

    // Recent sessions (last 10)
    const recent = tracked.slice(-10);

    return {
      totalTracked: tracked.length,
      avgTensionDrop: Math.round(avgTensionDrop * 10) / 10,
      improvementRate,
      fearReliefRate,
      negativePreCount,
      topPreEmotion: topPreEmotion ? { emotion: topPreEmotion[0] as EmotionLabel, count: topPreEmotion[1] } : null,
      preEmotionCounts,
      recent,
    };
  }, [focusSessions]);

  if (!analysis || analysis.totalTracked < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-violet-400" />
            Emotion Trends
          </CardTitle>
          <CardDescription>
            Complete a few more focus sessions with emotion check-ins to see patterns.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-violet-400" />
          Emotion Trends
        </CardTitle>
        <CardDescription>
          Based on {analysis.totalTracked} tracked sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key insight */}
        {analysis.negativePreCount >= 3 && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 text-sm">
            <p className="font-medium text-green-400">
              {analysis.fearReliefRate}% of the time you felt bad before, you felt better after.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The feeling before is almost always worse than the doing.
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/20 rounded-xl">
            <p className="text-2xl font-black text-violet-400">{analysis.improvementRate}%</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Feel better after</p>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-xl">
            <p className="text-2xl font-black">
              {analysis.avgTensionDrop > 0 ? (
                <span className="text-green-400">-{analysis.avgTensionDrop}</span>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Avg tension drop</p>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-xl">
            {analysis.topPreEmotion && (
              <>
                <p className="text-2xl">{getEmotionConfig(analysis.topPreEmotion.emotion).emoji}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
                  Top pre-emotion
                </p>
              </>
            )}
          </div>
        </div>

        {/* Pre-emotion distribution */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Before sessions</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(analysis.preEmotionCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([emotion, count]) => {
                const config = getEmotionConfig(emotion as EmotionLabel);
                return (
                  <Badge key={emotion} variant="outline" className={cn("text-[11px] gap-1", config.color)}>
                    {config.emoji} {config.label} ×{count}
                  </Badge>
                );
              })}
          </div>
        </div>

        {/* Recent sessions flow */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent sessions</p>
          <div className="space-y-1.5">
            {analysis.recent.slice(-5).map((s, i) => {
              const pre = getEmotionConfig(s.preEmotion!.emotion);
              const post = getEmotionConfig(s.postEmotion!.emotion);
              const tensionChange = s.preEmotion!.bodyTension - s.postEmotion!.bodyTension;
              return (
                <div key={i} className="flex items-center gap-2 text-xs bg-muted/20 rounded-lg px-3 py-2">
                  <span title={pre.label}>{pre.emoji}</span>
                  <span className="text-muted-foreground">{s.preEmotion!.bodyTension}/10</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                  <span title={post.label}>{post.emoji}</span>
                  <span className="text-muted-foreground">{s.postEmotion!.bodyTension}/10</span>
                  {tensionChange > 0 && (
                    <span className="ml-auto text-green-400 flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" /> -{tensionChange}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
