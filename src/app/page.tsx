
"use client";

import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardStatusChart } from "@/components/dashboard-status-chart";
import { DashboardPriorityChart } from "@/components/dashboard-priority-chart";
import { DashboardUpcomingDeadlines } from "@/components/dashboard-upcoming-deadlines";
import { DashboardCompletionChart } from "@/components/dashboard-completion-chart";
import { DashboardStats } from "@/components/dashboard-stats";
import { getAllTasks } from "@/lib/data";
import { useEffect, useState } from "react";
import { Task } from "@/lib/types";

export default function DashboardPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  useEffect(() => {
    const loadAllTasks = async () => {
      const tasks = await getAllTasks();
      setAllTasks(tasks);
    }
    loadAllTasks();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A high-level overview of your tasks and habits.</p>
      </div>
      <DashboardOverview allTasks={allTasks} />
      <div className="grid gap-8 lg:grid-cols-3">
        <DashboardPriorityChart allTasks={allTasks} />
        <DashboardStatusChart allTasks={allTasks} />
        <DashboardStats allTasks={allTasks} />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <DashboardUpcomingDeadlines allTasks={allTasks} />
        <DashboardCompletionChart allTasks={allTasks} />
      </div>
    </div>
  );
}
