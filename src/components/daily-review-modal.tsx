"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task, PushReason, PushHistoryEntry } from "@/lib/types";
import { getAllTasks, updateTask, saveUserProgress } from "@/lib/data";
import { isBefore, startOfDay, addDays, parseISO, isSameDay } from "date-fns";
import { CalendarDays, XCircle, ArrowRightCircle, Sparkles, AlertTriangle, HelpCircle, Maximize2, Coffee, Clock, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useGamification } from "@/context/GamificationContext";

const PUSH_REASONS: { value: PushReason; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'too-scary', label: 'Too Scary', icon: <AlertTriangle className="h-4 w-4" />, description: 'Feels overwhelming or anxiety-inducing' },
  { value: 'too-vague', label: 'Too Vague', icon: <HelpCircle className="h-4 w-4" />, description: "Don't know where to start" },
  { value: 'too-big', label: 'Too Big', icon: <Maximize2 className="h-4 w-4" />, description: 'Needs to be broken into smaller pieces' },
  { value: 'too-boring', label: 'Too Boring', icon: <Coffee className="h-4 w-4" />, description: 'No motivation or interest' },
  { value: 'ran-out-of-time', label: 'Ran Out of Time', icon: <Clock className="h-4 w-4" />, description: 'Genuinely had no time today' },
  { value: 'deprioritized', label: 'Deprioritized', icon: <ChevronDown className="h-4 w-4" />, description: 'Something more important came up' },
];

