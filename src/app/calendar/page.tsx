
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
import { TaskForm } from "@/components/task-form";

type CalendarView = "month" | "week" | "day";

interface CalendarEventData extends Partial<Task> {
    id: string;
    title: string;
    priority: Priority;
    isSubtask?: boolean;
    parentId?: string;
    dailyStatus?: DailyHabitStatus;
}

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-500/80 text-white",
  medium: "bg-yellow-500/80 text-white",
  low: "bg-green-500/80 text-white",
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
        {event.isHabit && event.dailyStatus && event.dailyStatus !== 'not recorded' && statusIcons[event.dailyStatus]}
        <span className="font-semibold flex-1 truncate">{event.title}</span>
        {event.isSubtask && <span className="text-xs opacity-80"> (subtask)</span>}
        {event.isHabit && <Repeat className="inline-block h-3 w-3 ml-1.5 opacity-90" />}
    </div>
  );
}

export default function CalendarPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const { toast } = useToast();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const refreshTasks = () => {
    setLoading(true);
    const tasks = getAllTasks();
    setAllTasks(tasks);
    setLoading(false);
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const getEventsForDay = (day: Date): CalendarEventData[] => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const events: CalendarEventData[] = [];

    (Array.isArray(allTasks) ? allTasks : []).forEach((task) => {
      if (task.isHabit) {
          const dailyStatusEntry = task.dailyStatus?.find(ds => isSameDay(parseISO(ds.date), day));
          events.push({ 
              ...task, 
              isSubtask: false,
              dailyStatus: dailyStatusEntry?.status || 'not recorded'
          });
      }
      else if (task.startDate) {
        const taskStart = parseISO(task.startDate);
        const taskEnd = task.endDate ? parseISO(task.endDate) : taskStart;
        if (isWithinInterval(day, { start: startOfDay(taskStart), end: endOfDay(taskEnd) })) {
          events.push({ ...task, isSubtask: false });
        }
      }

      if (task.subtasks) {
        task.subtasks.forEach((subtask) => {
          if (subtask.startDate) {
            const subtaskStart = parseISO(subtask.startDate);
            const subtaskEnd = subtask.endDate ? parseISO(subtask.endDate) : subtaskStart;
            if (isWithinInterval(day, { start: startOfDay(subtaskStart), end: endOfDay(subtaskEnd) })) {
              events.push({
                ...subtask,
                parentId: task.id,
                isSubtask: true,
                priority: task.priority,
                isHabit: false,
                title: subtask.title,
                id: subtask.id,
              });
            }
          }
        });
      }
    });
    
    const sortedEvents = events.sort((a, b) => {
        const aDate = a.startDate ? parseISO(a.startDate).getTime() : 0;
        const bDate = b.startDate ? parseISO(b.startDate).getTime() : 0;
        return aDate - bDate;
    });
    
    return sortedEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
  }

  const getCompletedCount = (events: CalendarEventData[], day: Date) => {
      return events.filter(e => {
          if (e.isSubtask) {
              const parent = allTasks.find(t => t.id === e.parentId);
              const subtask = parent?.subtasks.find(st => st.id === e.id);
              return subtask?.completed ?? false;
          }
          if (e.isHabit) {
              return e.completionHistory?.some(d => isSameDay(parseISO(d), day)) ?? false;
          }
          return e.status === 'done';
      }).length;
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
    toast({ title: "Task Created!", description: `"${data.title}" has been added for ${format(currentDate, "PPP")}.`});
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
        if(!parentTask) return;
        
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
    toast({ title: "Observation recorded", description: `Status for "${habit.title}" set to "${status}".`});
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
  
  const dailyEvents = getEventsForDay(currentDate);


  return (
    <div className="flex flex-col gap-8">
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Task for {format(currentDate, "MMMM d")}</DialogTitle>
            </DialogHeader>
            <TaskForm allTags={allTags} onSubmit={handleCreateTask}/>
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
                <Button onClick={() => setIsCreateTaskOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>Create Task
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                 {dailyEvents.length > 0 ? (
                    dailyEvents.map((event) => {
                        let isCompleted = false;

                        if (event.isSubtask) {
                            const parentTask = allTasks.find(t => t.id === event.parentId);
                            const subtask = parentTask?.subtasks.find(st => st.id === event.id);
                            isCompleted = subtask?.completed ?? false;
                        } else if (event.isHabit) {
                            isCompleted = event.completionHistory?.some(d => isSameDay(parseISO(d), currentDate)) ?? false;
                        } else {
                            isCompleted = event.status === 'done';
                        }
                        
                        const startDate = event.isHabit ? add(startOfDay(currentDate), {hours: 9}) : (event.startDate ? parseISO(event.startDate) : startOfDay(currentDate));
                        const endDate = event.isHabit ? add(startOfDay(currentDate), {hours: 9, minutes: 30}) : (event.endDate ? parseISO(event.endDate) : startDate);
                        const getLink = () => event.isHabit ? '/habits' : `/tasks?taskId=${event.isSubtask ? event.parentId : event.id}`;
                        const dailyStatus = event.dailyStatus;
                        const statusIcon = dailyStatus && dailyStatus !== 'not recorded' ? statusIcons[dailyStatus] : null;

                        return (
                            <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                <Checkbox id={`cal-check-${event.id}`} checked={isCompleted} onCheckedChange={(checked) => handleToggleCompletion(event, !!checked)} className="mt-1" />
                                <div className="flex-shrink-0 text-xs md:text-sm">
                                    <p className="font-semibold">{format(startDate, 'h:mm a')}</p>
                                    <p className="text-muted-foreground">{format(endDate, 'h:mm a')}</p>
                                </div>
                                <div className="flex-1">
                                    <Link href={getLink()} className="hover:underline">
                                        <p className={cn("font-semibold", isCompleted && "line-through text-muted-foreground")}>{event.title}{event.isSubtask && <span className="text-sm font-normal opacity-80"> (subtask)</span>}</p>
                                    </Link>
                                     <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={cn("capitalize", priorityStyles[event.priority])}>{event.priority}</Badge>
                                        {event.isHabit && <Badge variant="outline"><Repeat className="h-3 w-3 mr-1"/>Habit</Badge>}
                                        {statusIcon && <Badge variant="outline" className="flex items-center gap-1">{statusIcon}<span className="capitalize">{dailyStatus?.replace(' observed', '')}</span></Badge>}
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
                        )
                    })
                 ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-center h-60">
                        <CalendarIcon className="w-16 h-16 text-muted-foreground" />
                        <p className="text-muted-foreground">No tasks or habits scheduled for today.</p>
                        <Button onClick={() => setIsCreateTaskOpen(true)} variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Create a task for today</Button>
                    </div>
                 )}
            </CardContent>
         </Card>
      ) : null}
    </div>
  );
}
