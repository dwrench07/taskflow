"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Goal, FocusSession } from "@/lib/types";
import { getEmotionConfig } from "@/components/emotion-check-in";
import { Trophy, Calendar, Brain, ArrowRight, Rocket, Star } from "lucide-react";
import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface GoalCelebrationProps {
  goal: Goal;
  focusSessions: FocusSession[];
  open: boolean;
  onClose: () => void;
  onContinueToStretch?: () => void;
}

export function GoalCelebration({ goal, focusSessions, open, onClose, onContinueToStretch }: GoalCelebrationProps) {
  // Calculate stats for this goal
  const goalSessions = focusSessions.filter(s => s.taskId && s.status === 'completed');
  // We can't perfectly filter by goal (sessions are tied to tasks not goals directly)
  // But we can show overall emotion journey

  const sessionsWithEmotions = focusSessions.filter(s => s.preEmotion && s.postEmotion && s.status === 'completed');

  const durationDays = goal.startDate
    ? differenceInDays(new Date(), parseISO(goal.startDate))
    : null;

  // Emotion journey: first few and last few sessions with emotions
  const emotionJourney = sessionsWithEmotions.slice(-6);

  // Calculate improvement rate
  const anxiousEmotions = ['dread', 'anxiety', 'resistance', 'overwhelm'];
  const positiveEmotions = ['calm', 'neutral', 'excited'];
  let improvedCount = 0;
  sessionsWithEmotions.forEach(s => {
    if (anxiousEmotions.includes(s.preEmotion!.emotion) && positiveEmotions.includes(s.postEmotion!.emotion)) {
      improvedCount++;
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md [&>button:last-child]:hidden overflow-hidden">
        {/* Decorative top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/20 to-transparent -z-10" />

        <div className="flex flex-col items-center text-center pt-4 space-y-5">
          {/* Trophy */}
          <div className="h-20 w-20 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
            <Trophy className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Goal Achieved!</h2>
            <p className="text-lg font-bold text-primary">{goal.title}</p>
            {goal.description && (
              <p className="text-sm text-muted-foreground max-w-xs">{goal.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {durationDays !== null && (
              <div className="p-3 bg-muted/20 rounded-xl text-center">
                <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-black">{durationDays}</p>
                <p className="text-[10px] text-muted-foreground">Days</p>
              </div>
            )}
            {sessionsWithEmotions.length > 0 && (
              <div className="p-3 bg-muted/20 rounded-xl text-center">
                <Brain className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-black">{sessionsWithEmotions.length}</p>
                <p className="text-[10px] text-muted-foreground">Tracked sessions</p>
              </div>
            )}
          </div>

          {/* Emotion journey */}
          {emotionJourney.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Emotional Journey</p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {emotionJourney.map((s, i) => {
                  const pre = getEmotionConfig(s.preEmotion!.emotion);
                  const post = getEmotionConfig(s.postEmotion!.emotion);
                  return (
                    <div key={i} className="flex items-center gap-0.5 bg-muted/20 rounded-lg px-2 py-1">
                      <span className="text-sm" title={`Before: ${pre.label}`}>{pre.emoji}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30" />
                      <span className="text-sm" title={`After: ${post.label}`}>{post.emoji}</span>
                    </div>
                  );
                })}
              </div>
              {improvedCount > 0 && (
                <p className="text-xs text-emerald-400">
                  You pushed through discomfort {improvedCount} time{improvedCount !== 1 ? 's' : ''} and came out better.
                </p>
              )}
            </div>
          )}

          {/* Stretch goal nudge */}
          {goal.stretchGoal && (
            <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <Rocket className="h-4 w-4" />
                Stretch Goal
              </div>
              <p className="text-sm text-muted-foreground">{goal.stretchGoal}</p>
              <p className="text-[10px] text-muted-foreground">
                You hit your target. Want to keep going? No pressure — the stretch is always optional.
              </p>
              {onContinueToStretch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onContinueToStretch}
                  className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2"
                >
                  <Star className="h-3.5 w-3.5" /> Go for the stretch
                </Button>
              )}
            </div>
          )}

          {/* Close */}
          <Button onClick={onClose} className="w-full">
            Done celebrating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
