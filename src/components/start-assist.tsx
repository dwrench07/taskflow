"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wind, Timer, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StartAssistStep = 'breathing' | 'commit' | 'done';

interface StartAssistProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function StartAssist({ open, onComplete, onSkip }: StartAssistProps) {
  const [step, setStep] = useState<StartAssistStep>('breathing');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(4);
  const [commitTime, setCommitTime] = useState(120); // 2 minutes
  const [commitActive, setCommitActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing cycle: 4s inhale, 4s hold, 4s exhale, 4s hold
  useEffect(() => {
    if (!open || step !== 'breathing') return;

    const timer = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          setBreathPhase(current => {
            if (current === 'inhale') return 'hold-in';
            if (current === 'hold-in') return 'exhale';
            if (current === 'exhale') return 'hold-out';
            // hold-out -> inhale (new cycle)
            setBreathCount(c => c + 1);
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, step]);

  // 2-minute commit timer
  useEffect(() => {
    if (!commitActive || step !== 'commit') return;

    intervalRef.current = setInterval(() => {
      setCommitTime(prev => {
        if (prev <= 1) {
          setStep('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [commitActive, step]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('breathing');
      setBreathPhase('inhale');
      setBreathCount(0);
      setPhaseTimer(4);
      setCommitTime(120);
      setCommitActive(false);
    }
  }, [open]);

  const breathLabel = {
    'inhale': 'Breathe In',
    'hold-in': 'Hold',
    'exhale': 'Breathe Out',
    'hold-out': 'Hold',
  }[breathPhase];

  const breathScale = {
    'inhale': 'scale-110',
    'hold-in': 'scale-110',
    'exhale': 'scale-75',
    'hold-out': 'scale-75',
  }[breathPhase];

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent className="sm:max-w-sm [&>button:last-child]:hidden">
        {step === 'breathing' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-cyan-400" />
                Box Breathing
              </DialogTitle>
              <DialogDescription>
                Your tension is high. Let&apos;s calm your nervous system first. Follow the circle.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-8 space-y-6">
              {/* Breathing circle */}
              <div className="relative flex items-center justify-center">
                <div className={cn(
                  "w-32 h-32 rounded-full border-4 transition-all duration-[4000ms] ease-in-out flex items-center justify-center",
                  breathPhase === 'inhale' || breathPhase === 'hold-in'
                    ? "border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
                    : "border-cyan-400/20 bg-cyan-400/5",
                  breathScale
                )}>
                  <div className="text-center">
                    <p className="text-2xl font-black text-cyan-400">{phaseTimer}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400/70">{breathLabel}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Cycle {breathCount + 1} of 3
              </p>

              {breathCount >= 2 ? (
                <Button onClick={() => { setStep('commit'); setCommitActive(true); }} className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Ready — Start 2-Minute Commit
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => { setStep('commit'); setCommitActive(true); }} className="text-xs text-muted-foreground">
                  Skip breathing
                </Button>
              )}
            </div>
          </>
        )}

        {step === 'commit' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                2-Minute Commit
              </DialogTitle>
              <DialogDescription>
                Just work for 2 minutes. No pressure to continue. Most people do.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-10 space-y-6">
              <div className="text-5xl font-black tabular-nums text-primary">
                {formatTime(commitTime)}
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((120 - commitTime) / 120) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Focus on just the first tiny step. Don&apos;t think about the whole task.
              </p>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                You did it!
              </DialogTitle>
              <DialogDescription>
                2 minutes down. The hardest part is starting.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Want to keep going?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onSkip}>
                  Take a break
                </Button>
                <Button onClick={onComplete} className="gap-2">
                  Keep going <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
