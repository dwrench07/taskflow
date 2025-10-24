
"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllTasks, updateTask, addTask, deleteTask } from "@/lib/data";
import { type Task, type Priority, type HabitFrequency, DailyHabitStatus, DailyStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Repeat, Zap, PlusCircle, Edit, Trash2, Trophy, Undo2, ArrowLeft, X, CalendarIcon, Save, MoreVertical, Smile, Frown, Meh, BarChart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday, parseISO, startOfToday, format, subDays, startOfDay, isEqual } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HabitAnalyticsChart } from "@/components/habit-analytics-chart";
import { calculateStreak } from "@/lib/habits";

const habitFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  streakGoal: z.coerce.number().int().positive().optional(),
  habitFrequency: z.enum(["daily", "weekly", "monthly"]),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

const pageStatusIcons: Record<Exclude<DailyHabitStatus, 'not recorded'>, React.ReactNode> = {
    'changes observed': <Smile className="h-4 w-4 text-green-500" />,
    'no changes': <Meh className="h-4 w-4 text-yellow-500" />,
    'negative': <Frown className="h-4 w-4 text-red-500" />,
};

function HabitForm({ habit, onSubmit, onOpenChange }: { habit?: Task; onSubmit: (data: HabitFormValues) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: habit?.title || "",
      description: habit?.description || "",
      priority: habit?.priority || "medium",
      streakGoal: habit?.streakGoal || undefined,
      habitFrequency: habit?.habitFrequency || "daily",
    },
  });

  const handleFormSubmit = (data: HabitFormValues) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input placeholder="e.g., Workout for 30 minutes" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Why is this habit important?" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="streakGoal"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Streak Goal</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 21" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="habitFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{habit ? "Save Changes" : "Create Habit"}</Button>
      </form>
    </Form>
  );
}


