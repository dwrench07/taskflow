"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ListChecks, Search, Plus, ChevronRight, Trash2, Repeat } from "lucide-react";
import { getAllTasks, updateTask, addTask } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRefresh } from "@/context/RefreshContext";
import { useToast } from "@/hooks/use-toast";
import type { Task, Subtask, Priority, EnergyLevel, ChoreFrequency } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Filter = "all" | "open" | "done";

const INBOX_TITLE = "Inbox";

function intervalDaysFor(freq: ChoreFrequency, intervalDays?: number): number {
  if (freq === "daily") return 1;
  if (freq === "weekly") return 7;
  if (freq === "custom") return intervalDays ?? 30;
  return 0; // 'once'
}

function isCompletedToday(st: Subtask): boolean {
  if (st.type === "chore") {
    if (!st.lastCompleted) return false;
    return new Date(st.lastCompleted).toDateString() === new Date().toDateString();
  }
  return !!st.completed;
}

function dueLabel(st: Subtask): string | null {
  if (st.type !== "chore" || !st.frequency || st.frequency === "once") return null;
  if (!st.lastCompleted) return "Due now";
  const days = intervalDaysFor(st.frequency, st.intervalDays);
  const diff = differenceInCalendarDays(new Date(), parseISO(st.lastCompleted));
  const remaining = days - diff;
  if (remaining <= 0) return "Due now";
  if (remaining === 1) return "Due tomorrow";
  return `Due in ${remaining}d`;
}

function frequencyLabel(freq?: ChoreFrequency, intervalDays?: number): string {
  if (!freq) return "";
  if (freq === "daily") return "Daily";
  if (freq === "weekly") return "Weekly";
  if (freq === "once") return "Once";
  return `Every ${intervalDays ?? 30}d`;
}

