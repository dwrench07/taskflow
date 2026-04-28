"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Wind, PenLine, Timer, X, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GroundingMode = 'menu' | 'grounding-54321' | 'thought-dump' | 'surf-the-urge' | 'done';

// 5-4-3-2-1 grounding steps
const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', prompt: 'Name 5 things you can see right now', color: 'text-blue-400' },
  { count: 4, sense: 'HEAR', prompt: 'Name 4 things you can hear', color: 'text-green-400' },
  { count: 3, sense: 'FEEL', prompt: 'Name 3 things you can physically feel', color: 'text-yellow-400' },
  { count: 2, sense: 'SMELL', prompt: 'Name 2 things you can smell', color: 'text-orange-400' },
  { count: 1, sense: 'TASTE', prompt: 'Name 1 thing you can taste', color: 'text-red-400' },
];

export function GroundingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<GroundingMode>('menu');
  const [groundingStep, setGroundingStep] = useState(0);
  const [thoughtText, setThoughtText] = useState("");
  const [surgeTimer, setSurgeTimer] = useState(90);
  const [surgeActive, setSurgeActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on close
  const handleClose = () => {
    setIsOpen(false);
    setMode('menu');
    setGroundingStep(0);
    setThoughtText("");
    setSurgeTimer(90);
    setSurgeActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Surf the urge timer
  useEffect(() => {
    if (!surgeActive) return;
    intervalRef.current = setInterval(() => {
      setSurgeTimer(prev => {
        if (prev <= 1) {
          setSurgeActive(false);
          setMode('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [surgeActive]);

  const surgeProgress = ((90 - surgeTimer) / 90) * 100;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title="Grounding & Calm"
      >
        <Shield className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="sm:max-w-sm [&>button:last-child]:hidden">

          {/* Menu */}
          {mode === 'menu' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-400" />
                  Calm Down
                </DialogTitle>
                <DialogDescription>
                  Choose what feels right. There&apos;s no wrong choice.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-3">
                <button
                  onClick={() => { setMode('grounding-54321'); setGroundingStep(0); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left"
                >
                  <Wind className="h-6 w-6 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">5-4-3-2-1 Grounding</p>
                    <p className="text-xs text-muted-foreground">Reconnect with your senses</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>

                <button
                  onClick={() => setMode('thought-dump')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-left"
                >
                  <PenLine className="h-6 w-6 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Thought Dump</p>
                    <p className="text-xs text-muted-foreground">Get the intrusive thought out of your head</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>

                <button
                  onClick={() => { setMode('surf-the-urge'); setSurgeActive(true); setSurgeTimer(90); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5 transition-all text-left"
                >
                  <Timer className="h-6 w-6 text-green-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Surf the Urge</p>
                    <p className="text-xs text-muted-foreground">90 seconds — emotions peak then pass</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>
              </div>

              <button onClick={handleClose} className="text-xs text-muted-foreground hover:text-foreground text-center py-1">
                I&apos;m okay, close this
              </button>
            </>
          )}

          {/* 5-4-3-2-1 Grounding */}
          {mode === 'grounding-54321' && groundingStep < GROUNDING_STEPS.length && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-blue-400" />
                  5-4-3-2-1 Grounding
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col items-center py-8 space-y-6">
                {/* Progress dots */}
                <div className="flex gap-2">
                  {GROUNDING_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        i < groundingStep ? "bg-blue-400" : i === groundingStep ? "bg-blue-400 scale-150" : "bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>

                <div className={cn("text-6xl font-black", GROUNDING_STEPS[groundingStep].color)}>
                  {GROUNDING_STEPS[groundingStep].count}
                </div>

                <div className="text-center space-y-1">
                  <p className={cn("text-xs font-black uppercase tracking-[0.3em]", GROUNDING_STEPS[groundingStep].color)}>
                    {GROUNDING_STEPS[groundingStep].sense}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {GROUNDING_STEPS[groundingStep].prompt}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground/50">Take your time. Say them out loud or in your head.</p>

                <Button
                  onClick={() => {
                    if (groundingStep < GROUNDING_STEPS.length - 1) {
                      setGroundingStep(s => s + 1);
                    } else {
                      setMode('done');
                    }
                  }}
                  className="gap-2"
                >
                  {groundingStep < GROUNDING_STEPS.length - 1 ? 'Next' : 'Done'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Thought Dump */}
          {mode === 'thought-dump' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-amber-400" />
                  Thought Dump
                </DialogTitle>
                <DialogDescription>
                  Write down whatever is spiraling. Getting it out of your head reduces its power.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <Textarea
                  placeholder="What's consuming your mind right now?"
                  value={thoughtText}
                  onChange={(e) => setThoughtText(e.target.value)}
                  className="min-h-[150px] resize-none"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  This won&apos;t be saved anywhere. It&apos;s just for you, right now.
                </p>
                <Button onClick={() => setMode('done')} className="w-full">
                  I got it out — I feel better
                </Button>
              </div>
            </>
          )}

          {/* Surf the Urge */}
          {mode === 'surf-the-urge' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-green-400" />
                  Surf the Urge
                </DialogTitle>
                <DialogDescription>
                  Emotions peak at ~90 seconds, then naturally decline. Just wait.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center py-10 space-y-6">
                <div className="relative">
                  {/* Circular progress */}
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="currentColor"
                      className="text-muted-foreground/10"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="currentColor"
                      className="text-green-400 transition-all duration-1000 ease-linear"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${surgeProgress * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-black tabular-nums text-green-400">{surgeTimer}s</span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">
                    {surgeTimer > 60 ? "The wave is building..." : surgeTimer > 30 ? "Almost at the peak..." : "It's passing now..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notice the feeling without acting on it.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Done */}
          {mode === 'done' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  Well done
                </DialogTitle>
                <DialogDescription>
                  You handled that. Ready to refocus?
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center py-6 space-y-4">
                <Button onClick={handleClose} className="w-full">
                  Back to what I was doing
                </Button>
                <button
                  onClick={() => setMode('menu')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Try another technique
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