function HabitCompletionGrid({ habit }: { habit: Task }) {
    const today = startOfToday();
    const dates = Array.from({ length: 30 }).map((_, i) => subDays(today, 29 - i));
    
    const completionHistory = habit.completionHistory || [];
    const dailyStatus = habit.dailyStatus || [];

    const completedSet = new Set(completionHistory.map(d => format(parseISO(d), 'yyyy-MM-dd')));
    const statusMap = new Map(dailyStatus.map(ds => [format(parseISO(ds.date), 'yyyy-MM-dd'), ds.status]));

    const statusText: Record<DailyHabitStatus, string> = {
        'changes observed': 'Changes Observed',
        'no changes': 'No Changes',
        'negative': 'Negative',
        'not recorded': 'Completed'
    };

    return (
        <TooltipProvider>
            <div className="grid grid-cols-10 gap-1.5">
                {dates.map(date => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    const isCompleted = completedSet.has(dateString);
                    const dayStatus = statusMap.get(dateString) || 'not recorded';
                    
                    let tooltipText = "Not Completed";
                    let content: React.ReactNode = null;
                    let bgColor = "bg-muted/50";

                    if (isCompleted) {
                        tooltipText = statusText[dayStatus];
                        if (dayStatus !== 'not recorded') {
                            content = pageStatusIcons[dayStatus];
                            bgColor = "bg-muted"; // a neutral bg to make icon visible
                        } else {
                            bgColor = "bg-primary";
                        }
                    }

                    return (
                        <Tooltip key={dateString}>
                            <TooltipTrigger asChild>
                                <div className={cn("h-6 w-6 rounded-sm border flex items-center justify-center", bgColor)}>
                                    {content}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-semibold">{format(date, 'MMM d, yyyy')}</p>
                                <p>{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}


export default function HabitsPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Task | undefined>(undefined);
  const [selectedHabit, setSelectedHabit] = useState<Task | null>(null);
  const [newNote, setNewNote] = useState("");
  const isMobile = useIsMobile();

  const habits = useMemo(() => (Array.isArray(allTasks) ? allTasks : []).filter(task => task.isHabit), [allTasks]);
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a,b) => (b.priority === 'high' ? 1 : -1) - (a.priority === 'high' ? 1: -1) || calculateStreak(b) - calculateStreak(a));
  }, [habits]);

  const refreshHabits = async () => {
    setLoading(true);
    const tasks = await getAllTasks();
    setAllTasks(tasks);
    
    // Reselect habit if it still exists
    if (selectedHabit) {
      const refreshedSelected = (Array.isArray(tasks) ? tasks : []).find(h => h.id === selectedHabit.id);
      setSelectedHabit(refreshedSelected || null);
    }
    
    setLoading(false);
  };
  
  useEffect(() => {
    const loadTasks = async () => {
        const tasks = await getAllTasks();
        setAllTasks(tasks);
        if (!isMobile && (Array.isArray(tasks) ? tasks : []).filter(t=>t.isHabit).length > 0) {
            const sorted = [...(Array.isArray(tasks) ? tasks : []).filter(t=>t.isHabit)].sort((a,b) => (b.priority === 'high' ? 1 : -1) - (a.priority === 'high' ? 1: -1) || calculateStreak(b) - calculateStreak(a));
            setSelectedHabit(sorted[0]);
        }
        setLoading(false);
    }
    loadTasks();
  }, [isMobile]);

  useEffect(() => {
    if (selectedHabit) {
        const freshHabit = (Array.isArray(allTasks) ? allTasks : []).find(h => h.id === selectedHabit.id);
        if (freshHabit) {
            if (JSON.stringify(freshHabit) !== JSON.stringify(selectedHabit)) {
                setSelectedHabit(freshHabit);
            }
        } else {
            setSelectedHabit(null);
        }
    } else if (!isMobile && sortedHabits.length > 0) {
      setSelectedHabit(sortedHabits[0]);
    }
  }, [selectedHabit?.id, isMobile, sortedHabits, allTasks]);
  
  const hasCompletedToday = (habit: Task): boolean => {
    if (!habit.completionHistory) return false;
    const today = startOfToday();
    return habit.completionHistory.some(d => isEqual(startOfDay(parseISO(d)), today));
  }
  
  const getTodaysStatus = (habit: Task): DailyHabitStatus => {
    const today = startOfToday();
    const statusEntry = habit.dailyStatus?.find(ds => isEqual(startOfDay(parseISO(ds.date)), today));
    return statusEntry?.status || 'not recorded';
  }

  const handleToggleCompletion = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = startOfToday();
    const completedToday = hasCompletedToday(habit);
    let newCompletionHistory = [...(habit.completionHistory || [])];
    let toastMessage = {};
    let newLastCompletedDate = habit.lastCompletedDate;

    if (completedToday) {
      newCompletionHistory = newCompletionHistory.filter(d => !isEqual(startOfDay(parseISO(d)), today));
      const sortedHistory = newCompletionHistory.map(d => parseISO(d)).sort((a,b) => b.getTime() - a.getTime());
      newLastCompletedDate = sortedHistory.length > 0 ? sortedHistory[0].toISOString() : undefined;
      toastMessage = { title: "Habit undone.", description: `Completion for "${habit.title}" has been removed.` };
    } else {
      newCompletionHistory.push(today.toISOString());
      newLastCompletedDate = today.toISOString();
      toastMessage = { title: "Habit complete!", description: `Great job on "${habit.title}" today!` };
    }
    
    const updatedHabit = { ...habit, completionHistory: newCompletionHistory, lastCompletedDate: newLastCompletedDate };
    await updateTask(updatedHabit);

    refreshHabits();
    toast(toastMessage);
  };
  
  const handleSetDailyStatus = (habitId: string, status: DailyHabitStatus) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const today = startOfToday().toISOString();
    const existingStatusIndex = habit.dailyStatus?.findIndex(ds => isEqual(startOfDay(parseISO(ds.date)), startOfDay(parseISO(today)))) ?? -1;

    let newDailyStatus: DailyStatus[] = [...(habit.dailyStatus || [])];

    if (existingStatusIndex > -1) {
        if (newDailyStatus[existingStatusIndex].status === status) {
            newDailyStatus[existingStatusIndex].status = 'not recorded';
        } else {
            newDailyStatus[existingStatusIndex].status = status;
        }
    } else {
        newDailyStatus.push({ date: today, status: status });
    }

    const updatedHabit = { ...habit, dailyStatus: newDailyStatus };
    updateTask(updatedHabit);
    refreshHabits();
    toast({ title: "Observation recorded", description: `Status for "${habit.title}" set to "${status}".`});
  }

  const handleCreateHabit = async (data: HabitFormValues) => {
    const newHabit: Omit<Task, 'id'> = {
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        streakGoal: data.streakGoal,
        status: 'todo',
        isHabit: true,
        habitFrequency: data.habitFrequency,
        subtasks: [],
        notes: [],
        tags: [],
        completionHistory: [],
        dailyStatus: [],
    };
    await addTask(newHabit);
    await refreshHabits();
    toast({ title: "Habit created!", description: `"${data.title}" has been added.`});
  }

  const handleUpdateHabit = async (data: HabitFormValues) => {
    if (!editingHabit) return;
    const updatedHabit = { ...editingHabit, ...data };
    await updateTask(updatedHabit);
    await refreshHabits();
    setEditingHabit(undefined);
    toast({ title: "Habit updated!", description: `"${data.title}" has been saved.`});
  }

  const handleDeleteHabit = async (habitId: string) => {
    deleteTask(habitId);
    if (selectedHabit?.id === habitId) {
      setSelectedHabit(null);
    }
    await refreshHabits();
    toast({ title: "Habit deleted!", variant: "destructive" });
  }

  const handleSelectHabit = (habit: Task) => {
    setSelectedHabit(habit);
  }
  
  const handleSaveNote = async () => {
    if (!selectedHabit || newNote.trim() === "") return;
    const updatedHabit = {
      ...selectedHabit,
      notes: [...(selectedHabit.notes || []), newNote],
    };
    await updateTask(updatedHabit);
    await refreshHabits();
    setNewNote("");
     toast({
        title: "Note Saved",
        description: "Your new note has been added to the habit.",
    });
  };

  const showHabitList = !isMobile || (isMobile && !selectedHabit);
  const showHabitDetails = !isMobile || (isMobile && selectedHabit);
  
  const dailyStatusStyles: Record<DailyHabitStatus, string> = {
    'changes observed': 'bg-green-500/10 border-green-500/20',
    'negative': 'bg-red-500/10 border-red-500/20',
    'no changes': 'bg-yellow-500/10 border-yellow-500/20',
    'not recorded': '',
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
            <p className="text-muted-foreground">Stay consistent and build powerful habits.</p>
        </div>
        <div className="flex items-center gap-2">
            {isMobile && selectedHabit && (
                <Button variant="outline" onClick={() => setSelectedHabit(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            )}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Habit
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Habit</DialogTitle>
                    </DialogHeader>
                    <HabitForm onSubmit={handleCreateHabit} onOpenChange={setIsFormOpen} />
                </DialogContent>
            </Dialog>
        </div>
      </div>
      
      <div className={cn(
          "grid gap-6 h-[calc(100vh-theme(spacing.36))]",
          selectedHabit ? "md:grid-cols-3" : "grid-cols-1"
      )}>
        {showHabitList && (
            <div className={cn(
                "h-full",
                selectedHabit ? "md:col-span-1" : "md:col-span-3"
            )}>
                 <div className={cn(
                    "grid gap-6",
                    selectedHabit ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
                 )}>
                    {sortedHabits.map(habit => {
                        const streak = calculateStreak(habit);
                        const completedToday = hasCompletedToday(habit);
                        const progress = habit.streakGoal ? (streak / habit.streakGoal) * 100 : 0;
                        const goalMet = habit.streakGoal && streak >= habit.streakGoal;
                        const todaysStatus = getTodaysStatus(habit);

                        return (
                            <Card 
                                key={habit.id}
                                className={cn(
                                    "flex flex-col cursor-pointer transition-all",
                                    selectedHabit?.id === habit.id ? 'border-primary' : 'hover:border-primary/50',
                                    dailyStatusStyles[todaysStatus],
                                    goalMet && "border-green-500/50"
                                )}
                                onClick={() => handleSelectHabit(habit)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="flex-1">{habit.title}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={streak > 0 ? "default" : "secondary"} className="flex items-center gap-1.5 whitespace-nowrap">
                                                <Flame className={cn("h-4 w-4", streak > 0 ? "text-orange-300" : "text-muted-foreground")} />
                                                {streak} Day{streak !== 1 && 's'}
                                            </Badge>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4 text-destructive/50 hover:text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the "{habit.title}" habit and all its history. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteHabit(habit.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <CardDescription className="pt-2 line-clamp-2">{habit.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-end">
                                    <Badge variant="outline" className="capitalize w-fit">
                                      {habit.habitFrequency}
                                    </Badge>
                                    {habit.streakGoal && (
                                        <div className="mt-auto pt-4 space-y-2">
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Goal: {habit.streakGoal} days</span>
                                                {goalMet && <Trophy className="h-4 w-4 text-yellow-500" />}
                                            </div>
                                            <Progress value={progress} className={cn(goalMet && "[&>div]:bg-green-500")} />
                                        </div>
                                    )}
                                    <div className="flex items-stretch gap-2 w-full mt-4">
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); handleToggleCompletion(habit.id); }}
                                            variant={completedToday ? "secondary" : "default"}
                                            className="w-full"
                                        >
                                            {completedToday ? <Undo2 className="mr-2 h-4 w-4"/> : <Zap className="mr-2 h-4 w-4" />}
                                            {completedToday ? "Undo" : "Done"}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" onClick={e => e.stopPropagation()}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent onClick={e => e.stopPropagation()}>
                                                <DropdownMenuItem onSelect={() => handleSetDailyStatus(habit.id, 'changes observed')}>
                                                    <Smile className="mr-2 h-4 w-4 text-green-500" /> Changes Observed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleSetDailyStatus(habit.id, 'no changes')}>
                                                    <Meh className="mr-2 h-4 w-4 text-yellow-500" /> No Changes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleSetDailyStatus(habit.id, 'negative')}>
                                                    <Frown className="mr-2 h-4 w-4 text-red-500" /> Negative
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                    {habits.length === 0 && (
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardContent className="flex flex-col items-center justify-center gap-4 text-center h-60">
                                <Repeat className="w-12 h-12 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                You haven't created any habits yet.
                                </p>
                                <Button onClick={() => setIsFormOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Your First Habit
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                 </div>
            </div>
        )}
        {showHabitDetails && selectedHabit ? (
            <div className="md:col-span-2 h-full">
                <ScrollArea className="h-full pr-4">
                    <Card className="relative">
                         {isMobile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => setSelectedHabit(null)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                         )}
                        <CardHeader>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 pr-8">
                                    {selectedHabit.habitFrequency && (
                                        <Badge variant="outline" className="capitalize w-fit mb-2">
                                          {selectedHabit.habitFrequency}
                                        </Badge>
                                    )}
                                    <CardTitle className="text-2xl">{selectedHabit.title}</CardTitle>
                                    <CardDescription className="pt-2">{selectedHabit.description}</CardDescription>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <Dialog open={editingHabit?.id === selectedHabit.id} onOpenChange={(isOpen) => !isOpen && setEditingHabit(undefined)}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon" onClick={() => setEditingHabit(selectedHabit)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Habit</DialogTitle></DialogHeader>
                                            <HabitForm habit={selectedHabit} onSubmit={handleUpdateHabit} onOpenChange={(isOpen) => !isOpen && setEditingHabit(undefined)} />
                                        </DialogContent>
                                    </Dialog>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the "{selectedHabit.title}" habit and all its history. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteHabit(selectedHabit.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Separator />
                             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Current Streak</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <Flame className={cn("h-6 w-6", calculateStreak(selectedHabit) > 0 ? "text-orange-400" : "text-muted-foreground")} />
                                        <p className="text-2xl font-bold">{calculateStreak(selectedHabit)} days</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Streak Goal</p>
                                     <div className="flex items-center justify-center gap-2">
                                        <Trophy className={cn("h-6 w-6", selectedHabit.streakGoal && calculateStreak(selectedHabit) >= selectedHabit.streakGoal ? "text-yellow-500" : "text-muted-foreground")} />
                                        <p className="text-2xl font-bold">{selectedHabit.streakGoal ? `${selectedHabit.streakGoal} days` : 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 lg:col-span-1">
                                    <p className="text-sm text-muted-foreground">Last Completed</p>
                                     <div className="flex items-center justify-center gap-2">
                                        <CalendarIcon className={cn("h-6 w-6", selectedHabit.lastCompletedDate ? "text-primary" : "text-muted-foreground")} />
                                        <p className="text-lg font-bold">{selectedHabit.lastCompletedDate ? format(parseISO(selectedHabit.lastCompletedDate), 'MMM d, yyyy') : 'Never'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedHabit.streakGoal && (
                                <div>
                                     <Progress value={(calculateStreak(selectedHabit) / selectedHabit.streakGoal) * 100} />
                                </div>
                            )}

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-3">Last 30 Days Completion</h4>
                                <HabitCompletionGrid habit={selectedHabit} />
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-primary" />
                                    Last 30 Days Analytics
                                </h4>
                                <HabitAnalyticsChart habit={selectedHabit} />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-semibold">Notes</h4>
                                {selectedHabit.notes?.length > 0 ? (
                                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm max-h-40 overflow-y-auto">
                                        {selectedHabit.notes.map((note, index) => (
                                            <li key={index}>{note}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
                                )}
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Textarea 
                                            placeholder="Add a new note about this habit..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                        />
                                        <Button onClick={handleSaveNote} size="icon" variant="outline">
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>


                             <Button 
                                onClick={(e) => { e.stopPropagation(); handleToggleCompletion(selectedHabit.id); }}
                                variant={hasCompletedToday(selectedHabit) ? "secondary" : "default"}
                                className="w-full mt-4"
                            >
                                {hasCompletedToday(selectedHabit) ? <Undo2 className="mr-2 h-4 w-4"/> : <Zap className="mr-2 h-4 w-4" />}
                                {hasCompletedToday(selectedHabit) ? "Undo Today's Completion" : "Mark as Done Today"}
                            </Button>
                            
                        </CardContent>
                    </Card>
                </ScrollArea>
            </div>
        ) : showHabitList && !isMobile ? (
            <div className="md:col-span-2 h-full items-center justify-center flex">
                <div className="text-center text-muted-foreground">
                    <Repeat className="w-12 h-12 mx-auto mb-2"/>
                    <p>Select a habit to see its details.</p>
                </div>
            </div>
        ) : null}
      </div>
    </div>
  );
}
