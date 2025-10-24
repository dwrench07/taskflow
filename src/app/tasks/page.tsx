
"use client";

import React from "react";
import { useState, useMemo, useEffect } from "react";
import { getAllTemplates, getAllTasks, addTask, updateTask as updateTaskInData, deleteTask as deleteTaskInData } from "@/lib/data";
import { type Task, type Priority, type Subtask, type TaskTemplate, type Status } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ListTodo, FileText, Calendar as CalendarIcon, Clock, PlusCircle, Edit, Trash2, Tag, ChevronDown, ClipboardList, ArrowUpDown, ArrowLeft, Search, XCircle, Save, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore } from "date-fns";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { TagInput } from "@/components/tag-input";
import { Textarea } from "@/components/ui/textarea";
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


const priorityStyles: Record<Priority, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-50/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
};

const statusStyles: Record<Status, string> = {
  todo: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "in-progress": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  done: "border-green-500/30 bg-green-500/10 text-green-400",
};

type SortOption = "priority" | "title" | "startDate" | "status";

function TaskListItem({ task, onSelect, isSelected }: { task: Task; onSelect: () => void; isSelected: boolean }) {
  const completionPercentage =
     task?.subtasks?.length > 0
      ? (task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100
      : task.status === "done" ? 100 : 0;

  return (
    <button onClick={onSelect} className={cn(
        "w-full text-left p-3 rounded-lg border-2 transition-colors",
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50',
        task.status === 'done' && 'border-green-500/20'
    )}>
        <div className="flex justify-between items-start">
            <p className="font-semibold truncate pr-2">{task.title}</p>
            <Badge variant="outline" className={cn("capitalize flex-shrink-0", priorityStyles[task.priority])}>
            {task.priority}
            </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1 truncate">{task.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-2">
            <ListTodo className="w-3 h-3"/>
            <span>{task?.subtasks?.filter(st => st.completed)?.length}/{task?.subtasks?.length}</span>
            <div className="w-full bg-muted rounded-full h-1.5 ml-auto">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
            </div>
        </div>
        {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {task.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
                {task.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{task.tags.length - 3}</Badge>}
            </div>
        )}
    </button>
  );
}

function DateTimePicker({ date, setDate }: { date?: string; setDate: (date: Date) => void }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedDate = date ? new Date(date) : undefined;
  
  const formattedDate = isMounted && date ? format(new Date(date), "PPP p") : "Pick a date and time";

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!time) return;
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(selectedDate || new Date());
    newDate.setHours(hours, minutes);
    setDate(newDate);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formattedDate}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { if(d) setDate(d)}}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Input 
              type="time" 
              className="w-full"
              defaultValue={selectedDate ? format(selectedDate, 'HH:mm') : ''}
              onChange={handleTimeChange}
              />
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
                <ListTodo className="w-3 h-3"/>
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
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>All notes related to this task.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 pt-2">
            <h4 className="font-semibold">Add a new note:</h4>
            <div className="flex gap-2">
                <Textarea 
                    placeholder="Type your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                />
                <Button onClick={handleSaveNote} size="icon">
                    <Save />
                </Button>
            </div>
        </div>

        <div className="space-y-2 pt-4">
            <h4 className="font-semibold">All Notes:</h4>
            {task.notes && task.notes.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm max-h-40 overflow-y-auto">
                    {task.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                    ))}
                </ul>
            ): (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
  )
}

function TasksPageContent() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditingFormOpen, setIsEditingFormOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [sortOption, setSortOption] = useState<SortOption>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  
  const refreshTasks = async () => {
    setLoading(true);
    const tasks = await getAllTasks();
    setAllTasks(tasks);
    setLoading(false);
    return tasks;
  };

