
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
import { DashboardApproachScore } from "@/components/dashboard-approach-score";
import { DashboardAlmostDone } from "@/components/dashboard-almost-done";
import { DashboardDailyWins } from "@/components/dashboard-daily-wins";
import { DashboardPeakHours } from "@/components/dashboard-peak-hours";
import { DashboardWorryTracker } from "@/components/dashboard-worry-tracker";
import { DashboardFrogCompletion } from "@/components/dashboard-frog-completion";
import { DashboardEnergyMatrix } from "@/components/dashboard-energy-matrix";
import { DashboardTShirtAccuracy } from "@/components/dashboard-tshirt-accuracy";
import { DashboardBlockerInsights } from "@/components/dashboard-blocker-insights";
import { DashboardPushFunnel } from "@/components/dashboard-push-funnel";
import { DashboardTagHeatmap } from "@/components/dashboard-tag-heatmap";
import { DashboardEmotionProductivity } from "@/components/dashboard-emotion-productivity";
import { DashboardGoalCoverage } from "@/components/dashboard-goal-coverage";
import { DashboardHabitResilience } from "@/components/dashboard-habit-resilience";
import { DashboardTimeLimitAdherence } from "@/components/dashboard-timelimit-adherence";
import { DashboardWeeklyReport } from "@/components/dashboard-weekly-report";
import { DashboardPillarBalance } from "@/components/dashboard-pillar-balance";
import { DashboardOverdueRisk } from "@/components/dashboard-overdue-risk";
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
import { getAllTasks, getFocusSessions, getDailyPlan, updateTask, getAllChores, updateChore, getUserProgress, saveUserProgress } from "@/lib/data";
import { useEffect, useState, useMemo } from "react";
import { useRefresh } from "@/context/RefreshContext";
import { Task, FocusSession, Priority, EnergyLevel, Chore } from "@/lib/types";
import {
  LayoutDashboard, BarChart3, Clock, Flame, Brain, ListTodo, Timer,
  PlusCircle,
  FileText,
  ClipboardList,
  Zap,
  AlertTriangle, ChevronRight, CheckCircle2, Layers, Repeat, CalendarCheck,
  ChevronDown, BatteryLow, BatteryMedium, BatteryFull
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isSameDay, parseISO, startOfDay, format } from "date-fns";
import { getTodayEnergy } from "@/lib/energy";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/GamificationContext";
import { InventoryDock } from "@/components/InventoryDock";
import { BonsaiTree } from "@/components/BonsaiTree";
import { DailyProgressMeter } from "@/components/DailyProgressMeter";

import { DailyReviewModal } from "@/components/daily-review-modal";
import { MorningLaunch } from "@/components/morning-launch";
import { EnergyCheckIn } from "@/components/energy-check-in";
import { scheduleNotifications } from "@/lib/notifications";
import { NotificationSettings } from "@/components/notification-settings";
import { useToast } from "@/hooks/use-toast";


function isMorningTime(): boolean {
  const hour = new Date().getHours();
  const minutes = new Date().getMinutes();
  return hour < 10 || (hour === 10 && minutes <= 30);
}

