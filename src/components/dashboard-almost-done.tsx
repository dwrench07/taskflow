"use client";

import { useEffect, useMemo, useState } from "react";
import { Task, Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";
import { getAllProjects } from "@/lib/data";

interface DashboardAlmostDoneProps {
  allTasks: Task[];
}

export function DashboardAlmostDone({ allTasks }: DashboardAlmostDoneProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getAllProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const almostDoneProjects = useMemo(() => {
    return projects
      .map(project => {
        const children = allTasks.filter(t =>
          t.projectId === project.id && (t.recurrence ?? 'once') === 'once'
        );
        const completed = children.filter(c => c.status === 'done').length;
        const total = children.length;
        const remaining = children.filter(c => c.status !== 'done' && c.status !== 'abandoned');
        const pct = total === 0 ? 0 : completed / total;
        return { project, children, completed, total, remaining, percentage: Math.round(pct * 100) };
      })
      .filter(p => p.total >= 2 && p.percentage >= 60 && p.percentage < 100 && p.completed >= 2)
      .sort((a, b) => b.percentage - a.percentage);
  }, [projects, allTasks]);

  if (almostDoneProjects.length === 0) return null;

  return (
    <Card className="border-border/50 border-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Almost Done
          <WidgetInfo description={WIDGET_DESCRIPTIONS["almost-done"]} />
          <Badge variant="secondary" className="ml-auto text-[10px] bg-green-500/10 text-green-500">{almostDoneProjects.length} projects</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">These projects are 60%+ complete. Just finish them.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {almostDoneProjects.slice(0, 5).map(({ project, completed, total, percentage, remaining }) => (
          <div key={project.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/tasks?projectId=${project.id}`} className="text-sm font-medium truncate hover:text-primary transition-colors">{project.title}</Link>
              <Badge variant="outline" className="text-[10px] shrink-0 text-green-500 border-green-500/30">
                {completed}/{total} ({percentage}%)
              </Badge>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500/60 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="pl-2 space-y-1">
              {remaining.slice(0, 3).map(sub => (
                <div key={sub.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Circle className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{sub.title}</span>
                </div>
              ))}
              {remaining.length > 3 && (
                <span className="text-[10px] text-muted-foreground pl-4">+{remaining.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
