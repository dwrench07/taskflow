"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EnergyLevel } from "@/lib/types";
import { logEnergy, hasCheckedInToday, getTodayEnergy, getEnergyPatterns } from "@/lib/energy";
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ENERGY_OPTIONS: { level: EnergyLevel; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  { level: 'low', label: 'Low', icon: <BatteryLow className="h-8 w-8" />, color: 'text-red-400 border-red-500/30 hover:bg-red-500/10', description: 'Tired, foggy, need warmup tasks' },
  { level: 'medium', label: 'Medium', icon: <BatteryMedium className="h-8 w-8" />, color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10', description: 'Functional, can handle moderate work' },
  { level: 'high', label: 'High', icon: <BatteryFull className="h-8 w-8" />, color: 'text-green-400 border-green-500/30 hover:bg-green-500/10', description: 'Sharp, ready for deep work' },
];

interface EnergyCheckInProps {
  onComplete?: (level: EnergyLevel) => void;
}

export function EnergyCheckIn({ onComplete }: EnergyCheckInProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if not already checked in today
    if (!hasCheckedInToday()) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelect = (level: EnergyLevel) => {
    logEnergy(level);
    setIsOpen(false);
    onComplete?.(level);
  };

  const patterns = getEnergyPatterns();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-sm [&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Energy Check-In
          </DialogTitle>
          <DialogDescription>
            How&apos;s your energy right now? This helps match tasks to your current state.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {ENERGY_OPTIONS.map(opt => (
            <button
              key={opt.level}
              onClick={() => handleSelect(opt.level)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                opt.color
              )}
            >
              {opt.icon}
              <div>
                <div className="font-bold text-sm">{opt.label} Energy</div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Pattern insight if available */}
        {patterns && patterns.peakHour !== null && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
            <span className="font-semibold text-foreground/80">Pattern:</span> Your peak energy is usually around {patterns.peakHour}:00.
            {patterns.weekendAvg && patterns.weekdayAvg && patterns.weekendAvg !== patterns.weekdayAvg && (
              <> Weekends tend to be {patterns.weekendAvg} energy vs {patterns.weekdayAvg} on weekdays.</>
            )}
          </div>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground text-center py-1"
        >
          Skip for now
        </button>
      </DialogContent>
    </Dialog>
  );
}

// Inline energy indicator for use in headers/nav
export function EnergyIndicator() {
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);

  useEffect(() => {
    setEnergy(getTodayEnergy());
  }, []);

  if (!energy) return null;

  const config = ENERGY_OPTIONS.find(o => o.level === energy)!;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", config.color.split(' ')[0])}>
      {energy === 'low' ? <BatteryLow className="h-3.5 w-3.5" /> : energy === 'medium' ? <BatteryMedium className="h-3.5 w-3.5" /> : <BatteryFull className="h-3.5 w-3.5" />}
      {config.label}
    </div>
  );
}
