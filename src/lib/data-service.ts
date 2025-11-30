/**
 * Data service layer that uses the database abstraction
 */

import type { Task, TaskTemplate, User } from './types';
import type { DatabaseAdapter, DailyPlan } from './database/types';
import { DatabaseFactory } from './database/factory';
import { config, isServer } from './config';
import { defaultLogger } from './database/types';

// Singleton database adapter instance
let dbAdapter: DatabaseAdapter | null = null;

/**
 * Initialize the database connection
 */
async function initializeDatabase(): Promise<DatabaseAdapter> {
    if (!isServer) {
        throw new Error('Database operations are only available on the server side');
    }

    if (!dbAdapter || !dbAdapter.isConnected()) {
        try {
            dbAdapter = await DatabaseFactory.initialize(config.database, defaultLogger);
            defaultLogger.info('Database initialized successfully', { type: config.database.type });
        } catch (error) {
            defaultLogger.error('Failed to initialize database', error);
            throw error;
        }
    }

    return dbAdapter;
}

/**
 * Get the database adapter, initializing if necessary
 */
async function getDatabase(): Promise<DatabaseAdapter> {
    if (!dbAdapter || !dbAdapter.isConnected()) {
        return await initializeDatabase();
    }
    return dbAdapter;
}

/**
 * Mock data for client-side and fallback scenarios
 */
const mockTasks: Task[] = [
    {
        id: "task-1",
        title: "Design new homepage",
        description: "Create mockups and a prototype for the new homepage design.",
        priority: "high",
        status: "in-progress",
        tags: ["design", "website", "ux"],
        startDate: "2024-08-01T10:00:00.000Z",
        endDate: "2024-08-10T17:00:00.000Z",
        subtasks: [
            { id: "sub-1-1", title: "Create wireframes", completed: true, tags: ['design'] },
            { id: "sub-1-2", title: "Develop high-fidelity mockups", completed: false, tags: ['design'] },
            { id: "sub-1-3", title: "Prototype interactions", completed: false },
        ],
        notes: ["Initial meeting with stakeholders went well. They prefer a clean, modern look."],
    },
    {
        id: "task-2",
        title: "Develop API for user authentication",
        description: "Build and document the API endpoints for user sign-up, sign-in, and profile management.",
        priority: "high",
        status: "todo",
        tags: ["development", "backend", "api"],
        startDate: "2024-08-05T09:00:00.000Z",
        endDate: "2024-08-15T18:00:00.000Z",
        subtasks: [
            { id: "sub-2-1", title: "Set up database schema for users", completed: false },
            { id: "sub-2-2", title: "Implement JWT generation", completed: false, tags: ['auth'] },
            { id: "sub-2-3", title: "Create sign-up endpoint", completed: false },
            { id: "sub-2-4", title: "Create sign-in endpoint", completed: false },
        ],
        notes: [],
    },
    {
        id: "task-3",
        title: "Plan Q4 Marketing Campaign",
        description: "Outline the strategy, channels, and budget for the upcoming Q4 marketing campaign.",
        priority: "medium",
        status: "todo",
        tags: ["marketing", "planning", "strategy"],
        startDate: "2024-08-12T09:00:00.000Z",
        subtasks: [],
        notes: ["Focus on social media and content marketing.", "Need to coordinate with the sales team for promotions."],
    },
];

const mockTemplates: TaskTemplate[] = [
    {
        id: "template-1",
        title: "New Employee Onboarding",
        description: "A standard checklist for onboarding a new team member.",
        priority: "medium",
        tags: ["hr", "onboarding"],
        subtasks: [
            { id: "tsub-1-1", title: "Set up hardware (laptop, monitor)", tags: ["it"] },
            { id: "tsub-1-2", title: "Grant access to required systems", tags: ["it", "security"] },
            { id: "tsub-1-3", title: "Schedule team introduction meeting" },
        ]
    }
];

let mockDailyPlan: string[] = ['task-1'];

const mockUsers: User[] = [
    { id: 'user-1', email: 'user@example.com', roles: ['user'] },
    { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
];

/**
 * Get all tasks
 */
export async function getAllTasksAsync(): Promise<Task[]> {
    if (!isServer) {
        return mockTasks;
    }

    try {
        const db = await getDatabase();
        return await db.getAllTasks();
    } catch (error) {
        defaultLogger.warn('Failed to get tasks from database, returning mock data', error);
        return mockTasks;
    }
}

/**
 * Get a single task by ID
 */
export async function getTaskAsync(taskId: string): Promise<Task | null> {
    if (!isServer) {
        return mockTasks.find(task => task.id === taskId) || null;
    }

    try {
        const db = await getDatabase();
        return await db.getTask(taskId);
    } catch (error) {
        defaultLogger.warn('Failed to get task from database, checking mock data', { taskId, error });
        return mockTasks.find(task => task.id === taskId) || null;
    }
}

/**
 * Add a new task
 */
export async function addTaskAsync(newTask: Omit<Task, 'id'>): Promise<Task> {
    const taskWithId: Task = {
        ...newTask,
        id: `task-${Date.now()}`,
    };

    if (!isServer) {
        mockTasks.push(taskWithId);
        return taskWithId;
    }

    try {
        const db = await getDatabase();
        return await db.addTask(taskWithId);
    } catch (error) {
        defaultLogger.warn('Failed to add task to database, adding to mock data', { task: taskWithId, error });
        mockTasks.push(taskWithId);
        return taskWithId;
    }
}

/**
 * Update an existing task
 */
export async function updateTaskAsync(updatedTask: Task): Promise<void> {
    if (!isServer) {
        const index = mockTasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            mockTasks[index] = updatedTask;
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.updateTask(updatedTask);
    } catch (error) {
        defaultLogger.warn('Failed to update task in database', { task: updatedTask, error });
        // Update in mock data as fallback
        const index = mockTasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            mockTasks[index] = updatedTask;
        }
    }
}

