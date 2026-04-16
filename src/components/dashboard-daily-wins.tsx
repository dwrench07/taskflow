"use client";

import { useGamification } from "@/context/GamificationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, Flame, Trophy, Brain, Zap, Layers, PenLine, Send } from "lucide-react";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";
import { getLevel, updatePersonalBests } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "What's one thing you did today that your past self would be proud of?",
  "Finish this: Today I showed up as someone who…",
  "What resistance did you push through today?",
  "In one sentence — what kind of person did today's actions reflect?",
  "What small thing did you do today that actually mattered?",
];

const STORAGE_KEY = "daily-win-log";

interface WinEntry {
  date: string; // yyyy-MM-dd
  text: string;
}

function getTodayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export function DashboardDailyWins() {
  const { dailyWins, todayXP, totalXP, level, userProgress } = useGamification();
  const [winText, setWinText] = useState("");
  const [saved, setSaved] = useState(false);
  const [existingEntry, setExistingEntry] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const todayKey = getTodayKey();
  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const entry: WinEntry = JSON.parse(raw);
        if (entry.date === todayKey) {
          setExistingEntry(entry.text);
          setSaved(true);
        }
      }
    } catch {}
  }, [todayKey]);

  const handleSave = () => {
    const text = winText.trim();
    if (!text) return;
    const entry: WinEntry = { date: todayKey, text };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setExistingEntry(text);
    setSaved(true);
    setEditing(false);
    setWinText("");
  };

  const hasActivity = dailyWins.tasksCompleted > 0 || dailyWins.habitsCompleted > 0 ||
    dailyWins.focusMinutes > 0 || dailyWins.subtasksCompleted > 0;

  const wins: { icon: React.ReactNode; text: string }[] = [];
  if (dailyWins.tasksCompleted > 0)
    wins.push({ icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />, text: `Completed ${dailyWins.tasksCompleted} task${dailyWins.tasksCompleted > 1 ? 's' : ''}` });
  if (dailyWins.subtasksCompleted > 0)
    wins.push({ icon: <Layers className="h-3.5 w-3.5 text-indigo-400" />, text: `Knocked out ${dailyWins.subtasksCompleted} subtask${dailyWins.subtasksCompleted > 1 ? 's' : ''}` });
  if (dailyWins.habitsCompleted > 0)
    wins.push({ icon: <Flame className="h-3.5 w-3.5 text-orange-400" />, text: `Maintained ${dailyWins.habitsCompleted} habit${dailyWins.habitsCompleted > 1 ? 's' : ''}` });
  if (dailyWins.frogsEaten > 0)
    wins.push({ icon: <Zap className="h-3.5 w-3.5 text-yellow-400" />, text: `Ate ${dailyWins.frogsEaten} frog${dailyWins.frogsEaten > 1 ? 's' : ''}` });
  if (dailyWins.streaksMaintained > 0)
    wins.push({ icon: <Trophy className="h-3.5 w-3.5 text-amber-400" />, text: `${dailyWins.streaksMaintained} streak${dailyWins.streaksMaintained > 1 ? 's' : ''} alive` });
  if (dailyWins.focusMinutes > 0)
    wins.push({ icon: <Brain className="h-3.5 w-3.5 text-cyan-400" />, text: `${Math.round(dailyWins.focusMinutes)} min deep work` });

  return (
    <Card className="border-border/50 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Today&apos;s Wins
          <WidgetInfo description={WIDGET_DESCRIPTIONS["daily-wins"]} />
          {todayXP > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary">
              +{todayXP} XP
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity wins */}
        {!hasActivity ? (
          <p className="text-xs text-muted-foreground">No wins yet today. You got this.</p>
        ) : (
          <div className="space-y-2">
            {wins.map((win, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {win.icon}
                <span className="text-foreground/80">{win.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Personal Bests */}
        {(() => {
          const bests = userProgress?.personalBests;
          if (!bests) return null;
          const { newRecords } = updatePersonalBests(bests, dailyWins, 0);
          const records = [
            { key: 'maxTasksInDay', label: 'Tasks in a day', value: bests.maxTasksInDay, isNew: newRecords.includes('maxTasksInDay') },
            { key: 'maxFocusMinutes', label: 'Focus minutes', value: bests.maxFocusMinutes, isNew: newRecords.includes('maxFocusMinutes') },
            { key: 'maxFrogsInDay', label: 'Frogs in a day', value: bests.maxFrogsInDay, isNew: newRecords.includes('maxFrogsInDay') },
            { key: 'longestStreak', label: 'Longest streak', value: bests.longestStreak, isNew: newRecords.includes('longestStreak') },
          ].filter(r => r.value > 0);

          if (records.length === 0) return null;

          return (
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personal Bests</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {records.map(r => (
                  <div key={r.key} className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs", r.isNew ? "bg-primary/10 border border-primary/20" : "bg-muted/20")}>
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-black flex items-center gap-1">
                      {r.value}
                      {r.isNew && <Badge variant="default" className="text-[8px] px-1 py-0 h-3.5">NEW</Badge>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Daily Win Log — identity-affirming reflection */}
        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center gap-1.5">
            <PenLine className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Win Log</span>
          </div>

          {saved && existingEntry && !editing ? (
            <div
              className="text-xs text-foreground/80 italic bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5 leading-relaxed cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => { setEditing(true); setWinText(existingEntry); setTimeout(() => inputRef.current?.focus(), 50); }}
              title="Click to edit"
            >
              &ldquo;{existingEntry}&rdquo;
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground/80 italic leading-snug">{prompt}</p>
              <textarea
                ref={inputRef}
                value={winText}
                onChange={e => setWinText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
                placeholder="Write one sentence…"
                rows={2}
                className={cn(
                  "w-full text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 resize-none",
                  "placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-primary/5 transition-colors"
                )}
              />
              <button
                onClick={handleSave}
                disabled={!winText.trim()}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                  winText.trim()
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                <Send className="h-3 w-3" /> Save Win
              </button>
            </div>
          )}
        </div>

        {/* XP / Level bar */}
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-muted-foreground uppercase tracking-wider">
              Level {level.level}
            </span>
            <span className="text-muted-foreground">
              {level.currentXP} / {level.nextLevelXP} XP
            </span>
          </div>
          <Progress value={level.progress} className="h-1.5" />
          <div className="text-[10px] text-muted-foreground text-right">
            {totalXP.toLocaleString()} XP total
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