export default function SubtasksPage() {
  const { refreshKey, triggerRefresh } = useRefresh();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("open");

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState<"task" | "chore">("task");
  const [createFrequency, setCreateFrequency] = useState<ChoreFrequency>("weekly");
  const [createIntervalDays, setCreateIntervalDays] = useState<number>(7);
  const [createParentId, setCreateParentId] = useState<string>("__inbox__");
  const [creating, setCreating] = useState(false);

  const [detail, setDetail] = useState<{ taskId: string; subtaskId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await getAllTasks();
        if (!cancelled) setTasks(data || []);
      } catch (e) {
        console.error("Failed to fetch tasks:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .map((t) => {
        const subs = (t.subtasks || []).filter((st) => {
          const doneEffective = isCompletedToday(st);
          if (filter === "open" && doneEffective) return false;
          if (filter === "done" && !doneEffective) return false;
          if (q && !st.title.toLowerCase().includes(q) && !t.title.toLowerCase().includes(q)) return false;
          return true;
        });
        return { task: t, subtasks: subs };
      })
      .filter((g) => g.subtasks.length > 0);
  }, [tasks, search, filter]);

  const totalShown = groups.reduce((acc, g) => acc + g.subtasks.length, 0);

  const persistTask = async (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    try {
      await updateTask(updated);
      triggerRefresh();
    } catch (e) {
      console.error("Failed to update task:", e);
      toast({ title: "Failed to save", description: "Could not update subtask.", variant: "destructive" });
    }
  };

  const updateSubtask = async (taskId: string, subtaskId: string, patch: Partial<Subtask>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedSubs = task.subtasks.map((st) => (st.id === subtaskId ? { ...st, ...patch } : st));
    await persistTask({ ...task, subtasks: updatedSubs });
  };

  const toggleSubtask = (task: Task, st: Subtask, completed: boolean) => {
    if (st.type === "chore") {
      updateSubtask(task.id, st.id, {
        lastCompleted: completed ? new Date().toISOString() : undefined,
      });
    } else {
      updateSubtask(task.id, st.id, {
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      });
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await persistTask({ ...task, subtasks: task.subtasks.filter((s) => s.id !== subtaskId) });
  };

  const moveSubtaskToParent = async (
    fromTaskId: string,
    subtaskId: string,
    toTaskId: string
  ) => {
    if (fromTaskId === toTaskId) return;
    const fromTask = tasks.find((t) => t.id === fromTaskId);
    const toTask = tasks.find((t) => t.id === toTaskId);
    const sub = fromTask?.subtasks.find((s) => s.id === subtaskId);
    if (!fromTask || !toTask || !sub) return;
    const updatedFrom: Task = { ...fromTask, subtasks: fromTask.subtasks.filter((s) => s.id !== subtaskId) };
    const updatedTo: Task = { ...toTask, subtasks: [...toTask.subtasks, sub] };
    setTasks((prev) =>
      prev.map((t) => (t.id === fromTaskId ? updatedFrom : t.id === toTaskId ? updatedTo : t))
    );
    try {
      await updateTask(updatedFrom);
      await updateTask(updatedTo);
      triggerRefresh();
    } catch (e) {
      console.error("Failed to move subtask:", e);
      toast({ title: "Failed to move subtask", variant: "destructive" });
    }
  };

  const ensureInbox = async (): Promise<Task> => {
    const existing = tasks.find((t) => t.title === INBOX_TITLE);
    if (existing) return existing;
    const created = await addTask({
      title: INBOX_TITLE,
      description: "Loose subtasks without a parent task.",
      priority: "medium",
      status: "todo",
      subtasks: [],
      notes: [],
    });
    setTasks((prev) => [...prev, created]);
    return created;
  };

  const handleCreateSubtask = async () => {
    const title = createTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const newSub: Subtask = {
        id: `sub-${Date.now()}`,
        title,
        description: createDescription.trim() || undefined,
        completed: false,
        type: createType,
        tags: [],
        ...(createType === "chore"
          ? {
              frequency: createFrequency,
              intervalDays: createFrequency === "custom" ? createIntervalDays : undefined,
            }
          : {}),
      };

      let parent: Task | undefined;
      if (createParentId === "__inbox__") {
        parent = await ensureInbox();
      } else {
        parent = tasks.find((t) => t.id === createParentId);
      }
      if (!parent) {
        toast({ title: "Parent task not found", variant: "destructive" });
        return;
      }
      await persistTask({ ...parent, subtasks: [...parent.subtasks, newSub] });

      setCreateTitle("");
      setCreateDescription("");
      setCreateType("task");
      setCreateFrequency("weekly");
      setCreateIntervalDays(7);
      setCreateParentId("__inbox__");
      setCreateOpen(false);
    } catch (e) {
      console.error("Failed to create subtask:", e);
      toast({ title: "Failed to create subtask", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const detailSubtask = useMemo(() => {
    if (!detail) return null;
    const t = tasks.find((x) => x.id === detail.taskId);
    const s = t?.subtasks.find((x) => x.id === detail.subtaskId);
    return t && s ? { task: t, subtask: s } : null;
  }, [detail, tasks]);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ListChecks className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Subtasks</h1>
          <p className="text-sm text-muted-foreground">
            Every subtask across your tasks — the smallest unit of work.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-shrink-0">
              <Plus className="h-4 w-4 mr-1" /> New subtask
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New subtask</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Tabs value={createType} onValueChange={(v) => setCreateType(v as "task" | "chore")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="task">Task</TabsTrigger>
                  <TabsTrigger value="chore">Chore</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="subtask-title">Title</Label>
                <Input
                  id="subtask-title"
                  autoFocus
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !creating) {
                      e.preventDefault();
                      handleCreateSubtask();
                    }
                  }}
                  placeholder="What needs to get done?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtask-desc">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="subtask-desc"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Notes, context, links…"
                  rows={3}
                />
              </div>

              {createType === "chore" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="subtask-freq">Frequency</Label>
                    <Select
                      value={createFrequency}
                      onValueChange={(v) => setCreateFrequency(v as ChoreFrequency)}
                    >
                      <SelectTrigger id="subtask-freq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {createFrequency === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="subtask-interval">Every (days)</Label>
                      <Input
                        id="subtask-interval"
                        type="number"
                        min={1}
                        value={createIntervalDays}
                        onChange={(e) => setCreateIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subtask-parent">
                  Parent task <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Select value={createParentId} onValueChange={setCreateParentId}>
                  <SelectTrigger id="subtask-parent">
                    <SelectValue placeholder="None — send to Inbox" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__inbox__">None — send to Inbox</SelectItem>
                    {tasks
                      .filter((t) => t.title !== INBOX_TITLE)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubtask} disabled={!createTitle.trim() || creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subtasks or tasks…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          {(["open", "done", "all"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              onClick={() => setFilter(f)}
              className="h-7 px-3 text-xs capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {tasks.length === 0
              ? "No tasks yet. Create a task first to add subtasks."
              : "No subtasks match the current filter."}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Showing {totalShown} subtask{totalShown === 1 ? "" : "s"} across {groups.length} task
            {groups.length === 1 ? "" : "s"}
          </p>
          <div className="space-y-4">
            {groups.map(({ task, subtasks }) => {
              const total = task.subtasks.length;
              const done = task.subtasks.filter(isCompletedToday).length;
              return (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Link
                        href={`/tasks?id=${task.id}`}
                        className="group flex min-w-0 items-center gap-2 hover:text-primary"
                      >
                        <span className="truncate font-semibold">{task.title}</span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        {done}/{total}
                      </Badge>
                    </div>

                    <ul className="space-y-1">
                      {subtasks.map((st) => {
                        const doneEffective = isCompletedToday(st);
                        const due = dueLabel(st);
                        return (
                          <li
                            key={st.id}
                            className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={doneEffective}
                              onCheckedChange={(v) => toggleSubtask(task, st, !!v)}
                            />
                            <button
                              onClick={() => setDetail({ taskId: task.id, subtaskId: st.id })}
                              className="flex flex-1 items-center gap-2 text-left min-w-0"
                            >
                              <span
                                className={cn(
                                  "flex-1 text-sm truncate",
                                  doneEffective && "text-muted-foreground line-through"
                                )}
                              >
                                {st.title}
                              </span>
                              {st.type === "chore" && (
                                <Badge variant="outline" className="flex-shrink-0 gap-1 text-[10px]">
                                  <Repeat className="h-3 w-3" />
                                  {frequencyLabel(st.frequency, st.intervalDays)}
                                </Badge>
                              )}
                              {due && !doneEffective && (
                                <span
                                  className={cn(
                                    "flex-shrink-0 text-xs",
                                    due === "Due now" ? "text-orange-400 font-medium" : "text-muted-foreground"
                                  )}
                                >
                                  {due}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Sheet open={!!detailSubtask} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailSubtask && (
            <SubtaskDetail
              task={detailSubtask.task}
              subtask={detailSubtask.subtask}
              tasks={tasks}
              onChange={(patch) => updateSubtask(detailSubtask.task.id, detailSubtask.subtask.id, patch)}
              onMoveParent={(toId) => moveSubtaskToParent(detailSubtask.task.id, detailSubtask.subtask.id, toId)}
              onDelete={async () => {
                await deleteSubtask(detailSubtask.task.id, detailSubtask.subtask.id);
                setDetail(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SubtaskDetail({
  task,
  subtask,
  tasks,
  onChange,
  onMoveParent,
  onDelete,
}: {
  task: Task;
  subtask: Subtask;
  tasks: Task[];
  onChange: (patch: Partial<Subtask>) => void;
  onMoveParent: (toTaskId: string) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(subtask.title);
  const [description, setDescription] = useState(subtask.description ?? "");

  useEffect(() => {
    setTitle(subtask.title);
    setDescription(subtask.description ?? "");
  }, [subtask.id]);

  const type = subtask.type ?? "task";

  return (
    <>
      <SheetHeader>
        <SheetTitle>Subtask details</SheetTitle>
        <SheetDescription>
          Under{" "}
          <Link href={`/tasks?id=${task.id}`} className="underline hover:text-primary">
            {task.title}
          </Link>
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== subtask.title) onChange({ title: title.trim() });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (subtask.description ?? "")) {
                onChange({ description: description.trim() || undefined });
              }
            }}
            rows={4}
            placeholder="Notes, context, links…"
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Tabs
            value={type}
            onValueChange={(v) => {
              const next = v as "task" | "chore";
              if (next === "chore") {
                onChange({
                  type: "chore",
                  frequency: subtask.frequency ?? "weekly",
                });
              } else {
                onChange({ type: "task" });
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="task">Task</TabsTrigger>
              <TabsTrigger value="chore">Chore</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {type === "chore" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={subtask.frequency ?? "weekly"}
                onValueChange={(v) =>
                  onChange({
                    frequency: v as ChoreFrequency,
                    intervalDays: v === "custom" ? subtask.intervalDays ?? 7 : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {subtask.frequency === "custom" && (
              <div className="space-y-2">
                <Label>Every (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={subtask.intervalDays ?? 7}
                  onChange={(e) =>
                    onChange({ intervalDays: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={subtask.priority ?? "medium"}
              onValueChange={(v) => onChange({ priority: v as Priority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Energy</Label>
            <Select
              value={subtask.energyLevel ?? "medium"}
              onValueChange={(v) => onChange({ energyLevel: v as EnergyLevel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Parent task</Label>
          <Select value={task.id} onValueChange={onMoveParent}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === "chore" && subtask.lastCompleted && (
          <p className="text-xs text-muted-foreground">
            Last completed {format(new Date(subtask.lastCompleted), "MMM d, yyyy")}
          </p>
        )}

        <div className="pt-4 border-t">
          <Button variant="destructive" size="sm" onClick={onDelete} className="w-full">
            <Trash2 className="h-4 w-4 mr-2" /> Delete subtask
          </Button>
        </div>
      </div>
    </>
  );
}
