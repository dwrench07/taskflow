"use client";

import { useGamification } from "@/context/GamificationContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Shield, Sparkles, Anchor, Gem, BookOpen, Clock, Flame } from "lucide-react";

export function InventoryDock() {
  const { userProgress } = useGamification();

  if (!userProgress) return null;

  const { inventory, activeBuffs } = userProgress;

  const items = [
    { id: 'streakShields', icon: <Shield className="w-5 h-5 text-blue-500" />, count: inventory.streakShields, label: "Streak Shields", desc: "Protects a habit streak from breaking." },
    { id: 'predictionCrystals', icon: <Gem className="w-5 h-5 text-purple-400" />, count: inventory.predictionCrystals, label: "Prediction Crystals", desc: "Earned from conquering worries." },
    { id: 'freshStartTokens', icon: <Sparkles className="w-5 h-5 text-green-400" />, count: inventory.freshStartTokens, label: "Fresh Start Tokens", desc: "Forgives an overdue task without penalty." },
    { id: 'composureCoins', icon: <div className="w-5 h-5 rounded-full border-2 border-yellow-500 bg-yellow-500/20" />, count: inventory.composureCoins, label: "Composure Coins", desc: "Earned by keeping cool under pressure." },
    { id: 'anchorWeights', icon: <Anchor className="w-5 h-5 text-slate-400" />, count: inventory.anchorWeights, label: "Anchor Weights", desc: "Heavy effort applied to oldest tasks." },
    { id: 'stretchTokens', icon: <Zap className="w-5 h-5 text-orange-400" />, count: inventory.stretchTokens, label: "Stretch Tokens", desc: "Crushed a major task directly." },
    { id: 'timeBenderHourglasses', icon: <Clock className="w-5 h-5 text-amber-500" />, count: inventory.timeBenderHourglasses, label: "Time Bender Hourglass", desc: "Perfect time estimation." },
    { id: 'goldenBookmarks', icon: <BookOpen className="w-5 h-5 text-yellow-300" />, count: inventory.goldenBookmarks, label: "Golden Bookmarks", desc: "Synthesizing ideas during deep focus." },
    { id: 'embersOfContinuity', icon: <Flame className="w-5 h-5 text-red-500" />, count: inventory.embersOfContinuity, label: "Embers of Continuity", desc: "7+ perfect Daily Wins in a row." },
  ].filter(i => i.count > 0);

  if (items.length === 0 && activeBuffs.length === 0) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover/40 backdrop-blur-md border border-border/30 rounded-2xl p-2 px-4 flex items-center gap-2 z-50 text-muted-foreground text-xs font-semibold select-none">
        <Sparkles className="w-3 h-3" />
        Inventory Empty
      </div>
    );
  }
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 flex items-center gap-3 z-50">
      
      {/* Active Buffs Section */}
      {activeBuffs.length > 0 && (
        <div className="flex items-center gap-2 pr-3 border-r border-border/50">
          {activeBuffs.map((buff, i) => (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center justify-center p-2 rounded-xl bg-primary/20 animate-pulse ring-1 ring-primary/50">
                     <Zap className="w-5 h-5 text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-bold capitalize">{buff.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-xs text-muted-foreground">Expires {new Date(buff.expiresAt).toLocaleTimeString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Inventory Items Section */}
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger>
                <div className="relative flex items-center justify-center p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer group">
                  {item.icon}
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[11px] bg-primary group-hover:scale-110 transition-transform">
                    {item.count}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="mb-2">
                <p className="font-bold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

    </div>
  );
}
