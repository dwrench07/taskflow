"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/types";
import { getAllTasks, updateTask } from "@/lib/data";
import { isBefore, startOfDay, addDays, parseISO, isSameDay } from "date-fns";
import { CalendarDays, Split, XCircle, ArrowRightCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

export function DailyReviewModal() {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avoidedTasks, setAvoidedTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const checkTasks = async () => {
      if (isLoading || !user) return;
      // Basic check to see if we already reviewed today (can store in localStorage)
      const lastReview = localStorage.getItem("lastDailyReview");
      const todayStr = startOfDay(new Date()).toISOString();
      if (lastReview === todayStr) return;

      const tasks = await getAllTasks();
      if (!Array.isArray(tasks)) return;

      const today = startOfDay(new Date());
      const unfinishedPastTasks = tasks.filter(t => {
        if (t.isHabit || t.status === 'done' || t.status === 'abandoned') return false;
        
        let targetDate = null;
        if (t.doDate) targetDate = parseISO(t.doDate);
        else if (t.endDate) targetDate = parseISO(t.endDate);

        if (!targetDate) return false;
        
        // If targetDate is strictly before today, it was avoided.
        return isBefore(targetDate, today) && !isSameDay(targetDate, today);
      });

      if (unfinishedPastTasks.length > 0) {
        setAvoidedTasks(unfinishedPastTasks);
        setIsOpen(true);
      } else {
         localStorage.setItem("lastDailyReview", todayStr);
      }
    };

    // Slight delay to not interrupt initial render
    const timer = setTimeout(checkTasks, 2000);
    return () => clearTimeout(timer);
  }, [user, isLoading]);

  const handleAction = async (action: 'move' | 'push' | 'drop', task: Task) => {
    try {
      let updatedTask = { ...task };
      const todayStr = new Date().toISOString();
      
      switch (action) {
        case 'move':
          updatedTask.doDate = todayStr;
          if (updatedTask.endDate) updatedTask.endDate = todayStr;
          break;
        case 'push':
          const tomorrowStr = addDays(new Date(), 1).toISOString();
          updatedTask.doDate = tomorrowStr;
          if (updatedTask.endDate) updatedTask.endDate = tomorrowStr;
          updatedTask.pushCount = (updatedTask.pushCount || 0) + 1;
          break;
        case 'drop':
          updatedTask.status = 'abandoned';
          break;
      }

      await updateTask(updatedTask);
      
      toast({
        title: "Task Updated",
        description: `Successfully handled "${task.title}".`,
      });

      if (currentIndex < avoidedTasks.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsOpen(false);
        localStorage.setItem("lastDailyReview", startOfDay(new Date()).toISOString());
      }
    } catch (error) {
       console.error("Failed to update task", error);
       toast({ variant: "destructive", title: "Failed to update task" });
    }
  };

  const handleSkipAll = () => {
      setIsOpen(false);
      // Don't save to localStorage so it prompts again next time they open
  }

  if (avoidedTasks.length === 0) return null;

  const currentTask = avoidedTasks[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <Sparkles className="h-5 w-5" />
            Daily Review
          </DialogTitle>
          <DialogDescription>
            You have {avoidedTasks.length} unfinished tasks from the past. Let's decide what to do with them.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center text-center gap-4">
           <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task {currentIndex + 1} of {avoidedTasks.length}
           </div>
           
           <h3 className="text-xl font-bold">{currentTask.title}</h3>
           
           <div className="flex gap-2 justify-center">
              <Badge variant="outline" className="capitalize">{currentTask.priority}</Badge>
              {currentTask.tShirtSize && <Badge variant="secondary">Size: {currentTask.tShirtSize}</Badge>}
              {(currentTask.pushCount && currentTask.pushCount > 0) ? (
                 <Badge variant="destructive" className="animate-pulse">Pushed {currentTask.pushCount}x</Badge>
              ) : null}
           </div>

           <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
             Scheduled for {new Date(currentTask.doDate || currentTask.endDate || "").toLocaleDateString()}
           </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Button 
            variant="default" 
            className="w-full flex flex-col gap-1 h-auto py-3 bg-blue-600 hover:bg-blue-700"
            onClick={() => handleAction('move', currentTask)}
          >
            <CalendarDays className="h-5 w-5" />
            <span className="font-semibold">Do Today</span>
            <span className="text-[10px] font-normal opacity-80">Move to today</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 h-auto py-3 border-orange-500/30 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400"
            onClick={() => handleAction('push', currentTask)}
          >
            <div className="flex flex-col items-center gap-1">
              <ArrowRightCircle className="h-5 w-5" />
              <span className="font-semibold">Push</span>
              <span className="text-[10px] font-normal opacity-80">Move to tomorrow</span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 h-auto py-3 col-span-2 border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400"
            onClick={() => handleAction('drop', currentTask)}
          >
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Drop (Abandon)</span>
          </Button>
        </div>

        <DialogFooter className="sm:justify-center border-t border-border/50 pt-4">
           <Button variant="ghost" size="sm" onClick={handleSkipAll} className="text-muted-foreground w-full">
              Skip Review For Now
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
