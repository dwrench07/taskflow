import type { Task, TaskTemplate, FocusSession, Goal, Pillar, Milestone, Chore, Interest, InterestConnection, BackOfMindItem, MistakeLogEntry } from './types';

// === API FUNCTIONS FOR CLIENT-SIDE USAGE ===
// These functions make direct API calls and are used by React components

export async function getAllTasks(): Promise<Task[]> {
  try {
    const response = await fetch('/api/tasks');
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch tasks from API:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch tasks from API:', error);
    return [];
  }
}

export async function getAllTemplates(): Promise<TaskTemplate[]> {
  try {
    const response = await fetch('/api/templates');
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch templates from API:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch templates from API:', error);
    return [];
  }
}

export async function addTask(newTask: Omit<Task, 'id'>): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTask),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to add task: ${response.statusText}`);
  }
}

export async function updateTask(updatedTask: Task): Promise<void> {
  const response = await fetch(`/api/tasks/${updatedTask.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedTask),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.statusText}`);
  }
}

export async function addTemplate(newTemplate: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate> {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTemplate),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to add template: ${response.statusText}`);
  }
}

export async function updateTemplate(updatedTemplate: TaskTemplate): Promise<void> {
  const response = await fetch(`/api/templates/${updatedTemplate.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedTemplate),
  });

  if (!response.ok) {
    throw new Error(`Failed to update template: ${response.statusText}`);
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`/api/templates/${templateId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete template: ${response.statusText}`);
  }
}

export async function updateDailyPlanAsync(newTaskIds: string[], date?: string): Promise<void> {
  const response = await fetch('/api/daily-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dailyTaskIds: newTaskIds, ...(date ? { date } : {}) }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update daily plan: ${response.statusText}`);
  }
}

export async function getDailyPlan(date?: string) {
  try {
    const url = date ? `/api/daily-plan?date=${date}` : '/api/daily-plan';
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("User not found");
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch daily plan");
      } else {
        throw new Error(`Unexpected response: ${response.statusText}`);
      }
    }
    const json = await response.json();
    return json.dailyTaskIds || json.tasks || [];
  } catch (error) {
    console.error("Error in getDailyPlan:", error);
    throw error;
  }
}

export interface User {
  id: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}

/**
 * Fetch the current authenticated user session from the backend.
 * The browser automatically includes the HTTPOnly JWT cookie.
 */
export async function getUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const json = await response.json();
      return (json && (json.user || json)) ?? null;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch user from API:', error);
    return null;
  }
}

// === FOCUS SESSIONS ===
export async function getFocusSessions(): Promise<FocusSession[]> {
  try {
    const response = await fetch('/api/focus');
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch focus sessions:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch focus sessions:', error);
    return [];
  }
}

export async function addFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  const response = await fetch('/api/focus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to add focus session: ${response.statusText}`);
  }
}

export async function getActiveFocusSession(): Promise<FocusSession | null> {
  try {
    const response = await fetch('/api/focus-sessions/active');
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch active focus session:', error);
    return null;
  }
}

export async function startFocusSession(payload: { mode: string, expectedDuration?: number, taskId?: string, strategy?: string }): Promise<FocusSession> {
  const response = await fetch('/api/focus-sessions/active', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start', payload }),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to start focus session: ${response.statusText}`);
  }
}

export async function updateActiveFocusSession(action: 'pause' | 'resume' | 'stop', payload?: any): Promise<FocusSession | null> {
  const response = await fetch('/api/focus-sessions/active', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to update focus session: ${response.statusText}`);
  }
}

export async function updateFocusSession(id: string, updates: Partial<FocusSession>): Promise<FocusSession> {
  const response = await fetch(`/api/focus-sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to update focus session: ${response.statusText}`);
  }
}

// === GOALS ===

export async function getAllGoals(): Promise<Goal[]> {
  try {
    const response = await fetch('/api/goals');
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch goals from API:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch goals from API:', error);
    return [];
  }
}

export async function addGoal(newGoal: Omit<Goal, 'id'>): Promise<Goal> {
  const response = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newGoal),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Failed to add goal: ${response.statusText}`);
  }
}

