import type { Task, TaskTemplate } from './types';

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


export async function updateDailyPlanAsync(newTaskIds: string[]): Promise<void> {
  const response = await fetch('/api/daily-plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskIds: newTaskIds }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update daily plan: ${response.statusText}`);
  }
}