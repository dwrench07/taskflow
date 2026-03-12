"use client";

import { Task } from "@/lib/types";
import { format, parseISO, isSameDay } from "date-fns";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "./ui/badge";

export function TaskDetail({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  
  const todayItems = useMemo(() => {
    const items: { id: string; title: string; priority: string; date?: string; completed: boolean }[] = [];
    
    tasks.forEach(task => {
        if (task.isHabit) return;

        const isTaskToday = (task.doDate && isSameDay(parseISO(task.doDate), today)) || 
                           (task.endDate && isSameDay(parseISO(task.endDate), today));
        
        if (isTaskToday) {
            items.push({
                id: task.id,
                title: task.title,
                priority: task.priority,
                date: task.doDate || task.endDate,
                completed: task.status === 'done'
            });
        }
    });

    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return items.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return pOrder[a.priority as keyof typeof pOrder] - pOrder[b.priority as keyof typeof pOrder];
    });
  }, [tasks]);

  if (todayItems.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No tasks for today</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {todayItems.map(item => (
        <div
          key={item.id}
          className={cn(
              "block p-4 hover:bg-muted/50 transition-colors",
              item.completed && "opacity-50"
          )}
        >
          <div className="flex justify-between items-start mb-1 gap-2">
            <div className="flex flex-col min-w-0">
                <span className={cn("font-bold text-sm text-foreground truncate", item.completed && "line-through")}>
                {item.title}
                </span>
            </div>
            <Badge variant="outline" className={cn(
                "text-[10px] px-1 py-0 h-4 capitalize shrink-0",
                item.priority === 'urgent' ? "bg-red-500/10 text-red-600 border-red-200" : "bg-muted text-muted-foreground"
            )}>
                {item.priority}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {item.date ? `${format(parseISO(item.date), "MMM d, h:mm a")}` : "No time set"}
          </div>
        </div>
      ))}
    </div>
  );
}
