export type Priority = "low" | "medium" | "high" | "urgent";
export type EnergyLevel = 'high' | 'medium' | 'low';
export type Status = "todo" | "in-progress" | "done";
export type HabitFrequency = "daily" | "weekly" | "monthly";

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
  energyLevel?: EnergyLevel; // Optional energy requirement
}

// New Template Types
export interface TemplateSubtask {
  id: string;
  title: string;
  tags?: string[];
  priority?: Priority;
  energyLevel?: EnergyLevel;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  subtasks: TemplateSubtask[];
  tags?: string[];
  goalId?: string; // Optional link to a long-term goal
  energyLevel?: EnergyLevel; // Optional energy requirement
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  roles?: string[];
  [key: string]: any;
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

  // Timer API Integration Fields
  events?: TimerEvent[];
  expectedEndTime?: string;    // ISO date string if a timer was started with a known duration
  status?: 'active' | 'completed' | 'abandoned';
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
}
