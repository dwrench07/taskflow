"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Chore } from "@/lib/types";
import { getAllChores, addChore, deleteChore, updateChore, getUserProgress, saveUserProgress } from "@/lib/data";
import { useRefresh } from "@/context/RefreshContext";
import { useToast } from "@/hooks/use-toast";

export default function ChoresPage() {
  const { refreshKey } = useRefresh();
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newChore, setNewChore] = useState({
    title: "",
    description: "",
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
        frequency: "daily",
      };

      const addedChore = await addChore(choreData);
      setChores([...chores, addedChore]);
      setNewChore({ title: "", description: "" });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add chore:", error);
    }
  };

  const handleToggleChore = async (chore: Chore) => {
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chores.map((chore) => (
            <Card 
              key={chore.id} 
              className="group hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleToggleChore(chore)}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <button 
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                >
                  {chore.lastCompleted && new Date(chore.lastCompleted).toDateString() === new Date().toDateString() ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate pr-4">{chore.title}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mt-1 -mr-2 hover:text-destructive shrink-0"
                      onClick={(e) => handleDeleteChore(chore.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {chore.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {chore.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                    {chore.lastCompleted ? (
                      <span>
                        Last done: <span className="font-medium">{format(new Date(chore.lastCompleted), "MMM d, h:mm a")}</span>
                      </span>
                    ) : (
                      <span className="italic">Never completed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
