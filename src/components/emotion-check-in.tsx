"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { EmotionLabel, EmotionCheckIn } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMOTIONS: { value: EmotionLabel; label: string; emoji: string; color: string }[] = [
  { value: 'dread', label: 'Dread', emoji: '😰', color: 'border-red-500/40 bg-red-500/10 text-red-400' },
  { value: 'anxiety', label: 'Anxiety', emoji: '😟', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
  { value: 'resistance', label: 'Resistance', emoji: '😤', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { value: 'overwhelm', label: 'Overwhelm', emoji: '🌊', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
  { value: 'calm', label: 'Calm', emoji: '😌', color: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400' },
  { value: 'excited', label: 'Excited', emoji: '🔥', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
];

interface EmotionCheckInModalProps {
  open: boolean;
  onComplete: (checkIn: EmotionCheckIn) => void;
  onSkip: () => void;
  title?: string;
  description?: string;
}

export function EmotionCheckInModal({ open, onComplete, onSkip, title, description }: EmotionCheckInModalProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(null);
  const [bodyTension, setBodyTension] = useState(5);

  const handleSubmit = () => {
    if (!selectedEmotion) return;
    onComplete({
      emotion: selectedEmotion,
      bodyTension,
      timestamp: new Date().toISOString(),
    });
    setSelectedEmotion(null);
    setBodyTension(5);
  };

  const tensionLabel = bodyTension <= 3 ? 'Relaxed' : bodyTension <= 6 ? 'Some tension' : bodyTension <= 8 ? 'Tense' : 'Very tense';
  const tensionColor = bodyTension <= 3 ? 'text-green-400' : bodyTension <= 6 ? 'text-yellow-400' : bodyTension <= 8 ? 'text-orange-400' : 'text-red-400';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle>{title || "How are you feeling?"}</DialogTitle>
          <DialogDescription>
            {description || "Naming your emotion helps reduce its intensity. Be honest."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Emotion picker */}
          <div className="grid grid-cols-4 gap-2">
            {EMOTIONS.map(e => (
              <button
                key={e.value}
                onClick={() => setSelectedEmotion(e.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center",
                  selectedEmotion === e.value
                    ? e.color + " scale-105 shadow-md"
                    : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-2xl">{e.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{e.label}</span>
              </button>
            ))}
          </div>

          {/* Body tension slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Body Tension</label>
              <span className={cn("text-sm font-bold", tensionColor)}>
                {bodyTension}/10 — {tensionLabel}
              </span>
            </div>
            <Slider
              value={[bodyTension]}
              onValueChange={([v]) => setBodyTension(v)}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/50 px-1">
              <span>Completely relaxed</span>
              <span>Maximum tension</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onSkip} className="flex-1">
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEmotion}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline version for post-session
export function EmotionCheckInInline({ onComplete }: { onComplete: (checkIn: EmotionCheckIn) => void }) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(null);
  const [bodyTension, setBodyTension] = useState(5);

  const handleSelect = (emotion: EmotionLabel) => {
    setSelectedEmotion(emotion);
    onComplete({
      emotion,
      bodyTension,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {EMOTIONS.map(e => (
          <button
            key={e.value}
            onClick={() => handleSelect(e.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium",
              selectedEmotion === e.value
                ? e.color
                : "border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            <span>{e.emoji}</span>
            {e.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Body tension</span>
          <span className="text-xs font-medium">{bodyTension}/10</span>
        </div>
        <Slider
          value={[bodyTension]}
          onValueChange={([v]) => {
            setBodyTension(v);
            if (selectedEmotion) {
              onComplete({ emotion: selectedEmotion, bodyTension: v, timestamp: new Date().toISOString() });
            }
          }}
          min={1}
          max={10}
          step={1}
        />
      </div>
    </div>
  );
}

// Helper to get emotion config
export function getEmotionConfig(emotion: EmotionLabel) {
  return EMOTIONS.find(e => e.value === emotion) || EMOTIONS[5]; // default neutral
}

export { EMOTIONS };
