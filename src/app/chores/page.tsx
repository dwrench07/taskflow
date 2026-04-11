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
import type { Chore, ChoreFrequency } from "@/lib/types";
import { getAllChores, addChore, deleteChore, updateChore, getUserProgress, saveUserProgress } from "@/lib/data";
import { useRefresh } from "@/context/RefreshContext";
import { useToast } from "@/hooks/use-toast";

export default function ChoresPage() {
  const { refreshKey } = useRefresh();
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newChore, setNewChore] = useState<{
    title: string;
    description: string;
    frequency: ChoreFrequency;
    intervalDays: number;
  }>({
    title: "",
    description: "",
    frequency: "weekly",
    intervalDays: 7,
  });

  useEffect(() => {
    fetchChores();
  }, [refreshKey]);

  const fetchChores = async () => {
    setIsLoading(true);
    try {
      // In a real app we'd fetch this from the API, but for now we'll simulate
      const data = await getAllChores();
      setChores(data || []);
    } catch (error) {
      console.error("Failed to fetch chores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChore = async () => {
    if (!newChore.title.trim()) return;

    try {
      const choreData: Omit<Chore, "id"> = {
        title: newChore.title.trim(),
        description: newChore.description.trim(),
        priority: "medium",
        energyLevel: "medium",
        frequency: newChore.frequency,
        intervalDays: newChore.frequency === "custom" ? newChore.intervalDays : undefined,
      };

      const addedChore = await addChore(choreData);
      setChores([...chores, addedChore]);
      setNewChore({ title: "", description: "", frequency: "weekly", intervalDays: 7 });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add chore:", error);
    }
  };

  const handleToggleChore = async (chore: Chore) => {
    // One-time chores: mark permanently done, no toggle back
    if (chore.frequency === 'once') {
      if (chore.completedOnce) return;
      setChores(chores.map(c => c.id === chore.id ? { ...c, completedOnce: true, lastCompleted: new Date().toISOString() } : c));
      try {
        await updateChore({ ...chore, completedOnce: true, lastCompleted: new Date().toISOString() });
      } catch {
        setChores(chores.map(c => c.id === chore.id ? chore : c));
      }
      return;
    }

    const isCompletedToday = chore.lastCompleted && new Date(chore.lastCompleted).toDateString() === new Date().toDateString();
    const newCompletedState = isCompletedToday ? undefined : new Date().toISOString();
    const completing = !isCompletedToday;

    // Optimistic update
    const updatedChores = chores.map(c =>
      c.id === chore.id ? { ...c, lastCompleted: newCompletedState } : c
    );
    setChores(updatedChores);

    try {
      // Use null explicitly when clearing so JSON.stringify doesn't drop the field
      await updateChore({ ...chore, lastCompleted: newCompletedState ?? null } as any);

      // Twilight Lock: trigger if "Wind Down" chore is being completed
      if (completing && chore.title.toLowerCase().includes('wind down')) {
        const progress = await getUserProgress();
        if (progress) {
          import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
            const tempProgress = JSON.parse(JSON.stringify(progress));
            const updates = evaluateGamificationTriggers({ type: 'wind-down-completed' }, tempProgress);
            if (updates.length > 0) {
              await saveUserProgress(tempProgress);
              updates.forEach((u, idx) => {
                setTimeout(() => toast({ title: `🎁 ${u.message}`, description: u.detail }), idx * 1500);
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle chore:", error);
      setChores(chores.map(c => c.id === chore.id ? chore : c));
    }
  };

  const handleDeleteChore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChore(id);
      setChores(chores.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete chore:", error);
    }
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
                <Input
                  id="title"
                  placeholder="e.g., Do laundry, Pay bills"
                  value={newChore.title}
                  onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Notes or instructions..."
                  value={newChore.description}
                  onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: "once", label: "Once" },
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "custom", label: "Custom" },
                  ] as { value: ChoreFrequency; label: string }[]).map(opt => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={newChore.frequency === opt.value ? "default" : "outline"}
                      onClick={() => setNewChore({ ...newChore, frequency: opt.value, intervalDays: opt.value === "custom" ? 30 : newChore.intervalDays })}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {newChore.frequency === "custom" && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "Monthly", days: 30 },
                        { label: "Quarterly", days: 90 },
                        { label: "Every 6mo", days: 180 },
                        { label: "Yearly", days: 365 },
                      ].map(preset => (
                        <Button
                          key={preset.days}
                          type="button"
                          size="sm"
                          variant={newChore.intervalDays === preset.days ? "secondary" : "ghost"}
                          className="text-xs h-7"
                          onClick={() => setNewChore({ ...newChore, intervalDays: preset.days })}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        value={newChore.intervalDays}
                        onChange={(e) => setNewChore({ ...newChore, intervalDays: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
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
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-32 border-dashed" />
          ))}
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
        const activeChores = chores.filter(c => !(c.frequency === 'once' && c.completedOnce));
        const archivedChores = chores.filter(c => c.frequency === 'once' && c.completedOnce);

        const frequencyLabel = (c: Chore) => {
          if (c.frequency === 'once') return 'One-time';
          if (c.frequency === 'daily') return 'Daily';
          if (c.frequency === 'weekly') return 'Weekly';
          const days = c.intervalDays ?? 30;
          if (days === 30) return 'Monthly';
          if (days === 90) return 'Quarterly';
          if (days === 180) return 'Every 6mo';
          if (days === 365) return 'Yearly';
          return `Every ${days}d`;
        };

        const isDueLabel = (c: Chore) => {
          if (!c.lastCompleted || c.frequency === 'once') return null;
          const days = c.frequency === 'daily' ? 1 : c.frequency === 'weekly' ? 7 : (c.intervalDays ?? 30);
          const diff = differenceInCalendarDays(new Date(), parseISO(c.lastCompleted));
          const remaining = days - diff;
          if (remaining <= 0) return <span className="text-orange-400 font-medium">Due now</span>;
          if (remaining === 1) return <span className="text-muted-foreground">Due tomorrow</span>;
          return <span className="text-muted-foreground">Due in {remaining}d</span>;
        };

        const renderChoreCard = (chore: Chore, archived = false) => (
          <Card
            key={chore.id}
            className={`group transition-colors ${archived ? 'opacity-50' : 'hover:border-primary/50 cursor-pointer'}`}
            onClick={archived ? undefined : () => handleToggleChore(chore)}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <button className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                {archived || (chore.frequency !== 'once' && chore.lastCompleted && new Date(chore.lastCompleted).toDateString() === new Date().toDateString()) ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`font-medium truncate ${archived ? 'line-through text-muted-foreground' : ''}`}>{chore.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mt-1 -mr-2 hover:text-destructive"
                    onClick={(e) => handleDeleteChore(chore.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {chore.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chore.description}</p>
                )}
                <div className="text-xs mt-3 flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="text-xs font-normal gap-1 py-0">
                    {chore.frequency !== 'once' && <RefreshCw className="h-2.5 w-2.5" />}
                    {frequencyLabel(chore)}
                  </Badge>
                  {chore.lastCompleted ? (
                    <span className="text-muted-foreground">Last: {format(new Date(chore.lastCompleted), "MMM d")}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Never done</span>
                  )}
                  {isDueLabel(chore)}
                </div>
              </div>
            </CardContent>
          </Card>
        );

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
