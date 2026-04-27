export type Priority = "low" | "medium" | "high" | "urgent";
export type EnergyLevel = 'high' | 'medium' | 'low';
export type Status = "todo" | "in-progress" | "done" | "abandoned";
export type Recurrence = "once" | "daily" | "weekly" | "monthly" | "custom";
export type TaskCategory = "project-work" | "chore" | "habit";
export type PushReason = 'too-scary' | 'too-vague' | 'too-big' | 'too-boring' | 'ran-out-of-time' | 'deprioritized';
export type EmotionLabel = 'dread' | 'anxiety' | 'resistance' | 'overwhelm' | 'calm' | 'neutral' | 'excited';

/**
 * @deprecated Use `Recurrence` instead. Kept as a transitional alias while UI migrates.
 */
export type HabitFrequency = "daily" | "weekly" | "monthly";
/**
 * @deprecated Use `Recurrence` instead. Kept as a transitional alias while UI migrates.
 */
export type ChoreFrequency = Recurrence;

export interface EmotionCheckIn {
  emotion: EmotionLabel;
  bodyTension: number; // 1-10
  timestamp: string;
}

export interface PushHistoryEntry {
  date: string; // ISO date string
  reason: PushReason;
}

export type DailyHabitStatus = 'changes observed' | 'no changes' | 'negative' | 'not recorded';
export interface DailyStatus {
  date: string; // ISO date string
  status: DailyHabitStatus;
}

/**
 * Task — the atomic unit of work.
 * - Standalone if `projectId` is unset; otherwise grouped under a Project.
 * - `category` describes intent (project-work, chore, habit).
 * - `recurrence` describes how often it repeats.
 *   - For `once`: standard lifecycle via `status` (todo → in-progress → done).
 *   - For `daily`/`weekly`/`monthly`/`custom`: `completionHistory` tracks per-period completions; `status` describes the *task itself* (active vs abandoned).
 */
export interface Task {
  id: string;
  projectId?: string;          // null = standalone
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  /** Defaults to `'project-work'` when omitted. */
  category?: TaskCategory;
  /** Defaults to `'once'` when omitted. */
  recurrence?: Recurrence;
  intervalDays?: number;       // for `custom` recurrence

  energyLevel?: EnergyLevel;
  startDate?: string;
  endDate?: string;
  doDate?: string;
  completedAt?: string;
  tags?: string[];
  /** Always defaults to `[]`. */
  notes: string[];
  blocks?: string[];           // IDs of Tasks blocked by this Task
  blockedBy?: string[];        // IDs of Tasks this Task is blocked by
  goalId?: string;
  milestoneId?: string;
  pushCount?: number;
  pushHistory?: PushHistoryEntry[];
  timeLimit?: number;          // Parkinson's Law timebox in minutes
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
  isFrog?: boolean;
  order?: number;
  isPrivate?: boolean;         // For Silent Architect

  // Recurring-task fields (populated when recurrence !== 'once')
  completionHistory?: string[];   // ISO date strings of period completions
  lastCompletedDate?: string;
  streak?: number;
  streakGoal?: number;
  shieldedDates?: string[];       // For streak shields
  dailyStatus?: DailyStatus[];    // Optional per-day quality marker for habits

  userId?: string;

  // === Legacy back-compat (transitional) ===
  /** @deprecated Use `category === 'habit'` instead. Mirrors category for legacy UI. */
  isHabit?: boolean;
  /** @deprecated Use `recurrence` instead. */
  habitFrequency?: HabitFrequency;
  /** @deprecated Use `recurrence` instead. */
  frequency?: ChoreFrequency;
  /** @deprecated Use `lastCompletedDate` instead. */
  lastCompleted?: string;
  /** @deprecated For one-time chores, check `status === 'done'` instead. */
  completedOnce?: boolean;
  /** @deprecated Atomic Tasks no longer have child subtasks. Promote children to standalone Tasks linked via `projectId` instead. Always defaults to `[]`. */
  subtasks: Subtask[];
}

/**
 * @deprecated The atomic-Task model removes nested subtasks. Existing references should be migrated to standalone Tasks with `projectId` pointing to the parent's project.
 */
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  tags?: string[];
  priority?: Priority;
  energyLevel?: EnergyLevel;
  order?: number;
  doDate?: string;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
  pushCount?: number;
  pushHistory?: PushHistoryEntry[];
  timeLimit?: number;
  isFrog?: boolean;
}

/**
 * @deprecated The standalone Chore type has been folded into Task with `category: 'chore'`.
 * Kept as an alias so existing imports compile while UI migrates.
 */
export type Chore = Task;

/**
 * Project — container for related Tasks.
 * Status/progress are derived from the contained Tasks (see deriveProjectStatus / deriveProjectProgress).
 */
export interface Project {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  goalId?: string;
  milestoneId?: string;
  order?: number;
  userId?: string;
}

// === TEMPLATES ===

/**
 * Spec for a Task created from a template.
 * Lifecycle/runtime fields (status, completionHistory, pushCount, etc.) are excluded —
 * those are produced fresh on instantiation.
 */
