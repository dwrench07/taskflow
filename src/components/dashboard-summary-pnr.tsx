"use client";

import { format, parseISO, isPast, isSameDay } from "date-fns";
import { Priority, Task } from "@/lib/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export function PNRDetail({ tasks }: { tasks: Task[] }) {
  const pnrTasks = tasks
    .filter(t => t.doDate && t.status !== 'done' && !t.isHabit)
    .sort((a, b) => parseISO(a.doDate!).getTime() - parseISO(b.doDate!).getTime())
    .slice(0, 10);

  if (pnrTasks.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No upcoming Drop Dead Dates</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {pnrTasks.map(task => {
        const doDate = parseISO(task.doDate!);
        const isOverdue = isPast(doDate) && !isSameDay(doDate, new Date());
        return (
          <Link
            key={task.id}
            href={`/tasks?taskId=${task.id}`}
            className={cn(
              "block p-4 hover:bg-muted/50 transition-colors",
              isOverdue && "bg-red-500/5"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={cn("font-bold text-sm", isOverdue ? "text-red-600" : "text-foreground")}>
                {task.title}
              </span>
              {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
                <span className={cn("font-medium", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                    {format(doDate, "MMM d, h:mm a")}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-muted-foreground">{task.priority}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
