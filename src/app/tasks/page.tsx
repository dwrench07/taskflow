
"use client";

import React from "react";
import { useState, useMemo, useEffect } from "react";
import { getAllTemplates, getAllTasks, addTask, updateTask as updateTaskInData, deleteTask as deleteTaskInData, getAllGoals } from "@/lib/data";
import { type Task, type Priority, type Subtask, type TaskTemplate, type Status, type Goal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ListTodo, FileText, Calendar as CalendarIcon, Clock, PlusCircle, Edit, Trash2, Tag, ChevronDown, ClipboardList, ArrowUpDown, ArrowLeft, Search, XCircle, Save, Loader2, Timer, Check, ArrowUp, ArrowDown, Lock, Target, Play, AlarmClock, CheckCircle2, Sparkles, Shield } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore } from "date-fns";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskForm } from "@/components/task-form";
import { TagInput } from "@/components/tag-input";
import { DateTimePicker } from "@/components/date-time-picker";
import { Textarea } from "@/components/ui/textarea";
import { EisenhowerMatrix } from "@/components/eisenhower-matrix";
import { LayoutGrid, LayoutList } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGamification } from "@/context/GamificationContext";
import { isPast, addDays } from "date-fns";
import { saveUserProgress } from "@/lib/data";


const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-500/10 text-red-500 border-red-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-green-500/10 text-green-600 border-green-500/20",
};

const statusStyles: Record<Status, string> = {
  todo: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "in-progress": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  done: "border-green-500/30 bg-green-500/10 text-green-400",
  abandoned: "border-red-500/30 bg-red-500/10 text-red-400",
};

type SortOption = "priority" | "title" | "startDate" | "status";

function calculateGoalProgress(goalId: string, allTasks: Task[]) {
  const goalTasks = allTasks.filter(t => t.goalId === goalId);
  if (goalTasks.length === 0) return 0;
  const completedTasks = goalTasks.filter(t => t.status === 'done').length;
  return Math.round((completedTasks / goalTasks.length) * 100);
}

