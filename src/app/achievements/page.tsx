"use client";

import { useGamification } from "@/context/GamificationContext";
import { BADGE_DEFINITIONS, type BadgeTier, getLevel } from "@/lib/gamification";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

const TIER_STYLES: Record<BadgeTier, { border: string; bg: string; text: string; glow: string }> = {
  bronze: { border: 'border-amber-700/50', bg: 'bg-amber-900/20', text: 'text-amber-600', glow: '' },
  silver: { border: 'border-slate-400/50', bg: 'bg-slate-500/10', text: 'text-slate-300', glow: 'shadow-[0_0_10px_rgba(148,163,184,0.15)]' },
  gold: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
};

const TIER_LABELS: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export default function AchievementsPage() {
  const { badges, totalXP, todayXP, level } = useGamification();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const earnedCount = badges.filter(b => {
    const def = BADGE_DEFINITIONS.find(d => d.id === b.id)!;
    return b.progress >= def.tiers[0].threshold;
  }).length;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4 md:py-8 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-primary" /> Achievements
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Every action counts. Here&apos;s proof of your progress.
        </p>
      </div>

      {/* XP Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-black text-primary">{totalXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Total XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="text-4xl font-black">
              <span className="text-primary">Lv. {level.level}</span>
            </div>
            <Progress value={level.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {level.currentXP} / {level.nextLevelXP} XP to next level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-black text-green-400">+{todayXP}</div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">XP Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">{earnedCount} / {BADGE_DEFINITIONS.length} badges unlocked</span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleSound} className="gap-2 text-xs text-muted-foreground">
          {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          Sounds {soundOn ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Badge Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {BADGE_DEFINITIONS.map(def => {
          const earned = badges.find(b => b.id === def.id)!;
          const isUnlocked = earned.progress >= def.tiers[0].threshold;

          // Find the current tier
          let currentTierIdx = -1;
          for (let i = def.tiers.length - 1; i >= 0; i--) {
            if (earned.progress >= def.tiers[i].threshold) {
              currentTierIdx = i;
              break;
            }
          }

          const currentTier = currentTierIdx >= 0 ? def.tiers[currentTierIdx] : null;
          const nextTier = currentTierIdx < def.tiers.length - 1 ? def.tiers[currentTierIdx + 1] : null;
          const tierStyle = currentTier ? TIER_STYLES[currentTier.tier] : null;

          const progressToNext = nextTier
            ? Math.round(((earned.progress - (currentTier?.threshold || 0)) / (nextTier.threshold - (currentTier?.threshold || 0))) * 100)
            : 100;

          return (
            <Card
              key={def.id}
              className={cn(
                "transition-all duration-300",
                isUnlocked && tierStyle
                  ? `${tierStyle.border} ${tierStyle.bg} ${tierStyle.glow}`
                  : "border-border/30 opacity-60"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "text-3xl",
                      !isUnlocked && "grayscale opacity-40"
                    )}>
                      {def.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{def.name}</CardTitle>
                      <CardDescription className="text-xs">{def.description}</CardDescription>
                    </div>
                  </div>
                  {currentTier && (
                    <Badge className={cn("text-[10px] uppercase font-bold", tierStyle?.text, tierStyle?.bg)}>
                      {TIER_LABELS[currentTier.tier]}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Tier progress dots */}
                <div className="flex gap-2">
                  {def.tiers.map((tier, i) => {
                    const achieved = earned.progress >= tier.threshold;
                    const style = TIER_STYLES[tier.tier];
                    return (
                      <div key={tier.tier} className="flex items-center gap-1.5">
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full border",
                          achieved ? `${style.bg} ${style.border} ${style.text}` : "border-border/30 bg-muted/20"
                        )} style={achieved ? { backgroundColor: tier.tier === 'gold' ? '#eab308' : tier.tier === 'silver' ? '#94a3b8' : '#b45309', opacity: 0.8 } : {}} />
                        <span className={cn("text-[10px]", achieved ? style.text : "text-muted-foreground/40")}>
                          {TIER_LABELS[tier.tier]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar to next tier */}
                {nextTier ? (
                  <div className="space-y-1">
                    <Progress value={Math.min(100, Math.max(0, progressToNext))} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{earned.progress} / {nextTier.threshold}</span>
                      <span>{nextTier.label}</span>
                    </div>
                  </div>
                ) : isUnlocked ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-bold">
                    <Zap className="h-3 w-3" />
                    MAX TIER — All tiers unlocked
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Progress value={Math.round((earned.progress / def.tiers[0].threshold) * 100)} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{earned.progress} / {def.tiers[0].threshold}</span>
                      <span>{def.tiers[0].label}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* XP Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-bold">How XP Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Complete Task</span>
              <p className="text-muted-foreground">S: 5 · M: 10 · L: 20 · XL: 40</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Complete Habit</span>
              <p className="text-muted-foreground">+5 XP per day</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Eat a Frog</span>
              <p className="text-muted-foreground">+25 XP bonus</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Focus Session</span>
              <p className="text-muted-foreground">+1 XP per minute</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Complete Subtask</span>
              <p className="text-muted-foreground">+2 XP each</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Level Up</span>
              <p className="text-muted-foreground">Each level needs more XP</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
