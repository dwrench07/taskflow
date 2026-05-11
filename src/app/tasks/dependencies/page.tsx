"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllTasks } from "@/lib/data";
import type { Task } from "@/lib/types";
import { TaskDependencyGraph } from "@/components/tasks/task-dependency-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Network, AlertTriangle, Lock, Loader2 } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  todo: "#3b82f6",
  "in-progress": "#f59e0b",
  done: "#10b981",
  abandoned: "#6b7280",
};

export default function TaskDependenciesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllTasks().then((t) => {
      if (!cancelled) {
        setTasks(t);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const withDeps = tasks.filter(
      (t) => (t.blockedBy?.length ?? 0) > 0 || (t.blocks?.length ?? 0) > 0
    );
    const blocked = tasks.filter(
      (t) => (t.blockedBy?.length ?? 0) > 0 && t.status !== "done"
    );
    const blockers = tasks.filter(
      (t) =>
        (t.blocks?.length ?? 0) > 0 &&
        t.status !== "done" &&
        // counts as an active blocker only if at least one downstream task is not done
        t.blocks!.some((id) => {
          const dep = tasks.find((x) => x.id === id);
          return dep && dep.status !== "done";
        })
    );
    return { withDeps: withDeps.length, blocked: blocked.length, blockers: blockers.length };
  }, [tasks]);

  const selectedTask = selectedId ? tasks.find((t) => t.id === selectedId) : null;
  const selectedBlockers = selectedTask?.blockedBy
    ?.map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => !!t);
  const selectedBlocked = selectedTask?.blocks
    ?.map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => !!t);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tasks">
              <ArrowLeft className="h-4 w-4 mr-1" /> Tasks
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Task Dependencies
            </h1>
            <p className="text-xs text-muted-foreground">
              Visualize which tasks block which — arrows point from blocker to blocked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="hide-done"
            checked={hideCompleted}
            onCheckedChange={setHideCompleted}
          />
          <Label htmlFor="hide-done" className="text-xs">Hide completed</Label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-[11px] text-muted-foreground">Tasks with dependencies</div>
            <div className="text-2xl font-bold">{stats.withDeps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Currently blocked
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.blocked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Active blockers
            </div>
            <div className="text-2xl font-bold text-amber-500">{stats.blockers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 flex-1 min-h-0">
        <Card className="overflow-hidden">
          <CardContent className="p-0 h-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TaskDependencyGraph
                tasks={tasks}
                hideCompleted={hideCompleted}
                onSelect={setSelectedId}
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">
              {selectedTask ? "Selected Task" : "Legend"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs space-y-3 overflow-auto">
            {selectedTask ? (
              <>
                <div className="font-medium text-sm">{selectedTask.title}</div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: STATUS_COLOR[selectedTask.status] }}
                  />
                  <span className="capitalize">{selectedTask.status}</span>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">
                    Blocked by ({selectedBlockers?.length ?? 0})
                  </div>
                  {selectedBlockers && selectedBlockers.length > 0 ? (
                    <ul className="space-y-1">
                      {selectedBlockers.map((b) => (
                        <li key={b.id} className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ background: STATUS_COLOR[b.status] }}
                          />
                          <span className={b.status === "done" ? "line-through text-muted-foreground" : ""}>
                            {b.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground">None</div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">
                    Blocks ({selectedBlocked?.length ?? 0})
                  </div>
                  {selectedBlocked && selectedBlocked.length > 0 ? (
                    <ul className="space-y-1">
                      {selectedBlocked.map((b) => (
                        <li key={b.id} className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ background: STATUS_COLOR[b.status] }}
                          />
                          <span className={b.status === "done" ? "line-through text-muted-foreground" : ""}>
                            {b.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground">None</div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-muted-foreground">Click a node to highlight its full chain (upstream blockers and downstream blocked tasks).</div>
                <div className="space-y-1.5 pt-1">
                  {Object.entries(STATUS_COLOR).map(([s, c]) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                      <span className="capitalize">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 text-muted-foreground">
                  Arrows point from <span className="text-foreground">blocker</span> →{" "}
                  <span className="text-foreground">blocked task</span>.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