function TaskListItem({ task, allTasks, goals, onSelect, isSelected }: { task: Task; allTasks: Task[]; goals: Goal[]; onSelect: () => void; isSelected: boolean }) {
  const isBlocked = task.status !== "done" && task.blockedBy && task.blockedBy.some(blockerId => {
    const blocker = allTasks.find(t => t.id === blockerId);
    return blocker && blocker.status !== "done";
  });
  const completionPercentage =
    task?.subtasks?.length > 0
      ? (task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100
      : task.status === "done" ? 100 : 0;

  return (
    <button onClick={onSelect} disabled={isBlocked} className={cn(
      "w-full block text-left p-4 rounded-xl border transition-all duration-300 ease-in-out animate-fade-in shadow-sm hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 overflow-hidden max-w-full min-w-0 relative",
      isSelected ? 'bg-primary/10 border-primary scale-[1.01]' : 'bg-card hover:bg-muted/50 hover:scale-[1.02] hover:border-primary/50',
      task.status === 'done' && 'border-green-500/20 opacity-80',
      isBlocked && 'opacity-50 grayscale select-none pointer-events-none hover:scale-100 hover:bg-card'
    )}>
      {isBlocked && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-muted text-red-500 px-2 py-1 rounded-md border border-red-500/30 shadow-sm z-10">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide">LOCKED</span>
        </div>
      )}
      <div className="flex justify-between items-start gap-2 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {task.isFrog && <span className="text-lg animate-bounce duration-1000" title="Eat this Frog!">🐸</span>}
          <p className="font-semibold line-clamp-2 text-left break-words leading-snug">{task.title}</p>
        </div>
        <Badge variant="outline" className={cn("capitalize flex-shrink-0 mt-0.5", priorityStyles[task.priority])}>
          {task.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 w-full text-left min-w-0 break-words">{task.description}</p>
      
      {(() => {
        const linkedGoal = goals?.find(g => g.id === task.goalId);
        if (!linkedGoal) return null;
        const progress = calculateGoalProgress(linkedGoal.id, allTasks);
        return (
          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-muted-foreground w-full">
            <Target className="w-3 h-3 text-primary/70" />
            <span className="truncate flex-1 font-medium">{linkedGoal.title}</span>
            <span className="flex-shrink-0 font-medium tabular-nums">{progress}%</span>
            <div className="w-12 bg-muted rounded-full h-1 overflow-hidden">
              <div className="bg-primary/70 h-1 flex-shrink-0 transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        );
      })()}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 w-full min-w-0">
        <ListTodo className="w-3 h-3 flex-shrink-0" />
        <span className="flex-shrink-0">{task?.subtasks?.filter(st => st.completed)?.length}/{task?.subtasks?.length}</span>
        <div className="w-full bg-muted rounded-full h-1.5 ml-auto overflow-hidden">
          <div className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${completionPercentage}%` }}></div>
        </div>
      </div>
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mt-3 overflow-hidden">
          {task.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs truncate max-w-[100px]">{tag}</Badge>
          ))}
          {task.tags.length > 3 && <Badge variant="secondary" className="text-xs flex-shrink-0">+{task.tags.length - 3}</Badge>}
        </div>
      )}
    </button>
  );
}


function CreateFromTemplateDialog({ onSelectTemplate, onOpenChange }: { onSelectTemplate: (template: TaskTemplate) => void; onOpenChange: (isOpen: boolean) => void }) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      const templates = await getAllTemplates();
      setTemplates(templates);
    }
    loadTemplates();
    setLoading(false);
  }, [])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Task from Template</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 max-h-96 overflow-y-auto p-1">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : templates.map(template => (
          <button
            key={template.id}
            onClick={() => {
              onSelectTemplate(template);
              onOpenChange(false);
            }}
            className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <p className="font-semibold">{template.title}</p>
            <p className="text-sm text-muted-foreground mt-1 truncate">{template.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <ListTodo className="w-3 h-3" />
              <span>{template.subtasks.length} subtasks</span>
            </div>
          </button>
        ))}
        {!loading && templates.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No templates found. Go to the Templates page to create one.</p>
        )}
      </div>
    </DialogContent>
  );
}

function NotesSection({ task, onUpdateTask }: { task: Task, onUpdateTask: (task: Task) => void }) {
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();

  const handleSaveNote = () => {
    if (newNote.trim() === "") return;
    const updatedTask = {
      ...task,
      notes: [...(task.notes || []), newNote.trim()],
    };
    onUpdateTask(updatedTask);
    setNewNote("");
    toast({
      title: "Note Saved",
      description: "Your new note has been added to the task.",
    });
  };

  return (
    <div className="bg-muted/10 p-6 rounded-3xl border border-border/50 shadow-sm mt-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-transparent"></div>
      <div className="mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground/90">
          <FileText className="w-5 h-5 text-primary" />
          Task Journal & Notes
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Keep track of thoughts, logs, and important updates.</p>
      </div>
      <div className="space-y-6">
        <div className="bg-background rounded-2xl p-1.5 border shadow-sm flex items-end gap-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <Textarea
            placeholder="Type your new note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="border-0 focus-visible:ring-0 resize-none min-h-[80px] bg-transparent pb-3 pt-3 px-4 shadow-none"
          />
          <Button onClick={handleSaveNote} size="icon" className="mb-1.5 mr-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0 transition-transform active:scale-95">
            <Save className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Journal History</h4>
          {task.notes && task.notes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {task.notes.map((note, index) => (
                <div key={index} className="bg-card border rounded-2xl p-4 text-sm text-foreground/90 shadow-sm">
                  {note}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-background/30 rounded-2xl border border-dashed">
              <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TasksPageContent() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditingFormOpen, setIsEditingFormOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { celebrate, refreshGamification, userProgress, refreshProgress } = useGamification();
  const [sortOption, setSortOption] = useState<SortOption>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [energyFilter, setEnergyFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "eisenhower">("list");

  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const refreshTasks = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const [tasks, fetchedGoals] = await Promise.all([getAllTasks(), getAllGoals()]);
    setAllTasks(tasks || []);
    setGoals(fetchedGoals || []);
    if (showLoader) setLoading(false);
    return tasks;
  };

  useEffect(() => {
    let isMounted = true; // helps prevent state updates if component unmounts

    const loadTasks = async () => {
      try {
        const tasks = await refreshTasks(true); // wait for promise to resolve
        const taskId = searchParams?.get('taskId');
        const taskToSelect = taskId ? tasks.find(t => t.id === taskId) : null;

        if (!isMounted) return;

        if (taskToSelect) {
          setSelectedTask(taskToSelect);
        } else {
          setSelectedTask(null);
        }
      } catch (error) {
        console.error("Failed to refresh tasks:", error);
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [searchParams, isMobile]);



  // Consumable logic
  const handleUseFreshStart = async () => {
    if (!selectedTask || !userProgress || userProgress.inventory.freshStartTokens <= 0) return;
    
    // deduct token
    const newProgress = { ...userProgress };
    newProgress.inventory.freshStartTokens -= 1;
    await saveUserProgress(newProgress);
    await refreshProgress();

    // Use token - clear all overdue dates
    const updatedTask = { ...selectedTask, doDate: undefined, endDate: undefined };
    await handleUpdateTask(updatedTask);
    
    toast({
      title: "Fresh Start Token Used",
      description: "Deadlines cleared. Breathe, and start fresh.",
    });
  };

  const handleUseComposureCoin = async () => {
    if (!selectedTask || !userProgress || userProgress.inventory.composureCoins <= 0) return;
    
    // deduct token
    const newProgress = { ...userProgress };
    newProgress.inventory.composureCoins -= 1;
    await saveUserProgress(newProgress);
    await refreshProgress();

    // Use token - push deadline by 1 day
    const newDate = selectedTask.endDate ? addDays(new Date(selectedTask.endDate), 1) : addDays(new Date(), 1);
    const updatedTask = { ...selectedTask, endDate: newDate.toISOString() };
    await handleUpdateTask(updatedTask);
    
    toast({
      title: "Composure Coin Used",
      description: "Deadline respectfully snoozed by 24 hours.",
    });
  };

  useEffect(() => {
    // when task list changes, if a task was selected, refresh its data
    if (selectedTask) {
      const freshTask = allTasks.find(t => t.id === selectedTask.id);
      setSelectedTask(freshTask || null);
    }
  }, [allTasks, selectedTask?.id]);


  const sortedAndFilteredTasks = useMemo(() => {
    console.log("Recomputing sorted and filtered tasks", allTasks);
    console.log("^^^^^^^^^^||||||^^^^^^^", typeof allTasks)
    let sorted = typeof allTasks === 'object' ? allTasks?.filter(t => !t.isHabit) : [];
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<Status, number> = { todo: 1, "in-progress": 2, done: 3, abandoned: 4 };

    let filtered = sorted;
    if (searchQuery) {
      filtered = filtered.filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (statusFilter.length > 0) {
      filtered = filtered.filter(task => statusFilter.includes(task.status));
    }
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(task => priorityFilter.includes(task.priority));
    }
    if (energyFilter.length > 0) {
      filtered = filtered.filter(task => energyFilter.includes(task.energyLevel || 'none'));
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case "priority":
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "title":
          return a.title.localeCompare(b.title);
        case "startDate":
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        case "status":
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
    return filtered;
  }, [allTasks, searchQuery, statusFilter, priorityFilter, energyFilter, sortOption]);

  useEffect(() => {
    if (!selectedTask && !isMobile && sortedAndFilteredTasks.length > 0) {
      // Auto-selection removed so it displays as a grid
    }
  }, [sortedAndFilteredTasks, selectedTask, isMobile]);


  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allTasks.forEach(task => {
      task.tags?.forEach(tag => tagSet.add(tag));
      task.subtasks?.forEach(subtask => {
        subtask.tags?.forEach(tag => tagSet.add(tag));
      });
    });
    return Array.from(tagSet).sort();

  }, [allTasks]);


  const handleUpdateTask = async (updatedTask: Task) => {
    await updateTaskInData(updatedTask);
    const freshTasks = await refreshTasks();
    const freshSelectedTask = freshTasks.find(t => t.id === updatedTask.id);
    setSelectedTask(freshSelectedTask || null);
  };

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'subtasks' | 'notes' | 'status'> & { status?: Status }) => {
    const taskToAdd: Omit<Task, 'id'> = {
      ...newTaskData,
      status: 'todo',
      subtasks: [],
      notes: [],
    };
    const addedTask = await addTask(taskToAdd);
    refreshTasks();
    setSelectedTask(addedTask);
    router.push(`/tasks?taskId=${addedTask.id}`, { scroll: false });
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTaskInData(taskId);
    await refreshTasks();
    setSelectedTask(null);
    router.replace('/tasks', { scroll: false });
    toast({
      title: "Task Deleted",
      description: "The task has been successfully deleted.",
      variant: "destructive",
    });
  }

  const handleCreateTaskFromTemplate = async (template: TaskTemplate) => {
    const newSubtasks: Subtask[] = template.subtasks.map(tsub => ({
      id: `sub-${Date.now()}-${tsub.id}`,
      title: tsub.title,
      completed: false,
      tags: tsub.tags || [],
    }));

    const taskToAdd: Omit<Task, 'id'> = {
      title: template.title,
      description: template.description,
      priority: template.priority,
      status: 'todo',
      tags: template.tags || [],
      subtasks: newSubtasks,
      notes: [`Created from template: "${template.title}"`],
    };

    const addedTask = await addTask(taskToAdd);
    setSelectedTask(addedTask);
    setIsTemplateDialogOpen(false);
    await refreshTasks();
    router.push(`/tasks?taskId=${addedTask.id}`, { scroll: false });
    toast({
      title: "Task created from template!",
      description: `"${template.title}" has been added to your task list.`,
    });
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    router.push(`/tasks?taskId=${task.id}`, { scroll: false });
  }

  const handleCloseSheet = (open: boolean) => {
    if (!open) {
      setSelectedTask(null);
      router.push('/tasks', { scroll: false });
    }
  }

  const handleDateChange = async (field: 'startDate' | 'endDate' | 'doDate', date: Date) => {
    if (selectedTask) {
      const updatedTask = { ...selectedTask, [field]: date.toISOString() };
      await handleUpdateTask(updatedTask);
    }
  }

  const handleSubtaskDateChange = async (subtaskId: string, field: 'startDate' | 'endDate' | 'doDate', date: Date) => {
    if (selectedTask) {
      if (field === 'startDate') {
        const taskStartDate = selectedTask.startDate ? new Date(selectedTask.startDate) : null;
        const taskEndDate = selectedTask.endDate ? new Date(selectedTask.endDate) : null;

        if (taskStartDate && isBefore(date, taskStartDate)) {
          toast({
            variant: "destructive",
            title: "Invalid Subtask Start Date",
            description: `The subtask must start on or after the parent task's start date (${format(taskStartDate, 'PPP')}).`
          });
          return;
        }
        if (taskEndDate && isAfter(date, taskEndDate)) {
          toast({
            variant: "destructive",
            title: "Invalid Subtask Start Date",
            description: `The subtask must start on or before the parent task's end date (${format(taskEndDate, 'PPP')}).`
          });
          return;
        }
      }

      const updatedSubtasks = selectedTask.subtasks.map(st =>
        st.id === subtaskId ? { ...st, [field]: date.toISOString() } : st
      );
      const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
      await handleUpdateTask(updatedTask);
    }
  }

  const handleSubtaskCompletion = async (subtaskId: string, completed: boolean) => {
    if (!selectedTask) return;
    const updatedSubtasks = selectedTask.subtasks.map(st =>
      st.id === subtaskId ? { 
        ...st, 
        completed,
        completedAt: completed ? new Date().toISOString() : undefined 
      } : st
    );
    const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
    await handleUpdateTask(updatedTask);
  }

  const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubtaskTitle.trim() && selectedTask) {
      const newSubtask: Subtask = {
        id: `sub-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
        tags: [],
      };
      const updatedTask = { ...selectedTask, subtasks: [...selectedTask.subtasks, newSubtask] };
      await handleUpdateTask(updatedTask);
      setNewSubtaskTitle("");
    }
  }

  const handleUpdateSubtask = async (subtask: Subtask) => {
    if (!selectedTask) return;
    const updatedSubtasks = selectedTask.subtasks.map(st =>
      st.id === subtask.id ? subtask : st
    );
    const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
    await handleUpdateTask(updatedTask);
    if (editingSubtask?.id === subtask.id) {
      setEditingSubtask(null);
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    const updatedSubtasks = selectedTask.subtasks.filter(st => st.id !== subtaskId);
    const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
    await handleUpdateTask(updatedTask);
  }

  const handleMoveSubtaskUp = async (index: number) => {
    if (!selectedTask || index === 0) return;
    const updatedSubtasks = [...selectedTask.subtasks];
    const temp = updatedSubtasks[index - 1];
    updatedSubtasks[index - 1] = updatedSubtasks[index];
    updatedSubtasks[index] = temp;

    await handleUpdateTask({ ...selectedTask, subtasks: updatedSubtasks });
  }

  const handleMoveSubtaskDown = async (index: number) => {
    if (!selectedTask || index === selectedTask.subtasks.length - 1) return;
    const updatedSubtasks = [...selectedTask.subtasks];
    const temp = updatedSubtasks[index + 1];
    updatedSubtasks[index + 1] = updatedSubtasks[index];
    updatedSubtasks[index] = temp;

    await handleUpdateTask({ ...selectedTask, subtasks: updatedSubtasks });
  }

  const handleUpdateTaskTags = async (tags: string[]) => {
    if (selectedTask) {
      await handleUpdateTask({ ...selectedTask, tags });
    }
  }

  const handleUpdateSubtaskTags = async (subtaskId: string, tags: string[]) => {
    if (selectedTask) {
      const updatedSubtasks = selectedTask.subtasks.map(st =>
        st.id === subtaskId ? { ...st, tags } : st
      );
      await handleUpdateTask({ ...selectedTask, subtasks: updatedSubtasks });
    }
  }

  const handleStatusChange = async (status: Status) => {
    if (selectedTask) {
      const updatedTask = { ...selectedTask, status };
      await handleUpdateTask(updatedTask);

      if (status === 'done') {
        const isFrog = selectedTask.isFrog ||
          (selectedTask.pushCount && selectedTask.pushCount >= 3) ||
          (selectedTask.priority === 'urgent' && selectedTask.energyLevel === 'high');

        if (isFrog) {
          celebrate({ reason: 'frog-eaten', title: 'Frog eaten!', description: selectedTask.title, intensity: 'big' });
        } else {
          celebrate({ reason: 'task-complete', title: 'Task done!', description: selectedTask.title, intensity: 'medium' });
        }
        
        // Loot Drop Evaluation
        if (userProgress) {
          import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
            const tempProgress = JSON.parse(JSON.stringify(userProgress));
            const updates = evaluateGamificationTriggers(
              { type: 'task-completed', task: updatedTask, allTasksOnLoad: allTasks },
              tempProgress
            );

            if (updates.length > 0) {
              await saveUserProgress(tempProgress);
              await refreshProgress();
              
              // Cascade toasts for that "loot drop" feel
              updates.forEach((u, idx) => {
                setTimeout(() => {
                  toast({
                    title: `🎁 ${u.message}`,
                    description: u.detail,
                    variant: "default",
                  });
                }, idx * 1500);
              });
            }
          });
        }

        refreshGamification();
      }
    }
  };

  const handleBackToList = () => {
    setSelectedTask(null);
    router.push('/tasks', { scroll: false });
  }

  const toggleStatusFilter = (status: Status) => {
    setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  }

  const togglePriorityFilter = (priority: Priority) => {
    setPriorityFilter(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
  }

  const toggleEnergyFilter = (level: string) => {
    setEnergyFilter(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);
  }


  const showTaskList = !isMobile || (isMobile && !selectedTask);
  const showTaskDetails = !isMobile || (isMobile && selectedTask);

  const statusLabels: Record<Status, string> = {
    todo: 'To-Do',
    'in-progress': 'In Progress',
    done: 'Done',
    abandoned: 'Dropped',
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Your central hub for all tasks.</p>
        </div>
        {isMobile && selectedTask && (
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>
      <div className={cn(
        "w-full min-w-0 h-[calc(100vh-theme(spacing.48))] md:h-[calc(100vh-theme(spacing.36))]"
      )}>
        <Card className={cn(
          "flex flex-col h-full overflow-hidden min-h-0 min-w-0 border-border shadow-sm w-full"
        )}>
          <CardHeader className="flex flex-col gap-4 flex-none pb-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>All Tasks</CardTitle>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        New Blank Task
                      </DropdownMenuItem>
                      <DialogTrigger asChild>
                        <DropdownMenuItem>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Create from Template
                        </DropdownMenuItem>
                      </DialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <CreateFromTemplateDialog onSelectTemplate={handleCreateTaskFromTemplate} onOpenChange={setIsTemplateDialogOpen} />
                </Dialog>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    allTags={allTags}
                    onSubmit={(data) => {
                      const sanitizedData = {
                        ...data,
                        goalId: data.goalId === null ? undefined : data.goalId,
                        milestoneId: data.milestoneId === "none" || data.milestoneId === null ? undefined : data.milestoneId,
                        energyLevel: data.energyLevel === null ? undefined : data.energyLevel,
                        startDate: data.startDate || undefined,
                        endDate: data.endDate || undefined,
                        doDate: data.doDate || undefined,
                        blocks: data.blocks || [],
                        blockedBy: data.blockedBy || [],
                        tShirtSize: data.tShirtSize === null ? undefined : data.tShirtSize,
                        timeLimit: data.timeLimit || undefined,
                      };
                      handleAddTask(sanitizedData);
                      setIsFormOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
              <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-8 w-8 rounded-md"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'eisenhower' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-8 w-8 rounded-md"
                  onClick={() => setViewMode('eisenhower')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8 w-full h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && <XCircle onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="startDate">Start Date</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9">
                    Filter
                    {(statusFilter.length > 0 || priorityFilter.length > 0 || energyFilter.length > 0) && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuCheckboxItem checked={statusFilter.includes('todo')} onCheckedChange={() => toggleStatusFilter('todo')} onSelect={(e) => e.preventDefault()}>To-Do</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={statusFilter.includes('in-progress')} onCheckedChange={() => toggleStatusFilter('in-progress')} onSelect={(e) => e.preventDefault()}>In Progress</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={statusFilter.includes('done')} onCheckedChange={() => toggleStatusFilter('done')} onSelect={(e) => e.preventDefault()}>Done</DropdownMenuCheckboxItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuCheckboxItem checked={priorityFilter.includes('urgent')} onCheckedChange={() => togglePriorityFilter('urgent')} onSelect={(e) => e.preventDefault()}>Urgent</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={priorityFilter.includes('high')} onCheckedChange={() => togglePriorityFilter('high')} onSelect={(e) => e.preventDefault()}>High</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={priorityFilter.includes('medium')} onCheckedChange={() => togglePriorityFilter('medium')} onSelect={(e) => e.preventDefault()}>Medium</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={priorityFilter.includes('low')} onCheckedChange={() => togglePriorityFilter('low')} onSelect={(e) => e.preventDefault()}>Low</DropdownMenuCheckboxItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Energy Level</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuCheckboxItem checked={energyFilter.includes('high')} onCheckedChange={() => toggleEnergyFilter('high')} onSelect={(e) => e.preventDefault()}>High (Deep Work)</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={energyFilter.includes('medium')} onCheckedChange={() => toggleEnergyFilter('medium')} onSelect={(e) => e.preventDefault()}>Medium (Standard)</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={energyFilter.includes('low')} onCheckedChange={() => toggleEnergyFilter('low')} onSelect={(e) => e.preventDefault()}>Low (Brain-dead)</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={energyFilter.includes('none')} onCheckedChange={() => toggleEnergyFilter('none')} onSelect={(e) => e.preventDefault()}>Not specified</DropdownMenuCheckboxItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {(statusFilter.length > 0 || priorityFilter.length > 0 || energyFilter.length > 0) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => { setStatusFilter([]); setPriorityFilter([]); setEnergyFilter([]); }}>Clear Filters</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden min-h-0">
            {viewMode === 'list' ? (
              <div className="grid gap-6 pb-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="col-span-full flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sortedAndFilteredTasks.map(task => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    allTasks={allTasks}
                    goals={goals}
                    isSelected={selectedTask?.id === task.id}
                    onSelect={() => handleSelectTask(task)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full pb-8">
                <EisenhowerMatrix 
                  tasks={sortedAndFilteredTasks} 
                  goals={goals}
                  onSelectTask={handleSelectTask} 
                />
              </div>
            )}
          </div>
        </Card>

        <Sheet open={!!selectedTask} onOpenChange={handleCloseSheet}>
          <SheetContent side="right" className="w-full sm:max-w-[75vw] overflow-y-auto p-4 sm:p-6 lg:p-8">
            {selectedTask && (
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <div className="flex-1 pr-4 overflow-y-auto overflow-x-hidden">
                  <div className="space-y-6 pb-8">
                    <Card className="shadow-none border-none bg-transparent">
                      <CardHeader className="px-0 pt-0 pb-6">
                        <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className={cn("capitalize h-8 rounded-full px-4 text-xs font-semibold tracking-wide border-2", statusStyles[selectedTask.status])}>
                                    {statusLabels[selectedTask.status]}
                                    <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuRadioGroup value={selectedTask.status} onValueChange={(value) => handleStatusChange(value as Status)}>
                                    <DropdownMenuRadioItem value="todo">To-Do</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="in-progress">In Progress</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="done">Done</DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Badge variant="outline" className={cn("capitalize px-3 py-0.5 rounded-full border-2", priorityStyles[selectedTask.priority])}>
                                {selectedTask.priority} Priority
                              </Badge>
                            </div>
                            <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-1">{selectedTask.title}</CardTitle>
                            {selectedTask?.subtasks && selectedTask.subtasks.length > 0 && (
                              <div className="flex items-center gap-3 mt-4 w-full max-w-md">
                                <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                  {selectedTask.subtasks.filter(st => st.completed).length}/{selectedTask.subtasks.length} Subtasks
                                </div>
                                <div className="flex-1 bg-muted/60 rounded-full h-1.5 overflow-hidden border border-border/50 relative">
                                  <div className="absolute top-0 left-0 bg-primary h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${(selectedTask.subtasks.filter(st => st.completed).length / selectedTask.subtasks.length) * 100}%` }}></div>
                                </div>
                              </div>
                            )}
                            <p className="text-muted-foreground text-[15px] pt-4 w-full min-w-0 break-words whitespace-pre-wrap leading-relaxed">{selectedTask.description}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0 border border-border/50 p-1.5 rounded-full bg-background/50 shadow-sm backdrop-blur-sm">
                            
                            {userProgress && userProgress.inventory.freshStartTokens > 0 && selectedTask.endDate && isPast(new Date(selectedTask.endDate)) && selectedTask.status !== 'done' && (
                              <Button className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20 shadow-sm transition-all rounded-full px-4" variant="outline" size="sm" onClick={handleUseFreshStart}>
                                <Sparkles className="mr-2 h-4 w-4" /> Consume Fresh Start
                              </Button>
                            )}
                            
                            {userProgress && userProgress.inventory.composureCoins > 0 && selectedTask.status !== 'done' && (
                              <Button className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border-yellow-500/20 shadow-sm transition-all rounded-full px-4" variant="outline" size="sm" onClick={handleUseComposureCoin}>
                                <Shield className="mr-2 h-4 w-4" /> Use Composure Coin
                              </Button>
                            )}

                            <Button className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-sm transition-all rounded-full px-5" variant="outline" size="sm" onClick={() => router.push(`/focus?taskId=${selectedTask.id}`)}>
                              <Timer className="mr-2 h-4 w-4" /> Focus Session
                            </Button>
                            <Dialog open={isEditingFormOpen} onOpenChange={setIsEditingFormOpen}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Task</DialogTitle>
                                </DialogHeader>
                                <TaskForm
                                  task={selectedTask}
                                  allTags={allTags}
                                  onSubmit={async (data) => {
                                    const updatedData = {
                                      ...selectedTask,
                                      ...data,
                                      goalId: data.goalId === null ? undefined : data.goalId,
                                      energyLevel: data.energyLevel === null ? undefined : data.energyLevel,
                                      milestoneId: data.milestoneId === "none" || data.milestoneId === null ? undefined : data.milestoneId,
                                      startDate: data.startDate || undefined,
                                      endDate: data.endDate || undefined,
                                      doDate: data.doDate || undefined,
                                      blockedBy: data.blockedBy || [],
                                      blocks: data.blocks || [],
                                      tShirtSize: data.tShirtSize === null ? undefined : data.tShirtSize,
                                      timeLimit: data.timeLimit || undefined,
                                    };
                                    await handleUpdateTask(updatedData);
                                    setIsEditingFormOpen(false);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the task
                                    "{selectedTask.title}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTask(selectedTask.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-0">
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8 relative">
                          <div className="lg:col-span-3 space-y-3 bg-muted/20 p-5 rounded-2xl border border-border/50 shadow-sm transition-all hover:shadow-md">
                            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                              <Tag className="w-4 h-4 text-primary/70" />
                              Labels & Categories
                            </h4>
                            <div className="pt-2">
                              <TagInput
                                tags={selectedTask.tags || []}
                                allTags={allTags}
                                onUpdateTags={handleUpdateTaskTags}
                                placeholder="Add or select tags..."
                              />
                            </div>
                          </div>
                          <div className="xl:col-span-2 space-y-4 bg-muted/20 p-5 rounded-2xl border border-border/50 shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                <CalendarIcon className="w-4 h-4 text-primary/70" />
                                Schedule
                              </h4>
                              <div className="grid gap-4 pt-2">
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Earliest Start</span>
                                  <DateTimePicker date={selectedTask.startDate} setDate={(date) => handleDateChange('startDate', date)} />
                                </div>
                                <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Drop Dead Date (Point of no return)</span>
                                  <DateTimePicker date={selectedTask.doDate} setDate={(date) => handleDateChange('doDate', date)} label="Must do by..." />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Final Deadline</span>
                                  <DateTimePicker date={selectedTask.endDate} setDate={(date) => handleDateChange('endDate', date)} label="Hard deadline" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="py-4 mt-6 bg-muted/10 rounded-3xl p-6 border border-border/50 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary-foreground/20 to-transparent"></div>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-2 text-foreground/90">
                              <ListTodo className="w-5 h-5 text-primary" />
                              Subtasks Action Plan
                            </h4>
                            <Badge variant="secondary" className="font-medium bg-background border shadow-sm">
                              {selectedTask?.subtasks?.filter(st => st.completed).length || 0} / {selectedTask?.subtasks?.length || 0} Completed
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            {selectedTask?.subtasks?.map((subtask, index) => (
                              <div key={subtask.id} className={cn(
                                "flex flex-col gap-3 group p-3 rounded-xl border transition-all duration-300",
                                subtask.completed ? "bg-muted/30 border-border/40" : "bg-card hover:border-primary/40 hover:shadow-sm"
                              )}>
                                <div className="flex items-start gap-3 w-full">
                                  <div className={cn(
                                    "relative flex items-center justify-center w-5 h-5 rounded border-2 transition-colors mt-0.5 shrink-0",
                                    subtask.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-background group-hover:border-primary/50"
                                  )}>
                                    <Checkbox
                                      id={subtask.id}
                                      checked={subtask.completed}
                                      onCheckedChange={(checked) => handleSubtaskCompletion(subtask.id, !!checked)}
                                      className="w-full h-full opacity-0 absolute cursor-pointer"
                                    />
                                    {subtask.completed && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {editingSubtask?.id === subtask.id ? (
                                        <Input
                                          type="text"
                                          defaultValue={subtask.title}
                                          autoFocus
                                          onBlur={() => setEditingSubtask(null)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                              handleUpdateSubtask({ ...subtask, title: e.currentTarget.value.trim() });
                                            } else if (e.key === 'Escape') {
                                              setEditingSubtask(null)
                                            }
                                          }}
                                          className="h-8 text-sm font-medium shadow-sm"
                                          placeholder="Subtask title..."
                                        />
                                      ) : (
                                        <>
                                          <label
                                            htmlFor={subtask.id}
                                            className={cn(
                                              "text-sm font-bold flex-1 cursor-text break-words select-none transition-colors",
                                              subtask.completed ? "line-through text-muted-foreground" : "text-foreground/90 group-hover:text-primary"
                                            )}
                                            onDoubleClick={() => setEditingSubtask(subtask)}
                                          >
                                            {subtask.title}
                                          </label>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 py-0 capitalize font-bold cursor-pointer", subtask.priority && priorityStyles[subtask.priority])}>
                                                  {subtask.priority ? subtask.priority[0].toUpperCase() : "P"}
                                                </Badge>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent>
                                                <DropdownMenuRadioGroup value={subtask.priority || ""} onValueChange={(val) => handleUpdateSubtask({ ...subtask, priority: val as Priority })}>
                                                  <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                              </DropdownMenuContent>
                                            </DropdownMenu>

                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 py-0 font-normal border cursor-pointer opacity-70 hover:opacity-100">
                                                  {subtask.energyLevel ? subtask.energyLevel[0].toUpperCase() : "E"}
                                                </Badge>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent>
                                                <DropdownMenuRadioGroup value={subtask.energyLevel || "none"} onValueChange={(val) => handleUpdateSubtask({ ...subtask, energyLevel: val === "none" ? undefined : val as any })}>
                                                  <DropdownMenuRadioItem value="none">Not specified</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="high">High (Deep Work)</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="medium">Medium (Standard)</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="low">Low (Brain-dead)</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-2 mt-3 p-3 bg-muted/20 rounded-xl border border-border/40 overflow-hidden">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                                            <Play className="w-2.5 h-2.5" /> Start
                                          </span>
                                          <DateTimePicker
                                            date={subtask.startDate}
                                            setDate={(date) => handleSubtaskDateChange(subtask.id, 'startDate', date)}
                                            triggerClassName="h-9 text-xs px-3 w-full bg-background border-border/50 hover:bg-muted/50 shadow-sm"
                                            label="Set start time..."
                                          />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                                            <AlarmClock className="w-2.5 h-2.5" /> Deadline
                                          </span>
                                          <DateTimePicker
                                            date={subtask.endDate}
                                            setDate={(date) => handleSubtaskDateChange(subtask.id, 'endDate', date)}
                                            label="Set deadline..."
                                            triggerClassName="h-9 text-xs px-3 w-full bg-background border-border/50 hover:bg-muted/50 shadow-sm text-primary font-bold"
                                          />
                                        </div>
                                      </div>

                                      {subtask.completed && subtask.completedAt && (
                                        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-green-500/80 flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> Resolved At
                                          </span>
                                          <div className="h-9 flex items-center px-3 text-xs font-medium text-green-500/90 bg-green-500/5 rounded-md border border-green-500/20">
                                            {format(new Date(subtask.completedAt), "MMM d, h:mm a")}
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                                          <Tag className="w-2.5 h-2.5" /> Labels
                                        </span>
                                        <TagInput
                                          tags={subtask.tags || []}
                                          allTags={allTags}
                                          onUpdateTags={(tags) => handleUpdateSubtaskTags(subtask.id, tags)}
                                          placeholder="Add tags..."
                                          className="h-9 text-xs flex-1 w-full"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10" disabled={index === 0} onClick={() => handleMoveSubtaskUp(index)}>
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10" disabled={index === selectedTask.subtasks.length - 1} onClick={() => handleMoveSubtaskDown(index)}>
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSubtask(subtask.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="mt-6">
                              <div className="flex items-center gap-3 bg-background border px-4 py-1 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all">
                                <PlusCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                <Input
                                  placeholder="Add an actionable step..."
                                  value={newSubtaskTitle}
                                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                  onKeyDown={handleAddSubtask}
                                  className="h-8 border-0 focus-visible:ring-0 px-0 shadow-none text-sm bg-transparent min-w-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <NotesSection task={selectedTask} onUpdateTask={handleUpdateTask} />
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div >
  );
}

export default function TasksPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TasksPageContent />
    </React.Suspense>
  )
}
