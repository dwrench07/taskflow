export type Priority = "low" | "medium" | "high";
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
}

export interface Task {
  id:string;
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
}

// New Template Types
export interface TemplateSubtask {
  id: string;
  title: string;
  tags?: string[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  subtasks: TemplateSubtask[];
  tags?: string[];
}
