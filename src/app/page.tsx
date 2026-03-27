
"use client";

import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardStatusChart } from "@/components/dashboard-status-chart";
import { DashboardPriorityChart } from "@/components/dashboard-priority-chart";
import { DashboardCompletionChart } from "@/components/dashboard-completion-chart";
import { DashboardStats } from "@/components/dashboard-stats";
import { DashboardGoals } from "@/components/dashboard-goals";
import { DashboardHabitHeatmap } from "@/components/dashboard-habit-heatmap";
import { DashboardFocusDistribution } from "@/components/dashboard-focus-distribution";
import { DashboardDistractionScore } from "@/components/dashboard-distraction-score";
import { DashboardGoalVelocity } from "@/components/dashboard-goal-velocity";
import { DashboardTaskVelocity } from "@/components/dashboard-task-velocity";
import { DashboardPointOfNoReturn } from "@/components/dashboard-point-of-no-return";
import { DashboardPushAnalytics } from "@/components/dashboard-push-analytics";
import { DashboardAlmostDone } from "@/components/dashboard-almost-done";
import { DashboardDailyWins } from "@/components/dashboard-daily-wins";
import { SummaryCard } from "@/components/dashboard-summary-card";
import { PNRDetail } from "@/components/dashboard-summary-pnr";
import { calculateStreak } from "@/lib/habits";
import { HabitDetail } from "@/components/dashboard-summary-habits";
import { FocusDetail } from "@/components/dashboard-summary-focus";
import { TaskDetail } from "@/components/dashboard-summary-tasks";
import { SubtaskDetail } from "@/components/dashboard-summary-subtasks";
import { CriticalDetail } from "@/components/dashboard-summary-critical";
import { DashboardUpcomingDeadlines } from "@/components/dashboard-upcoming-deadlines-v2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllTasks, getFocusSessions } from "@/lib/data";
import { useEffect, useState, useMemo } from "react";
import { Task, FocusSession } from "@/lib/types";
import { LayoutDashboard, BarChart3, Clock, Flame, Brain, ListTodo, AlertTriangle, ChevronRight, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

import { DailyReviewModal } from "@/components/daily-review-modal";
import { MorningLaunch } from "@/components/morning-launch";
import { EnergyCheckIn } from "@/components/energy-check-in";

function isMorningTime(): boolean {
  const hour = new Date().getHours();
  const minutes = new Date().getMinutes();
  return hour < 10 || (hour === 10 && minutes <= 30);
}

export default function DashboardPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [viewMode, setViewMode] = useState<'quick' | 'detailed'>('quick');
  const [showMorningLaunch, setShowMorningLaunch] = useState(false);

  useEffect(() => {
    // Show morning launch if before 10:30 AM and not dismissed this session
    const dismissed = sessionStorage.getItem('morning-launch-dismissed');
    if (isMorningTime() && !dismissed) {
      setShowMorningLaunch(true);
    }
  }, []);

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

  const stats = useMemo(() => {
    const today = new Date();
    const activeTasks = allTasks.filter(t => t.status !== 'done' && !t.isHabit);
    const criticalTasks = activeTasks.filter(t => 
        t.priority === 'urgent' || t.priority === 'high' || (t.endDate && isSameDay(parseISO(t.endDate), today))
    ).length;

    const pnrCount = allTasks.filter(t => t.doDate && t.status !== 'done' && !t.isHabit).length;
    
    const habits = allTasks.filter(t => t.isHabit);
    const habitsDoneToday = habits.filter(h => h.completionHistory?.some(d => isSameDay(parseISO(d), today))).length;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const habitsDoneYesterday = habits.filter(h => h.completionHistory?.some(d => isSameDay(parseISO(d), yesterday))).length;
    const habitDelta = habitsDoneToday - habitsDoneYesterday;

    let topTasksTotalToday = 0;
    let topTasksDoneToday = 0;
    let subTasksTotalToday = 0;
    let subTasksDoneToday = 0;

    allTasks.forEach(task => {
        if (task.isHabit) return;

        // Check top-level task
        const isTaskToday = (task.doDate && isSameDay(parseISO(task.doDate), today)) || 
                           (task.endDate && isSameDay(parseISO(task.endDate), today));
        
        if (isTaskToday) {
            topTasksTotalToday++;
            if (task.status === 'done') topTasksDoneToday++;
        }

        // Check subtasks
        task.subtasks?.forEach(sub => {
            const isSubToday = (sub.doDate && isSameDay(parseISO(sub.doDate), today)) || 
                              (sub.endDate && isSameDay(parseISO(sub.endDate), today));
            
            if (isSubToday) {
                subTasksTotalToday++;
                if (sub.completed) subTasksDoneToday++;
            }
        });
    });

    const todaySessions = focusSessions.filter(s => isSameDay(parseISO(s.startTime), today));
    const focusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

    return {
        criticalTasks,
        pnrCount,
        habitsDoneToday,
        habitsTotal: habits.length,
        habitsWithStreak: habits.filter(h => calculateStreak(h) > 0).length,
        habitDelta,
        focusMinutes,
        topTasksDoneToday,
        topTasksTotalToday,
        subTasksDoneToday,
        subTasksTotalToday
    };
  }, [allTasks, focusSessions]);

  const handleDismissMorning = () => {
    sessionStorage.setItem('morning-launch-dismissed', 'true');
    setShowMorningLaunch(false);
  };

  if (showMorningLaunch) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-xl mx-auto px-4 sm:px-8 py-2">
        <DailyReviewModal />
        <EnergyCheckIn />
        <MorningLaunch allTasks={allTasks} onDismiss={handleDismissMorning} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-2">
      <DailyReviewModal />
      <EnergyCheckIn />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] rotate-3 hover:rotate-0 transition-transform duration-500">
                <Flame className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl font-black italic tracking-tighter bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">Dash</h1>
          </div>
          <p className="text-muted-foreground/60 text-xs font-black uppercase tracking-[0.3em] pl-1.5">Focus on that matters. Ignore the rest.</p>
        </div>
        
        <div className="glass-morphism p-1 rounded-xl flex items-center shadow-inner">
            <Button 
                variant={viewMode === 'quick' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('quick')}
                className={cn(
                    "h-9 px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                    viewMode === 'quick' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                )}
            >
                <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                Quick View
            </Button>
            <Button 
                variant={viewMode === 'detailed' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('detailed')}
                className={cn(
                    "h-9 px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                    viewMode === 'detailed' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                )}
            >
                <BarChart3 className="w-3.5 h-3.5 mr-2" />
                Deep Dive
            </Button>
        </div>
      </div>

      {viewMode === 'quick' ? (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 mb-10">
            <SummaryCard
                icon={AlertTriangle}
                title="Urgent"
                value={stats.criticalTasks}
                subtitle="High priority & deadlines"
                color="text-red-500"
            >
                <CriticalDetail tasks={allTasks} />
            </SummaryCard>
            <SummaryCard
                icon={ListTodo}
                title="Tasks"
                value={`${stats.topTasksDoneToday}/${stats.topTasksTotalToday}`}
                subtitle="Main objectives today"
                color="text-blue-500"
            >
                <TaskDetail tasks={allTasks} />
            </SummaryCard>
            <SummaryCard
                icon={Layers}
                title="Subtasks"
                value={`${stats.subTasksDoneToday}/${stats.subTasksTotalToday}`}
                subtitle="Granular progress"
                color="text-indigo-400"
            >
                <SubtaskDetail tasks={allTasks} />
            </SummaryCard>
            <SummaryCard
                icon={Clock}
                title="PNR"
                value={stats.pnrCount}
                subtitle="Must start immediately"
                color="text-orange-400"
            >
                <PNRDetail tasks={allTasks} />
            </SummaryCard>
            <SummaryCard
                icon={Flame}
                title="Habits"
                value={`${stats.habitsDoneToday}/${stats.habitsTotal}`}
                subtitle="Consistency is key"
                color="text-green-400"
                trend={{ value: stats.habitDelta, isGood: true }}
            >
                <HabitDetail tasks={allTasks} />
            </SummaryCard>
            <SummaryCard
                icon={Brain}
                title="Focus"
                value={`${Math.round(stats.focusMinutes / 60 * 10) / 10}h`}
                subtitle="Total deep work today"
                color="text-cyan-400"
            >
                <FocusDetail sessions={focusSessions} />
            </SummaryCard>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* The Overview metrics remain visible at the top */}
            <DashboardOverview allTasks={allTasks} />

            <div className="max-w-[800px]">
                <DashboardUpcomingDeadlines allTasks={allTasks} />
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:w-[600px] bg-muted/30 p-1">
                <TabsTrigger value="overview" className="py-2">Performance</TabsTrigger>
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
                     <DashboardDailyWins />
                     <DashboardPointOfNoReturn allTasks={allTasks} />
                    <DashboardAlmostDone allTasks={allTasks} />
                    <DashboardPushAnalytics allTasks={allTasks} />
                    <DashboardHabitHeatmap allTasks={allTasks} />
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
      )}
    </div>
  );
}
