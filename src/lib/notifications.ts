/**
 * Notification Scheduler for Capacitor Local Notifications
 * 
 * Schedules native Android notifications on app load:
 * - Deadline reminders (tasks due today/tomorrow)
 * - Overdue alerts (tasks past their deadline) 
 * - Habit nudges (incomplete habits at configured time)
 * 
 * Falls back gracefully on web (no-op).
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Task } from './types';
import { parseISO, isToday, isTomorrow, isPast, startOfDay, set } from 'date-fns';

// Notification ID ranges to avoid collisions
const ID_DEADLINE_TODAY = 1000;
const ID_DEADLINE_TOMORROW = 2000;
const ID_OVERDUE = 3000;
const ID_HABIT = 4000;

export interface NotificationPreferences {
  enabled: boolean;
  deadlineReminders: boolean;
  overdueAlerts: boolean;
  habitNudges: boolean;
  habitNudgeHour: number; // 0-23, default 19 (7pm)
  morningBriefingHour: number; // 0-23, default 8 (8am)
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  deadlineReminders: true,
  overdueAlerts: true,
  habitNudges: true,
  habitNudgeHour: 19,
  morningBriefingHour: 8,
};

const PREFS_KEY = 'dash_notification_prefs';

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFERENCES;
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Check if we're running inside a Capacitor native app
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Request notification permissions (native)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (e) {
    console.error('[notifications] Failed to request permission:', e);
    return false;
  }
}

/**
 * Check current permission status
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Cancel all previously scheduled notifications 
 * Called before rescheduling to avoid duplicates
 */
async function cancelAllScheduled(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id })),
      });
    }
  } catch (e) {
    console.error('[notifications] Failed to cancel pending:', e);
  }
}

/**
 * Main scheduling function — call this on app load
 * Calculates all notifications for today and schedules them natively
 */
export async function scheduleNotifications(allTasks: Task[]): Promise<number> {
  if (!isNativeApp()) return 0;
  
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return 0;
  
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return 0;

  // Clear all existing scheduled notifications to avoid duplicates
  await cancelAllScheduled();

  const notifications: ScheduleOptions['notifications'] = [];
  const now = new Date();
  const today = startOfDay(now);

  // --- Deadline Reminders ---
  if (prefs.deadlineReminders) {
    const tasksWithDeadlines = allTasks.filter(t =>
      (t.category !== "habit") && t.status !== 'done' && t.status !== 'abandoned' && (t.doDate || t.endDate)
    );

    tasksWithDeadlines.forEach((task, i) => {
      const deadline = task.doDate || task.endDate;
      if (!deadline) return;

      try {
        const deadlineDate = parseISO(deadline);

        // Due today — schedule morning briefing
        if (isToday(deadlineDate)) {
          const morningTime = set(today, { hours: prefs.morningBriefingHour, minutes: 0 });
          if (morningTime > now) {
            notifications.push({
              id: ID_DEADLINE_TODAY + i,
              title: '📅 Due Today',
              body: task.title,
              schedule: { at: morningTime },
              sound: 'default',
              smallIcon: 'ic_stat_icon',
            });
          }
        }

        // Due tomorrow — schedule evening heads-up
        if (isTomorrow(deadlineDate)) {
          const eveningTime = set(today, { hours: 20, minutes: 0 });
          if (eveningTime > now) {
            notifications.push({
              id: ID_DEADLINE_TOMORROW + i,
              title: '⏰ Due Tomorrow',
              body: task.title,
              schedule: { at: eveningTime },
              sound: 'default',
              smallIcon: 'ic_stat_icon',
            });
          }
        }
      } catch {}
    });
  }

  // --- Overdue Alerts ---
  if (prefs.overdueAlerts) {
    const overdueTasks = allTasks.filter(t => {
      if ((t.category === "habit") || t.status === 'done' || t.status === 'abandoned') return false;
      const deadline = t.doDate || t.endDate;
      if (!deadline) return false;
      try {
        return isPast(parseISO(deadline)) && !isToday(parseISO(deadline));
      } catch { return false; }
    });

    if (overdueTasks.length > 0) {
      const morningTime = set(today, { hours: prefs.morningBriefingHour, minutes: 30 });
      if (morningTime > now) {
        const taskList = overdueTasks.slice(0, 3).map(t => t.title).join(', ');
        const extra = overdueTasks.length > 3 ? ` +${overdueTasks.length - 3} more` : '';
        notifications.push({
          id: ID_OVERDUE,
          title: `⚠️ ${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
          body: taskList + extra,
          schedule: { at: morningTime },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
        });
      }
    }
  }

  // --- Habit Nudges ---
  if (prefs.habitNudges) {
    const habits = allTasks.filter(t => (t.category === "habit") && t.status !== 'abandoned');
    const incompleteHabits = habits.filter(t => {
      const todayStr = today.toISOString().split('T')[0];
      return !(t.completionHistory || []).some(d => d.startsWith(todayStr));
    });

    if (incompleteHabits.length > 0) {
      const nudgeTime = set(today, { hours: prefs.habitNudgeHour, minutes: 0 });
      if (nudgeTime > now) {
        const habitList = incompleteHabits.slice(0, 3).map(t => t.title).join(', ');
        const extra = incompleteHabits.length > 3 ? ` +${incompleteHabits.length - 3} more` : '';
        notifications.push({
          id: ID_HABIT,
          title: `🔥 ${incompleteHabits.length} Habit${incompleteHabits.length > 1 ? 's' : ''} Left Today`,
          body: habitList + extra,
          schedule: { at: nudgeTime },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
        });
      }
    }
  }

  // Schedule all
  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
      console.log(`[notifications] Scheduled ${notifications.length} notifications`);
    } catch (e) {
      console.error('[notifications] Failed to schedule:', e);
      return 0;
    }
  }

  return notifications.length;
}
