import { Task, FocusSession } from './types';
import { isSameDay, parseISO, startOfToday, isToday } from 'date-fns';
import { calculateStreak } from './habits';

// === XP RULES ===

const XP_VALUES = {
  taskComplete: { S: 5, M: 10, L: 20, XL: 40, default: 10 },
  habitComplete: 5,
  frogEaten: 25,         // Bonus for completing a frog
  focusPerMinute: 1,
  subtaskComplete: 2,
} as const;

export function calculateTaskXP(task: Task): number {
  const sizeXP = XP_VALUES.taskComplete[task.tShirtSize as keyof typeof XP_VALUES.taskComplete] || XP_VALUES.taskComplete.default;
  const frogBonus = task.isFrog || (task.pushCount && task.pushCount >= 3) ? XP_VALUES.frogEaten : 0;
  return sizeXP + frogBonus;
}

export function calculateTotalXP(allTasks: Task[], focusSessions: FocusSession[]): number {
  let xp = 0;

  for (const task of allTasks) {
    if (task.isHabit) {
      // XP per completion day
      xp += (task.completionHistory?.length || 0) * XP_VALUES.habitComplete;
    } else if (task.status === 'done') {
      xp += calculateTaskXP(task);
      // Subtask XP
      xp += (task.subtasks?.filter(s => s.completed).length || 0) * XP_VALUES.subtaskComplete;
    }
  }

  // Focus session XP
  for (const session of focusSessions) {
    if (session.status === 'completed' || session.endTime) {
      xp += Math.floor(session.duration) * XP_VALUES.focusPerMinute;
    }
  }

  return xp;
}

export function calculateTodayXP(allTasks: Task[], focusSessions: FocusSession[]): number {
  const today = startOfToday();
  let xp = 0;

  for (const task of allTasks) {
    if (task.isHabit) {
      const completedToday = task.completionHistory?.some(d => isSameDay(parseISO(d), today));
      if (completedToday) xp += XP_VALUES.habitComplete;
    } else if (task.status === 'done') {
      // Approximate: count tasks completed "today" — no completedAt field, so check subtasks
      // We'll count all done tasks for total XP but today's XP is harder without timestamps
      // For now, check if endDate or doDate is today and status is done
      const isToday = (task.doDate && isSameDay(parseISO(task.doDate), today)) ||
                      (task.endDate && isSameDay(parseISO(task.endDate), today));
      if (isToday) {
        xp += calculateTaskXP(task);
      }
    }
  }

  for (const session of focusSessions) {
    if (isSameDay(parseISO(session.startTime), today)) {
      xp += Math.floor(session.duration) * XP_VALUES.focusPerMinute;
    }
  }

  return xp;
}

// === XP LEVEL SYSTEM ===

export function getLevel(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  // Each level requires progressively more XP: level N needs N * 100 XP
  let level = 1;
  let remaining = xp;

  while (remaining >= level * 100) {
    remaining -= level * 100;
    level++;
  }

  const nextLevelXP = level * 100;
  return {
    level,
    currentXP: remaining,
    nextLevelXP,
    progress: Math.round((remaining / nextLevelXP) * 100),
  };
}

// === BADGE DEFINITIONS ===

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  tiers: { tier: BadgeTier; threshold: number; label: string }[];
  check: (tasks: Task[], sessions: FocusSession[]) => number; // returns progress count
}

