"use client";

import React, { useState } from "react";
import { useGamification } from "@/context/GamificationContext";
import { feedBonsai, getBonsaiStage, calculateBonsaiNextLevelXP, BONSAI_GROWTH_XP } from "@/lib/gamification";
import { saveUserProgress } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Sprout, Leaf, Zap, Heart, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { BonsaiCanvas } from "./BonsaiCanvas";

export function BonsaiTree() {
  const { userProgress, refreshProgress } = useGamification();
  const { toast } = useToast();
  const [isFeeding, setIsFeeding] = useState(false);

  if (!userProgress || !userProgress.bonsai) {
    return null;
  }

  const { level, experience, lastFed } = userProgress.bonsai;
  const stage = getBonsaiStage(level);
  const nextLevelXP = calculateBonsaiNextLevelXP(level);
  const progressPercent = Math.min(100, Math.round((experience / nextLevelXP) * 100));

  // Determine if it was fed in the last 24 hours
  const isGlowing = lastFed && (new Date().getTime() - new Date(lastFed).getTime()) < 24 * 60 * 60 * 1000;

  const handleFeed = async (itemKey: keyof typeof userProgress.inventory) => {
    if (isFeeding) return;
    setIsFeeding(true);

    try {
      // Create a deep copy to mutate
      const updatedProgress = JSON.parse(JSON.stringify(userProgress));
      const message = feedBonsai(updatedProgress, itemKey);

      if (message) {
        await saveUserProgress(updatedProgress);
        await refreshProgress();
        
        toast({
          title: message.includes("Level Up") ? "Evolution!" : "Nurtured",
          description: message,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to feed the tree. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsFeeding(false);
    }
  };

  const feedableItems = [
    { key: 'freshStartTokens', label: 'Fresh Start', icon: '✨', xp: BONSAI_GROWTH_XP.freshStartTokens },
    { key: 'predictionCrystals', label: 'Crystal', icon: '💎', xp: BONSAI_GROWTH_XP.predictionCrystals },
    { key: 'composureCoins', label: 'Coin', icon: '🪙', xp: BONSAI_GROWTH_XP.composureCoins },
    { key: 'streakShields', label: 'Shield', icon: '🛡️', xp: BONSAI_GROWTH_XP.streakShields },
  ] as const;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500 border-border/40 bg-card",
      isGlowing && "shadow-[0_0_20px_rgba(34,197,94,0.1)] border-green-500/20"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-500" />
            Zen Garden
          </CardTitle>
          <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[11px] font-bold uppercase tracking-wider">
            Level {level}
          </div>
        </div>
        <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">
          Digital Bonsai
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tree Visual */}
        <div className="relative flex flex-col items-center justify-center py-6 bg-secondary/20 rounded-2xl border border-border/20 group cursor-default">
          {/* Subtle Ambient Glow if fed recently */}
          {isGlowing && (
             <div className="absolute inset-0 bg-green-500/5 animate-pulse rounded-2xl" />
          )}

          <div className={cn(
            "w-full h-full min-h-[180px] flex items-center justify-center transition-all duration-500",
            isGlowing && "drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          )}>
            <BonsaiCanvas level={level} isGlowing={!!isGlowing} />
          </div>
          
          <div className="mt-4 text-center">
            <div className="font-black text-sm tracking-tight">{stage.label}</div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
              A physical representation of your focus
            </div>
          </div>

          {/* Sparkle particles if glowing */}
          {isGlowing && (
            <div className="absolute top-4 right-4 animate-bounce">
              <Sparkles className="w-4 h-4 text-yellow-400 opacity-60" />
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-muted-foreground uppercase tracking-wider">Growth Progress</span>
            <span className="text-primary">{experience} / {nextLevelXP} XP</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Feeding Section */}
        <div className="space-y-3">
          <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">
            Feed your artifacts
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {feedableItems.map((item) => {
              const count = userProgress.inventory[item.key as keyof typeof userProgress.inventory] || 0;
              return (
                <Button
                  key={item.key}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-auto py-1.5 sm:py-2 px-1 flex flex-col gap-0.5 sm:gap-1 items-center transition-all overflow-hidden",
                    count > 0 ? "border-primary/20 hover:bg-primary/5 hover:border-primary/40" : "opacity-40 grayscale cursor-not-allowed"
                  )}
                  disabled={count <= 0 || isFeeding}
                  onClick={() => handleFeed(item.key as any)}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-[11px]">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="text-[11px] sm:text-[11px] text-muted-foreground font-medium truncate">
                    {count} Available (+{item.xp} XP)
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
