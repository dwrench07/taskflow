"use client";

import React from "react";
import { Task, Priority, Status, Goal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, Calendar, Users, Trash2, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EisenhowerMatrixProps {
  tasks: Task[];
  goals: Goal[];
  onSelectTask: (task: Task) => void;
}

function calculateGoalProgress(goalId: string, allTasks: Task[]) {
  const goalTasks = allTasks.filter(t => t.goalId === goalId);
  if (goalTasks.length === 0) return 0;
  const completedTasks = goalTasks.filter(t => t.status === 'done').length;
  return Math.round((completedTasks / goalTasks.length) * 100);
}

export function EisenhowerMatrix({ tasks, goals, onSelectTask }: EisenhowerMatrixProps) {
  const quadrants: { title: string; subtitle: string; icon: React.ReactNode; color: string; priorities: Priority[] }[] = [
    {
      title: "Do Now",
      subtitle: "Urgent & Important",
      icon: <Flame className="h-4 w-4 text-red-500" />,
      color: "border-red-500/20 bg-red-500/5",
      priorities: ["urgent"],
    },
    {
      title: "Schedule",
      subtitle: "Important, Not Urgent",
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
      color: "border-blue-500/20 bg-blue-500/5",
      priorities: ["high"],
    },
    {
      title: "Delegate",
      subtitle: "Urgent, Not Important",
      icon: <Users className="h-4 w-4 text-orange-500" />,
      color: "border-orange-500/20 bg-orange-500/5",
      priorities: ["medium"],
    },
    {
      title: "Eliminate",
      subtitle: "Neither",
      icon: <Trash2 className="h-4 w-4 text-muted-foreground" />,
      color: "border-muted/20 bg-muted/5",
      priorities: ["low"],
    },
  ];

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "medium": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "low": return "bg-muted text-muted-foreground border-border";
      default: return "";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0">
      {quadrants.map((q) => {
        const quadrantTasks = tasks.filter((t) => q.priorities.includes(t.priority) && t.status !== 'done');
        
        return (
          <Card key={q.title} className={cn("flex flex-col h-full min-h-0 overflow-hidden border shadow-none", q.color)}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b border-border/50 bg-background/30">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest">{q.title}</CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium italic">{q.subtitle}</p>
              </div>
              {q.icon}
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {quadrantTasks.length > 0 ? (
                    quadrantTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="w-full text-left p-3 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-all duration-200 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-semibold truncate flex-1">{task.title}</p>
                          {task.tShirtSize && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 flex-shrink-0 border-primary/20 text-primary">
                              {task.tShirtSize}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-1">
                            {task.description}
                          </p>
                        )}
                        {(() => {
                          const linkedGoal = goals?.find(g => g.id === task.goalId);
                          if (!linkedGoal) return null;
                          const progress = calculateGoalProgress(linkedGoal.id, tasks);
                          return (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-muted-foreground w-full border-t border-border/30 pt-1.5">
                              <Target className="w-2.5 h-2.5 text-primary/70" />
                              <span className="truncate flex-1 font-medium">{linkedGoal.title}</span>
                              <span className="flex-shrink-0 font-medium tabular-nums">{progress}%</span>
                              <div className="w-8 bg-muted rounded-full h-0.5 overflow-hidden">
                                <div className="bg-primary/70 h-0.5 flex-shrink-0 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          );
                        })()}
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                      <p className="text-[10px] uppercase font-bold tracking-tighter italic">Clear</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
