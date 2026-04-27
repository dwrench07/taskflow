"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Task, Recurrence } from "@/lib/types";
import { getAllTasks, addTask, deleteTask, updateTask, getUserProgress, saveUserProgress } from "@/lib/data";
import { useRefresh } from "@/context/RefreshContext";
import { useToast } from "@/hooks/use-toast";

type ChoreRecurrence = Extract<Recurrence, "once" | "daily" | "weekly" | "custom">;

const todayStr = () => new Date().toISOString().substring(0, 10);
const isCompletedToday = (task: Task) =>
  task.completionHistory?.some(d => d.substring(0, 10) === todayStr()) ?? false;
const lastCompletedDate = (task: Task) =>
  task.completionHistory && task.completionHistory.length > 0
    ? task.completionHistory[task.completionHistory.length - 1]
    : task.completedAt;

export default function ChoresPage() {
  const { refreshKey, triggerRefresh } = useRefresh();
  const [chores, setChores] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newChore, setNewChore] = useState<{
    title: string;
    description: string;
    recurrence: ChoreRecurrence;
    intervalDays: number;
  }>({
    title: "",
    description: "",
    recurrence: "weekly",
    intervalDays: 7,
  });

  useEffect(() => { fetchChores(); }, [refreshKey]);

  const fetchChores = async () => {
    setIsLoading(true);
    try {
      const tasks = await getAllTasks();
      setChores(tasks.filter(t => t.category === 'chore'));
    } catch (error) {
      console.error("Failed to fetch chores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChore = async () => {
    if (!newChore.title.trim()) return;
    try {
      const taskData: Omit<Task, "id"> = {
        title: newChore.title.trim(),
        description: newChore.description.trim() || undefined,
        priority: "medium",
        energyLevel: "medium",
        status: "todo",
        category: "chore",
        recurrence: newChore.recurrence,
        intervalDays: newChore.recurrence === "custom" ? newChore.intervalDays : undefined,
        // Dual-write legacy fields so any unmigrated reads keep working.
        frequency: newChore.recurrence,
        subtasks: [],
        notes: [],
      };
      const added = await addTask(taskData);
      setChores([...chores, added]);
      setNewChore({ title: "", description: "", recurrence: "weekly", intervalDays: 7 });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add chore:", error);
    }
  };

  const handleToggleChore = async (chore: Task) => {
    // One-time chores: flip status to 'done', no toggle back
    if (chore.recurrence === 'once') {
      if (chore.status === 'done') return;
      const updated: Task = { ...chore, status: 'done', completedAt: new Date().toISOString() };
      setChores(chores.map(c => c.id === chore.id ? updated : c));
      try {
        await updateTask(updated);
        triggerRefresh();
      } catch {
        setChores(chores.map(c => c.id === chore.id ? chore : c));
      }
      return;
    }

    // Recurring chore: toggle today's completion in completionHistory
    const today = todayStr();
    const completedToday = isCompletedToday(chore);
    const newHistory = completedToday
      ? (chore.completionHistory || []).filter(d => d.substring(0, 10) !== today)
      : [...(chore.completionHistory || []), new Date().toISOString()];

    const updated: Task = {
      ...chore,
      completionHistory: newHistory,
      lastCompletedDate: completedToday ? undefined : new Date().toISOString(),
      // Dual-write the legacy field so the dashboard keeps working.
      lastCompleted: completedToday ? undefined : new Date().toISOString(),
    };
    setChores(chores.map(c => c.id === chore.id ? updated : c));

    try {
      await updateTask(updated);
      // Twilight Lock: trigger if "Wind Down" chore is being completed
      if (!completedToday && chore.title.toLowerCase().includes('wind down')) {
        const progress = await getUserProgress();
        if (progress) {
          const { evaluateGamificationTriggers } = await import("@/lib/gamification");
          const tempProgress = JSON.parse(JSON.stringify(progress));
          const updates = evaluateGamificationTriggers({ type: 'wind-down-completed' }, tempProgress);
          if (updates.length > 0) {
            await saveUserProgress(tempProgress);
            updates.forEach((u, idx) => {
              setTimeout(() => toast({ title: `🎁 ${u.message}`, description: u.detail }), idx * 1500);
            });
          }
        }
      }
      triggerRefresh();
    } catch (error) {
      console.error("Failed to toggle chore:", error);
      setChores(chores.map(c => c.id === chore.id ? chore : c));
    }
  };

  const handleDeleteChore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTask(id);
      setChores(chores.filter(c => c.id !== id));
    } catch (error) {
      console.error("Failed to delete chore:", error);
    }
  };

  const recurrenceLabel = (c: Task) => {
    if (c.recurrence === 'once') return 'One-time';
    if (c.recurrence === 'daily') return 'Daily';
    if (c.recurrence === 'weekly') return 'Weekly';
    if (c.recurrence === 'monthly') return 'Monthly';
    const days = c.intervalDays ?? 30;
    if (days === 30) return 'Monthly';
    if (days === 90) return 'Quarterly';
    if (days === 180) return 'Every 6mo';
    if (days === 365) return 'Yearly';
    return `Every ${days}d`;
  };

  const isDueLabel = (c: Task) => {
    const last = lastCompletedDate(c);
    if (!last || c.recurrence === 'once') return null;
    const days = c.recurrence === 'daily' ? 1
      : c.recurrence === 'weekly' ? 7
      : c.recurrence === 'monthly' ? 30
      : (c.intervalDays ?? 30);
    const diff = differenceInCalendarDays(new Date(), parseISO(last));
    const remaining = days - diff;
    if (remaining <= 0) return <span className="text-orange-400 font-medium">Due now</span>;
    if (remaining === 1) return <span className="text-muted-foreground">Due tomorrow</span>;
    return <span className="text-muted-foreground">Due in {remaining}d</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chores</h1>
          <p className="text-muted-foreground mt-1">
            Routine maintenance and standalone tasks separated from your milestones.
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Chore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Chore</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., Do laundry, Pay bills"
                  value={newChore.title}
                  onChange={(e) => setNewChore({ ...newChore, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" placeholder="Notes or instructions..."
                  value={newChore.description}
                  onChange={(e) => setNewChore({ ...newChore, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: "once", label: "Once" },
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "custom", label: "Custom" },
                  ] as { value: ChoreRecurrence; label: string }[]).map(opt => (
                    <Button key={opt.value} type="button" size="sm"
                      variant={newChore.recurrence === opt.value ? "default" : "outline"}
                      onClick={() => setNewChore({ ...newChore, recurrence: opt.value, intervalDays: opt.value === "custom" ? 30 : newChore.intervalDays })}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {newChore.recurrence === "custom" && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "Monthly", days: 30 },
                        { label: "Quarterly", days: 90 },
                        { label: "Every 6mo", days: 180 },
                        { label: "Yearly", days: 365 },
                      ].map(preset => (
                        <Button key={preset.days} type="button" size="sm"
                          variant={newChore.intervalDays === preset.days ? "secondary" : "ghost"}
                          className="text-xs h-7"
                          onClick={() => setNewChore({ ...newChore, intervalDays: preset.days })}>
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} className="w-24"
                        value={newChore.intervalDays}
                        onChange={(e) => setNewChore({ ...newChore, intervalDays: Math.max(1, parseInt(e.target.value) || 1) })} />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleAddChore} disabled={!newChore.title.trim()}>
                Save Chore
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-32 border-dashed" />)}
        </div>
      ) : chores.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <h3 className="text-xl font-medium text-muted-foreground">No chores found</h3>
          <p className="text-muted-foreground mb-4">You have no routine tasks tracked.</p>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create First Chore
          </Button>
        </div>
      ) : (() => {
        const activeChores = chores.filter(c => !(c.recurrence === 'once' && c.status === 'done'));
        const archivedChores = chores.filter(c => c.recurrence === 'once' && c.status === 'done');

        const renderChoreCard = (chore: Task, archived = false) => {
          const completedToday = chore.recurrence !== 'once' && isCompletedToday(chore);
          const last = lastCompletedDate(chore);
          return (
            <Card key={chore.id}
              className={`group transition-colors ${archived ? 'opacity-50' : 'hover:border-primary/50 cursor-pointer'}`}
              onClick={archived ? undefined : () => handleToggleChore(chore)}>
              <CardContent className="p-5 flex items-start gap-4">
                <button className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                  {archived || completedToday ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-medium truncate ${archived ? 'line-through text-muted-foreground' : ''}`}>{chore.title}</h3>
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mt-1 -mr-2 hover:text-destructive"
                      onClick={(e) => handleDeleteChore(chore.id, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {chore.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chore.description}</p>
                  )}
                  <div className="text-xs mt-3 flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="text-xs font-normal gap-1 py-0">
                      {chore.recurrence !== 'once' && <RefreshCw className="h-2.5 w-2.5" />}
                      {recurrenceLabel(chore)}
                    </Badge>
                    {last ? (
                      <span className="text-muted-foreground">Last: {format(new Date(last), "MMM d")}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Never done</span>
                    )}
                    {isDueLabel(chore)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        };

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChores.map(c => renderChoreCard(c))}
            </div>
            {archivedChores.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60">Completed One-time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archivedChores.map(c => renderChoreCard(c, true))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