export interface TemplateTaskSpec {
  title: string;
  description?: string;
  tags?: string[];
  priority?: Priority;
  category?: TaskCategory;
  recurrence?: Recurrence;
  intervalDays?: number;
  energyLevel?: EnergyLevel;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
  timeLimit?: number;
  isFrog?: boolean;
}

/**
 * @deprecated Use `TemplateTaskSpec` instead.
 */
export type TemplateSubtask = TemplateTaskSpec & { id?: string };

/**
 * Template that produces either:
 *  - A Project + child Tasks (when `tasks` has multiple entries or a project description), or
 *  - A single standalone Task (when there's exactly one entry and `tasks[0]` carries enough metadata).
 */
export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  goalId?: string;
  milestoneId?: string;
  tasks: TemplateTaskSpec[];
  userId?: string;

  // === Legacy back-compat (transitional) ===
  /** @deprecated Use the per-task `priority` on `tasks[*]` instead. */
  priority?: Priority;
  /** @deprecated Use `tasks` instead. Always defaults to `[]`. */
  subtasks: TemplateSubtask[];
  /** @deprecated Use the per-task `energyLevel` on `tasks[*]` instead. */
  energyLevel?: EnergyLevel;
  /** @deprecated Use the per-task `tShirtSize` on `tasks[*]` instead. */
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  roles?: string[];
  [key: string]: any;
}

// Jot Types
export type JotCategory = 'worry' | 'todo' | 'idea' | 'random' | 'untagged';

export interface ParsedJot {
  text: string;
  category: JotCategory;
  timestamp?: string;
  isDone?: boolean;
  sessionId: string;
  sessionDate: string;
  taskTitle?: string;
  followUpDate?: string;
  followUpResult?: 'happened' | 'didnt-happen' | 'partially';
}

// Focus Timer Types
export type FocusMode = 'pomodoro' | 'stopwatch' | 'countdown';
export type ProductivityScore = 'high' | 'medium' | 'low';

export interface TimerEvent {
  type: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: string;
}

export interface FocusSession {
  id: string;
  userId?: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  mode: FocusMode;
  productivityScore?: ProductivityScore;
  energyLevel?: EnergyLevel;
  distractions: string[];
  deepWorkScore?: number;
  taskTitle?: string;

  events?: TimerEvent[];
  expectedEndTime?: string;
  status?: 'active' | 'completed' | 'abandoned';
  strategy?: string;

  preEmotion?: EmotionCheckIn;
  postEmotion?: EmotionCheckIn;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'abandoned';
  deadline?: string;
  startDate?: string;
  tags?: string[];
  userId?: string;
  pillarId?: string;
  stretchGoal?: string;
  completedAt?: string;
  isPrivate?: boolean;
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  color?: string;
  icon?: string;
  userId?: string;
}

export interface Milestone extends Goal {
  targetDate?: string;
  stretchGoalCompleted?: boolean;
}

export interface Interest {
  id: string;
  name: string;
  description?: string;
  category?: string;
  priority: Priority;
  color?: string;
  tags?: string[];
  pillarId?: string;
  userId?: string;
}

export interface InterestConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  strength?: number;
  userId?: string;
}

// === UTILITY LOGS ===

export interface BackOfMindItem {
  id: string;
  content: string;
  category?: string;
  relevanceScore: number;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface FocusReminders {
  id: string;
  reminders: string[];
  intervalMinutes: number;
  enabled: boolean;
  userId?: string;
}

export interface MistakeLogEntry {
  id: string;
  description: string;
  lessonsLearned: string;
  actionTaken?: string;
  status: 'open' | 'resolved';
  createdAt: string;
  userId?: string;
}

export interface ActiveBuff {
  type: 'laserOverdrive' | 'zenMode' | 'momentumSurge' | 'brainFuel' | 'backlogLockdown' | 'energyInjection';
  expiresAt: string;
  metadata?: any;
}

export interface UserProgress {
  userId: string;
  xp: number;
  level: number;
  inventory: {
    streakShields: number;
    predictionCrystals: number;
    freshStartTokens: number;
    composureCoins: number;
    anchorWeights: number;
    stretchTokens: number;
    timeBenderHourglasses: number;
    dawnDiamonds: number;
    goldenBookmarks: number;
    embersOfContinuity: number;
  };
  activeBuffs: ActiveBuff[];

  lastActiveDate?: string;
  seasonStartDate?: string;
  unlockedRelics?: string[];
  legacyBadges?: string[];

  bonsai?: {
    level: number;
    experience: number;
    lastFed?: string;
  };
  dailyWinStreak?: number;
  windDownStreak?: number;
  lastWindDownDate?: string;

  personalBests?: {
    maxTasksInDay: number;
    maxFocusMinutes: number;
    maxFrogsInDay: number;
    longestStreak: number;
    maxHabitsInDay: number;
  };
}

export type GameAction =
  | { type: 'task-completed', task: Task, allTasksOnLoad: Task[] }
  | { type: 'focus-completed', session: FocusSession, jotsLogged: number, startedQuickly: boolean, preEmotion?: EmotionCheckIn }
  | { type: 'worry-resolved', accuracy: 'high' | 'low' }
  | { type: 'mistake-logged' }
  | { type: 'perfect-day-review' }
  | { type: 'wind-down-completed' };
