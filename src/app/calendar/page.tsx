
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  add,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Repeat,
  PlusCircle,
  Smile,
  Meh,
  Frown,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { getAllTasks, updateTask as updateTaskData, addTask } from "@/lib/data";
import { Task, Priority, DailyHabitStatus, DailyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskForm } from "@/components/task-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type CalendarView = "month" | "week" | "day";

interface CalendarEventData extends Omit<Partial<Task>, 'dailyStatus'> {
  id: string;
  title: string;
  priority: Priority;
  isSubtask?: boolean;
  parentId?: string;
  dailyStatus?: DailyHabitStatus;
  isDueDayOnly?: boolean;
}

const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-600/30 text-red-500 border-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse",
  high: "bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400",
  medium: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  low: "bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400",
};

const statusIcons: Record<Exclude<DailyHabitStatus, 'not recorded'>, React.ReactNode> = {
  'changes observed': <Smile className="h-3 w-3 text-green-500" />,
  'no changes': <Meh className="h-3 w-3 text-yellow-500" />,
  'negative': <Frown className="h-3 w-3 text-red-500" />,
}

function CalendarEvent({ event }: { event: CalendarEventData }) {
  const router = useRouter();

  const getLink = () => {
    if (event.isHabit) {
      return '/habits';
    }
    const taskId = event.isSubtask ? event.parentId : event.id;
    return `/tasks?taskId=${taskId}`;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(getLink());
  };

  const renderTitle = (title: string, isSubtask?: boolean) => {
    if (isSubtask) {
      const match = title.match(/^(.*)\s*—\s*(.*)$/);
      if (match) {
        return (
          <span className="truncate flex-1 min-w-0">
            {match[1]}{" "}
            <span className="font-normal opacity-75">— {match[2]}</span>
          </span>
        );
      }
    }
    return <span className="truncate">{title}</span>;
  };

  return (
    <div
      className={cn(
        "p-1.5 text-xs rounded-md truncate text-left flex items-center gap-1.5",
        priorityStyles[event.priority]
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e as any)}
    >
      {event.isDueDayOnly && (
        <span className="bg-red-500 text-[8px] text-white px-1 py-0 rounded font-bold uppercase shrink-0">
          Due
        </span>
      )}
      {event.isHabit && event.dailyStatus && event.dailyStatus !== 'not recorded' && statusIcons[event.dailyStatus]}
      <span className="font-semibold flex-1 truncate">{renderTitle(event.title, event.isSubtask)}</span>
      {event.isHabit && <Repeat className="inline-block h-3 w-3 ml-1.5 opacity-90" />}
    </div>
  );
}

