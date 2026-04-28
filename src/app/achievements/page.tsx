"use client";

import { useGamification } from "@/context/GamificationContext";
import { BADGE_DEFINITIONS, type BadgeTier, getLevel, getCampfireStatus, checkAndExecuteSeasonReset } from "@/lib/gamification";
import { saveUserProgress } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Shield, Sparkles, Anchor, Gem, BookOpen, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Moon, Shield as ShieldIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { badges, totalXP, todayXP, level, userProgress, refreshProgress, refreshGamification } = useGamification();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const { toast } = useToast();

  useEffect(() => {
    // Check for season reset randomly when loading the achievements page
    const checkSeason = async () => {
      if (userProgress && badges.length > 0) {
        const didReset = checkAndExecuteSeasonReset(userProgress, badges);
        if (didReset) {
          await saveUserProgress(userProgress);
          await refreshGamification();
          toast({
            title: "A New Season Begins!",
            description: "Your XP has reset, but your legacy has been immortalized.",
          });
        }
      }
    };
    checkSeason();
  }, [userProgress, badges, refreshGamification, toast]);

  const campfireStatus = userProgress ? getCampfireStatus(userProgress) : 'burning';

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

      {/* Badge Grid Status Banner */}
      {campfireStatus === 'frozen' && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-center gap-3 shadow-lg my-2 mx-auto w-full max-w-3xl">
          <Moon className="w-5 h-5 text-slate-400" />
          <p className="font-bold text-slate-300">The Campfire is Frozen. Complete any task to reignite your badges!</p>
        </div>
      )}

      {/* Badge Grid */}
      <div className={cn("grid gap-4 md:grid-cols-2 transition-all duration-700", campfireStatus === 'frozen' && "grayscale opacity-50")}>
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
                    <Badge className={cn("text-[11px] uppercase font-bold", tierStyle?.text, tierStyle?.bg)}>
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
                        <span className={cn("text-[11px]", achieved ? style.text : "text-muted-foreground")}>
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
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{earned.progress} / {nextTier.threshold}</span>
                      <span>{nextTier.label}</span>
                    </div>
                  </div>
                ) : isUnlocked ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 font-bold">
                    <Zap className="h-3 w-3" />
                    MAX TIER — All tiers unlocked
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Progress value={Math.round((earned.progress / def.tiers[0].threshold) * 100)} className="h-1.5" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
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

      {/* Artifacts & Inventory */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-black tracking-tight">Artifacts & Inventory</h2>
        </div>
        
        {userProgress ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {[
               { id: 'streakShields', icon: <Shield className="w-8 h-8 text-blue-500 mb-3" />, count: userProgress.inventory.streakShields, label: "Streak Shields", desc: "Saves a streak from breaking natively. Earned by hitting 10-day milestones." },
               { id: 'predictionCrystals', icon: <Gem className="w-8 h-8 text-purple-400 mb-3" />, count: userProgress.inventory.predictionCrystals, label: "Prediction Crystals", desc: "Your worries didn't come true. This physical manifestation of anxiety turned to dust." },
               { id: 'freshStartTokens', icon: <Sparkles className="w-8 h-8 text-green-400 mb-3" />, count: userProgress.inventory.freshStartTokens, label: "Fresh Start Tokens", desc: "Amnesty for your past. Cleanse overdue metrics and reset." },
               { id: 'composureCoins', icon: <div className="w-8 h-8 mb-3 rounded-full border-[3px] border-yellow-500 bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />, count: userProgress.inventory.composureCoins, label: "Composure Coins", desc: "Kept a cool head under pressure. Use to snooze 1 deadline respectfully." },
               { id: 'anchorWeights', icon: <Anchor className="w-8 h-8 text-slate-400 mb-3" />, count: userProgress.inventory.anchorWeights, label: "Anchor Weights", desc: "Dug up the oldest tasks in your backlog and vanquished them." },
               { id: 'stretchTokens', icon: <Zap className="w-8 h-8 text-orange-400 mb-3" />, count: userProgress.inventory.stretchTokens, label: "Stretch Tokens", desc: "Completed Large or Extra Large goals natively without pushing." },
               { id: 'timeBenderHourglasses', icon: <Clock className="w-8 h-8 text-amber-500 mb-3" />, count: userProgress.inventory.timeBenderHourglasses, label: "Time Bender Hourglass", desc: "Estimated focus-time flawlessly to the minute. A master of time." },
               { id: 'goldenBookmarks', icon: <BookOpen className="w-8 h-8 text-yellow-300 mb-3" />, count: userProgress.inventory.goldenBookmarks, label: "Golden Bookmarks", desc: "Synthesizing and logging ideas directly from the deep work pipeline." },
               { id: 'embersOfContinuity', icon: <Flame className="w-8 h-8 text-red-500 mb-3" />, count: userProgress.inventory.embersOfContinuity, label: "Embers of Continuity", desc: "Earned by achieving 7 perfect execution days consecutively." },
             ].map(item => (
                <Card key={item.id} className={cn("border-border/50 relative overflow-hidden transition-all duration-300", item.count > 0 ? "bg-card hover:bg-muted/50 border-primary/20 shadow-sm" : "bg-muted/10 opacity-60 grayscale hover:grayscale-0")}>
                  <CardContent className="pt-6">
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground font-black text-xs px-2 py-1 rounded-full">{item.count}</div>
                    {item.icon}
                    <h3 className={cn("text-base font-bold", item.count === 0 && "text-muted-foreground")}>{item.label}</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
           </div>
         ) : (
           <div className="text-sm text-muted-foreground px-2">Initializing inventory...</div>
         )}
       </div>
 
       {/* Relic Forge */}
       <div className="flex flex-col gap-4 mt-6 mb-8">
         <div className="flex items-center gap-2">
           <Flame className="h-5 w-5 text-orange-500" />
           <h2 className="text-xl font-black tracking-tight">The Relic Forge</h2>
         </div>
         <p className="text-muted-foreground text-sm max-w-2xl px-2">Sacrifice your artifacts to forge permanent upgrades. Your artifacts will be consumed forever.</p>
         
         <div className="grid gap-4 md:grid-cols-2">
           <Card className="border-border/50 bg-card overflow-hidden">
             <CardHeader className="pb-2">
               <CardTitle className="text-base flex items-center gap-2">
                 <Moon className="w-4 h-4 text-slate-400" />
                 Midnight Obsidian Theme
               </CardTitle>
               <CardDescription>Permanently unlock the ultra-premium dark aesthetic.</CardDescription>
             </CardHeader>
             <CardContent>
               {userProgress?.unlockedRelics?.includes('midnight_obsidian') ? (
                 <div className="text-green-500 font-bold text-sm bg-green-500/10 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                   <Zap className="w-4 h-4" /> Unlocked
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm font-semibold">
                     <span className="text-muted-foreground">Cost:</span>
                     <span className={cn(userProgress?.inventory.freshStartTokens! >= 5 ? "text-green-500" : "text-red-400")}>5 Fresh Start Tokens</span>
                     <span className="text-muted-foreground">+</span>
                     <span className={cn(userProgress?.inventory.composureCoins! >= 5 ? "text-yellow-500" : "text-red-400")}>5 Composure Coins</span>
                   </div>
                   <Button 
                     disabled={!userProgress || userProgress.inventory.freshStartTokens < 5 || userProgress.inventory.composureCoins < 5} 
                     onClick={async () => {
                       if(userProgress) {
                         const n = {...userProgress};
                         n.inventory.freshStartTokens -= 5;
                         n.inventory.composureCoins -= 5;
                         n.unlockedRelics = [...(n.unlockedRelics || []), 'midnight_obsidian'];
                         await saveUserProgress(n);
                         refreshGamification();
                         toast({ title: "Relic Forged!", description: "Midnight Obsidian Theme unlocked." });
                       }
                     }}
                   >
                     Forge Relic
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>

           <Card className="border-border/50 bg-card overflow-hidden">
             <CardHeader className="pb-2">
               <CardTitle className="text-base flex items-center gap-2">
                 <ShieldIcon className="w-4 h-4 text-blue-400" />
                 Titanium Will Legacy
               </CardTitle>
               <CardDescription>A permanent badge of pure discipline.</CardDescription>
             </CardHeader>
             <CardContent>
               {userProgress?.unlockedRelics?.includes('titanium_will') ? (
                 <div className="text-green-500 font-bold text-sm bg-green-500/10 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                   <Zap className="w-4 h-4" /> Unlocked
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm font-semibold">
                     <span className="text-muted-foreground">Cost:</span>
                     <span className={cn(userProgress?.inventory.streakShields! >= 10 ? "text-blue-500" : "text-red-400")}>10 Streak Shields</span>
                   </div>
                   <Button 
                     disabled={!userProgress || userProgress.inventory.streakShields < 10} 
                     onClick={async () => {
                       if(userProgress) {
                         const n = {...userProgress};
                         n.inventory.streakShields -= 10;
                         n.unlockedRelics = [...(n.unlockedRelics || []), 'titanium_will'];
                         await saveUserProgress(n);
                         refreshGamification();
                         toast({ title: "Relic Forged!", description: "Titanium Will Badge unlocked." });
                       }
                     }}
                   >
                     Forge Relic
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
       </div>

       {/* Check for Legacy Badges */}
       {userProgress?.legacyBadges && userProgress.legacyBadges.length > 0 && (
         <div className="flex flex-col gap-4 mt-2 mb-8 bg-amber-500/5 rounded-2xl p-6 border border-amber-500/20">
           <div className="flex items-center gap-2 text-amber-500">
             <Trophy className="h-6 w-6" />
             <h2 className="text-xl font-black tracking-tight">Hall of Legacy</h2>
           </div>
           <p className="text-sm text-yellow-600/70 mb-2">Past seasonal victories immortalized forever.</p>
           <div className="flex flex-wrap gap-3">
             {userProgress.legacyBadges.map((badgeStr, i) => (
                <div key={i} className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-black text-xs shadow-sm shadow-amber-500/10">
                  {badgeStr.replace(/-/g, ' ').toUpperCase()}
                </div>
             ))}
           </div>
         </div>
       )}
 
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
