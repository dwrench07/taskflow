import { Task, FocusSession, UserProgress, GameAction } from './types';
import { isSameDay, parseISO, startOfToday, differenceInMinutes, getHours, differenceInDays, startOfDay } from 'date-fns';
import { calculateStreak } from './habits';

// === XP RULES ===

const XP_VALUES = {
  taskComplete: { S: 5, M: 10, L: 20, XL: 40, default: 10 },
  habitComplete: 5,
  frogEaten: 25,
  focusPerMinute: 1,
} as const;

const isHabit = (t: Task) => t.category === 'habit';
const isOneTime = (t: Task) => t.recurrence === 'once';

export function calculateTaskXP(task: Task): number {
  const sizeXP = XP_VALUES.taskComplete[task.tShirtSize as keyof typeof XP_VALUES.taskComplete] || XP_VALUES.taskComplete.default;
  const frogBonus = task.isFrog || (task.pushCount && task.pushCount >= 3) ? XP_VALUES.frogEaten : 0;
  return sizeXP + frogBonus;
}

export function calculateTotalXP(allTasks: Task[], focusSessions: FocusSession[]): number {
  let xp = 0;

  for (const task of allTasks) {
    if (isHabit(task)) {
      xp += (task.completionHistory?.length || 0) * XP_VALUES.habitComplete;
    } else if (task.status === 'done') {
      xp += calculateTaskXP(task);
    }
  }

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
    if (isHabit(task)) {
      const completedToday = task.completionHistory?.some(d => isSameDay(parseISO(d), today));
      if (completedToday) xp += XP_VALUES.habitComplete;
    } else if (task.status === 'done') {
      const isToday = (task.doDate && isSameDay(parseISO(task.doDate), today)) ||
                      (task.completedAt && isSameDay(parseISO(task.completedAt), today)) ||
                      (task.endDate && isSameDay(parseISO(task.endDate), today));
      if (isToday) xp += calculateTaskXP(task);
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
  icon: string;
  tiers: { tier: BadgeTier; threshold: number; label: string }[];
  check: (tasks: Task[], sessions: FocusSession[]) => number;
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
      t.status === 'done' && !isHabit(t) && (
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
      const habits = tasks.filter(isHabit);
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
    check: (tasks) => tasks.filter(t => t.status === 'done' && !isHabit(t)).length,
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
      t.status === 'done' && !isHabit(t) &&
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
    check: (tasks) => tasks.filter(t => isHabit(t) && t.status !== 'abandoned').length,
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
  /** @deprecated Atomic Tasks no longer have child subtasks — kept as 0 for legacy UI. */
  subtasksCompleted: number;
}

export function calculateDailyWins(allTasks: Task[], focusSessions: FocusSession[]): DailyWins {
  const today = startOfToday();

  const tasksCompletedToday = allTasks.filter(t =>
    isOneTime(t) && t.status === 'done' &&
    ((t.completedAt && isSameDay(parseISO(t.completedAt), today)) ||
     (t.doDate && isSameDay(parseISO(t.doDate), today)) ||
     (t.endDate && isSameDay(parseISO(t.endDate), today)))
  );

  const habitsCompletedToday = allTasks.filter(t =>
    isHabit(t) && t.completionHistory?.some(d => isSameDay(parseISO(d), today))
  );

  const frogsEaten = tasksCompletedToday.filter(t =>
    t.isFrog || (t.pushCount && t.pushCount >= 3) ||
    (t.priority === 'urgent' && t.energyLevel === 'high')
  ).length;

  const todaySessions = focusSessions.filter(s => isSameDay(parseISO(s.startTime), today));
  const focusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  const streaksMaintained = allTasks.filter(t =>
    isHabit(t) && calculateStreak(t) > 0 &&
    t.completionHistory?.some(d => isSameDay(parseISO(d), today))
  ).length;

  return {
    tasksCompleted: tasksCompletedToday.length,
    habitsCompleted: habitsCompletedToday.length,
    frogsEaten,
    focusMinutes,
    streaksMaintained,
    xpEarned: calculateTodayXP(allTasks, focusSessions),
    subtasksCompleted: 0,
  };
}

// === PERSONAL BESTS ===

export interface PersonalBests {
  maxTasksInDay: number;
  maxFocusMinutes: number;
  maxFrogsInDay: number;
  longestStreak: number;
  maxHabitsInDay: number;
}

const DEFAULT_BESTS: PersonalBests = { maxTasksInDay: 0, maxFocusMinutes: 0, maxFrogsInDay: 0, longestStreak: 0, maxHabitsInDay: 0 };

export function updatePersonalBests(
  current: PersonalBests | undefined,
  dailyWins: DailyWins,
  longestCurrentStreak: number
): { bests: PersonalBests; newRecords: string[] } {
  const prev = current || DEFAULT_BESTS;
  const bests = { ...prev };
  const newRecords: string[] = [];

  if (dailyWins.tasksCompleted > prev.maxTasksInDay) { bests.maxTasksInDay = dailyWins.tasksCompleted; newRecords.push('maxTasksInDay'); }
  if (dailyWins.focusMinutes > prev.maxFocusMinutes) { bests.maxFocusMinutes = dailyWins.focusMinutes; newRecords.push('maxFocusMinutes'); }
  if (dailyWins.frogsEaten > prev.maxFrogsInDay) { bests.maxFrogsInDay = dailyWins.frogsEaten; newRecords.push('maxFrogsInDay'); }
  if (longestCurrentStreak > prev.longestStreak) { bests.longestStreak = longestCurrentStreak; newRecords.push('longestStreak'); }
  if (dailyWins.habitsCompleted > prev.maxHabitsInDay) { bests.maxHabitsInDay = dailyWins.habitsCompleted; newRecords.push('maxHabitsInDay'); }

  return { bests, newRecords };
}

// === CELEBRATION TRIGGERS ===

export type CelebrationReason =
  | 'task-complete'
  | 'habit-complete'
  | 'frog-eaten'
  | 'streak-milestone'
  | 'all-daily-done'
  | 'badge-unlocked'
  | 'focus-complete'
  | 'goal-complete';

export interface CelebrationEvent {
  reason: CelebrationReason;
  title: string;
  description?: string;
  intensity: 'small' | 'medium' | 'big';
}

// === PHASE 5: SCALING & MAINTENANCE MECHANICS ===

export function getCampfireStatus(progress: UserProgress): 'burning' | 'frozen' {
  if (!progress.lastActiveDate) return 'burning';
  const diffDays = differenceInDays(startOfDay(new Date()), startOfDay(new Date(progress.lastActiveDate)));
  return diffDays >= 3 ? 'frozen' : 'burning';
}

export function checkAndExecuteSeasonReset(progress: UserProgress, badges: EarnedBadge[]): boolean {
  if (!progress.seasonStartDate) {
    progress.seasonStartDate = new Date().toISOString();
    return false;
  }
  const diffDays = differenceInDays(new Date(), new Date(progress.seasonStartDate));
  if (diffDays >= 30) {
    const newLegacy = badges.map(b => {
      const def = BADGE_DEFINITIONS.find(d => d.id === b.id);
      if (!def) return null;
      let highestTier = null;
      for (const t of def.tiers) {
        if (b.progress >= t.threshold) highestTier = t.tier;
      }
      return highestTier ? `${b.id}-${highestTier}-season-${new Date(progress.seasonStartDate!).getFullYear()}` : null;
    }).filter(Boolean) as string[];
    progress.legacyBadges = [...(progress.legacyBadges || []), ...newLegacy];
    progress.xp = 0;
    progress.level = 1;
    progress.seasonStartDate = new Date().toISOString();
    return true;
  }
  return false;
}

// === PHASE 5.1: THE DIGITAL BONSAI TREE ===

export const BONSAI_GROWTH_XP: Record<string, number> = {
  freshStartTokens: 25,
  predictionCrystals: 20,
  composureCoins: 15,
  streakShields: 10,
  anchorWeights: 15,
  stretchTokens: 20,
  timeBenderHourglasses: 15,
  dawnDiamonds: 15,
  goldenBookmarks: 10,
  embersOfContinuity: 50,
};

export interface BonsaiStage {
  emoji: string;
  label: string;
  minLevel: number;
}

export const BONSAI_STAGES: BonsaiStage[] = [
  { emoji: '🌱', label: 'Seed', minLevel: 1 },
  { emoji: '🌿', label: 'Sprout', minLevel: 2 },
  { emoji: '🎋', label: 'Sapling', minLevel: 6 },
  { emoji: '🌲', label: 'Small Tree', minLevel: 11 },
  { emoji: '🌳', label: 'Mature Bonsai', minLevel: 21 },
  { emoji: '✨🌳✨', label: 'Ancient Bonsai', minLevel: 50 },
];

export function getBonsaiStage(level: number): BonsaiStage {
  return [...BONSAI_STAGES].reverse().find(s => level >= s.minLevel) || BONSAI_STAGES[0];
}

export function calculateBonsaiNextLevelXP(level: number): number {
  return level * 100;
}

export function feedBonsai(progress: UserProgress, itemKey: keyof UserProgress['inventory']): string | null {
  if (!progress.bonsai) progress.bonsai = { level: 1, experience: 0 };
  const xpValue = BONSAI_GROWTH_XP[itemKey];
  if (!xpValue) return null;
  if (progress.inventory[itemKey] <= 0) return null;
  progress.inventory[itemKey]--;
  progress.bonsai.experience += xpValue;
  progress.bonsai.lastFed = new Date().toISOString();
  let leveledUp = false;
  while (progress.bonsai.experience >= calculateBonsaiNextLevelXP(progress.bonsai.level)) {
    progress.bonsai.experience -= calculateBonsaiNextLevelXP(progress.bonsai.level);
    progress.bonsai.level++;
    leveledUp = true;
  }
  return leveledUp ? `Level Up! Your tree is now Level ${progress.bonsai.level}.` : `Your tree grew! (+${xpValue} XP)`;
}

export function evaluateGamificationTriggers(
  action: GameAction,
  progress: UserProgress
): { message: string, detail: string }[] {
  const updates: { message: string, detail: string }[] = [];
  const now = new Date();

  const wasFrozen = getCampfireStatus(progress) === 'frozen';
  progress.lastActiveDate = now.toISOString();
  if (wasFrozen) {
    updates.push({ message: 'Campfire Re-ignited!', detail: 'Your campfire was frozen. XP is halved this session — keep going to restore full gains.' });
  }
  progress.activeBuffs = progress.activeBuffs.filter(b => new Date(b.expiresAt) > now);

  if (action.type === 'task-completed') {
    const task = action.task;
    const hasLaserOverdrive = progress.activeBuffs.some(b => b.type === 'laserOverdrive' && new Date(b.expiresAt) > now);
    const xpMultiplier = (hasLaserOverdrive ? 2 : 1) * (wasFrozen ? 0.5 : 1);

    // 1. Morning Lark
    if (getHours(now) < 9 || (getHours(now) === 9 && now.getMinutes() <= 30)) {
      const expiresAt = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
      const alreadyActive = progress.activeBuffs.some(b => b.type === 'zenMode');
      if (!alreadyActive) {
        progress.activeBuffs.push({ type: 'zenMode', expiresAt });
        progress.xp += 50 * xpMultiplier;
        updates.push({ message: 'Morning Lark Buff!', detail: `Zen Mode activated for 3 hours. +${50 * xpMultiplier} XP` });
      }
    }

    // 2. The Closer — fired when this completion closes out the last open Task in its Project.
    if (task.projectId) {
      const siblings = action.allTasksOnLoad.filter(t =>
        t.projectId === task.projectId && t.id !== task.id && isOneTime(t)
      );
      const allSiblingsDone = siblings.length > 0 && siblings.every(s => s.status === 'done');
      if (allSiblingsDone && isOneTime(task)) {
        const xp = 50 * xpMultiplier;
        progress.xp += xp;
        const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
        progress.activeBuffs.push({ type: 'momentumSurge', expiresAt });
        updates.push({ message: 'The Closer', detail: `Project fully closed! Momentum Surge active. +${xp} XP` });
      }
    }

    // 3. The Anchor — clearing one of the three oldest open tasks
    if (action.allTasksOnLoad && action.allTasksOnLoad.length > 0) {
      const oldTasks = action.allTasksOnLoad.filter(t => t.status !== 'done').sort((a, b) => {
        const aTime = a.id.startsWith('task-') ? parseInt(a.id.split('-')[1]) || 0 : 0;
        const bTime = b.id.startsWith('task-') ? parseInt(b.id.split('-')[1]) || 0 : 0;
        return aTime - bTime;
      });
      if (oldTasks.length >= 3) {
        const top3 = oldTasks.slice(0, 3).map(t => t.id);
        if (top3.includes(task.id)) {
          progress.inventory.anchorWeights += 1;
          const xp = 75 * xpMultiplier;
          progress.xp += xp;
          updates.push({ message: 'Anchor Earned', detail: `Cleared an old backlog task. +${xp} XP` });
        }
      }
    }

    // 4. Pinnacle Push
    if (task.tShirtSize === 'L' || task.tShirtSize === 'XL') {
      if (!task.pushCount || task.pushCount === 0) {
        progress.inventory.stretchTokens += 1;
        const xp = 100 * xpMultiplier;
        progress.xp += xp;
        updates.push({ message: 'Pinnacle Push', detail: `Major task finished without pushing. +${xp} XP` });
      }
    }

    // 5. Silent Architect
    if (task.isPrivate) {
      const xp = 30 * xpMultiplier;
      progress.xp += xp;
      updates.push({ message: 'Silent Architect', detail: `Private execution rewarded. +${xp} XP` });
    }

    // 6. Habit Streak Shield
    if (isHabit(task) && task.completionHistory) {
      const streak = calculateStreak(task);
      if (streak % 10 === 0 && streak > 0) {
        progress.inventory.streakShields += 1;
        const xp = 50 * xpMultiplier;
        progress.xp += xp;
        updates.push({ message: 'Streak Shield Earned', detail: `${streak}-day streak! Shield added to inventory. +${xp} XP` });
      }
    }
  }

  if (action.type === 'focus-completed') {
    const session = action.session;

    if (session.duration >= 50 && session.distractions.length === 0) {
      const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      progress.activeBuffs.push({ type: 'laserOverdrive', expiresAt });
      progress.xp += 100;
      updates.push({ message: 'Laser Overdrive!', detail: '2x XP multiplier active for 2 hours. +100 XP' });
    }

    if (session.duration >= 60) {
      const expiresAt = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
      progress.activeBuffs.push({ type: 'brainFuel', expiresAt });
      progress.xp += 25;
      updates.push({ message: 'Metabolic Fueling', detail: 'Time for self-care. Brain Fuel Buff gained. +25 XP' });
    }

    if (session.expectedEndTime && session.endTime) {
      const diff = Math.abs(differenceInMinutes(parseISO(session.endTime), parseISO(session.expectedEndTime)));
      if (diff <= 5) {
        progress.inventory.timeBenderHourglasses += 1;
        progress.xp += 50;
        updates.push({ message: 'Time Bender Earned', detail: 'Perfect planning execution. +50 XP' });
      }
    }

    if (action.jotsLogged > 0 && session.mode === 'pomodoro') {
      progress.inventory.goldenBookmarks += 1;
      progress.xp += 40;
      updates.push({ message: 'Active Synthesizer', detail: 'Logged ideas during focus. Golden bookmark earned. +40 XP' });
    }

    if (action.startedQuickly && session.duration >= 25) {
      progress.inventory.composureCoins += 1;
      progress.xp += 50;
      updates.push({ message: 'Poker Face Composure', detail: 'Started a tough task under pressure. Earned a Composure Coin. +50 XP' });
    }

    const scaryEmotion = action.preEmotion?.emotion;
    if (scaryEmotion === 'dread' || scaryEmotion === 'anxiety') {
      const bonusXP = Math.floor(session.duration * 2);
      progress.xp += bonusXP;
      const drop = Math.random() < 0.5 ? 'composureCoins' : 'stretchTokens';
      progress.inventory[drop] += 1;
      const dropName = drop === 'composureCoins' ? 'Composure Coin' : 'Stretch Token';
      updates.push({
        message: 'Scary Bonus!',
        detail: `You pushed through ${scaryEmotion}. Double focus XP earned + ${dropName} dropped. +${bonusXP} XP`
      });
    }
  }

  if (action.type === 'worry-resolved') {
    if (action.accuracy === 'low') {
      progress.inventory.predictionCrystals += 1;
      progress.xp += 20;
      updates.push({ message: 'Worry Master', detail: 'Worry accuracy was low. Found a Prediction Crystal. +20 XP' });
    }
  }

  if (action.type === 'mistake-logged') {
    progress.inventory.freshStartTokens += 1;
    progress.xp += 30;
    updates.push({ message: 'Mistake Mastery', detail: 'Growth mindset shown. Earned a Fresh Start token. +30 XP' });
  }

  if (action.type === 'wind-down-completed') {
    const hour = getHours(now);
    const minute = now.getMinutes();
    const beforeCurfew = hour < 23 || (hour === 23 && minute <= 30);
    if (beforeCurfew) {
      const todayStr = now.toISOString().split('T')[0];
      const lastDate = progress.lastWindDownDate;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const isConsecutive = lastDate === yesterdayStr;
      progress.windDownStreak = isConsecutive ? (progress.windDownStreak || 0) + 1 : 1;
      progress.lastWindDownDate = todayStr;
      if (progress.windDownStreak >= 3) {
        progress.inventory.dawnDiamonds += 1;
        progress.windDownStreak = 0;
        const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
        progress.activeBuffs.push({ type: 'energyInjection', expiresAt });
        progress.xp += 75;
        updates.push({ message: '🌙 Twilight Lock!', detail: '3 nights of early Wind Down. Dawn Diamond earned + Energy Injection tomorrow. +75 XP' });
      } else {
        progress.xp += 15;
        updates.push({ message: 'Wind Down Logged', detail: `Night ${progress.windDownStreak}/3 of early bedtime. Keep it up! +15 XP` });
      }
    }
  }

  if (action.type === 'perfect-day-review') {
    progress.dailyWinStreak = (progress.dailyWinStreak || 0) + 1;
    progress.xp += 50;
    if (progress.dailyWinStreak >= 7) {
      progress.inventory.embersOfContinuity += 1;
      progress.dailyWinStreak = 0;
      updates.push({ message: 'Ember of Continuity', detail: '7-day perfect streak achieved! High-value item earned. +50 XP' });
    } else {
      updates.push({ message: 'Streak Maintained', detail: `Day ${progress.dailyWinStreak}/7 of your perfect win streak. +50 XP` });
    }
  }

  return updates;
}
