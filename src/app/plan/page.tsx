
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllTasks, getDailyPlan, updateDailyPlanAsync } from "@/lib/data";
import { Task, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PlusCircle, ArrowLeftCircle, GripVertical, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

function MiniTaskCard({ 
  task, 
  onMove, 
  isBacklog, 
  onDragStart, 
  onDragEnter, 
  onDragEnd, 
  isDragging 
}: { 
  task: Task; 
  onMove: (id: string) => void;
  isBacklog: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}) {
  return (
    <Card 
      className={cn(
        "group transition-all hover:border-primary",
        isDragging && "opacity-50"
      )}
      draggable={!isBacklog}
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragEnter={(e) => onDragEnter?.(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <CardContent className="p-3 flex items-center justify-between gap-2">
        {!isBacklog && (
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:text-foreground" />
        )}
        <div className="flex-1">
          <p className="font-semibold">{task.title}</p>
          <Badge variant="outline" className={cn("capitalize mt-1", priorityStyles[task.priority])}>
            {task.priority}
          </Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={() => onMove(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
            {isBacklog ? <PlusCircle className="h-5 w-5 text-primary" /> : <ArrowLeftCircle className="h-5 w-5 text-muted-foreground" />}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PlanPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailyTaskIds, setDailyTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    const tasks = await getAllTasks();
    const planIds = await getDailyPlan();
    setAllTasks(tasks);
    setDailyTaskIds(planIds);
    setLoading(false);
  }
  
  useEffect(() => {
    refreshData();
  }, []);
  
  const dailyTasks = dailyTaskIds.map(id => (Array.isArray(allTasks) ? allTasks : []).find(t => t.id === id)).filter((t): t is Task => !!t);
  const backlogTasks = (Array.isArray(allTasks) ? allTasks : []).filter(task => 
    task.status !== 'done' && 
    !task.isHabit && 
    !dailyTaskIds.includes(task.id)
  );

  const addToDailyPlan = (taskId: string) => {
    const newDailyIds = [...dailyTaskIds, taskId];
    updateDailyPlanAsync(newDailyIds);
    refreshData();
  };

  const removeFromDailyPlan = (taskId: string) => {
    const newDailyIds = dailyTaskIds.filter(id => id !== taskId);
    updateDailyPlanAsync(newDailyIds);
    refreshData();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    dragItem.current = id;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (dragItem.current === null || dragItem.current === id) return;
    
    dragOverItem.current = id;

    const newIds = [...dailyTaskIds];
    const dragItemIndex = newIds.indexOf(dragItem.current);
    const dragOverItemIndex = newIds.indexOf(id);

    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;

    const [draggedId] = newIds.splice(dragItemIndex, 1);
    newIds.splice(dragOverItemIndex, 0, draggedId);
    
    setDailyTaskIds(newIds);
  };

  const handleDragEnd = () => {
    if (dragItem.current === null) return;
    
    updateDailyPlanAsync(dailyTaskIds);
    
    dragItem.current = null;
    dragOverItem.current = null;
    refreshData();
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Your Day</h1>
        <p className="text-muted-foreground">Move tasks from your backlog to today's plan. Drag and drop to reorder.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Task Backlog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[50vh]">
            {loading ? (
                 <div className="flex justify-center items-center h-full pt-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : backlogTasks.length > 0 ? (
                backlogTasks.map((task) => (
                    <MiniTaskCard key={task.id} task={task} onMove={addToDailyPlan} isBacklog={true} />
                ))
            ) : (
                <p className="text-muted-foreground text-center pt-10">Backlog is empty!</p>
            )}
          </CardContent>
        </Card>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Today's Plan</CardTitle>
          </CardHeader>
          <CardContent 
            className="space-y-3 min-h-[50vh] bg-primary/5 rounded-b-lg"
            onDragOver={(e) => e.preventDefault()}
          >
             {loading ? (
                <div className="flex justify-center items-center h-full pt-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
             ) : dailyTasks.length > 0 ? (
                dailyTasks.map((task) => (
                    <MiniTaskCard 
                      key={task.id} 
                      task={task} 
                      onMove={removeFromDailyPlan} 
                      isBacklog={false}
                      onDragStart={handleDragStart}
                      onDragEnter={handleDragEnter}
                      onDragEnd={handleDragEnd}
                      isDragging={dragItem.current === task.id}
                    />
                ))
            ) : (
                <p className="text-muted-foreground text-center pt-10">Plan your day by adding tasks from the backlog.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