function SortableCalendarItem({
  event,
  currentDate,
  handleToggleCompletion,
  handleSetDailyStatus,
  isEventCompleted,
  priorityStyles,
  statusIcons,
}: {
  event: CalendarEventData;
  currentDate: Date;
  handleToggleCompletion: (event: CalendarEventData, checked: boolean) => void;
  handleSetDailyStatus: (habitId: string, status: DailyHabitStatus) => void;
  isEventCompleted: (event: CalendarEventData, day: Date) => boolean;
  priorityStyles: Record<Priority, string>;
  statusIcons: Record<Exclude<DailyHabitStatus, "not recorded">, React.ReactNode>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = isEventCompleted(event, currentDate);
  const startDate = event.isHabit ? add(startOfDay(currentDate), { hours: 9 }) : (event.startDate ? parseISO(event.startDate) : startOfDay(currentDate));
  const endDate = event.isHabit ? add(startOfDay(currentDate), { hours: 9, minutes: 30 }) : (event.endDate ? parseISO(event.endDate) : startDate);
  const getLink = () => event.isHabit ? `/habits?taskId=${event.id}` : `/tasks?taskId=${event.isSubtask ? event.parentId : event.id}`;
  const dailyStatus = event.dailyStatus;
  const statusIcon = dailyStatus && dailyStatus !== 'not recorded' ? statusIcons[dailyStatus] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-start gap-4 p-3 rounded-lg bg-muted/50 group", isDragging && "shadow-lg bg-muted")}
    >
      <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
        <GripVertical className="h-5 w-5" />
      </div>
      <Checkbox id={`cal-check-${event.id}`} checked={isCompleted} onCheckedChange={(checked) => handleToggleCompletion(event, !!checked)} className="mt-1" />
      <div className="flex-shrink-0 text-xs md:text-sm">
        <p className="font-semibold">{format(startDate, 'h:mm a')}</p>
        <p className="text-muted-foreground">{format(endDate, 'h:mm a')}</p>
      </div>
      <div className="flex-1">
        <Link href={getLink()} className="hover:underline">
          <p className={cn("font-semibold flex items-center flex-wrap gap-1", isCompleted && "line-through text-muted-foreground")}>
            {(() => {
              if (event.isSubtask) {
                const match = event.title.match(/^(.*)\s*—\s*(.*)$/);
                if (match) {
                  return (
                    <h4 className="font-semibold text-lg flex flex-col">
                      {match[1]}{" "}
                      <span className="text-sm font-normal text-muted-foreground opacity-80">— {match[2]}</span>
                    </h4>
                  );
                }
              }
              return <span>{event.title}</span>;
            })()}
          </p>
        </Link>
        <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-1 no-scrollbar">
          <Badge variant="outline" className={cn("capitalize shrink-0", priorityStyles[event.priority])}>{event.priority}</Badge>
          {event.isHabit && <Badge variant="outline" className="shrink-0"><Repeat className="h-3 w-3 mr-1" />Habit</Badge>}
          {statusIcon && <Badge variant="outline" className="flex items-center gap-1 shrink-0">{statusIcon}<span className="capitalize">{dailyStatus?.replace(' observed', '')}</span></Badge>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {event.isHabit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handleSetDailyStatus(event.id, 'changes observed')}><Smile className="mr-2 h-4 w-4 text-green-500" /> Changes Observed</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSetDailyStatus(event.id, 'no changes')}><Meh className="mr-2 h-4 w-4 text-yellow-500" /> No Changes</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSetDailyStatus(event.id, 'negative')}><Frown className="mr-2 h-4 w-4 text-red-500" /> Negative</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("day");
  const [dayFilter, setDayFilter] = useState<"all" | "done" | "undone">("all");
  const { toast } = useToast();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const refreshTasks = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const tasks = await getAllTasks();
    setAllTasks(tasks);
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    refreshTasks(true);
  }, []);

  const getEventsForDay = (day: Date): CalendarEventData[] => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const events: CalendarEventData[] = [];

    (Array.isArray(allTasks) ? allTasks : []).forEach((task) => {
      let isTaskAdded = false;
      const scheduledSubtasks = new Set<string>();

      if (task.subtasks) {
        task.subtasks.forEach((subtask) => {
          if (subtask.startDate) {
            const subtaskStart = parseISO(subtask.startDate);
            const subtaskEnd = subtask.endDate ? parseISO(subtask.endDate) : subtaskStart;
            if (isWithinInterval(day, { start: startOfDay(subtaskStart), end: endOfDay(subtaskEnd) })) {
              scheduledSubtasks.add(subtask.id);
              events.push({
                ...subtask,
                parentId: task.id,
                isSubtask: true,
                priority: task.priority,
                isHabit: false,
                title: `${subtask.title} — ${task.title}`,
                id: subtask.id,
              });
            }
          }
        });
      }

      if (scheduledSubtasks.size === 0) {
        if (task.isHabit) {
          const dailyStatusEntry = task.dailyStatus?.find(ds => isSameDay(parseISO(ds.date), day));
          events.push({
            ...task,
            isSubtask: false,
            dailyStatus: dailyStatusEntry?.status || 'not recorded'
          });
          isTaskAdded = true;
        }
        else {
          const taskStart = task.startDate ? parseISO(task.startDate) : null;
          const taskDo = task.doDate ? parseISO(task.doDate) : null;
          const taskEnd = task.endDate ? parseISO(task.endDate) : null;

          const isDoDay = taskDo ? isSameDay(day, taskDo) : (taskStart ? isSameDay(day, taskStart) : false);
          const isDueDay = taskEnd ? isSameDay(day, taskEnd) : false;

          if (isDoDay || isDueDay) {
            const { dailyStatus, ...restTask } = task;
            events.push({ 
              ...restTask, 
              isSubtask: false,
              isDueDayOnly: isDueDay && !isDoDay 
            });
            isTaskAdded = true;
          }
        }
      }
    });

    const sortedEvents = events.sort((a, b) => {
      const aDate = a.startDate ? parseISO(a.startDate).getTime() : 0;
      const bDate = b.startDate ? parseISO(b.startDate).getTime() : 0;
      
      if (aDate !== bDate) {
        return aDate - bDate;
      }
      
      const aOrder = a.order ?? 0;
      const bOrder = b.order ?? 0;
      return aOrder - bOrder;
    });

    return sortedEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );
  }

  const isEventCompleted = (event: CalendarEventData, day: Date) => {
    if (event.isSubtask) {
      const parent = allTasks.find(t => t.id === event.parentId);
      const subtask = parent?.subtasks.find(st => st.id === event.id);
      return subtask?.completed ?? false;
    }
    if (event.isHabit) {
      return event.completionHistory?.some(d => isSameDay(parseISO(d), day)) ?? false;
    }
    return event.status === 'done';
  }

  const getCompletedCount = (events: CalendarEventData[], day: Date) => {
    return events.filter(e => isEventCompleted(e, day)).length;
  }

  const getHabitStatsForDay = (day: Date) => {
    const habits = (Array.isArray(allTasks) ? allTasks : []).filter(t => t.isHabit);
    const totalHabits = habits.length;
    const completedHabits = habits.filter(h => h.completionHistory?.some(d => isSameDay(parseISO(d), day))).length;
    return { totalHabits, completedHabits };
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    (Array.isArray(allTasks) ? allTasks : []).forEach(task => {
      task.tags?.forEach(tag => tagSet.add(tag));
      task.subtasks?.forEach(subtask => {
        subtask.tags?.forEach(tag => tagSet.add(tag));
      });
    });
    return Array.from(tagSet).sort();
  }, [allTasks]);

  const handleCreateTask = (data: any) => {
    const newTask: Omit<Task, 'id'> = {
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      status: 'todo',
      tags: data.tags || [],
      startDate: currentDate.toISOString(),
      subtasks: [],
      notes: [],
    };
    addTask(newTask);
    refreshTasks();
    setIsCreateTaskOpen(false);
    toast({ title: "Task Created!", description: `"${data.title}" has been added for ${format(currentDate, "PPP")}.` });
  }

  const handleToggleCompletion = (event: CalendarEventData, checked: boolean) => {
    let taskToUpdate: Task | undefined;

    if (event.isHabit) {
      const habit = allTasks.find(h => h.id === event.id);
      if (!habit) return;

      const dayStr = startOfDay(currentDate).toISOString();
      let newCompletionHistory = [...(habit.completionHistory || [])];

      if (checked) {
        if (!newCompletionHistory.some(d => isSameDay(parseISO(d), currentDate))) {
          newCompletionHistory.push(dayStr);
        }
      } else {
        newCompletionHistory = newCompletionHistory.filter(d => !isSameDay(parseISO(d), currentDate));
      }
      taskToUpdate = { ...habit, completionHistory: newCompletionHistory };
      toast({ title: checked ? "Habit completed!" : "Habit marked incomplete." });

    } else if (event.isSubtask) {
      const parentTask = allTasks.find(t => t.id === event.parentId);
      if (!parentTask) return;

      const updatedSubtasks = parentTask.subtasks.map(st => st.id === event.id ? { ...st, completed: checked } : st);
      taskToUpdate = { ...parentTask, subtasks: updatedSubtasks };
      toast({ title: checked ? "Subtask completed!" : "Subtask marked incomplete." });

    } else {
      const task = allTasks.find(t => t.id === event.id);
      if (!task) return;
      taskToUpdate = { ...task, status: checked ? 'done' : 'in-progress' as 'done' | 'in-progress' };
      toast({ title: checked ? "Task completed!" : "Task marked incomplete." });
    }

    if (taskToUpdate) {
      updateTaskData(taskToUpdate);
      refreshTasks();
    }
  }

  const handleSetDailyStatus = (habitId: string, status: DailyHabitStatus) => {
    const habit = allTasks.find(h => h.id === habitId);
    if (!habit) return;

    const dayStr = startOfDay(currentDate).toISOString();
    const existingStatusIndex = habit.dailyStatus?.findIndex(ds => isSameDay(parseISO(ds.date), currentDate)) ?? -1;

    let newDailyStatus: DailyStatus[] = [...(habit.dailyStatus || [])];

    if (existingStatusIndex > -1) {
      if (newDailyStatus[existingStatusIndex].status === status) {
        newDailyStatus[existingStatusIndex].status = 'not recorded';
      } else {
        newDailyStatus[existingStatusIndex].status = status;
      }
    } else {
      newDailyStatus.push({ date: dayStr, status: status });
    }

    const updatedHabit = { ...habit, dailyStatus: newDailyStatus };
    updateTaskData(updatedHabit);
    refreshTasks();
    toast({ title: "Observation recorded", description: `Status for "${habit.title}" set to "${status}".` });
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dailyEvents = getEventsForDay(currentDate);

  const handleDragEnd = async (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;

    if (over && active.id !== over.id) {
      const filteredEvents = dailyEvents.filter((event) => {
        const completed = isEventCompleted(event, currentDate);
        if (dayFilter === 'done') return completed;
        if (dayFilter === 'undone') return !completed;
        return true;
      });

      const oldIndex = filteredEvents.findIndex((e) => e.id === active.id);
      const newIndex = filteredEvents.findIndex((e) => e.id === over.id);

      const newOrder = arrayMove(filteredEvents, oldIndex, newIndex);

      const tasksToUpdate = new Map<string, Task>();

      newOrder.forEach((event, index) => {
        if (event.isHabit || (!event.isHabit && !event.isSubtask)) {
          const taskId = event.id;
          const task = tasksToUpdate.get(taskId) || allTasks.find((t) => t.id === taskId);
          if (task && task.order !== index) {
            tasksToUpdate.set(taskId, { ...task, order: index });
          }
        } else if (event.isSubtask) {
          const parentId = event.parentId!;
          const parentTask = tasksToUpdate.get(parentId) || allTasks.find((t) => t.id === parentId);
          if (parentTask) {
            const updatedSubtasks = parentTask.subtasks.map((st) =>
              st.id === event.id ? { ...st, order: index } : st
            );
            tasksToUpdate.set(parentId, { ...parentTask, subtasks: updatedSubtasks });
          }
        }
      });

      // ---- Optimistic UI Update ----
      setAllTasks((prevTasks) => {
        const nextTasks = [...prevTasks];
        tasksToUpdate.forEach((updatedTask, taskId) => {
          const index = nextTasks.findIndex(t => t.id === taskId);
          if (index !== -1) {
            nextTasks[index] = updatedTask;
          }
        });
        return nextTasks;
      });
      // -----------------------------

      try {
        const updatePromises = Array.from(tasksToUpdate.values()).map(task => updateTaskData(task));
        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Failed to persist order", error);
        toast({ title: "Failed to save order", variant: "destructive" });
        refreshTasks(); // Rollback on error
      }
    }
  }


  const start =
    view === "month"
      ? startOfWeek(startOfMonth(currentDate))
      : view === "week"
        ? startOfWeek(currentDate)
        : startOfDay(currentDate);

  const end =
    view === "month"
      ? endOfWeek(endOfMonth(currentDate))
      : view === "week"
        ? endOfWeek(currentDate)
        : endOfDay(currentDate);

  const days = eachDayOfInterval({ start, end });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const next = () => setCurrentDate(add(currentDate, view === "month" ? { months: 1 } : view === "week" ? { weeks: 1 } : { days: 1 }));
  const prev = () => setCurrentDate(add(currentDate, view === "month" ? { months: -1 } : view === "week" ? { weeks: -1 } : { days: -1 }));
  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView("day");
  };

  return (
    <div className="flex flex-col gap-8">
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task for {format(currentDate, "MMMM d")}</DialogTitle>
          </DialogHeader>
          <TaskForm allTags={allTags} onSubmit={handleCreateTask} />
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            {format(currentDate, "MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>Today</Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={prev}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" onClick={next}>
              <ChevronRight />
            </Button>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)} className="hidden md:block">
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)} className="block md:hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : view === 'month' ? (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid md:grid-cols-7 border-b">
              {weekdays.map((day) => (
                <div key={day} className="p-3 font-semibold text-center text-muted-foreground text-xs md:text-sm">
                  {day}
                </div>
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-7">
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const timedEvents = dayEvents.filter(e => !e.isHabit);
                const completedCount = getCompletedCount(timedEvents, day);
                const { totalHabits, completedHabits } = getHabitStatsForDay(day);

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "h-32 md:h-40 border-b border-r p-1 md:p-2 flex flex-col gap-1 overflow-hidden cursor-pointer transition-colors hover:bg-muted/80",
                      !isSameMonth(day, currentDate) && "bg-muted/50 text-muted-foreground"
                    )}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex justify-between items-center flex-wrap gap-y-1">
                      <span className={cn("font-semibold text-sm", isToday(day) && "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center")}>
                        {format(day, "d")}
                      </span>
                      <div className="flex flex-col md:flex-row items-end md:items-center gap-1.5 scale-90 md:scale-100 origin-right">
                        {totalHabits > 0 && <Badge variant={completedHabits === totalHabits && totalHabits > 0 ? 'default' : 'secondary'} className="text-xs">{completedHabits}/{totalHabits} habits</Badge>}
                        {timedEvents.length > 0 && <Badge variant={completedCount === timedEvents.length && timedEvents.length > 0 ? 'default' : 'secondary'} className="text-xs">{completedCount}/{timedEvents.length} tasks</Badge>}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((event) => <CalendarEvent key={event.id} event={event} />)}
                      {dayEvents.length > 2 && <p className="text-xs text-muted-foreground mt-1">+ {dayEvents.length - 2} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="block md:hidden">
              {days.filter(d => isSameMonth(d, currentDate)).map(day => {
                const dayEvents = getEventsForDay(day);
                const timedEvents = dayEvents.filter(e => !e.isHabit);
                const completedCount = getCompletedCount(timedEvents, day);
                const { totalHabits, completedHabits } = getHabitStatsForDay(day);

                return (
                  <div key={`mobile-${day.toString()}`} className="border-b p-4" onClick={() => handleDayClick(day)}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-lg", isToday(day) && "text-primary")}>{format(day, "d")}</span>
                        <span className="text-muted-foreground">{format(day, "EEE")}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {totalHabits > 0 && <Badge variant={completedHabits === totalHabits && totalHabits > 0 ? 'default' : 'secondary'} className="text-xs">{completedHabits}/{totalHabits} habits</Badge>}
                        {timedEvents.length > 0 && <Badge variant={completedCount === timedEvents.length && timedEvents.length > 0 ? 'default' : 'secondary'} className="text-xs">{completedCount}/{timedEvents.length} tasks</Badge>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => <CalendarEvent key={event.id} event={event} />)}
                      {dayEvents.length > 3 && <p className="text-xs text-muted-foreground mt-1">+ {dayEvents.length - 3} more</p>}
                      {dayEvents.length === 0 && <p className="text-xs text-muted-foreground">No events</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : view === 'week' ? (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {days.map((day) => (
                <div key={day.toISOString()} className="p-2 md:p-3 text-center border-r">
                  <p className="text-xs md:text-sm text-muted-foreground">{format(day, 'EEE')}</p>
                  <p className={cn("text-lg md:text-2xl font-semibold", isToday(day) && "text-primary")}>{format(day, 'd')}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const timedEvents = dayEvents.filter(e => !e.isHabit);
                const completedCount = getCompletedCount(timedEvents, day);
                const { totalHabits, completedHabits } = getHabitStatsForDay(day);

                return (
                  <div key={day.toISOString()} className="h-[60vh] border-r p-1 md:p-2 space-y-2 overflow-y-auto">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {totalHabits > 0 && <Badge variant={completedHabits === totalHabits && totalHabits > 0 ? 'default' : 'secondary'} className="text-xs w-fit">{completedHabits}/{totalHabits} habits</Badge>}
                      {timedEvents.length > 0 && <Badge variant={completedCount === timedEvents.length && timedEvents.length > 0 ? 'default' : 'secondary'} className="text-xs w-fit">{completedCount}/{timedEvents.length} tasks</Badge>}
                    </div>
                    {dayEvents.map((event) => <CalendarEvent key={event.id} event={event} />)}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : view === 'day' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{format(currentDate, 'EEEE, MMMM d')}</CardTitle>
              <CardDescription>{dailyEvents.length} items scheduled today. {getCompletedCount(dailyEvents, currentDate)} completed.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <Select value={dayFilter} onValueChange={(v: any) => setDayFilter(v)}>
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="undone">To Do</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsCreateTaskOpen(true)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />Create Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const filteredEvents = dailyEvents.filter((event) => {
                const completed = isEventCompleted(event, currentDate);
                if (dayFilter === 'done') return completed;
                if (dayFilter === 'undone') return !completed;
                return true;
              });

              if (filteredEvents.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center gap-4 text-center h-60">
                    <CalendarIcon className="w-16 h-16 text-muted-foreground" />
                    <p className="text-muted-foreground">{dailyEvents.length > 0 ? "No tasks match this filter." : "No tasks or habits scheduled for today."}</p>
                    <Button onClick={() => setIsCreateTaskOpen(true)} variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Create a task for today</Button>
                  </div>
                );
              }

              return (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredEvents.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {filteredEvents.map((event) => (
                        <SortableCalendarItem
                          key={event.id}
                          event={event}
                          currentDate={currentDate}
                          handleToggleCompletion={handleToggleCompletion}
                          handleSetDailyStatus={handleSetDailyStatus}
                          isEventCompleted={isEventCompleted}
                          priorityStyles={priorityStyles}
                          statusIcons={statusIcons}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              );
            })()}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