export interface EarnedBadge {
  id: string;
  tier: BadgeTier;
  progress: number;
  nextTier?: { tier: BadgeTier; threshold: number } | null;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-focus',
    name: 'First Focus',
    description: 'Complete focus sessions',
    icon: '🎯',
    tiers: [
      { tier: 'bronze', threshold: 1, label: 'Complete your first focus session' },
      { tier: 'silver', threshold: 10, label: 'Complete 10 focus sessions' },
      { tier: 'gold', threshold: 50, label: 'Complete 50 focus sessions' },
    ],
    check: (_, sessions) => sessions.filter(s => s.status === 'completed' || s.endTime).length,
  },
  {
    id: 'frog-eater',
    name: 'Frog Eater',
    description: 'Complete high-resistance tasks',
    icon: '🐸',
    tiers: [
      { tier: 'bronze', threshold: 1, label: 'Eat your first frog' },
      { tier: 'silver', threshold: 5, label: 'Eat 5 frogs' },
      { tier: 'gold', threshold: 25, label: 'Eat 25 frogs' },
    ],
    check: (tasks) => tasks.filter(t =>
      t.status === 'done' && !t.isHabit && (
        t.isFrog || (t.pushCount && t.pushCount >= 3) ||
        (t.priority === 'urgent' && t.energyLevel === 'high')
      )
    ).length,
  },
  {
    id: 'consistency-machine',
    name: 'Consistency Machine',
    description: 'Build long habit streaks',
    icon: '🔥',
    tiers: [
      { tier: 'bronze', threshold: 7, label: 'Any habit at 7-day streak' },
      { tier: 'silver', threshold: 21, label: 'Any habit at 21-day streak' },
      { tier: 'gold', threshold: 60, label: 'Any habit at 60-day streak' },
    ],
    check: (tasks) => {
      const habits = tasks.filter(t => t.isHabit);
      return Math.max(0, ...habits.map(h => calculateStreak(h)));
    },
  },
  {
    id: 'task-crusher',
    name: 'Task Crusher',
    description: 'Complete tasks',
    icon: '⚡',
    tiers: [
      { tier: 'bronze', threshold: 10, label: 'Complete 10 tasks' },
      { tier: 'silver', threshold: 50, label: 'Complete 50 tasks' },
      { tier: 'gold', threshold: 200, label: 'Complete 200 tasks' },
    ],
    check: (tasks) => tasks.filter(t => t.status === 'done' && !t.isHabit).length,
  },
  {
    id: 'deep-worker',
    name: 'Deep Worker',
    description: 'Accumulate focus hours',
    icon: '🧠',
    tiers: [
      { tier: 'bronze', threshold: 10, label: 'Focus for 10 hours total' },
      { tier: 'silver', threshold: 50, label: 'Focus for 50 hours total' },
      { tier: 'gold', threshold: 200, label: 'Focus for 200 hours total' },
    ],
    check: (_, sessions) => {
      const totalMinutes = sessions
        .filter(s => s.status === 'completed' || s.endTime)
        .reduce((sum, s) => sum + s.duration, 0);
      return Math.floor(totalMinutes / 60);
    },
  },
  {
    id: 'fear-crusher',
    name: 'Fear Crusher',
    description: 'Complete tasks you kept pushing as "too scary"',
    icon: '🛡️',
    tiers: [
      { tier: 'bronze', threshold: 1, label: 'Complete 1 "too scary" task' },
      { tier: 'silver', threshold: 5, label: 'Complete 5 "too scary" tasks' },
      { tier: 'gold', threshold: 20, label: 'Complete 20 "too scary" tasks' },
    ],
    check: (tasks) => tasks.filter(t =>
      t.status === 'done' && !t.isHabit &&
      t.pushHistory?.some(h => h.reason === 'too-scary')
    ).length,
  },
  {
    id: 'habit-collector',
    name: 'Habit Collector',
    description: 'Maintain active habits',
    icon: '🌱',
    tiers: [
      { tier: 'bronze', threshold: 3, label: 'Have 3 active habits' },
      { tier: 'silver', threshold: 7, label: 'Have 7 active habits' },
      { tier: 'gold', threshold: 15, label: 'Have 15 active habits' },
    ],
    check: (tasks) => tasks.filter(t => t.isHabit && t.status !== 'abandoned').length,
  },
  {
    id: 'zero-distraction',
    name: 'Laser Focus',
    description: 'Complete focus sessions with zero distractions',
    icon: '💎',
    tiers: [
      { tier: 'bronze', threshold: 1, label: '1 distraction-free session' },
      { tier: 'silver', threshold: 10, label: '10 distraction-free sessions' },
      { tier: 'gold', threshold: 50, label: '50 distraction-free sessions' },
    ],
    check: (_, sessions) => sessions.filter(s =>
      (s.status === 'completed' || s.endTime) &&
      s.distractions.length === 0 &&
      s.duration >= 25
    ).length,
  },
];

export function checkBadges(tasks: Task[], sessions: FocusSession[]): EarnedBadge[] {
  const earned: EarnedBadge[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    const progress = badge.check(tasks, sessions);

    // Find highest earned tier
    let highestTier: BadgeTier | null = null;
    let nextTier: { tier: BadgeTier; threshold: number } | null = null;

    for (let i = badge.tiers.length - 1; i >= 0; i--) {
      if (progress >= badge.tiers[i].threshold) {
        highestTier = badge.tiers[i].tier;
        nextTier = badge.tiers[i + 1] || null;
        break;
      }
    }

    if (!highestTier && progress > 0) {
      nextTier = badge.tiers[0];
    }

    earned.push({
      id: badge.id,
      tier: highestTier || 'bronze',
      progress,
      nextTier: highestTier ? nextTier : badge.tiers[0],
    });
  }

  return earned;
}

// === DAILY WINS ===

export interface DailyWins {
  tasksCompleted: number;
  habitsCompleted: number;
  frogsEaten: number;
  focusMinutes: number;
  streaksMaintained: number;
  xpEarned: number;
  subtasksCompleted: number;
}

export function calculateDailyWins(allTasks: Task[], focusSessions: FocusSession[]): DailyWins {
  const today = startOfToday();

  const tasksCompletedToday = allTasks.filter(t =>
    !t.isHabit && t.status === 'done' &&
    ((t.doDate && isSameDay(parseISO(t.doDate), today)) ||
     (t.endDate && isSameDay(parseISO(t.endDate), today)))
  );

  const habitsCompletedToday = allTasks.filter(t =>
    t.isHabit && t.completionHistory?.some(d => isSameDay(parseISO(d), today))
  );

  const frogsEaten = tasksCompletedToday.filter(t =>
    t.isFrog || (t.pushCount && t.pushCount >= 3) ||
    (t.priority === 'urgent' && t.energyLevel === 'high')
  ).length;

  const todaySessions = focusSessions.filter(s => isSameDay(parseISO(s.startTime), today));
  const focusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  const streaksMaintained = allTasks.filter(t =>
    t.isHabit && calculateStreak(t) > 0 &&
    t.completionHistory?.some(d => isSameDay(parseISO(d), today))
  ).length;

  let subtasksCompleted = 0;
  allTasks.forEach(t => {
    if (!t.isHabit) {
      t.subtasks?.forEach(sub => {
        if (sub.completed && sub.doDate && isSameDay(parseISO(sub.doDate), today)) {
          subtasksCompleted++;
        }
      });
    }
  });

  return {
    tasksCompleted: tasksCompletedToday.length,
    habitsCompleted: habitsCompletedToday.length,
    frogsEaten,
    focusMinutes,
    streaksMaintained,
    xpEarned: calculateTodayXP(allTasks, focusSessions),
    subtasksCompleted,
  };
}

// === CELEBRATION TRIGGERS ===

export type CelebrationReason =
  | 'task-complete'
  | 'habit-complete'
  | 'frog-eaten'
  | 'streak-milestone'
  | 'all-daily-done'
  | 'badge-unlocked'
  | 'focus-complete';

export interface CelebrationEvent {
  reason: CelebrationReason;
  title: string;
  description?: string;
  intensity: 'small' | 'medium' | 'big';
}
