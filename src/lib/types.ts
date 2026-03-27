export type Priority = "low" | "medium" | "high" | "urgent";
export type EnergyLevel = 'high' | 'medium' | 'low';
export type Status = "todo" | "in-progress" | "done" | "abandoned";
export type HabitFrequency = "daily" | "weekly" | "monthly";
export type PushReason = 'too-scary' | 'too-vague' | 'too-big' | 'too-boring' | 'ran-out-of-time' | 'deprioritized';
export type EmotionLabel = 'dread' | 'anxiety' | 'resistance' | 'overwhelm' | 'calm' | 'neutral' | 'excited';

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
  date: string; // ISO date string (e.g., "2024-08-07T00:00:00.000Z")
  status: DailyHabitStatus;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  priority?: Priority;
  energyLevel?: EnergyLevel;
  order?: number;
  doDate?: string;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
  pushCount?: number;
  pushHistory?: PushHistoryEntry[];
  timeLimit?: number; // Parkinson's Law timebox in minutes
  isFrog?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  subtasks: Subtask[];
  notes: string[];
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isHabit?: boolean;
  completionHistory?: string[]; // Array of ISO date strings
  streakGoal?: number;
  habitFrequency?: HabitFrequency;
  lastCompletedDate?: string;
  dailyStatus?: DailyStatus[];
  goalId?: string; // Optional link to a long-term goal
  milestoneId?: string; // Link to a specific milestone
  energyLevel?: EnergyLevel; // Optional energy requirement
  order?: number;
  blocks?: string[]; // IDs of tasks that are blocked by this task
  blockedBy?: string[]; // IDs of tasks that this task is blocked by
  doDate?: string;
  streak?: number;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
  pushCount?: number;
  pushHistory?: PushHistoryEntry[];
  timeLimit?: number; // Parkinson's Law timebox in minutes
  isFrog?: boolean;
}

// New Template Types
export interface TemplateSubtask {
  id: string;
  title: string;
  tags?: string[];
  priority?: Priority;
  energyLevel?: EnergyLevel;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  subtasks: TemplateSubtask[];
  tags?: string[];
  goalId?: string; // Optional link to a long-term goal
  milestoneId?: string;
  energyLevel?: EnergyLevel; // Optional energy requirement
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
  timestamp?: string;         // HH:MM from the focus session
  isDone?: boolean;           // for todo-style checkboxes
  sessionId: string;
  sessionDate: string;        // ISO date string
  taskTitle?: string;
  followUpDate?: string;      // ISO date string — for worry jots
  followUpResult?: 'happened' | 'didnt-happen' | 'partially';
}

// Focus Timer Types
export type FocusMode = 'pomodoro' | 'stopwatch' | 'countdown';
export type ProductivityScore = 'high' | 'medium' | 'low';

export interface TimerEvent {
  type: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: string; // ISO date string
}

export interface FocusSession {
  id: string;
  userId?: string;             // Attached to the tenant
  taskId?: string;             // Optional association with a Task/Habit
  startTime: string;           // ISO date string
  endTime?: string;            // ISO date string (optional until complete)
  duration: number;            // Total active focus time in minutes (so far)
  mode: FocusMode;
  productivityScore?: ProductivityScore;
  energyLevel?: EnergyLevel;
  distractions: string[];
  deepWorkScore?: number;      // Multiplier logic
  taskTitle?: string;

  // Timer API Integration Fields
  events?: TimerEvent[];
  expectedEndTime?: string;    // ISO date string if a timer was started with a known duration
  status?: 'active' | 'completed' | 'abandoned';
  strategy?: string;

  // Emotion tracking
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
  userId?: string; // Attached to the tenant
  pillarId?: string; // Link to a life pillar
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  color?: string; // Visual categorization
  icon?: string;
  userId?: string;
}

export interface Milestone extends Goal {
  // Inherits title, description, status, etc from Goal
  // We can add milestone specific fields here if they diverge later
  targetDate?: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  frequency: HabitFrequency;
  lastCompleted?: string;
  priority: Priority;
  energyLevel: EnergyLevel;
  userId?: string;
  tags?: string[];
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
  relevanceScore: number; // 1-10
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface FocusReminders {
  id: string;
  reminders: string[];
  intervalMinutes: number; // how often to show during focus
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
