
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllTasks, getDailyPlan, updateDailyPlanAsync } from "@/lib/data";
import { Task, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PlusCircle, ArrowLeftCircle, GripVertical, Loader2, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnergyIndicator } from "@/components/energy-check-in";
import { getTodayEnergy, getEnergyMatch } from "@/lib/energy";
import { EnergyLevel } from "@/lib/types";

const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-600/30 text-red-500 border-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  low: "bg-green-500/20 text-green-500 border-green-500/30",
};

function MiniTaskCard({
  task,
  onMove,
  isBacklog,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging
}: {
  task: Task;
  onMove: (id: string) => void;
  isBacklog: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}) {
  const renderTitle = (title: string) => {
    const match = title.match(/^(.*)\s*—\s*(.*)$/);
    if (match) {
      return (
        <span>
          {match[1]}{" "}
          <span className="text-muted-foreground font-normal opacity-75">— {match[2]}</span>
        </span>
      );
    }
    return title;
  };

  return (
    <Card
      className={cn(
        "group transition-all duration-300 ease-in-out hover:border-primary hover:shadow-md animate-fade-in",
        isDragging ? "opacity-30 scale-95" : "hover:scale-[1.02]"
      )}
      draggable={!isBacklog}
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragEnter={(e) => onDragEnter?.(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <CardContent className="p-3 flex items-center justify-between gap-2">
        {!isBacklog && (
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:text-foreground" />
        )}
        <div className="flex-1">
          <p className="font-semibold">{renderTitle(task.title)}</p>
          <Badge variant="outline" className={cn("capitalize mt-1", priorityStyles[task.priority])}>
            {task.priority}
          </Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={() => onMove(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          {isBacklog ? <PlusCircle className="h-5 w-5 text-primary" /> : <ArrowLeftCircle className="h-5 w-5 text-muted-foreground" />}
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper to determine if an ID is a subtask format typical of this app.
// Since we don't naturally have a global subtask ID tracker that tells us its parent,
// we will structure the combined ID as parentId_subtaskId for the daily plan if needed,
// OR we just store the subtask ID if they are universally unique.
// Actually, earlier we stored just task IDs. Let's see how dailyTaskIds handles it.

export default function PlanPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailyTaskIds, setDailyTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEnergy, setCurrentEnergy] = useState<EnergyLevel | null>(null);

  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    setCurrentEnergy(getTodayEnergy());
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const tasks = await getAllTasks();
      const planIds = await getDailyPlan(selectedDate);
      setAllTasks(tasks || []);
      setDailyTaskIds(Array.isArray(planIds) ? planIds : []);
    } catch (error) {
      console.error("Failed to refresh daily plan:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [selectedDate]);

  const dailyTasks = dailyTaskIds.map(id => {
    // Find parent or subtask
    for (const t of (Array.isArray(allTasks) ? allTasks : [])) {
      if (t.id === id) return t;
      if (t.subtasks) {
        const st = t.subtasks.find(s => s.id === id);
        if (st) {
          return {
            ...st,
            parentId: t.id,
            description: "",
            status: st.completed ? 'done' : 'todo' as 'done' | 'todo',
            priority: t.priority,
            subtasks: [],
            notes: [],
            isSubtask: true,
            title: `${st.title} — ${t.title}`
          } as unknown as Task;
        }
      }
    }
    return undefined;
  }).filter((t): t is Task => !!t);

  const backlogTasks: Task[] = [];
  (Array.isArray(allTasks) ? allTasks : []).forEach(task => {
    if (task.status === 'done' || task.isHabit) return;

    // Only add parent if it has no incomplete subtasks, OR we add subtasks individually.
    // Wait, let's just add the parent if the parent is not in dailyTaskIds AND has no subtasks.
    // Or add subtasks if they exist.

    const incompleteSubtasks = task.subtasks?.filter(st => !st.completed) || [];

    if (incompleteSubtasks.length > 0) {
      incompleteSubtasks.forEach(st => {
        if (!dailyTaskIds.includes(st.id)) {
          backlogTasks.push({
            ...st,
            parentId: task.id,
            description: "",
            status: 'todo',
            priority: task.priority,
            subtasks: [],
            notes: [],
            isSubtask: true,
            title: `${st.title} — ${task.title}`
          } as unknown as Task);
        }
      });
    } else {
      if (!dailyTaskIds.includes(task.id)) {
        backlogTasks.push(task);
      }
    }
  });

  const addToDailyPlan = async (taskId: string) => {
    let taskEndDate = "";

    // Find task or subtask end date
    for (const t of allTasks) {
      if (t.id === taskId && t.endDate) {
        taskEndDate = t.endDate.split('T')[0];
        break;
      }
      const st = t.subtasks?.find(s => s.id === taskId);
      if (st && st.endDate) {
        taskEndDate = st.endDate.split('T')[0];
        break;
      } else if (st && t.endDate) {
        // Fallback to parent end date
        taskEndDate = t.endDate.split('T')[0];
        break;
      }
    }

    if (taskEndDate) {
      if (selectedDate > taskEndDate) {
        alert(`Cannot plan this task for ${selectedDate} because its deadline was ${taskEndDate}`);
        return;
      }
    }
    const newDailyIds = [...dailyTaskIds, taskId];
    await updateDailyPlanAsync(newDailyIds, selectedDate);
    refreshData();
  };

  const removeFromDailyPlan = async (taskId: string) => {
    const newDailyIds = dailyTaskIds.filter(id => id !== taskId);
    await updateDailyPlanAsync(newDailyIds, selectedDate);
    refreshData();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    dragItem.current = id;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (dragItem.current === null || dragItem.current === id) return;

    dragOverItem.current = id;

    const newIds = [...dailyTaskIds];
    const dragItemIndex = newIds.indexOf(dragItem.current);
    const dragOverItemIndex = newIds.indexOf(id);

    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;

    const [draggedId] = newIds.splice(dragItemIndex, 1);
    newIds.splice(dragOverItemIndex, 0, draggedId);

    setDailyTaskIds(newIds);
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null) return;

    let taskEndDate = "";
    const taskId = dragItem.current;

    for (const t of allTasks) {
      if (t.id === taskId && t.endDate) {
        taskEndDate = t.endDate.split('T')[0];
        break;
      }
      const st = t.subtasks?.find(s => s.id === taskId);
      if (st && st.endDate) {
        taskEndDate = st.endDate.split('T')[0];
        break;
      } else if (st && t.endDate) {
        taskEndDate = t.endDate.split('T')[0];
        break;
      }
    }

    if (taskEndDate) {
      if (selectedDate > taskEndDate) {
        alert(`Cannot plan this task for ${selectedDate} because its deadline was ${taskEndDate}`);
        refreshData(); // Revert visual drag
        dragItem.current = null;
        dragOverItem.current = null;
        return;
      }
    }

    await updateDailyPlanAsync(dailyTaskIds, selectedDate);

    dragItem.current = null;
    dragOverItem.current = null;
    refreshData();
  };

  // Sort backlog: energy-matched tasks first
  const sortedBacklog = currentEnergy
    ? [...backlogTasks].sort((a, b) => {
        const aMatch = getEnergyMatch(a.energyLevel, currentEnergy);
        const bMatch = getEnergyMatch(b.energyLevel, currentEnergy);
        const order = { match: 0, 'slight-mismatch': 1, mismatch: 2 };
        return order[aMatch] - order[bMatch];
      })
    : backlogTasks;

  const matchedCount = currentEnergy
    ? backlogTasks.filter(t => getEnergyMatch(t.energyLevel, currentEnergy) === 'match').length
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Your Day</h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">Move tasks from your backlog to today&apos;s plan. Drag and drop to reorder.</p>
            <EnergyIndicator />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Energy-matched suggestion bar */}
      {currentEnergy && matchedCount > 0 && (
        <div className="flex items-center gap-2 text-xs bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5">
          {currentEnergy === 'low' ? <BatteryLow className="h-4 w-4 text-red-400" /> : currentEnergy === 'medium' ? <BatteryMedium className="h-4 w-4 text-yellow-400" /> : <BatteryFull className="h-4 w-4 text-green-400" />}
          <span className="text-muted-foreground">
            Your energy is <span className="font-semibold text-foreground">{currentEnergy}</span>.
            {' '}<span className="text-green-400 font-semibold">{matchedCount} task{matchedCount !== 1 ? 's' : ''}</span> match your current energy level.
          </span>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Task Backlog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[50vh]">
            {loading ? (
              <div className="flex justify-center items-center h-full pt-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sortedBacklog.length > 0 ? (
              sortedBacklog.map((task) => {
                const match = currentEnergy ? getEnergyMatch(task.energyLevel, currentEnergy) : null;
                return (
                  <div key={task.id} className={cn(
                    "rounded-lg transition-all",
                    match === 'match' && "ring-1 ring-green-500/30",
                    match === 'mismatch' && "opacity-50"
                  )}>
                    <MiniTaskCard task={task} onMove={addToDailyPlan} isBacklog={true} />
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center pt-10">Backlog is empty!</p>
            )}
          </CardContent>
        </Card>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Today's Plan</CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-3 min-h-[50vh] bg-primary/5 rounded-b-lg"
            onDragOver={(e) => e.preventDefault()}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full pt-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : dailyTasks.length > 0 ? (
              dailyTasks.map((task) => (
                <MiniTaskCard
                  key={task.id}
                  task={task}
                  onMove={removeFromDailyPlan}
                  isBacklog={false}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  isDragging={dragItem.current === task.id}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center pt-10">Plan your day by adding tasks from the backlog.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