useEffect(() => {
  let isMounted = true; // helps prevent state updates if component unmounts

  const loadTasks = async () => {
    try {
      const tasks = await refreshTasks(); // wait for promise to resolve
      const taskId = searchParams?.get('taskId');
      const taskToSelect = taskId ? tasks.find(t => t.id === taskId) : null;

      if (!isMounted) return;

      if (taskToSelect) {
        setSelectedTask(taskToSelect);
      } else if (!isMobile) {
        // Auto-select first task based on current sort/filter
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
  
  useEffect(() => {
      // when task list changes, if a task was selected, refresh its data
      if (selectedTask) {
          const freshTask = allTasks.find(t => t.id === selectedTask.id);
          setSelectedTask(freshTask || null);
      }
  }, [allTasks, selectedTask?.id]);


  const sortedAndFilteredTasks = useMemo( () => {
    console.log("Recomputing sorted and filtered tasks", allTasks);
    console.log("^^^^^^^^^^||||||^^^^^^^", typeof allTasks)
    let sorted = typeof allTasks === 'object' ? allTasks?.filter(t => !t.isHabit) : [];
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const statusOrder = { todo: 1, "in-progress": 2, done: 3 };

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
  }, [allTasks, searchQuery, statusFilter, priorityFilter, sortOption]);
  
  useEffect(() => {
    if (!selectedTask && !isMobile && sortedAndFilteredTasks.length > 0) {
        setSelectedTask(sortedAndFilteredTasks[0]);
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

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'subtasks' | 'notes' | 'status'> & {status?: Status}) => {
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

  const handleDateChange = async (field: 'startDate' | 'endDate', date: Date) => {
    if(selectedTask) {
        const updatedTask = { ...selectedTask, [field]: date.toISOString() };
        await handleUpdateTask(updatedTask);
    }
  }
  
  const handleSubtaskDateChange = async (subtaskId: string, field: 'startDate' | 'endDate', date: Date) => {
    if(selectedTask) {
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
        st.id === subtaskId ? { ...st, completed } : st
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
    if (!selectedTask || !editingSubtask) return;
    const updatedSubtasks = selectedTask.subtasks.map(st => 
        st.id === editingSubtask.id ? subtask : st
    );
    const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
    await handleUpdateTask(updatedTask);
    setEditingSubtask(null);
  }
  
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    const updatedSubtasks = selectedTask.subtasks.filter(st => st.id !== subtaskId);
    const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
    await handleUpdateTask(updatedTask);
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
      await handleUpdateTask({ ...selectedTask, status });
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


  const showTaskList = !isMobile || (isMobile && !selectedTask);
  const showTaskDetails = !isMobile || (isMobile && selectedTask);

  const statusLabels: Record<Status, string> = {
    todo: 'To-Do',
    'in-progress': 'In Progress',
    done: 'Done',
  };

  return (
    <div className="h-full">
       <div className="flex justify-between items-center mb-4 md:mb-8">
            <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                <p className="text-muted-foreground">Your central hub for all tasks.</p>
            </div>
            {isMobile && selectedTask && (
                <Button variant="outline" onClick={handleBackToList}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back
                </Button>
            )}
        </div>
      <div className={cn(
          "grid gap-6 h-[calc(100vh-theme(spacing.48))] md:h-[calc(100vh-theme(spacing.36))]",
          selectedTask ? "md:grid-cols-4" : "grid-cols-1"
      )}>
        {showTaskList && (
          <Card className={cn(
              "h-full flex flex-col",
              selectedTask ? "md:col-span-1" : "col-span-1"
            )}>
              <CardHeader className="flex flex-col gap-4">
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
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>Create New Task</DialogTitle>
                              </DialogHeader>
                              <TaskForm 
                                  allTags={allTags}
                                  onSubmit={(data) => {
                                      handleAddTask(data);
                                      setIsFormOpen(false);
                                  }}
                              />
                          </DialogContent>
                      </Dialog>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <XCircle onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex-1">
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
                           <Button variant="outline" className="flex-1">
                                Filter
                                {(statusFilter.length > 0 || priorityFilter.length > 0) && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem checked={statusFilter.includes('todo')} onCheckedChange={() => toggleStatusFilter('todo')}>To-Do</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={statusFilter.includes('in-progress')} onCheckedChange={() => toggleStatusFilter('in-progress')}>In Progress</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={statusFilter.includes('done')} onCheckedChange={() => toggleStatusFilter('done')}>Done</DropdownMenuCheckboxItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem checked={priorityFilter.includes('high')} onCheckedChange={() => togglePriorityFilter('high')}>High</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={priorityFilter.includes('medium')} onCheckedChange={() => togglePriorityFilter('medium')}>Medium</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={priorityFilter.includes('low')} onCheckedChange={() => togglePriorityFilter('low')}>Low</DropdownMenuCheckboxItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            {(statusFilter.length > 0 || priorityFilter.length > 0) && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => { setStatusFilter([]); setPriorityFilter([]); }}>Clear Filters</DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
              </CardHeader>
              <ScrollArea className="h-full p-3">
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : sortedAndFilteredTasks.map(task => (
                            <TaskListItem 
                                key={task.id} 
                                task={task}
                                isSelected={selectedTask?.id === task.id}
                                onSelect={() => handleSelectTask(task)} 
                            />
                        ))}
                    </div>
              </ScrollArea>
          </Card>
        )}
        {showTaskDetails && selectedTask ? (
          <div className="md:col-span-3 h-full">
              <ScrollArea className="h-full pr-4">
                      <div className="space-y-6">
                          <Card>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                      <div>
                                          <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className={cn("capitalize w-fit", statusStyles[selectedTask.status])}>
                                                        {statusLabels[selectedTask.status]}
                                                        <ChevronDown className="ml-2 h-4 w-4"/>
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
                                            <Badge variant="outline" className={cn("capitalize w-fit", priorityStyles[selectedTask.priority])}>
                                                {selectedTask.priority}
                                            </Badge>
                                          </div>
                                          <CardTitle className="text-2xl pt-2">{selectedTask.title}</CardTitle>
                                          <p className="text-muted-foreground pt-1">{selectedTask.description}</p>
                                      </div>
                                    <div className="flex items-center gap-2">
                                        <Dialog open={isEditingFormOpen} onOpenChange={setIsEditingFormOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Task</DialogTitle>
                                                </DialogHeader>
                                                <TaskForm 
                                                    task={selectedTask}
                                                    allTags={allTags}
                                                    onSubmit={async (data) => {
                                                        const updatedData = { ...selectedTask, ...data };
                                                        await handleUpdateTask(updatedData);
                                                        setIsEditingFormOpen(false);
                                                    }}
                                                />
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
                              
                                  <CardContent>
                                      <Separator className="my-2" />
                                      <div className="py-4">
                                          <h4 className="font-semibold mb-2">Tags</h4>
                                          <TagInput
                                              tags={selectedTask.tags || []}
                                              allTags={allTags}
                                              onUpdateTags={handleUpdateTaskTags}
                                              placeholder="Add or select tags..."
                                          />
                                      </div>
                                      <Separator className="my-2" />
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                          <div>
                                              <h4 className="font-semibold mb-2">Start Date & Time</h4>
                                              <DateTimePicker date={selectedTask.startDate} setDate={(date) => handleDateChange('startDate', date)} />
                                          </div>
                                          <div>
                                              <h4 className="font-semibold mb-2">End Date & Time</h4>
                                              <DateTimePicker date={selectedTask.endDate} setDate={(date) => handleDateChange('endDate', date)} />
                                          </div>
                                      </div>
                                    
                                      <Separator className="my-2" />
                                      <div className="py-4">
                                          <h4 className="font-semibold my-3">Subtasks</h4>
                                          <div className="space-y-2">
                                              {selectedTask?.subtasks?.map(subtask => (
                                                  <div key={subtask.id} className="flex flex-col sm:flex-row sm:items-start gap-3 group p-2 rounded-md hover:bg-muted/50">
                                                      <Checkbox 
                                                          id={subtask.id} 
                                                          checked={subtask.completed}
                                                          onCheckedChange={(checked) => handleSubtaskCompletion(subtask.id, !!checked)}
                                                          className="mt-1"
                                                      />
                                                      <div className="flex-1 space-y-2">
                                                          {editingSubtask?.id === subtask.id ? (
                                                              <Input
                                                                  type="text"
                                                                  defaultValue={subtask.title}
                                                                  autoFocus
                                                                  onBlur={() => setEditingSubtask(null)}
                                                                  onKeyDown={(e) => {
                                                                      if(e.key === 'Enter' && e.currentTarget.value.trim()){
                                                                          handleUpdateSubtask({ ...subtask, title: e.currentTarget.value.trim() });
                                                                      } else if (e.key === 'Escape') {
                                                                          setEditingSubtask(null)
                                                                      }
                                                                  }}
                                                                  className="h-8"
                                                              />
                                                          ) : (
                                                              <label 
                                                                  htmlFor={subtask.id} 
                                                                  className={cn("text-sm flex-1 cursor-text", subtask.completed && "line-through text-muted-foreground")}
                                                                  onDoubleClick={() => setEditingSubtask(subtask)}
                                                              >
                                                                  {subtask.title}
                                                              </label>
                                                          )}
                                                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                              <TagInput
                                                                  tags={subtask.tags || []}
                                                                  allTags={allTags}
                                                                  onUpdateTags={(tags) => handleUpdateSubtaskTags(subtask.id, tags)}
                                                                  placeholder="Add tags..."
                                                              />
                                                              <DateTimePicker date={subtask.startDate} setDate={(date) => handleSubtaskDateChange(subtask.id, 'startDate', date)} />
                                                          </div>
                                                      </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSubtask(subtask)}>
                                                              <Edit className="h-3.5 w-3.5" />
                                                          </Button>
                                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteSubtask(subtask.id)}>
                                                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                          </Button>
                                                      </div>
                                                  </div>
                                              ))}
                                              <div className="flex items-center gap-3 pl-7">
                                                  <Input 
                                                      placeholder="Add new subtask and press Enter"
                                                      value={newSubtaskTitle}
                                                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                      onKeyDown={handleAddSubtask}
                                                      className="h-8 mt-2"
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  </CardContent>
                          </Card>

                          <NotesSection task={selectedTask} onUpdateTask={handleUpdateTask} />
                      </div>
              </ScrollArea>
          </div>
        ) : showTaskList && (
          <div className="md:col-span-3 h-full items-center justify-center hidden md:flex">
              <div className="text-center text-muted-foreground">
                  <ListTodo className="w-12 h-12 mx-auto mb-2"/>
                  <p>Select a task to see its details.</p>
                  <p className="text-sm">Or, create a new task to get started.</p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <TasksPageContent />
        </React.Suspense>
    )
}
