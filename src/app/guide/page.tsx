"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Shield, Sparkles, Zap, Flame, Snowflake, Trophy, ListTodo, 
  Timer, Target, RefreshCw, Box, Ghost, HelpCircle, ArrowUpCircle,
  Gem, Coins, Anchor, Scissors, Clock, Sun, Bookmark, FlameKindling
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GAME_RULES = {
  inventory: [
    { name: "Streak Shields", icon: Shield, color: "text-blue-400", desc: "Prevents a habit streak from resetting if you miss a day. Used automatically when you miss a habitual commitment.", earn: "Earned for every 10 days of a consistent habit streak." },
    { name: "Fresh Start Tokens", icon: RefreshCw, color: "text-emerald-400", desc: "Used to clear all overdue do-dates and end-dates from a task, allowing you to restart without baggage.", earn: "Earned by logging mistakes and feedback in the Deep Store." },
    { name: "Composure Coins", icon: Coins, color: "text-amber-400", desc: "Pushes a task deadline by exactly 24 hours with a respectful snooze.", earn: "Earned by finishing tasks that you previously pushed under pressure." },
    { name: "Prediction Crystals", icon: Sparkles, color: "text-purple-400", desc: "Used to feed the Bonsai. Represents your growing ability to predict your own anxiety.", earn: "Earned when a Worry Jot (anxiety) turns out to be inaccurate." },
    { name: "Anchor Weights", icon: Anchor, color: "text-indigo-400", desc: "Feed these to your Bonsai for massive XP. They represent clearing old backlog items.", earn: "Earned by completing one of your 3 oldest pending tasks." },
    { name: "Stretch Tokens", icon: Scissors, color: "text-rose-400", desc: "Represents pushing past your comfort zone.", earn: "Earned by completing Large (L) or Extra Large (XL) tasks without pushing the date even once." },
    { name: "Hourglasses", icon: Clock, color: "text-cyan-400", desc: "Perfect for time-bending growth.", earn: "Earned by finishing a focus session within 5 minutes of your expected time limit." },
    { name: "Dawn Diamonds", icon: Sun, color: "text-orange-400", desc: "Rare energy gems.", earn: "Earned by completing high-energy tasks before 10 AM." },
    { name: "Golden Bookmarks", icon: Bookmark, color: "text-yellow-400", desc: "Represents synthesized knowledge.", earn: "Earned by logging Jots (ideas) during a Pomodoro focus session." },
    { name: "Embers of Continuity", icon: FlameKindling, color: "text-orange-600", desc: "Huge Bonsai XP. Keeps the fire burning.", earn: "Rare drop during the Daily Review for maintaining perfect attendance." },
  ],
  buffs: [
    { name: "Zen Mode", icon: Ghost, color: "text-cyan-400", effect: "Silences all non-essential UI and increases focus XP gains.", trigger: "Complete your first task of the day before 9:30 AM." },
    { name: "Laser Overdrive", icon: Zap, color: "text-yellow-400", effect: "Double XP multiplier for all focus sessions and tasks.", trigger: "Complete a 50+ minute focus session with 0 distractions." },
    { name: "Momentum Surge", icon: ArrowUpCircle, color: "text-emerald-400", effect: "XP boost and smoother task transitions.", trigger: "Complete the final subtask of a complex task." },
    { name: "Brain Fuel", icon: Sparkles, color: "text-pink-400", effect: "Reduces fatigue penalty and increases clarity.", trigger: "Complete a focus session longer than 60 minutes." },
  ],
  status: [
    { name: "Frozen State", icon: Snowflake, color: "text-blue-300", desc: "If you don't log in for 3 days, your 'Campfire' freezes. XP gains are reduced until you log a win.", fix: "Log into the app and complete any task or habit." },
    { name: "Seasonal Reset", icon: RefreshCw, color: "text-slate-400", desc: "Every 30 days, your XP and Level reset to 1. Your top-tier badges are archived as Legacy Relics.", why: "Prevents numbers from getting too large and keeps the growth feeling fresh." },
  ]
};

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          <HelpCircle className="h-10 w-10 text-primary" />
          The Strategy Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          Master the hidden mechanics of Taskflow and evolve your Digital Bonsai.
        </p>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="bg-muted border border-border p-1 h-12">
          <TabsTrigger value="inventory" className="gap-2 px-6">
            <Box className="h-4 w-4" />
            Inventory & Loot
          </TabsTrigger>
          <TabsTrigger value="buffs" className="gap-2 px-6">
            <Sparkles className="h-4 w-4" />
            Buffs & Triggers
          </TabsTrigger>
          <TabsTrigger value="world" className="gap-2 px-6">
            <Flame className="h-4 w-4" />
            The World State
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAME_RULES.inventory.map((item) => (
              <Card key={item.name} className="bg-card border-border hover:border-primary/30 transition-all group overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-3 rounded-xl bg-muted/50 ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-muted">Consumable</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">How to Earn</p>
                    <p className="text-xs text-foreground/70 italic">"{item.earn}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="buffs" className="space-y-4">
           <div className="grid grid-cols-1 gap-4">
            {GAME_RULES.buffs.map((buff) => (
              <Card key={buff.name} className="bg-card border-border border-l-4 border-l-primary/30 hover:border-primary transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                   <div className={`p-5 rounded-2xl bg-muted/50 ${buff.color}`}>
                     <buff.icon className="h-10 w-10" />
                   </div>
                   <div className="flex-1 space-y-2 text-center md:text-left">
                      <h3 className="text-2xl font-bold">{buff.name}</h3>
                      <p className="text-foreground/80 leading-relaxed max-w-lg">{buff.effect}</p>
                      <div className="flex items-center gap-2 pt-2 justify-center md:justify-start">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-primary italic">Trigger: {buff.trigger}</span>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
           </div>
        </TabsContent>

        <TabsContent value="world" className="space-y-4">
           {GAME_RULES.status.map((status) => (
              <Card key={status.name} className="bg-muted/10 border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <status.icon className={`h-6 w-6 ${status.color}`} />
                      <CardTitle>{status.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">World Logic</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-foreground/90">{status.desc}</p>
                  {status.fix && (
                    <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <RefreshCw className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">The Antidote</p>
                        <p className="text-sm text-foreground/80">{status.fix}</p>
                      </div>
                    </div>
                  )}
                  {status.why && (
                     <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <Target className="h-4 w-4 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Design Rationale</p>
                        <p className="text-sm text-foreground/80">{status.why}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
           ))}

           <Card className="bg-primary border-none text-primary-foreground shadow-2xl">
             <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8">
                <Trophy className="h-24 w-24 opacity-80 shrink-0" />
                <div className="space-y-4">
                   <h3 className="text-3xl font-black">The Ultimate Goal: The Ancient Bonsai</h3>
                   <p className="text-lg opacity-90 leading-relaxed">
                     Every action you take in this app—every checked box, every focused minute, and every logged mistake—is fuel for your Digital Bonsai. Leveling up your tree unlocks hidden themes, rare relics, and eventually, the <strong>Ancient Bonsai stage</strong> (Level 50). 
                   </p>
                   <p className="text-sm font-bold opacity-80 uppercase tracking-widest">
                     The items in your inventory are the only way to feed it. Use them wisely.
                   </p>
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      <div className="pt-10 flex justify-center">
         <p className="text-xs text-muted-foreground italic font-medium">"Growth is not linear. It is a spiral." — The Architect</p>
      </div>
    </div>
  );
}
