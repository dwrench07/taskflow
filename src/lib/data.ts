import type { Task, TaskTemplate } from './types';

// === API FUNCTIONS FOR CLIENT-SIDE USAGE ===
// These functions make direct API calls and are used by React components

const USER_ID = `userId=${localStorage.getItem('userId') || ''}`;

export async function getAllTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`/api/tasks?${USER_ID}`);
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
    const response = await fetch(`/api/templates?${USER_ID}`);
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
  const response = await fetch(`/api/tasks?${USER_ID}`, {
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
  const response = await fetch(`/api/tasks/${updatedTask.id}?${USER_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedTask),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}?{USER_ID}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.statusText}`);
  }
}

export async function addTemplate(newTemplate: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate> {
  const response = await fetch(`/api/templates?{USER_ID}`, {
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
  const response = await fetch(`/api/templates/${updatedTemplate.id}?{USER_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedTemplate),
  });

  if (!response.ok) {
    throw new Error(`Failed to update template: ${response.statusText}`);
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`/api/templates/${templateId}?${USER_ID}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete template: ${response.statusText}`);
  }
}

export async function updateDailyPlanAsync(newTaskIds: string[]): Promise<void> {
  const response = await fetch(`/api/daily-plan?${USER_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskIds: newTaskIds }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update daily plan: ${response.statusText}`);
  }
}

export async function getDailyPlan(userId: string) {
  try {
    console.log("Fetching daily plan for userId:", userId); // Log userId for debugging
    const response = await fetch(`/api/daily-plan?${USER_ID}`);
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
    return await response.json();
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
 * Fetch the current user from /api/auth.
 * - token: optional JWT string (if you prefer to send it via Authorization header)
 * - Reads token from localStorage if not provided (client-side only)
 * - Includes credentials so httpOnly cookie-based sessions will work
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/authentication?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const json = await response.json();
      // Expecting response shape { user: { ... } } or just user object
      return (json && (json.user || json)) ?? null;
    } else {
      console.error('Failed to fetch user from API:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch user from API:', error);
    return null;
  }
}