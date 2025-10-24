
"use client";

import { useState, useMemo, useEffect } from "react";
import { getAllTasks, updateTask } from "@/lib/data";
import { type Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Tag, Edit, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const refreshTasks = async () => {
    setLoading(true);
    const tasks = await getAllTasks();
    setTasks(tasks);
    setLoading(false);
  }

  useEffect(() => {
    refreshTasks();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
        task.tags?.forEach(tag => tagSet.add(tag));
        task.subtasks?.forEach(subtask => {
            subtask.tags?.forEach(tag => tagSet.add(tag));
        });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const handleUpdateTag = async (oldTag: string, newTag: string) => {
    if (!newTag || oldTag === newTag) {
        setIsEditing(null);
        return;
    }
    
    const tasksToUpdate = tasks.filter(task => 
        task.tags?.includes(oldTag) || task.subtasks?.some(st => st.tags?.includes(oldTag))
    );

    for (const task of tasksToUpdate) {
        const newTags = task.tags?.map(t => t === oldTag ? newTag : t);
        const newSubtasks = task.subtasks.map(st => ({
            ...st,
            tags: st.tags?.map(t => t === oldTag ? newTag : t)
        }));
        await updateTask({ ...task, tags: newTags, subtasks: newSubtasks });
    }

    await refreshTasks();
    setIsEditing(null);
    toast({ title: "Tag updated successfully!" });
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const tasksToUpdate = tasks.filter(task => 
        task.tags?.includes(tagToDelete) || task.subtasks?.some(st => st.tags?.includes(tagToDelete))
    );
     
    for (const task of tasksToUpdate) {
        const newTags = task.tags?.filter(t => t !== tagToDelete);
        const newSubtasks = task.subtasks.map(st => ({
            ...st,
            tags: st.tags?.filter(t => t !== tagToDelete)
        }));
        updateTask({ ...task, tags: newTags, subtasks: newSubtasks });
    }
    
    refreshTasks();
    toast({ title: `Tag "${tagToDelete}" deleted successfully!`, variant: "destructive" });
  };

  const handleCreateTag = () => {
    if (!newTag || allTags.includes(newTag)) {
        toast({ title: "Invalid or duplicate tag", description: "Please enter a unique tag name.", variant: "destructive" });
        return;
    }
    
    // To make a new tag "exist", we add it to the first task.
    if (tasks.length > 0) {
        const firstTask = tasks[0];
        const updatedTask = { ...firstTask, tags: [...(firstTask.tags || []), newTag] };
        updateTask(updatedTask);
        refreshTasks();
    }
    setNewTag("");
    toast({ title: `Tag "${newTag}" created successfully!` });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Manage Tags</CardTitle>
            <CardDescription>Globally edit or delete tags across all tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                    placeholder="Create a new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button onClick={handleCreateTag} className="w-full sm:w-auto">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create
                </Button>
            </div>
            <div className="space-y-2 rounded-md border p-2 min-h-48 max-h-96 overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full pt-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : allTags.length > 0 ? (
                allTags.map(tag => (
                  <div key={tag} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group">
                    {isEditing === tag ? (
                      <Input
                        type="text"
                        defaultValue={tag}
                        autoFocus
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleUpdateTag(tag, editingValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateTag(tag, editingValue);
                          if (e.key === 'Escape') setIsEditing(null);
                        }}
                        className="h-8"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{tag}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsEditing(tag); setEditingValue(tag);}}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTag(tag)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center p-4">No tags found. Create one above to get started!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Future profile features will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center h-60">
            <User className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              User settings, themes, and gamification rewards are on the way!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