export default function DashboardPage() {
  const { toast } = useToast();
  const { refreshKey } = useRefresh();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allChores, setAllChores] = useState<Chore[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [dailyPlanIds, setDailyPlanIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'schedule' | 'quick' | 'detailed'>('schedule');
  const [scheduleView, setScheduleView] = useState<'list' | 'eisenhower' | 'energy'>('list');
  const [habitsOpen, setHabitsOpen] = useState(false);
  const [choresOpen, setChoresOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);
  const [showMorningLaunch, setShowMorningLaunch] = useState(false);
  const SHOW_ZEN_GARDEN = false; // Toggle for Bonsai Tree feature

  const { userProgress } = useGamification();
  const isZenMode = userProgress?.activeBuffs.some(b => b.type === 'zenMode');

  useEffect(() => {
    // Show morning launch if before 10:30 AM and not dismissed this session
    const dismissed = sessionStorage.getItem('morning-launch-dismissed');
    if (isMorningTime() && !dismissed) {
      setShowMorningLaunch(true);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const [tasks, sessions, planIds, chores] = await Promise.all([
        getAllTasks(),
        getFocusSessions(),
        getDailyPlan(todayStr).catch(() => []),
        getAllChores().catch(() => []),
      ]);
      setAllTasks(tasks);
      setFocusSessions(sessions);
      setDailyPlanIds(Array.isArray(planIds) ? planIds : []);
      setAllChores(Array.isArray(chores) ? chores : []);

      // Schedule native notifications if in Capacitor
      await scheduleNotifications(tasks);
    }
    loadData();
  }, [refreshKey]);

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
    const focusMinutes = todaySessions.reduce((acc: number, s: any) => acc + s.duration, 0);

    const frogs = allTasks.filter(t => t.isFrog && t.status !== 'done');
    const frogsDoneToday = allTasks.filter(t => t.isFrog && t.status === 'done' && t.doDate && isSameDay(parseISO(t.doDate), today)).length;
    const frogsTotal = allTasks.filter(t => t.isFrog).length;

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
      subTasksTotalToday,
      frogsRemaining: frogs.length,
      frogsDoneToday,
      frogsTotal
    };
  }, [allTasks, focusSessions]);

  interface TodayItem {
    id: string;
    title: string;
    type: 'frog' | 'task' | 'habit';
    parentId?: string;
    isSubtask: boolean;
    completed: boolean;
    priority: Priority;
  }

  const todayList = useMemo((): TodayItem[] => {
    const today = new Date();
    const items: TodayItem[] = [];
    const addedIds = new Set<string>();

    const addTask = (t: Task) => {
      if (addedIds.has(t.id)) return;
      items.push({
        id: t.id,
        title: t.title,
        type: t.isFrog ? 'frog' : 'task',
        isSubtask: false,
        completed: t.status === 'done',
        priority: t.priority,
      });
      addedIds.add(t.id);
    };

    const addSubtask = (parentTask: Task, stId: string) => {
      if (addedIds.has(stId)) return;
      const st = parentTask.subtasks?.find(s => s.id === stId);
      if (!st) return;
      items.push({
        id: st.id,
        title: `${st.title} — ${parentTask.title}`,
        type: parentTask.isFrog ? 'frog' : 'task',
        parentId: parentTask.id,
        isSubtask: true,
        completed: st.completed,
        priority: st.priority ?? parentTask.priority,
      });
      addedIds.add(stId);
    };

    // 1. Daily plan items (In the exact order the user planned)
    dailyPlanIds.forEach(id => {
      if (addedIds.has(id)) return;

      // Try resolving as task/habit
      const task = allTasks.find(t => t.id === id);
      if (task) {
        items.push({
          id: task.id,
          title: task.title,
          type: task.isFrog ? 'frog' : (task.isHabit ? 'habit' : 'task'),
          isSubtask: false,
          completed: task.isHabit
            ? (task.completionHistory?.some(d => isSameDay(parseISO(d), today)) ?? false)
            : task.status === 'done',
          priority: task.priority,
        });
        addedIds.add(id);
        return;
      }

      // Try resolving as subtask
      for (const t of allTasks) {
        const st = t.subtasks?.find(s => s.id === id);
        if (st) {
          items.push({
            id: st.id,
            title: `${st.title} — ${t.title}`,
            type: t.isFrog ? 'frog' : 'task',
            parentId: t.id,
            isSubtask: true,
            completed: st.completed,
            priority: st.priority ?? t.priority,
          });
          addedIds.add(id);
          return;
        }
      }

      // Try resolving as chore
      const chore = allChores.find(c => c.id === id);
      if (chore) {
        items.push({
          id: chore.id,
          title: chore.title,
          type: 'task', // treat as task for list rendering
          isSubtask: false,
          completed: !!(chore.lastCompleted && isSameDay(parseISO(chore.lastCompleted), today)),
          priority: chore.priority,
        });
        addedIds.add(id);
      }
    });

    // 2. Frogs that weren't in the plan (Auto-suggested)
    allTasks.filter(t => t.isFrog && !t.isHabit && t.status !== 'done' && !addedIds.has(t.id)).forEach(t => {
      items.push({
        id: t.id,
        title: t.title,
        type: 'frog',
        isSubtask: false,
        completed: false,
        priority: t.priority,
      });
      addedIds.add(t.id);
    });

    // 3. High priority chores not in plan
    allChores.filter(c => (c.priority === 'urgent' || c.priority === 'high') && !addedIds.has(c.id)).forEach(c => {
      const doneToday = !!(c.lastCompleted && isSameDay(parseISO(c.lastCompleted), today));
      if (!doneToday) {
        items.push({
          id: c.id,
          title: c.title,
          type: 'task',
          isSubtask: false,
          completed: false,
          priority: c.priority,
        });
        addedIds.add(c.id);
      }
    });

    // Completed items sink to bottom
    return [...items.filter(i => !i.completed), ...items.filter(i => i.completed)];
  }, [allTasks, allChores, dailyPlanIds]);

  const refreshScheduleData = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const [tasks, planIds, chores] = await Promise.all([
      getAllTasks(),
      getDailyPlan(todayStr).catch(() => []),
      getAllChores().catch(() => []),
    ]);
    setAllTasks(tasks);
    setDailyPlanIds(Array.isArray(planIds) ? planIds : []);
    setAllChores(Array.isArray(chores) ? chores : []);
  };

  const handleToggleChore = async (chore: Chore) => {
    const today = new Date();
    const isCompletedToday = chore.lastCompleted && isSameDay(parseISO(chore.lastCompleted), today);
    const completing = !isCompletedToday;
    const updated = { ...chore, lastCompleted: isCompletedToday ? undefined : today.toISOString() };
    setAllChores(prev => prev.map(c => c.id === chore.id ? updated : c));
    try {
      await updateChore(updated);

      if (completing && chore.title.toLowerCase().includes('wind down')) {
        const progress = await getUserProgress();
        if (progress) {
          import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
            const tempProgress = JSON.parse(JSON.stringify(progress));
            const updates = evaluateGamificationTriggers({ type: 'wind-down-completed' }, tempProgress);
            if (updates.length > 0) {
              await saveUserProgress(tempProgress);
              updates.forEach((u, idx) => {
                setTimeout(() => toast({ title: `🎁 ${u.message}`, description: u.detail }), idx * 1500);
              });
            }
          });
        }
      }
    } catch {
      setAllChores(prev => prev.map(c => c.id === chore.id ? chore : c));
    }
  };

  const todayChores = useMemo(() => allChores.filter(c => {
    if (c.frequency === 'daily') return true;
    if (c.frequency === 'weekly') {
      if (!c.lastCompleted) return true;
      const last = parseISO(c.lastCompleted);
      const diff = (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 7;
    }
    if (c.frequency === 'monthly') {
      if (!c.lastCompleted) return true;
      const last = parseISO(c.lastCompleted);
      const diff = (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 30;
    }
    return true;
  }), [allChores]);

  const choresDoneToday = useMemo(() =>
    todayChores.filter(c => c.lastCompleted && isSameDay(parseISO(c.lastCompleted), new Date())).length,
    [todayChores]
  );

  const handleToggleTodayItem = async (item: TodayItem) => {
    const today = new Date();
    const newCompleted = !item.completed;

    // Optimistic update
    if (item.type === 'habit') {
      setAllTasks(prev => prev.map(t => {
        if (t.id !== item.id) return t;
        const dayStr = startOfDay(today).toISOString();
        const history = [...(t.completionHistory || [])];
        if (newCompleted) {
          if (!history.some(d => isSameDay(parseISO(d), today))) history.push(dayStr);
        } else {
          history.splice(history.findIndex(d => isSameDay(parseISO(d), today)), 1);
        }
        return { ...t, completionHistory: history };
      }));
    } else if (item.isSubtask && item.parentId) {
      setAllTasks(prev => prev.map(t => {
        if (t.id !== item.parentId) return t;
        return {
          ...t, subtasks: t.subtasks.map(st => st.id === item.id ? {
            ...st,
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : undefined
          } : st)
        };
      }));
    } else {
      setAllTasks(prev => prev.map(t => t.id === item.id ? { ...t, status: newCompleted ? 'done' : 'in-progress' } : t));
    }

    // Persist
    try {
      if (item.type === 'habit') {
        const habit = allTasks.find(t => t.id === item.id);
        if (!habit) return;
        const dayStr = startOfDay(today).toISOString();
        const history = [...(habit.completionHistory || [])];
        if (newCompleted) {
          if (!history.some(d => isSameDay(parseISO(d), today))) history.push(dayStr);
        } else {
          history.splice(history.findIndex(d => isSameDay(parseISO(d), today)), 1);
        }
        await updateTask({ ...habit, completionHistory: history });
      } else if (item.isSubtask && item.parentId) {
        const parent = allTasks.find(t => t.id === item.parentId);
        if (!parent) return;
        const updatedSubtasks = parent.subtasks.map(st => st.id === item.id ? {
          ...st,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : undefined
        } : st);
        await updateTask({ ...parent, subtasks: updatedSubtasks });
      } else {
        const task = allTasks.find(t => t.id === item.id);
        if (!task) return;
        await updateTask({ ...task, status: newCompleted ? 'done' : 'in-progress' });
      }
    } catch {
      await refreshScheduleData();
    }
  };

  const handleDismissMorning = () => {
    sessionStorage.setItem('morning-launch-dismissed', 'true');
    setShowMorningLaunch(false);
  };

  if (showMorningLaunch && viewMode !== 'schedule') {
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
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm rotate-3 hover:rotate-0 transition-transform duration-500">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dash</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium pl-1.5">Focus on what matters. Ignore the rest.</p>
        </div>

        <div className="bg-muted p-1 rounded-xl flex items-center shadow-sm border border-border w-fit max-w-full overflow-x-auto no-scrollbar">
          <Button
            variant={viewMode === 'schedule' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('schedule')}
            className={cn(
              "h-9 px-2 sm:px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0",
              viewMode === 'schedule' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarCheck className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Schedule</span>
            <span className="sm:hidden ml-1">Schedule</span>
          </Button>
          <Button
            variant={viewMode === 'quick' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('quick')}
            className={cn(
              "h-9 px-2 sm:px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0",
              viewMode === 'quick' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Quick View</span>
            <span className="sm:hidden ml-1">Quick</span>
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('detailed')}
            className={cn(
              "h-9 px-2 sm:px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0",
              viewMode === 'detailed' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Deep Dive</span>
            <span className="sm:hidden ml-1">Dive</span>
          </Button>
        </div>
      </div>



      {viewMode === 'schedule' && (() => {
        const today = new Date();
        const habits = allTasks.filter(t => t.isHabit);
        const habitsDone = habits.filter(h => h.completionHistory?.some(d => isSameDay(parseISO(d), today))).length;
        const currentEnergy = getTodayEnergy();

        // Eisenhower quadrant helper
        const getQuadrant = (priority: Priority) => {
          if (priority === 'urgent') return 'q1';
          if (priority === 'high') return 'q2';
          if (priority === 'medium') return 'q3';
          return 'q4';
        };

        const incompleteTasks = todayList.filter(i => !i.completed && i.type !== 'habit' && !dailyPlanIds.includes(i.id));
        const completedTasks = todayList.filter(i => i.completed && i.type !== 'habit' && !dailyPlanIds.includes(i.id));

        const TaskItem = ({ item }: { item: typeof todayList[0] }) => (
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
              item.completed ? "opacity-40" : "hover:bg-muted/50"
            )}
            onClick={() => handleToggleTodayItem(item)}
          >
            <Checkbox checked={item.completed} onCheckedChange={() => { }} className="shrink-0" />
            <span className={cn("flex-1 text-sm font-medium leading-snug truncate", item.completed && "line-through")}>
              {item.title}
            </span>
            {item.type === 'frog' && <span className="text-sm leading-none shrink-0">🐸</span>}
          </div>
        );

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-5">
            {/* Phase 5.1: The Zen Garden (Digital Bonsai) - Hidden for now */}
            {SHOW_ZEN_GARDEN && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2 mt-4">
                <div className="lg:col-span-2 order-1 lg:order-2">
                  {showMorningLaunch && <MorningLaunch allTasks={allTasks} onDismiss={handleDismissMorning} />}
                </div>
                <div className="lg:col-span-1 order-2 lg:order-1">
                  <BonsaiTree />
                </div>
              </div>
            )}

            {!SHOW_ZEN_GARDEN && showMorningLaunch && (
              <div className="max-w-3xl mx-auto w-full mt-4">
                <MorningLaunch allTasks={allTasks} allChores={allChores} onDismiss={handleDismissMorning} />
              </div>
            )}

            {/* Daily Progress Meter */}
            {(() => {
              const meterTotal = todayList.length + todayChores.length;
              const meterDone = todayList.filter(i => i.completed).length + choresDoneToday;
              return <DailyProgressMeter totalItems={meterTotal} completedItems={meterDone} />;
            })()}

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-muted-foreground pl-1">
              <span className="whitespace-nowrap"><span className="text-emerald-500 font-semibold">{stats.frogsRemaining}</span> frogs</span>
              <span className="opacity-30">·</span>
              <span className="whitespace-nowrap"><span className="text-red-400 font-semibold">{stats.criticalTasks}</span> urgent</span>
              <span className="opacity-30">·</span>
              <span className="whitespace-nowrap"><span className="text-green-400 font-semibold">{habitsDone}/{habits.length}</span> habits</span>
              <span className="opacity-30">·</span>
              <span className="whitespace-nowrap"><span className="text-blue-400 font-semibold">{choresDoneToday}/{todayChores.length}</span> chores</span>
              <span className="opacity-30">·</span>
              <span className="whitespace-nowrap">{format(today, 'EEE, MMM d')}</span>
            </div>

            {/* Today's To-Do List Dropdown (Master Plan) */}
            <div className={cn(
              "border rounded-xl overflow-hidden transition-all",
              dailyPlanIds.length > 0 ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 border-border border-dashed"
            )}>
              <button
                onClick={() => setPlanOpen(o => !o)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 transition-colors text-sm font-bold",
                  dailyPlanIds.length > 0 ? "bg-primary/10 hover:bg-primary/20 text-primary" : "hover:bg-muted/20 text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  Today's To-Do List
                  {dailyPlanIds.length > 0 && (
                    <span className="text-xs font-normal opacity-70">
                      {todayList.filter(i => i.completed && dailyPlanIds.includes(i.id)).length}/{dailyPlanIds.length} done
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {dailyPlanIds.length === 0 && <span className="text-[10px] font-normal uppercase tracking-wider bg-muted-foreground/10 px-1.5 py-0.5 rounded">Empty</span>}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", planOpen && "rotate-180")} />
                </div>
              </button>
              {planOpen && (
                <div className="px-2 py-2 space-y-0.5 bg-background/40">
                  {dailyPlanIds.length > 0 ? (
                    todayList
                      .filter(item => dailyPlanIds.includes(item.id))
                      .sort((a, b) => dailyPlanIds.indexOf(a.id) - dailyPlanIds.indexOf(b.id))
                      .map(item => <TaskItem key={item.id} item={item} />)
                  ) : (
                    <div className="py-6 px-4 text-center">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">Your plan is empty for today.</p>
                      <Button variant="outline" size="sm" asChild className="h-8 text-[10px] font-bold uppercase tracking-widest">
                        <a href="/plan">Set up your day →</a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Habits accordion */}
            {habits.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setHabitsOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-green-400" />
                    Habits
                    <span className="text-xs text-muted-foreground font-normal">{habitsDone}/{habits.length} done</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", habitsOpen && "rotate-180")} />
                </button>
                {habitsOpen && (
                  <div className="px-2 py-2 space-y-0.5">
                    {habits.map(habit => {
                      const doneToday = habit.completionHistory?.some(d => isSameDay(parseISO(d), today)) ?? false;
                      return (
                        <div
                          key={habit.id}
                          className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer", doneToday ? "opacity-40" : "hover:bg-muted/50")}
                          onClick={() => handleToggleTodayItem({ id: habit.id, title: habit.title, type: 'habit', isSubtask: false, completed: doneToday, priority: habit.priority })}
                        >
                          <Checkbox
                            checked={doneToday}
                            onCheckedChange={() => { }}
                            className="shrink-0"
                          />
                          <span className={cn("flex-1 text-sm truncate", doneToday && "line-through")}>{habit.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Chores accordion */}
            {todayChores.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setChoresOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    Chores
                    <span className="text-xs text-muted-foreground font-normal">{choresDoneToday}/{todayChores.length} done</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", choresOpen && "rotate-180")} />
                </button>
                {choresOpen && (
                  <div className="px-2 py-2 space-y-0.5">
                    {todayChores.map(chore => {
                      const doneToday = chore.lastCompleted ? isSameDay(parseISO(chore.lastCompleted), today) : false;
                      return (
                        <div
                          key={chore.id}
                          className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer", doneToday ? "opacity-40" : "hover:bg-muted/50")}
                          onClick={() => handleToggleChore(chore)}
                        >
                          <Checkbox checked={doneToday} onCheckedChange={() => { }} className="shrink-0" />
                          <span className={cn("flex-1 text-sm truncate", doneToday && "line-through")}>{chore.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 w-fit">
              {(['list', 'eisenhower', 'energy'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setScheduleView(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all",
                    scheduleView === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === 'eisenhower' ? 'Matrix' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Task views */}
            {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
                <p className="text-muted-foreground font-medium">Nothing planned yet.</p>
                <a href="/plan" className="text-xs text-primary underline underline-offset-2">Go to Plan to set up your day →</a>
              </div>
            ) : scheduleView === 'list' ? (
              <div className="space-y-0.5 max-w-2xl">
                {incompleteTasks.map(item => <TaskItem key={item.id} item={item} />)}
                {completedTasks.length > 0 && incompleteTasks.length > 0 && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Done</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {completedTasks.map(item => <TaskItem key={item.id} item={item} />)}
              </div>
            ) : scheduleView === 'eisenhower' ? (
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {([
                  { key: 'q1', label: 'Do First', sub: 'Urgent · Important', color: 'border-red-500/40 bg-red-500/5' },
                  { key: 'q2', label: 'Schedule', sub: 'Not Urgent · Important', color: 'border-blue-500/40 bg-blue-500/5' },
                  { key: 'q3', label: 'Delegate', sub: 'Urgent · Less Important', color: 'border-yellow-500/40 bg-yellow-500/5' },
                  { key: 'q4', label: 'Eliminate', sub: 'Not Urgent · Less Important', color: 'border-muted bg-muted/10' },
                ] as const).map(({ key, label, sub, color }) => {
                  const items = [...incompleteTasks, ...completedTasks].filter(i => getQuadrant(i.priority) === key);
                  return (
                    <div key={key} className={cn("rounded-xl border p-3 space-y-1.5 min-h-[120px]", color)}>
                      <div className="mb-2">
                        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{sub}</p>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/40 italic">Empty</p>
                      ) : items.map(item => <TaskItem key={item.id} item={item} />)}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Energy view
              <div className="space-y-4 max-w-2xl">
                {(['high', 'medium', 'low'] as EnergyLevel[]).map(level => {
                  const levelItems = [...incompleteTasks, ...completedTasks].filter(i => {
                    const task = allTasks.find(t => t.id === i.id);
                    return (task?.energyLevel ?? 'medium') === level;
                  });
                  if (levelItems.length === 0) return null;
                  const icon = level === 'high' ? <BatteryFull className="h-3.5 w-3.5 text-green-400" /> : level === 'medium' ? <BatteryMedium className="h-3.5 w-3.5 text-yellow-400" /> : <BatteryLow className="h-3.5 w-3.5 text-red-400" />;
                  const isCurrent = currentEnergy === level;
                  return (
                    <div key={level} className={cn("rounded-xl border p-3 space-y-1", isCurrent ? "border-primary/40 bg-primary/5" : "border-border")}>
                      <div className="flex items-center gap-2 mb-2">
                        {icon}
                        <span className="text-xs font-semibold capitalize">{level} Energy</span>
                        {isCurrent && <span className="text-[10px] text-primary font-semibold ml-1">← You're here</span>}
                      </div>
                      {levelItems.map(item => <TaskItem key={item.id} item={item} />)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {viewMode === 'quick' && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mb-10">
            <SummaryCard
              icon={Zap}
              title="Frogs"
              value={stats.frogsRemaining}
              subtitle={`${stats.frogsDoneToday}/${stats.frogsTotal} Eaten`}
              color="text-emerald-500"
            >
              <div className="space-y-2">
                {allTasks.filter(t => t.isFrog && t.status !== 'done').slice(0, 3).map(t => (
                  <div key={t.id} className="text-[10px] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate opacity-80">{t.title}</span>
                  </div>
                ))}
                {stats.frogsRemaining === 0 && <p className="text-[10px] text-emerald-500 font-bold">All frogs eaten! 🐸🏆</p>}
              </div>
            </SummaryCard>
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
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* The Overview metrics remain visible at the top */}
          <DashboardOverview allTasks={allTasks} />

          <div className="max-w-[800px]">
            <DashboardUpcomingDeadlines allTasks={allTasks} />
          </div>

          {!isZenMode && (
            <Tabs defaultValue="overview" className="w-full space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:w-[600px] bg-muted/30 p-1">
                <TabsTrigger value="overview" className="py-2">Performance</TabsTrigger>
                <TabsTrigger value="deep-work" className="py-2">Deep Work</TabsTrigger>
                <TabsTrigger value="strategic" className="py-2">Strategic</TabsTrigger>
                <TabsTrigger value="velocity" className="py-2">Velocity</TabsTrigger>
                <TabsTrigger value="settings" className="py-2">Settings</TabsTrigger>
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
                    <DashboardWeeklyReport allTasks={allTasks} focusSessions={focusSessions} />
                    <DashboardDailyWins />
                    <DashboardPointOfNoReturn allTasks={allTasks} />
                    <DashboardOverdueRisk allTasks={allTasks} />
                    <DashboardAlmostDone allTasks={allTasks} />
                    <DashboardPushAnalytics allTasks={allTasks} />
                    <DashboardApproachScore allTasks={allTasks} focusSessions={focusSessions} />
                    <DashboardFrogCompletion allTasks={allTasks} />
                    <DashboardBlockerInsights allTasks={allTasks} />
                    <DashboardTShirtAccuracy allTasks={allTasks} />
                    <DashboardPushFunnel allTasks={allTasks} />
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <DashboardPeakHours focusSessions={focusSessions} />
                  <DashboardEnergyMatrix focusSessions={focusSessions} />
                  <DashboardWorryTracker focusSessions={focusSessions} allTasks={allTasks} />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <DashboardEmotionProductivity focusSessions={focusSessions} />
                  <DashboardTimeLimitAdherence allTasks={allTasks} focusSessions={focusSessions} />
                </div>
              </TabsContent>

              <TabsContent value="strategic" className="space-y-6 animate-fade-in">
                <div className="grid gap-6 lg:grid-cols-7">
                  <div className="col-span-full xl:col-span-4 space-y-6">
                    <DashboardGoalVelocity />
                    <DashboardPillarBalance allTasks={allTasks} focusSessions={focusSessions} />
                  </div>
                  <div className="col-span-full xl:col-span-3 space-y-6">
                    <DashboardGoals />
                    <DashboardGoalCoverage allTasks={allTasks} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="velocity" className="space-y-6 animate-fade-in">
                <div className="grid gap-6 md:grid-cols-2">
                  <DashboardTaskVelocity allTasks={allTasks} />
                  <DashboardTagHeatmap allTasks={allTasks} />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <DashboardHabitResilience allTasks={allTasks} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 animate-fade-in">
                <div className="max-w-md mx-auto">
                  <NotificationSettings />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
      <InventoryDock />
    </div>
  );
}
