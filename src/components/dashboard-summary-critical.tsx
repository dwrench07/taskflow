"use client";

import { Task } from "@/lib/types";
import { format, parseISO, isPast, isSameDay } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import Link from "next/link";

export function CriticalDetail({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  
  const criticalItems = useMemo(() => {
    return tasks
      .filter(t => 
        t.status !== 'done' && 
        (t.category !== "habit") && 
        (t.priority === 'urgent' || t.priority === 'high' || (t.endDate && isSameDay(parseISO(t.endDate), today)))
      )
      .sort((a, b) => {
        const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (pOrder[a.priority] !== pOrder[b.priority]) {
            return pOrder[a.priority] - pOrder[b.priority];
        }
        if (a.endDate && b.endDate) {
            return parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime();
        }
        return a.endDate ? -1 : 1;
      })
      .slice(0, 10);
  }, [tasks]);

  if (criticalItems.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No urgent deadlines</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {criticalItems.map(task => {
        const hasDeadline = !!task.endDate;
        const isOverdue = hasDeadline && isPast(parseISO(task.endDate!)) && !isSameDay(parseISO(task.endDate!), today);
        
        return (
          <Link
            href={`/focus?taskId=${task.id}`}
            key={task.id}
            className={cn(
              "block p-4 hover:bg-muted/50 transition-colors",
              isOverdue && "bg-red-500/5"
            )}
          >
            <div className="flex justify-between items-start mb-1 gap-2">
              <span className={cn("font-bold text-sm hover:text-primary transition-colors", isOverdue ? "text-red-600" : "text-foreground")}>
                {task.title}
              </span>
              <Badge variant="outline" className={cn(
                "text-[10px] px-1 py-0 h-4 capitalize shrink-0",
                task.priority === 'urgent' ? "bg-red-500/10 text-red-600 border-red-200" : "bg-muted text-muted-foreground"
              )}>
                {task.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {hasDeadline ? (
                <span className={cn("flex items-center gap-1", isOverdue && "text-red-500 font-medium")}>
                  <Clock className="w-3 h-3" />
                  {format(parseISO(task.endDate!), "MMM d, h:mm a")}
                </span>
              ) : (
                <span>No hard deadline</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