export async function updateGoal(updatedGoal: Goal): Promise<void> {
  const response = await fetch(`/api/goals/${updatedGoal.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedGoal),
  });

  if (!response.ok) {
    throw new Error(`Failed to update goal: ${response.statusText}`);
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  const response = await fetch(`/api/goals/${goalId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete goal: ${response.statusText}`);
  }
}

// === PILLARS ===

export async function getAllPillars(): Promise<Pillar[]> {
  try {
    const response = await fetch('/api/pillars');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch pillars:', error);
    return [];
  }
}

export async function getPillarById(id: string): Promise<Pillar | null> {
  try {
    const response = await fetch(`/api/pillars/${id}`);
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error(`Failed to fetch pillar ${id}:`, error);
    return null;
  }
}

export async function addPillar(pillar: Omit<Pillar, 'id'>): Promise<Pillar> {
  const response = await fetch('/api/pillars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pillar),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add pillar: ${response.statusText}`);
}

export async function deletePillar(id: string): Promise<void> {
  await fetch(`/api/pillars/${id}`, { method: 'DELETE' });
}

// === MILESTONES ===

export async function getAllMilestones(): Promise<Milestone[]> {
  try {
    const response = await fetch('/api/milestones');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch milestones:', error);
    return [];
  }
}

export async function addMilestone(milestone: Omit<Milestone, 'id'>): Promise<Milestone> {
  const response = await fetch('/api/milestones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestone),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add milestone: ${response.statusText}`);
}

export async function deleteMilestone(id: string): Promise<void> {
  await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
}

// === CHORES ===

export async function getAllChores(): Promise<Chore[]> {
  try {
    const response = await fetch('/api/chores');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    return [];
  }
}

export async function addChore(chore: Omit<Chore, 'id'>): Promise<Chore> {
  const response = await fetch('/api/chores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chore),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add chore: ${response.statusText}`);
}

export async function deleteChore(id: string): Promise<void> {
  await fetch(`/api/chores/${id}`, { method: 'DELETE' });
}

// === INTERESTS ===

export async function getAllInterests(): Promise<Interest[]> {
  try {
    const response = await fetch('/api/interests');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch interests:', error);
    return [];
  }
}

export async function addInterest(interest: Omit<Interest, 'id'>): Promise<Interest> {
  const response = await fetch('/api/interests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interest),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add interest: ${response.statusText}`);
}

export async function updateInterest(interest: Interest): Promise<void> {
  const response = await fetch(`/api/interests/${interest.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interest),
  });
  if (!response.ok) throw new Error(`Failed to update interest: ${response.statusText}`);
}

export async function deleteInterest(id: string): Promise<void> {
  await fetch(`/api/interests/${id}`, { method: 'DELETE' });
}

// === INTEREST CONNECTIONS ===

export async function getAllInterestConnections(): Promise<InterestConnection[]> {
  try {
    const response = await fetch('/api/interest-connections');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch interest connections:', error);
    return [];
  }
}

export async function addInterestConnection(connection: Omit<InterestConnection, 'id'>): Promise<InterestConnection> {
  const response = await fetch('/api/interest-connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connection),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add interest connection: ${response.statusText}`);
}

export async function deleteInterestConnection(id: string): Promise<void> {
  await fetch(`/api/interest-connections/${id}`, { method: 'DELETE' });
}

// === BACK OF MIND ===

export async function getAllBackOfMindItems(): Promise<BackOfMindItem[]> {
  try {
    const response = await fetch('/api/back-of-mind');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch back of mind items:', error);
    return [];
  }
}

export async function addBackOfMindItem(item: Omit<BackOfMindItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackOfMindItem> {
  const response = await fetch('/api/back-of-mind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add back of mind item: ${response.statusText}`);
}

export async function updateBackOfMindItem(item: BackOfMindItem): Promise<void> {
  const response = await fetch(`/api/back-of-mind/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error(`Failed to update back of mind item: ${response.statusText}`);
}

export async function deleteBackOfMindItem(id: string): Promise<void> {
  await fetch(`/api/back-of-mind/${id}`, { method: 'DELETE' });
}

// === MISTAKE LOG ===

export async function getAllMistakeLogEntries(): Promise<MistakeLogEntry[]> {
  try {
    const response = await fetch('/api/mistake-log');
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Failed to fetch mistake log entries:', error);
    return [];
  }
}

export async function addMistakeLogEntry(entry: Omit<MistakeLogEntry, 'id' | 'createdAt'>): Promise<MistakeLogEntry> {
  const response = await fetch('/api/mistake-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (response.ok) return await response.json();
  throw new Error(`Failed to add mistake log entry: ${response.statusText}`);
}

export async function updateMistakeLogEntry(entry: MistakeLogEntry): Promise<void> {
  const response = await fetch(`/api/mistake-log/${entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error(`Failed to update mistake log entry: ${response.statusText}`);
}

export async function deleteMistakeLogEntry(id: string): Promise<void> {
  await fetch(`/api/mistake-log/${id}`, { method: 'DELETE' });
}