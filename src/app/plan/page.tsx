
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getAllTasks, getDailyPlan, updateDailyPlanAsync, getAllChores } from "@/lib/data";
import { useRefresh } from "@/context/RefreshContext";
import { Task, Priority, EnergyLevel, Chore } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
  CalendarCheck,
  GripVertical,
  Repeat,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { isSameDay, parseISO, isPast, isToday, format, differenceInCalendarDays, startOfDay, addDays, subDays } from "date-fns";
import { getTodayEnergy, getEnergyMatch } from "@/lib/energy";
import { EnergyIndicator } from "@/components/energy-check-in";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

type UnifiedItem = {
  id: string;
  title: string;
  priority: Priority;
  energyLevel?: EnergyLevel;
  type: 'task' | 'habit' | 'chore';
  completed?: boolean;
};

function SortableTaskRow({
  item,
  onRemove,
  onAdd,
  mode,
  energyMatch,
}: {
  item: UnifiedItem;
  onRemove?: () => void;
  onAdd?: () => void;
  mode: 'approved' | 'suggestion';
  energyMatch?: 'match' | 'slight-mismatch' | 'mismatch' | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const renderTitle = (title: string) => {
    const match = title.match(/^(.*)\s*—\s*(.*)$/);
    if (match) return (
      <span>{match[1]} <span className="text-muted-foreground font-normal opacity-70">— {match[2]}</span></span>
    );
    return title;
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group",
        mode === 'approved' ? "bg-card border-border shadow-sm" : "bg-muted/10 border-border/50",
        energyMatch === 'match' && "border-green-500/30",
        energyMatch === 'mismatch' && "opacity-50",
        isDragging && "shadow-lg border-primary/50"
      )}
    >
      {mode === 'approved' && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-muted-foreground opacity-40 group-hover:opacity-100 touch:opacity-70 transition-opacity">
          <GripVertical className="h-5 w-5" />
        </div>
      )}
      
      <div className="flex-shrink-0">
        {item.type === 'habit' && <Repeat className="h-4 w-4 text-primary/70" />}
        {item.type === 'chore' && <ShoppingBag className="h-4 w-4 text-orange-400/70" />}
        {item.type === 'task' && <CheckCircle2 className="h-4 w-4 text-muted-foreground/50" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{renderTitle(item.title)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize", priorityStyles[item.priority])}>
            {item.priority}
          </Badge>
          {item.energyLevel && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              {energyIcon(item.energyLevel)}
              {item.energyLevel}
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
  const [allChores, setAllChores] = useState<Chore[]>([]);
  const [dailyTaskIds, setDailyTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const { refreshKey } = useRefresh();

  const currentEnergy = getTodayEnergy();
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isActualToday = isSameDay(selectedDate, new Date());

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tasks, chores, planIds] = await Promise.all([
          getAllTasks(), 
          getAllChores(),
          getDailyPlan(selectedDateStr).catch(() => [])
        ]);
        
        setAllTasks(tasks || []);
        setAllChores(chores || []);
        
        const ids = Array.isArray(planIds) ? planIds : [];
        setDailyTaskIds(ids);
        
        if (ids.length > 0) {
          setApprovedIds(ids);
          setStep('done');
        } else {
          setApprovedIds([]);
          setStep(1);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDateStr, refreshKey]);

  // Unified items lookup
  const unifiedItemsMap = useMemo(() => {
    const map = new Map<string, UnifiedItem>();
    allTasks.filter(t => t.status !== 'abandoned').forEach(t => map.set(t.id, {
      id: t.id,
      title: t.title,
      priority: t.priority,
      energyLevel: t.energyLevel,
      type: t.isHabit ? 'habit' : 'task',
      completed: t.status === 'done',
    }));
    allChores.forEach(c => map.set(c.id, {
      id: c.id,
      title: c.title,
      priority: c.priority,
      energyLevel: c.energyLevel,
      type: 'chore',
      completed: !!c.lastCompleted && isSameDay(parseISO(c.lastCompleted), selectedDate),
    }));
    return map;
  }, [allTasks, allChores, selectedDate]);

  // Non-negotiables
  const nonNegotiables = useMemo(() => {
    const committedTasks = allTasks.filter(t => {
      if (t.status === 'done' || t.status === 'abandoned') return false; // keep existing done-task filter here for suggestions
      if (t.isHabit) return true; // habits are always daily suggestions
      
      const doToday = t.doDate && isSameDay(parseISO(t.doDate), selectedDate);
      const dueToday = t.endDate && isSameDay(parseISO(t.endDate), selectedDate);
      const overdue = t.endDate && isPast(parseISO(t.endDate)) && !isSameDay(parseISO(t.endDate), selectedDate);
      return doToday || dueToday || overdue;
    });

    const committedChores = allChores.filter(c => {
      if (!c.lastCompleted) return true;
      const last = parseISO(c.lastCompleted);
      const dateStart = startOfDay(selectedDate);
      const diff = differenceInCalendarDays(dateStart, last);
      
      const isDue = (c.frequency === 'daily' && diff >= 1) ||
                    (c.frequency === 'weekly' && diff >= 7) ||
                    (c.frequency === 'monthly' && diff >= 30);
                    
      return isDue || c.priority === 'urgent' || c.priority === 'high';
    });

    return [
      ...committedTasks.map(t => unifiedItemsMap.get(t.id)),
      ...committedChores.map(c => unifiedItemsMap.get(c.id))
    ].filter(Boolean) as UnifiedItem[];
  }, [allTasks, allChores, unifiedItemsMap]);

  // Suggestions pool
  const suggestions = useMemo(() => {
    const approvedSet = new Set(approvedIds);
    const nonNegIds = new Set(nonNegotiables.map(t => t.id));
    
    return Array.from(unifiedItemsMap.values())
      .filter(item => !approvedSet.has(item.id) && !nonNegIds.has(item.id) && !item.completed)
      .sort((a, b) => {
        const aMatch = currentEnergy ? getEnergyMatch(a.energyLevel, currentEnergy) : 'slight-mismatch';
        const bMatch = currentEnergy ? getEnergyMatch(b.energyLevel, currentEnergy) : 'slight-mismatch';
        const matchOrder = { match: 0, 'slight-mismatch': 1, mismatch: 2 };
        const matchDiff = matchOrder[aMatch] - matchOrder[bMatch];
        if (matchDiff !== 0) return matchDiff;
        
        const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }, [unifiedItemsMap, approvedIds, nonNegotiables, currentEnergy]);

  // Initial populate
  useEffect(() => {
    if (!loading && step === 1 && dailyTaskIds.length === 0) {
      setApprovedIds(nonNegotiables.map(t => t.id));
    }
  }, [loading, nonNegotiables]);

  const approvedItemsList = useMemo(() =>
    approvedIds.map(id => unifiedItemsMap.get(id)).filter(Boolean) as UnifiedItem[],
    [approvedIds, unifiedItemsMap]
  );

  const handleRemove = (id: string) => setApprovedIds(prev => prev.filter(x => x !== id));
  const handleAddSuggestion = (id: string) => {
    setApprovedIds(prev => [...prev, id]);
    setAddedSuggestionIds(prev => [...prev, id]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setApprovedIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      await updateDailyPlanAsync(approvedIds, selectedDateStr);
      setDailyTaskIds(approvedIds);
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await updateDailyPlanAsync([], selectedDateStr);
      setDailyTaskIds([]);
      setApprovedIds(nonNegotiables.map(t => t.id));
      setAddedSuggestionIds([]);
      setStep(1);
    } finally {
      setSaving(false);
    }
  };

  const renderDateSelector = () => (
    <div className="flex items-center gap-2 mb-2 bg-muted/30 w-fit rounded-full p-1 border">
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 text-sm font-semibold px-2 min-w-[100px] text-center hover:text-primary transition-colors">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            {isActualToday ? "Today" : format(selectedDate, 'MMM d, yyyy')}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setCalendarOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderActivePlan = () => {
    const activeItems = approvedItemsList.filter(i => !i.completed);
    const completedItems = approvedItemsList.filter(i => i.completed);

    return (
      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeItems.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {activeItems.map(item => (
              <SortableTaskRow
                key={item.id}
                item={item}
                mode="approved"
                onRemove={step !== 'done' ? () => handleRemove(item.id) : undefined}
              />
            ))}
          </SortableContext>
        </DndContext>

        {activeItems.length === 0 && completedItems.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl">
            Nothing in the plan. Add items below or proceed to suggestions.
          </div>
        )}

        {step === 'done' && completedItems.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-2 w-full"
            >
              <div className="flex-1 h-px bg-border/50" />
              <span className="flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500/70" />
                Completed ({completedItems.length})
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !showCompleted && "-rotate-90")} />
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </button>
            {showCompleted && (
              <div className="space-y-2">
                {completedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 bg-muted/5 opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <div className="flex-shrink-0">
                      {item.type === 'habit' && <Repeat className="h-4 w-4 text-primary/40" />}
                      {item.type === 'chore' && <ShoppingBag className="h-4 w-4 text-orange-400/40" />}
                    </div>
                    <span className="text-sm line-through text-muted-foreground">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Already planned today
  if (step === 'done') {
    return (
      <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2">
        <div>
          {renderDateSelector()}
          <h1 className="text-3xl font-bold tracking-tight">Agenda Ready</h1>
          <p className="text-muted-foreground text-sm mt-1">Your unified plan for {format(selectedDate, 'MMMM do')}.</p>
        </div>

        {(() => {
          const completedCount = approvedItemsList.filter(i => i.completed).length;
          const totalCount = approvedItemsList.length;
          const allDone = completedCount === totalCount && totalCount > 0;
          return (
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 border",
              allDone
                ? "bg-green-500/10 border-green-500/20"
                : "bg-muted/30 border-border/50"
            )}>
              {allDone
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : <Zap className="h-4 w-4 text-primary shrink-0" />
              }
              <span className={cn("text-sm font-medium", allDone ? "text-green-400" : "text-foreground")}>
                {completedCount > 0
                  ? `${completedCount} of ${totalCount} completed`
                  : `${totalCount} items planned`
                }
              </span>
            </div>
          );
        })()}

        {renderActivePlan()}

        <div className="flex flex-col gap-3">
          <Button variant="outline" size="sm" className="self-start" onClick={handleReset} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Full Replan
          </Button>
          <Button variant="ghost" size="sm" className="self-start text-muted-foreground" onClick={() => setStep(2)}>
            Add More Items
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Commit Review
  if (step === 1) {
    return (
      <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-right-2">
        <div className="flex items-start justify-between">
          <div>
            {renderDateSelector()}
            <h1 className="text-3xl font-bold tracking-tight">Plan Your Day</h1>
            <p className="text-muted-foreground text-sm mt-1">Step 1: Organize your committed work</p>
          </div>
          <EnergyIndicator />
        </div>

        {renderActivePlan()}

        <div className="flex items-center gap-3 pt-2">
          <Button
            className="flex-1 h-12 text-base"
            onClick={() => setStep(2)}
            disabled={approvedItemsList.length === 0}
          >
            Organize & Enhance
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Suggestions & Refinement
  return (
    <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-right-2">
      <div>
        {renderDateSelector()}
        <h1 className="text-3xl font-bold tracking-tight">Enhance Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">Step 2: Drag to prioritize and add extras.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">Active Plan (Drag to reorder)</h3>
        {renderActivePlan()}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map(item => {
              const match = currentEnergy ? getEnergyMatch(item.energyLevel, currentEnergy) : null;
              return (
                <SortableTaskRow
                  key={item.id}
                  item={item}
                  mode="suggestion"
                  energyMatch={match}
                  onAdd={() => handleAddSuggestion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-4 border-t">
        <Button 
          size="lg" 
          className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" 
          onClick={handleFinalize} 
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
          Lock In Plan ({approvedIds.length} items)
        </Button>
        <Button variant="ghost" onClick={() => setStep(1)}>
          Back to commitment review
        </Button>
      </div>
    </div>
  );
}
