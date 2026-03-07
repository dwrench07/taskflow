
"use client";

import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardStatusChart } from "@/components/dashboard-status-chart";
import { DashboardPriorityChart } from "@/components/dashboard-priority-chart";
import { DashboardUpcomingDeadlines } from "@/components/dashboard-upcoming-deadlines";
import { DashboardCompletionChart } from "@/components/dashboard-completion-chart";
import { DashboardStats } from "@/components/dashboard-stats";
import { DashboardGoals } from "@/components/dashboard-goals";
import { DashboardHabitHeatmap } from "@/components/dashboard-habit-heatmap";
import { DashboardFocusDistribution } from "@/components/dashboard-focus-distribution";
import { DashboardDistractionScore } from "@/components/dashboard-distraction-score";
import { DashboardGoalVelocity } from "@/components/dashboard-goal-velocity";
import { DashboardTaskVelocity } from "@/components/dashboard-task-velocity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllTasks, getFocusSessions } from "@/lib/data";
import { useEffect, useState } from "react";
import { Task, FocusSession } from "@/lib/types";

export default function DashboardPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [tasks, sessions] = await Promise.all([
        getAllTasks(),
        getFocusSessions()
      ]);
      setAllTasks(tasks);
      setFocusSessions(sessions);
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A high-level overview of your tasks and habits.</p>
      </div>

      {/* The Overview metrics remain visible at the top */}
      <DashboardOverview allTasks={allTasks} />

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:w-[600px]">
          <TabsTrigger value="overview" className="py-2">Overview</TabsTrigger>
          <TabsTrigger value="deep-work" className="py-2">Deep Work</TabsTrigger>
          <TabsTrigger value="strategic" className="py-2">Strategic</TabsTrigger>
          <TabsTrigger value="velocity" className="py-2">Velocity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-full xl:col-span-4 space-y-6">
              <DashboardCompletionChart allTasks={allTasks} />
              <div className="grid gap-6 sm:grid-cols-2">
                <DashboardPriorityChart allTasks={allTasks} />
                <DashboardStatusChart allTasks={allTasks} />
              </div>
            </div>
            <div className="col-span-full xl:col-span-3 space-y-6">
              <DashboardHabitHeatmap allTasks={allTasks} />
              <DashboardUpcomingDeadlines allTasks={allTasks} />
              <DashboardStats allTasks={allTasks} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deep-work" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardFocusDistribution allTasks={allTasks} focusSessions={focusSessions} />
            <DashboardDistractionScore focusSessions={focusSessions} />
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 lg:grid-cols-7">
            <div className="col-span-full xl:col-span-4 space-y-6">
              <DashboardGoalVelocity />
            </div>
            <div className="col-span-full xl:col-span-3 space-y-6">
              <DashboardGoals />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="velocity" className="space-y-6 animate-fade-in">
          <div className="grid gap-6">
            <DashboardTaskVelocity allTasks={allTasks} />
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
