"use client";

import { Task } from "@/lib/types";
import { format, parseISO, isSameDay } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { getAllProjects } from "@/lib/data";

/**
 * Renamed in spirit: shows today's scheduled child tasks of any Project.
 * In the new atomic-Task model, "subtask" means "a Task that belongs to a Project".
 */
export function SubtaskDetail({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const [projectMap, setProjectMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllProjects()
      .then(ps => setProjectMap(Object.fromEntries(ps.map(p => [p.id, p.title]))))
      .catch(() => setProjectMap({}));
  }, []);

  const todayChildTasks = useMemo(() => {
    const items: { id: string; title: string; priority: string; date?: string; parentTitle: string; parentId: string; completed: boolean }[] = [];

    tasks.forEach(task => {
      if (task.category === 'habit' || task.isHabit) return;
      if (!task.projectId) return;

      const isToday = (task.doDate && isSameDay(parseISO(task.doDate), today)) ||
                      (task.endDate && isSameDay(parseISO(task.endDate), today));
      if (!isToday) return;

      items.push({
        id: task.id,
        title: task.title,
        priority: task.priority,
        date: task.doDate || task.endDate,
        parentTitle: projectMap[task.projectId] || 'Project',
        parentId: task.projectId,
        completed: task.status === 'done',
      });
    });

    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return items.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return pOrder[a.priority as keyof typeof pOrder] - pOrder[b.priority as keyof typeof pOrder];
    });
  }, [tasks, projectMap]);

  if (todayChildTasks.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No project tasks scheduled today</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {todayChildTasks.map(item => (
        <Link
          href={`/focus?taskId=${item.id}`}
          key={item.id}
          className={cn(
            "block p-4 hover:bg-white/5 transition-colors group/item",
            item.completed && "opacity-50"
          )}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn(
                "font-bold text-sm text-foreground transition-all group-hover/item:text-primary",
                item.completed && "line-through text-muted-foreground"
              )}>
                {item.title}
              </span>
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">
                {item.parentTitle}
              </span>
            </div>
            <Badge variant="outline" className={cn(
              "text-[9px] px-1.5 py-0 h-4 capitalize shrink-0 font-black tracking-tighter",
              item.priority === 'urgent' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-muted-foreground border-white/10"
            )}>
              {item.priority}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/80 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <Clock className="w-3 h-3 text-primary" />
              {item.date ? format(parseISO(item.date), "MMM d, h:mm a") : "No time set"}
            </div>
            {item.completed && (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
