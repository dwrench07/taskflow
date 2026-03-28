
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getAllTasks, getDailyPlan, updateDailyPlanAsync } from "@/lib/data";
import { Task, Priority, EnergyLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, X, Plus, ChevronRight, BatteryLow, BatteryMedium, BatteryFull, Zap, CalendarCheck } from "lucide-react";
import { isSameDay, parseISO, isPast, isToday } from "date-fns";
import { getTodayEnergy, getEnergyMatch } from "@/lib/energy";
import { EnergyIndicator } from "@/components/energy-check-in";

const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-600/20 text-red-400 border-red-600/40",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  low: "bg-green-500/20 text-green-500 border-green-500/30",
};

const energyIcon = (level: EnergyLevel | null) => {
  if (level === 'low') return <BatteryLow className="h-3.5 w-3.5 text-red-400" />;
  if (level === 'medium') return <BatteryMedium className="h-3.5 w-3.5 text-yellow-400" />;
  if (level === 'high') return <BatteryFull className="h-3.5 w-3.5 text-green-400" />;
  return null;
};

function TaskRow({
  task,
  onRemove,
  onAdd,
  mode,
  energyMatch,
}: {
  task: Task;
  onRemove?: () => void;
  onAdd?: () => void;
  mode: 'approved' | 'suggestion';
  energyMatch?: 'match' | 'slight-mismatch' | 'mismatch' | null;
}) {
  const renderTitle = (title: string) => {
    const match = title.match(/^(.*)\s*—\s*(.*)$/);
    if (match) return (
      <span>{match[1]} <span className="text-muted-foreground font-normal opacity-70">— {match[2]}</span></span>
    );
    return title;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
      mode === 'approved' ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50",
      energyMatch === 'match' && "border-green-500/30",
      energyMatch === 'mismatch' && "opacity-50",
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{renderTitle(task.title)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize", priorityStyles[task.priority])}>
            {task.priority}
          </Badge>
          {task.energyLevel && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              {energyIcon(task.energyLevel as EnergyLevel)}
              {task.energyLevel}
            </span>
          )}
        </div>
      </div>
      {mode === 'approved' && onRemove && (
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      )}
      {mode === 'suggestion' && onAdd && (
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function PlanPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailyTaskIds, setDailyTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const currentEnergy = getTodayEnergy();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tasks, planIds] = await Promise.all([getAllTasks(), getDailyPlan().catch(() => [])]);
        setAllTasks(tasks || []);
        const ids = Array.isArray(planIds) ? planIds : [];
        setDailyTaskIds(ids);
        if (ids.length > 0) {
          setApprovedIds(ids);
          setStep('done');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Non-negotiables: doDate=today, endDate=today, overdue incomplete
  const nonNegotiables = useMemo(() => {
    return allTasks.filter(t => {
      if (t.isHabit || t.status === 'done') return false;
      const doToday = t.doDate && isSameDay(parseISO(t.doDate), today);
      const dueToday = t.endDate && isSameDay(parseISO(t.endDate), today);
      const overdue = t.endDate && isPast(parseISO(t.endDate)) && !isToday(parseISO(t.endDate));
      return doToday || dueToday || overdue;
    });
  }, [allTasks]);

  // Suggestions: backlog tasks not in non-negotiables, sorted by energy match + priority
  const suggestions = useMemo(() => {
    const nonNegIds = new Set(nonNegotiables.map(t => t.id));
    const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return allTasks
      .filter(t => !t.isHabit && t.status !== 'done' && !nonNegIds.has(t.id) && !t.doDate && !t.endDate)
      .sort((a, b) => {
        const aMatch = currentEnergy ? getEnergyMatch(a.energyLevel, currentEnergy) : 'slight-mismatch';
        const bMatch = currentEnergy ? getEnergyMatch(b.energyLevel, currentEnergy) : 'slight-mismatch';
        const matchOrder = { match: 0, 'slight-mismatch': 1, mismatch: 2 };
        const matchDiff = matchOrder[aMatch] - matchOrder[bMatch];
        if (matchDiff !== 0) return matchDiff;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 3);
  }, [allTasks, nonNegotiables, currentEnergy]);

  // Step 1: init approved from non-negotiables
  useEffect(() => {
    if (!loading && step === 1 && dailyTaskIds.length === 0) {
      setApprovedIds(nonNegotiables.map(t => t.id));
    }
  }, [loading, nonNegotiables]);

  const approvedTasks = useMemo(() =>
    approvedIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[],
    [approvedIds, allTasks]
  );

  const handleRemove = (id: string) => setApprovedIds(prev => prev.filter(x => x !== id));
  const handleAddSuggestion = (id: string) => {
    setApprovedIds(prev => [...prev, id]);
    setAddedSuggestionIds(prev => [...prev, id]);
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      await updateDailyPlanAsync(approvedIds, todayStr);
      setDailyTaskIds(approvedIds);
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await updateDailyPlanAsync([], todayStr);
      setDailyTaskIds([]);
      setApprovedIds(nonNegotiables.map(t => t.id));
      setAddedSuggestionIds([]);
      setStep(1);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Already planned today
  if (step === 'done') {
    return (
      <div className="flex flex-col gap-6 max-w-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Your Day</h1>
          <p className="text-muted-foreground text-sm mt-1">Today's plan is set. Head to the dashboard to execute.</p>
        </div>

        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm font-medium text-green-400">{approvedIds.length} task{approvedIds.length !== 1 ? 's' : ''} on today's plan</span>
        </div>

        <div className="space-y-2">
          {approvedTasks.map(task => (
            <TaskRow key={task.id} task={task} mode="approved" />
          ))}
        </div>

        <Button variant="outline" size="sm" className="self-start" onClick={handleReset} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Replan today
        </Button>
      </div>
    );
  }

  // Step 1: Non-negotiables review
  if (step === 1) {
    return (
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plan Your Day</h1>
            <p className="text-muted-foreground text-sm mt-1">Step 1 of 2 — Review today's committed work</p>
          </div>
          <EnergyIndicator />
        </div>

        {approvedTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl">
            Nothing scheduled for today. Add tasks via search or proceed to suggestions.
          </div>
        ) : (
          <div className="space-y-2">
            {approvedTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                mode="approved"
                onRemove={() => handleRemove(task.id)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            className="flex-1"
            onClick={() => setStep(2)}
          >
            Looks good ({approvedTasks.length} items)
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Suggestions
  const remainingSuggestions = suggestions.filter(s => !addedSuggestionIds.includes(s.id));

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Your Day</h1>
        <p className="text-muted-foreground text-sm mt-1">Step 2 of 2 — Want to add anything else?</p>
      </div>

      {remainingSuggestions.length > 0 ? (
        <div className="space-y-2">
          {remainingSuggestions.map(task => {
            const match = currentEnergy ? getEnergyMatch(task.energyLevel, currentEnergy) : null;
            return (
              <TaskRow
                key={task.id}
                task={task}
                mode="suggestion"
                energyMatch={match}
                onAdd={() => handleAddSuggestion(task.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
          No additional suggestions.
        </div>
      )}

      {addedSuggestionIds.length > 0 && (
        <p className="text-xs text-muted-foreground pl-1">
          {addedSuggestionIds.length} suggestion{addedSuggestionIds.length !== 1 ? 's' : ''} added
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={handleFinalize} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Skip, I'm ready
        </Button>
        {remainingSuggestions.length > 0 && (
          <Button className="flex-1" onClick={() => {
            remainingSuggestions.forEach(s => handleAddSuggestion(s.id));
          }}>
            <Zap className="h-4 w-4 mr-1.5" />
            Add all suggestions
          </Button>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleFinalize}
        disabled={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
        Finalize plan ({approvedIds.length} tasks)
      </Button>
    </div>
  );
}