export function DailyReviewModal() {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avoidedTasks, setAvoidedTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PushReason | null>(null);
  const [reflectionNote, setReflectionNote] = useState("");
  const { toast } = useToast();
  const { userProgress, refreshProgress } = useGamification();

  useEffect(() => {
    const checkTasks = async () => {
      if (isLoading || !user) return;
      
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

        return isBefore(targetDate, today) && !isSameDay(targetDate, today);
      });

      if (unfinishedPastTasks.length > 0) {
        setAvoidedTasks(unfinishedPastTasks);
        setIsOpen(true);
      } else {
         localStorage.setItem("lastDailyReview", todayStr);
      }
    };

    const timer = setTimeout(checkTasks, 2000);
    return () => clearTimeout(timer);
  }, [user, isLoading]);

  const advanceOrClose = () => {
    if (currentIndex < avoidedTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowReasonPicker(false);
      setSelectedReason(null);
      setReflectionNote("");
    } else {
      setIsOpen(false);
      setShowReasonPicker(false);
      setSelectedReason(null);
      setReflectionNote("");
      localStorage.setItem("lastDailyReview", startOfDay(new Date()).toISOString());
      
      // Gamification: Perfect Day Review trigger
      if (userProgress) {
        import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
          const tempProgress = JSON.parse(JSON.stringify(userProgress));
          const updates = evaluateGamificationTriggers({ type: 'perfect-day-review' }, tempProgress);
          if (updates.length > 0) {
            await saveUserProgress(tempProgress);
            await refreshProgress();
            updates.forEach(u => toast({ title: `🎁 ${u.message}`, description: u.detail }));
          }
        });
      }
    }
  };

  const currentTask = avoidedTasks[currentIndex];

  const handleAction = async (action: 'move' | 'push' | 'drop', task: Task, reason?: PushReason) => {
    try {
      let updatedTask = { ...task };
      const todayStr = new Date().toISOString();

      switch (action) {
        case 'move':
          updatedTask.doDate = todayStr;
          if (updatedTask.endDate) updatedTask.endDate = todayStr;
          break;
        case 'push': {
          const tomorrowStr = addDays(new Date(), 1).toISOString();
          updatedTask.doDate = tomorrowStr;
          if (updatedTask.endDate) updatedTask.endDate = tomorrowStr;
          updatedTask.pushCount = (updatedTask.pushCount || 0) + 1;

          if (reason) {
            const entry: PushHistoryEntry = {
              date: todayStr,
              reason,
            };
            updatedTask.pushHistory = [...(updatedTask.pushHistory || []), entry];
            
            if (reflectionNote.trim()) {
              updatedTask.notes = [...(updatedTask.notes || []), `Reflection (${reason}): ${reflectionNote.trim()}`];
            }
          }
          break;
        }
        case 'drop':
          updatedTask.status = 'abandoned';
          break;
      }

      await updateTask(updatedTask);
      toast({ title: "Task Updated", description: `Successfully handled "${task.title}".` });
      advanceOrClose();
    } catch (error) {
       console.error("Failed to update task", error);
       toast({ variant: "destructive", title: "Failed to update task" });
    }
  };

  const handlePushClick = () => {
    setShowReasonPicker(true);
    setSelectedReason(null);
    setReflectionNote("");
  };

  const handleConfirmPush = () => {
    if (selectedReason && currentTask) {
      handleAction('push', currentTask, selectedReason);
    }
  };

  const handleSkipAll = () => {
      setIsOpen(false);
      setShowReasonPicker(false);
      setSelectedReason(null);
      setReflectionNote("");
  }

  if (avoidedTasks.length === 0 || !currentTask) return null;

  const pushReasonSummary = (() => {
    const history = currentTask.pushHistory || [];
    if (history.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const entry of history) {
      counts[entry.reason] = (counts[entry.reason] || 0) + 1;
    }
    const topReason = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { reason: topReason[0] as PushReason, count: topReason[1], total: history.length };
  })();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <Sparkles className="h-5 w-5" />
            Daily Review
          </DialogTitle>
          <DialogDescription>
            You have {avoidedTasks.length} unfinished tasks from the past. Decide their fate.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center text-center gap-3">
           <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task {currentIndex + 1} of {avoidedTasks.length}
           </div>

           <h3 className="text-xl font-bold">{currentTask.title}</h3>

           <div className="flex gap-2 justify-center flex-wrap">
              <Badge variant="outline" className="capitalize">{currentTask.priority}</Badge>
              {currentTask.tShirtSize && <Badge variant="secondary">Size: {currentTask.tShirtSize}</Badge>}
              {(currentTask.pushCount && currentTask.pushCount > 0) ? (
                 <Badge variant="destructive" className="animate-pulse">Pushed {currentTask.pushCount}x</Badge>
              ) : null}
           </div>

           {pushReasonSummary && (
             <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mt-1">
               Pattern: pushed as &quot;{PUSH_REASONS.find(r => r.value === pushReasonSummary.reason)?.label}&quot; {pushReasonSummary.count}/{pushReasonSummary.total} times
             </div>
           )}

           <p className="text-sm text-muted-foreground line-clamp-2">
             Scheduled for {new Date(currentTask.doDate || currentTask.endDate || "").toLocaleDateString()}
           </p>
        </div>

        {showReasonPicker ? (
          <div className="space-y-3 pb-4">
            <p className="text-sm font-medium text-center text-muted-foreground">Why are you pushing this?</p>
            <div className="grid grid-cols-2 gap-2">
              {PUSH_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all text-center",
                    selectedReason === reason.value
                      ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {reason.icon}
                  <span className="font-semibold">{reason.label}</span>
                </button>
              ))}
            </div>

            {selectedReason && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Commitment Reflection (Mandatory)
                </p>
                <Textarea 
                  placeholder="Why is tomorrow truly better? What will be different?"
                  value={reflectionNote}
                  onChange={(e) => setReflectionNote(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => { setShowReasonPicker(false); setSelectedReason(null); }}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={!selectedReason || reflectionNote.trim().length < 5}
                onClick={handleConfirmPush}
              >
                Push to Tomorrow
              </Button>
            </div>
            
            {selectedReason && (
              <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2 mt-2">
                {selectedReason === 'too-scary' && "Tip: Try breaking this into a tiny 2-minute first step."}
                {selectedReason === 'too-vague' && "Tip: Spend 5 minutes just defining the first concrete step."}
                {selectedReason === 'too-big' && "Tip: Can you break this into subtasks?"}
                {selectedReason === 'too-boring' && "Tip: Try pairing this with music."}
                {selectedReason === 'ran-out-of-time' && "Consider: Is your daily plan too ambitious?"}
                {selectedReason === 'deprioritized' && "Does the priority level still reflect reality?"}
              </div>
            )}
          </div>
        ) : (
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
              onClick={handlePushClick}
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
        )}

        <DialogFooter className="sm:justify-center border-t border-border/50 pt-4">
           <Button variant="ghost" size="sm" onClick={handleSkipAll} className="text-muted-foreground w-full">
              Skip Review For Now
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