/**
 * Delete a task
 */
export async function deleteTaskAsync(taskId: string): Promise<void> {
    if (!isServer) {
        const index = mockTasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            mockTasks.splice(index, 1);
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.deleteTask(taskId);
    } catch (error) {
        defaultLogger.warn('Failed to delete task from database', { taskId, error });
        // Delete from mock data as fallback
        const index = mockTasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            mockTasks.splice(index, 1);
        }
    }
}

/**
 * Get all templates
 */
export async function getAllTemplatesAsync(): Promise<TaskTemplate[]> {
    if (!isServer) {
        return mockTemplates;
    }

    try {
        const db = await getDatabase();
        return await db.getAllTemplates();
    } catch (error) {
        defaultLogger.warn('Failed to get templates from database, returning mock data', error);
        return mockTemplates;
    }
}

/**
 * Add a new template
 */
export async function addTemplateAsync(newTemplate: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate> {
    const templateWithId: TaskTemplate = {
        ...newTemplate,
        id: `template-${Date.now()}`,
    };

    if (!isServer) {
        mockTemplates.push(templateWithId);
        return templateWithId;
    }

    try {
        const db = await getDatabase();
        return await db.addTemplate(templateWithId);
    } catch (error) {
        defaultLogger.warn('Failed to add template to database, adding to mock data', { template: templateWithId, error });
        mockTemplates.push(templateWithId);
        return templateWithId;
    }
}

/**
 * Update an existing template
 */
export async function updateTemplateAsync(updatedTemplate: TaskTemplate): Promise<void> {
    if (!isServer) {
        const index = mockTemplates.findIndex(template => template.id === updatedTemplate.id);
        if (index !== -1) {
            mockTemplates[index] = updatedTemplate;
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.updateTemplate(updatedTemplate);
    } catch (error) {
        defaultLogger.warn('Failed to update template in database', { template: updatedTemplate, error });
        // Update in mock data as fallback
        const index = mockTemplates.findIndex(template => template.id === updatedTemplate.id);
        if (index !== -1) {
            mockTemplates[index] = updatedTemplate;
        }
    }
}

/**
 * Delete a template
 */
export async function deleteTemplateAsync(templateId: string): Promise<void> {
    if (!isServer) {
        const index = mockTemplates.findIndex(template => template.id === templateId);
        if (index !== -1) {
            mockTemplates.splice(index, 1);
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.deleteTemplate(templateId);
    } catch (error) {
        defaultLogger.warn('Failed to delete template from database', { templateId, error });
        // Delete from mock data as fallback
        const index = mockTemplates.findIndex(template => template.id === templateId);
        if (index !== -1) {
            mockTemplates.splice(index, 1);
        }
    }
}

/**
 * Get daily plan
 */
export async function getDailyPlanAsync(): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0];

    if (!isServer) {
        return mockDailyPlan;
    }

    try {
        const db = await getDatabase();
        const plan = await db.getDailyPlan(today);
        return plan?.tasks || [];
    } catch (error) {
        defaultLogger.warn('Failed to get daily plan from database, returning mock data', error);
        return mockDailyPlan;
    }
}

/**
 * Update daily plan
 */
export async function updateDailyPlanAsync(taskIds: string[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    if (!isServer) {
        mockDailyPlan = taskIds;
        return;
    }

    try {
        const db = await getDatabase();
        const plan: DailyPlan = {
            id: today,
            date: today,
            tasks: taskIds,
            notes: [],
            updatedAt: new Date().toISOString(),
        };
        await db.updateDailyPlan(plan);
    } catch (error) {
        defaultLogger.warn('Failed to update daily plan in database', { taskIds, error });
        // Update mock data as fallback
        mockDailyPlan = taskIds;
    }
}

/**
 * Health check for the database
 */
export async function healthCheckAsync(): Promise<boolean> {
    if (!isServer) {
        return true; // Client-side always returns true
    }

    try {
        const db = await getDatabase();
        return await db.healthCheck();
    } catch (error) {
        defaultLogger.error('Database health check failed', error);
        return false;
    }
}

/**
 * Initialize database on server startup
 */
if (isServer) {
    initializeDatabase().catch((error) => {
        defaultLogger.error('Failed to initialize database on startup', error);
    });
}

// === AUTHENTICATION ===

/**
 * Get a user by ID
 */
export async function getUserAsync(userId: string): Promise<User | null> {
    if (!isServer) {
        return mockUsers.find(user => user.id === userId) || null;
    }

    try {
        const db = await getDatabase();
        return await db.getUser(userId);
    } catch (error) {
        defaultLogger.error(`Failed to get user ${userId}`, error);
        return null;
    }
}