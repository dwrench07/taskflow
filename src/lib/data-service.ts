/**
 * Data service layer that uses the database abstraction
 */

import type { Task, TaskTemplate, User, FocusSession, Goal, Pillar, Milestone, Chore } from './types';
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

const mockFocusSessions: FocusSession[] = [];
const mockGoals: Goal[] = [];

const mockPillars: Pillar[] = [
    { id: 'pillar-1', title: 'Health', description: 'Physical and mental well-being', color: '#ef4444' },
    { id: 'pillar-2', title: 'Wealth', description: 'Financial stability and growth', color: '#22c55e' },
    { id: 'pillar-3', title: 'Wisdom', description: 'Learning and personal growth', color: '#3b82f6' },
];

const mockMilestones: Milestone[] = [];
const mockChores: Chore[] = [];

/**
 * Get all tasks
 */
export async function getAllTasksAsync(userId?: string | null): Promise<Task[]> {
    if (!isServer) {
        return mockTasks;
    }

    try {
        const db = await getDatabase();
        return await db.getAllTasks(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get tasks from database, returning mock data', error);
        return mockTasks;
    }
}

/**
 * Get a single task by ID
 */
export async function getTaskAsync(taskId: string, userId?: string | null): Promise<Task | null> {
    if (!isServer) {
        return mockTasks.find(task => task.id === taskId) || null;
    }

    try {
        const db = await getDatabase();
        return await db.getTask(taskId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get task from database, checking mock data', { taskId, error });
        return mockTasks.find(task => task.id === taskId) || null;
    }
}

/**
 * Add a new task
 */
export async function addTaskAsync(newTask: Omit<Task, 'id'>, userId?: string | null): Promise<Task> {
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
        return await db.addTask(taskWithId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add task to database, adding to mock data', { task: taskWithId, error });
        mockTasks.push(taskWithId);
        return taskWithId;
    }
}

/**
 * Update an existing task
 */
export async function updateTaskAsync(updatedTask: Task, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockTasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            mockTasks[index] = updatedTask;
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.updateTask(updatedTask, userId);
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
export async function deleteTaskAsync(taskId: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const index = mockTasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            mockTasks.splice(index, 1);
            return true;
        }
        return false;
    }

    try {
        const db = await getDatabase();
        return await db.deleteTask(taskId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete task from database', { taskId, error });
        // Delete from mock data as fallback
        const index = mockTasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            mockTasks.splice(index, 1);
            return true;
        }
        return false;
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

// === FOCUS SESSIONS ===

/**
 * Get all focus sessions
 */
export async function getFocusSessionsAsync(userId?: string | null): Promise<FocusSession[]> {
    if (!isServer) {
        return mockFocusSessions;
    }

    try {
        const db = await getDatabase();
        return await db.getFocusSessions(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get focus sessions from database, returning mock data', error);
        return mockFocusSessions;
    }
}

/**
 * Add a new focus session
 */
export async function addFocusSessionAsync(newSession: Omit<FocusSession, 'id'>, userId?: string | null): Promise<FocusSession> {
    const sessionWithId: FocusSession = {
        ...newSession,
        id: `focus-${Date.now()}`,
    };

    if (!isServer) {
        mockFocusSessions.push(sessionWithId);
        return sessionWithId;
    }

    try {
        const db = await getDatabase();
        return await db.addFocusSession(sessionWithId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add focus session to database, adding to mock data', { session: sessionWithId, error });
        mockFocusSessions.push(sessionWithId);
        return sessionWithId;
    }
}

/**
 * Get the active focus session
 */
export async function getActiveFocusSessionAsync(userId?: string | null): Promise<FocusSession | null> {
    if (!isServer) {
        return mockFocusSessions.find(s => s.status === 'active' && (!userId || s.userId === userId)) || null;
    }

    try {
        const db = await getDatabase();
        return await db.getActiveFocusSession(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get active focus session from database, returning mock data', error);
        return mockFocusSessions.find(s => s.status === 'active' && (!userId || s.userId === userId)) || null;
    }
}

/**
 * Update a focus session
 */
export async function updateFocusSessionAsync(session: FocusSession, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockFocusSessions.findIndex(s => s.id === session.id);
        if (index !== -1) {
            mockFocusSessions[index] = session;
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.updateFocusSession(session, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update focus session in database', { session: session, error });
        const index = mockFocusSessions.findIndex(s => s.id === session.id);
        if (index !== -1) {
            mockFocusSessions[index] = session;
        }
    }
}

/**
 * Finalize orphaned sessions
 */
export async function finalizeOrphanedSessionsAsync(userId?: string | null): Promise<void> {
    if (!isServer) {
        return; // No-op on client side mocks
    }

    try {
        const db = await getDatabase();
        await db.finalizeOrphanedSessions(userId);
    } catch (error) {
        defaultLogger.warn('Failed to finalize orphaned sessions', error);
    }
}

// === GOALS ===

/**
 * Get all goals
 */
export async function getGoalsAsync(userId?: string | null): Promise<Goal[]> {
    if (!isServer) {
        return mockGoals;
    }

    try {
        const db = await getDatabase();
        return await db.getGoals(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get goals from database, returning mock data', error);
        return mockGoals;
    }
}

/**
 * Get a single goal
 */
export async function getGoalAsync(id: string, userId?: string | null): Promise<Goal | null> {
    if (!isServer) {
        return mockGoals.find(g => g.id === id) || null;
    }

    try {
        const db = await getDatabase();
        return await db.getGoal(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get goal from database, returning mock data', error);
        return mockGoals.find(g => g.id === id) || null;
    }
}

/**
 * Add a new goal
 */
export async function addGoalAsync(newGoal: Omit<Goal, 'id'>, userId?: string | null): Promise<Goal> {
    const goalWithId: Goal = {
        ...newGoal,
        id: `goal-${Date.now()}`,
    };

    if (!isServer) {
        mockGoals.push(goalWithId);
        return goalWithId;
    }

    try {
        const db = await getDatabase();
        return await db.addGoal(goalWithId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add goal to database, adding to mock data', { goal: goalWithId, error });
        mockGoals.push(goalWithId);
        return goalWithId;
    }
}

/**
 * Update an existing goal
 */
export async function updateGoalAsync(updatedGoal: Goal, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockGoals.findIndex(g => g.id === updatedGoal.id);
        if (index !== -1) {
            mockGoals[index] = updatedGoal;
        }
        return;
    }

    try {
        const db = await getDatabase();
        await db.updateGoal(updatedGoal, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update goal in database', { goal: updatedGoal, error });
        // Update mock data as fallback
        const index = mockGoals.findIndex(g => g.id === updatedGoal.id);
        if (index !== -1) {
            mockGoals[index] = updatedGoal;
        }
    }
}

/**
 * Delete a goal
 */
export async function deleteGoalAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const index = mockGoals.findIndex(g => g.id === id);
        if (index !== -1) {
            mockGoals.splice(index, 1);
            return true;
        }
        return false;
    }

    try {
        const db = await getDatabase();
        return await db.deleteGoal(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete goal from database', { id, error });
        // Delete mock data as fallback
        const index = mockGoals.findIndex(g => g.id === id);
        if (index !== -1) {
            mockGoals.splice(index, 1);
            return true;
        }
        return false;
    }
}

/**
 * Get daily plan
 */
export async function getDailyPlanAsync(date?: string, userId?: string | null): Promise<string[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!isServer) {
        return mockDailyPlan;
    }

    try {
        const db = await getDatabase();
        const plan = await db.getDailyPlan(targetDate, userId);
        return plan?.tasks || [];
    } catch (error) {
        defaultLogger.warn('Failed to get daily plan from database, returning mock data', error);
        return mockDailyPlan;
    }
}

/**
 * Update daily plan
 */
export async function updateDailyPlanAsync(taskIds: string[], date?: string, userId?: string | null): Promise<void> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!isServer) {
        mockDailyPlan = taskIds;
        return;
    }

    try {
        const db = await getDatabase();
        const plan: DailyPlan = {
            id: targetDate,
            date: targetDate,
            tasks: taskIds,
            notes: [],
            updatedAt: new Date().toISOString(),
        };
        await db.updateDailyPlan(plan, userId);
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

/**
 * Get a user by email
 */
export async function getUserByEmailAsync(email: string): Promise<User | null> {
    if (!isServer) {
        return mockUsers.find(user => user.email === email) || null;
    }

    try {
        const db = await getDatabase();
        return await db.getUserByEmail(email);
    } catch (error) {
        defaultLogger.error(`Failed to get user by email ${email}`, error);
        return null;
    }
}

/**
 * Create a new user
 */
export async function createUserAsync(user: User): Promise<User | null> {
    if (!isServer) {
        const userWithId = { ...user, id: user.id || Date.now().toString() };
        mockUsers.push(userWithId);
        return userWithId;
    }

    try {
        const db = await getDatabase();
        return await db.createUser(user);
    } catch (error: any) {
        defaultLogger.error(`Failed to create user`, error);
        throw new Error(error.message || 'Failed to create user');
    }
}

// === PILLARS ===

export async function getPillarsAsync(userId?: string | null): Promise<Pillar[]> {
    if (!isServer) return mockPillars;
    try {
        const db = await getDatabase();
        return await db.getPillars(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get pillars from database', error);
        return mockPillars;
    }
}

export async function getPillarByIdAsync(id: string, userId?: string | null): Promise<Pillar | null> {
    if (!isServer) {
        return mockPillars.find(p => p.id === id) || null;
    }
    try {
        const db = await getDatabase();
        return await db.getPillar(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get pillar from database', { id, error });
        return mockPillars.find(p => p.id === id) || null;
    }
}

export async function addPillarAsync(pillar: Omit<Pillar, 'id'>, userId?: string | null): Promise<Pillar> {
    const withId: Pillar = { ...pillar, id: `pillar-${Date.now()}` };
    if (!isServer) { mockPillars.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addPillar(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add pillar to database', error);
        mockPillars.push(withId);
        return withId;
    }
}

export async function deletePillarAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockPillars.findIndex(p => p.id === id);
        if (idx !== -1) { mockPillars.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deletePillar(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete pillar', error);
        return false;
    }
}

// === MILESTONES ===

export async function getMilestonesAsync(userId?: string | null): Promise<Milestone[]> {
    if (!isServer) return mockMilestones;
    try {
        const db = await getDatabase();
        return await db.getMilestones(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get milestones', error);
        return mockMilestones;
    }
}

export async function addMilestoneAsync(milestone: Omit<Milestone, 'id'>, userId?: string | null): Promise<Milestone> {
    const withId: Milestone = { ...milestone, id: `milestone-${Date.now()}` } as Milestone;
    if (!isServer) { mockMilestones.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addMilestone(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add milestone', error);
        mockMilestones.push(withId);
        return withId;
    }
}

export async function deleteMilestoneAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockMilestones.findIndex(m => m.id === id);
        if (idx !== -1) { mockMilestones.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteMilestone(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete milestone', error);
        return false;
    }
}

// === CHORES ===

export async function getChoresAsync(userId?: string | null): Promise<Chore[]> {
    if (!isServer) return mockChores;
    try {
        const db = await getDatabase();
        return await db.getChores(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get chores', error);
        return mockChores;
    }
}

export async function addChoreAsync(chore: Omit<Chore, 'id'>, userId?: string | null): Promise<Chore> {
    const withId: Chore = { ...chore, id: `chore-${Date.now()}` } as Chore;
    if (!isServer) { mockChores.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addChore(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add chore', error);
        mockChores.push(withId);
        return withId;
    }
}

export async function deleteChoreAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockChores.findIndex(c => c.id === id);
        if (idx !== -1) { mockChores.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteChore(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete chore', error);
        return false;
    }
}