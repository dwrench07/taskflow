/**
 * Data service layer that uses the database abstraction
 */

import type { Task, Project, TaskTemplate, User, FocusSession, Goal, Pillar, Milestone, Interest, InterestConnection, BackOfMindItem, MistakeLogEntry, FocusReminders, UserProgress, Status } from './types';
import type { DatabaseAdapter, DailyPlan } from './database/types';
import { DatabaseFactory } from './database/factory';
import { config, isServer } from './config';
import { defaultLogger } from './database/types';

let dbAdapter: DatabaseAdapter | null = null;

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

async function getDatabase(): Promise<DatabaseAdapter> {
    if (!dbAdapter || !dbAdapter.isConnected()) {
        return await initializeDatabase();
    }
    return dbAdapter;
}

// Mock data for client-side
const mockProjects: Project[] = [
    { id: "project-1", title: "Design new homepage", description: "Mockups and prototype.", tags: ["design"] },
];

const mockTasks: Task[] = [
    { id: "task-1", projectId: "project-1", title: "Create wireframes", status: "done", priority: "high", category: "project-work", recurrence: "once", subtasks: [], notes: [] },
    { id: "task-2", projectId: "project-1", title: "Develop high-fidelity mockups", status: "in-progress", priority: "high", category: "project-work", recurrence: "once", subtasks: [], notes: [] },
    { id: "task-3", title: "Plan Q4 Marketing Campaign", status: "todo", priority: "medium", category: "project-work", recurrence: "once", tags: ["marketing"], subtasks: [], notes: [] },
];

const mockTemplates: TaskTemplate[] = [];
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
const mockInterests: Interest[] = [];
const mockInterestConnections: InterestConnection[] = [];
const mockBackOfMindItems: BackOfMindItem[] = [];
const mockMistakeLogEntries: MistakeLogEntry[] = [];
let mockFocusReminders: FocusReminders | null = null;
let mockUserProgress: UserProgress | null = null;

// === TASKS ===

export async function getAllTasksAsync(userId?: string | null): Promise<Task[]> {
    if (!isServer) return mockTasks;
    try {
        const db = await getDatabase();
        return await db.getAllTasks(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get tasks from database, returning mock data', error);
        return mockTasks;
    }
}

export async function getTaskAsync(taskId: string, userId?: string | null): Promise<Task | null> {
    if (!isServer) return mockTasks.find(t => t.id === taskId) || null;
    try {
        const db = await getDatabase();
        return await db.getTask(taskId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get task from database, checking mock data', { taskId, error });
        return mockTasks.find(t => t.id === taskId) || null;
    }
}

export async function getTasksByProjectAsync(projectId: string, userId?: string | null): Promise<Task[]> {
    const all = await getAllTasksAsync(userId);
    return all.filter(t => t.projectId === projectId);
}

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

export async function updateTaskAsync(updatedTask: Task, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockTasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) mockTasks[index] = updatedTask;
        return;
    }
    try {
        const db = await getDatabase();
        await db.updateTask(updatedTask, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update task in database', { task: updatedTask, error });
        const index = mockTasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) mockTasks[index] = updatedTask;
    }
}

export async function deleteTaskAsync(taskId: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const index = mockTasks.findIndex(t => t.id === taskId);
        if (index !== -1) { mockTasks.splice(index, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteTask(taskId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete task from database', { taskId, error });
        const index = mockTasks.findIndex(t => t.id === taskId);
        if (index !== -1) { mockTasks.splice(index, 1); return true; }
        return false;
    }
}

// === PROJECTS ===

export async function getAllProjectsAsync(userId?: string | null): Promise<Project[]> {
    if (!isServer) return mockProjects;
    try {
        const db = await getDatabase();
        return await db.getAllProjects(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get projects from database, returning mock data', error);
        return mockProjects;
    }
}

export async function getProjectAsync(projectId: string, userId?: string | null): Promise<Project | null> {
    if (!isServer) return mockProjects.find(p => p.id === projectId) || null;
    try {
        const db = await getDatabase();
        return await db.getProject(projectId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get project from database, checking mock data', { projectId, error });
        return mockProjects.find(p => p.id === projectId) || null;
    }
}

export async function getProjectWithTasksAsync(projectId: string, userId?: string | null): Promise<{ project: Project; tasks: Task[] } | null> {
    const project = await getProjectAsync(projectId, userId);
    if (!project) return null;
    const tasks = await getTasksByProjectAsync(projectId, userId);
    return { project, tasks };
}

export async function addProjectAsync(newProject: Omit<Project, 'id'>, userId?: string | null): Promise<Project> {
    const withId: Project = { ...newProject, id: `project-${Date.now()}` };
    if (!isServer) { mockProjects.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addProject(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add project to database, adding to mock data', { project: withId, error });
        mockProjects.push(withId);
        return withId;
    }
}

export async function updateProjectAsync(updatedProject: Project, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockProjects.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) mockProjects[index] = updatedProject;
        return;
    }
    try {
        const db = await getDatabase();
        await db.updateProject(updatedProject, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update project in database', { project: updatedProject, error });
        const index = mockProjects.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) mockProjects[index] = updatedProject;
    }
}

export async function deleteProjectAsync(projectId: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        // Orphan child tasks
        mockTasks.forEach(t => { if (t.projectId === projectId) delete (t as any).projectId; });
        const index = mockProjects.findIndex(p => p.id === projectId);
        if (index !== -1) { mockProjects.splice(index, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteProject(projectId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete project from database', { projectId, error });
        return false;
    }
}

/**
 * Roll-up helpers — Project status/progress is derived, not stored.
 */
export function deriveProjectStatus(tasks: Task[]): Status {
    if (tasks.length === 0) return 'todo';
    const oneTime = tasks.filter(t => t.recurrence === 'once');
    const considered = oneTime.length > 0 ? oneTime : tasks;
    if (considered.every(t => t.status === 'done')) return 'done';
    if (considered.every(t => t.status === 'abandoned')) return 'abandoned';
    if (considered.some(t => t.status === 'in-progress')) return 'in-progress';
    return 'todo';
}

export function deriveProjectProgress(tasks: Task[]): { done: number; total: number; pct: number } {
    const oneTime = tasks.filter(t => t.recurrence === 'once');
    const total = oneTime.length;
    const done = oneTime.filter(t => t.status === 'done').length;
    return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// === TEMPLATES ===

export async function getAllTemplatesAsync(): Promise<TaskTemplate[]> {
    if (!isServer) return mockTemplates;
    try {
        const db = await getDatabase();
        return await db.getAllTemplates();
    } catch (error) {
        defaultLogger.warn('Failed to get templates from database, returning mock data', error);
        return mockTemplates;
    }
}

export async function addTemplateAsync(newTemplate: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate> {
    const withId: TaskTemplate = { ...newTemplate, id: `template-${Date.now()}` };
    if (!isServer) { mockTemplates.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addTemplate(withId);
    } catch (error) {
        defaultLogger.warn('Failed to add template to database, adding to mock data', { template: withId, error });
        mockTemplates.push(withId);
        return withId;
    }
}

export async function updateTemplateAsync(updatedTemplate: TaskTemplate): Promise<void> {
    if (!isServer) {
        const index = mockTemplates.findIndex(t => t.id === updatedTemplate.id);
        if (index !== -1) mockTemplates[index] = updatedTemplate;
        return;
    }
    try {
        const db = await getDatabase();
        await db.updateTemplate(updatedTemplate);
    } catch (error) {
        defaultLogger.warn('Failed to update template in database', { template: updatedTemplate, error });
        const index = mockTemplates.findIndex(t => t.id === updatedTemplate.id);
        if (index !== -1) mockTemplates[index] = updatedTemplate;
    }
}

export async function deleteTemplateAsync(templateId: string): Promise<void> {
    if (!isServer) {
        const index = mockTemplates.findIndex(t => t.id === templateId);
        if (index !== -1) mockTemplates.splice(index, 1);
        return;
    }
    try {
        const db = await getDatabase();
        await db.deleteTemplate(templateId);
    } catch (error) {
        defaultLogger.warn('Failed to delete template from database', { templateId, error });
        const index = mockTemplates.findIndex(t => t.id === templateId);
        if (index !== -1) mockTemplates.splice(index, 1);
    }
}

// === FOCUS SESSIONS ===

export async function getFocusSessionsAsync(userId?: string | null): Promise<FocusSession[]> {
    if (!isServer) return mockFocusSessions;
    try {
        const db = await getDatabase();
        return await db.getFocusSessions(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get focus sessions from database, returning mock data', error);
        return mockFocusSessions;
    }
}

export async function addFocusSessionAsync(newSession: Omit<FocusSession, 'id'>, userId?: string | null): Promise<FocusSession> {
    const sessionWithId: FocusSession = { ...newSession, id: `focus-${Date.now()}` };
    if (!isServer) { mockFocusSessions.push(sessionWithId); return sessionWithId; }
    try {
        const db = await getDatabase();
        return await db.addFocusSession(sessionWithId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add focus session to database, adding to mock data', { session: sessionWithId, error });
        mockFocusSessions.push(sessionWithId);
        return sessionWithId;
    }
}

export async function getActiveFocusSessionAsync(userId?: string | null): Promise<FocusSession | null> {
    if (!isServer) return mockFocusSessions.find(s => s.status === 'active' && (!userId || s.userId === userId)) || null;
    try {
        const db = await getDatabase();
        return await db.getActiveFocusSession(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get active focus session from database, returning mock data', error);
        return mockFocusSessions.find(s => s.status === 'active' && (!userId || s.userId === userId)) || null;
    }
}

export async function updateFocusSessionAsync(session: FocusSession, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockFocusSessions.findIndex(s => s.id === session.id);
        if (index !== -1) mockFocusSessions[index] = session;
        return;
    }
    try {
        const db = await getDatabase();
        await db.updateFocusSession(session, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update focus session in database', { session, error });
        const index = mockFocusSessions.findIndex(s => s.id === session.id);
        if (index !== -1) mockFocusSessions[index] = session;
    }
}

export async function finalizeOrphanedSessionsAsync(userId?: string | null): Promise<void> {
    if (!isServer) return;
    try {
        const db = await getDatabase();
        await db.finalizeOrphanedSessions(userId);
    } catch (error) {
        defaultLogger.warn('Failed to finalize orphaned sessions', error);
    }
}

// === GOALS ===

export async function getGoalsAsync(userId?: string | null): Promise<Goal[]> {
    if (!isServer) return mockGoals;
    try {
        const db = await getDatabase();
        return await db.getGoals(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get goals from database, returning mock data', error);
        return mockGoals;
    }
}

export async function getGoalAsync(id: string, userId?: string | null): Promise<Goal | null> {
    if (!isServer) return mockGoals.find(g => g.id === id) || null;
    try {
        const db = await getDatabase();
        return await db.getGoal(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get goal from database, returning mock data', error);
        return mockGoals.find(g => g.id === id) || null;
    }
}

export async function addGoalAsync(newGoal: Omit<Goal, 'id'>, userId?: string | null): Promise<Goal> {
    const goalWithId: Goal = { ...newGoal, id: `goal-${Date.now()}` };
    if (!isServer) { mockGoals.push(goalWithId); return goalWithId; }
    try {
        const db = await getDatabase();
        return await db.addGoal(goalWithId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add goal to database, adding to mock data', { goal: goalWithId, error });
        mockGoals.push(goalWithId);
        return goalWithId;
    }
}

export async function updateGoalAsync(updatedGoal: Goal, userId?: string | null): Promise<void> {
    if (!isServer) {
        const index = mockGoals.findIndex(g => g.id === updatedGoal.id);
        if (index !== -1) mockGoals[index] = updatedGoal;
        return;
    }
    try {
        const db = await getDatabase();
        await db.updateGoal(updatedGoal, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update goal in database', { goal: updatedGoal, error });
        const index = mockGoals.findIndex(g => g.id === updatedGoal.id);
        if (index !== -1) mockGoals[index] = updatedGoal;
    }
}

export async function deleteGoalAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const index = mockGoals.findIndex(g => g.id === id);
        if (index !== -1) { mockGoals.splice(index, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteGoal(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete goal from database', { id, error });
        return false;
    }
}

// === DAILY PLAN ===

export async function getDailyPlanAsync(date?: string, userId?: string | null): Promise<string[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!isServer) return mockDailyPlan;
    try {
        const db = await getDatabase();
        const plan = await db.getDailyPlan(targetDate, userId);
        return plan?.tasks || [];
    } catch (error) {
        defaultLogger.warn('Failed to get daily plan from database, returning mock data', error);
        return mockDailyPlan;
    }
}

export async function updateDailyPlanAsync(taskIds: string[], date?: string, userId?: string | null): Promise<void> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!isServer) { mockDailyPlan = taskIds; return; }
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
        mockDailyPlan = taskIds;
    }
}

export async function healthCheckAsync(): Promise<boolean> {
    if (!isServer) return true;
    try {
        const db = await getDatabase();
        return await db.healthCheck();
    } catch (error) {
        defaultLogger.error('Database health check failed', error);
        return false;
    }
}

if (isServer) {
    initializeDatabase().catch((error) => {
        defaultLogger.error('Failed to initialize database on startup', error);
    });
}

// === USERS ===

export async function getUserAsync(userId: string): Promise<User | null> {
    if (!isServer) return mockUsers.find(u => u.id === userId) || null;
    try {
        const db = await getDatabase();
        return await db.getUser(userId);
    } catch (error) {
        defaultLogger.error(`Failed to get user ${userId}`, error);
        return null;
    }
}

export async function getUserByEmailAsync(email: string): Promise<User | null> {
    if (!isServer) return mockUsers.find(u => u.email === email) || null;
    try {
        const db = await getDatabase();
        return await db.getUserByEmail(email);
    } catch (error) {
        defaultLogger.error(`Failed to get user by email ${email}`, error);
        return null;
    }
}

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
    if (!isServer) return mockPillars.find(p => p.id === id) || null;
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

// === INTERESTS ===

export async function getInterestsAsync(userId?: string | null): Promise<Interest[]> {
    if (!isServer) return mockInterests;
    try {
        const db = await getDatabase();
        return await db.getInterests(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get interests', error);
        return mockInterests;
    }
}

export async function addInterestAsync(interest: Omit<Interest, 'id'>, userId?: string | null): Promise<Interest> {
    const withId: Interest = { ...interest, id: `interest-${Date.now()}` } as Interest;
    if (!isServer) { mockInterests.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addInterest(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add interest', error);
        mockInterests.push(withId);
        return withId;
    }
}

export async function updateInterestAsync(interest: Interest, userId?: string | null): Promise<void> {
    if (!isServer) {
        const idx = mockInterests.findIndex(i => i.id === interest.id);
        if (idx !== -1) mockInterests[idx] = interest;
        return;
    }
    try {
        const db = await getDatabase();
        await db.updateInterest(interest, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update interest', error);
        const idx = mockInterests.findIndex(i => i.id === interest.id);
        if (idx !== -1) mockInterests[idx] = interest;
    }
}

export async function deleteInterestAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockInterests.findIndex(i => i.id === id);
        if (idx !== -1) { mockInterests.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteInterest(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete interest', error);
        return false;
    }
}

// === INTEREST CONNECTIONS ===

export async function getInterestConnectionsAsync(userId?: string | null): Promise<InterestConnection[]> {
    if (!isServer) return mockInterestConnections;
    try {
        const db = await getDatabase();
        return await db.getInterestConnections(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get interest connections', error);
        return mockInterestConnections;
    }
}

export async function addInterestConnectionAsync(connection: Omit<InterestConnection, 'id'>, userId?: string | null): Promise<InterestConnection> {
    const withId: InterestConnection = { ...connection, id: `iconn-${Date.now()}` } as InterestConnection;
    if (!isServer) { mockInterestConnections.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addInterestConnection(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add interest connection', error);
        mockInterestConnections.push(withId);
        return withId;
    }
}

export async function deleteInterestConnectionAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockInterestConnections.findIndex(c => c.id === id);
        if (idx !== -1) { mockInterestConnections.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteInterestConnection(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete interest connection', error);
        return false;
    }
}

// === BACK OF MIND ===

export async function getBackOfMindItemsAsync(userId?: string | null): Promise<BackOfMindItem[]> {
    if (!isServer) return mockBackOfMindItems;
    try {
        const db = await getDatabase();
        return await db.getBackOfMindItems(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get back of mind items', error);
        return mockBackOfMindItems;
    }
}

export async function getBackOfMindItemAsync(id: string, userId?: string | null): Promise<BackOfMindItem | null> {
    if (!isServer) return mockBackOfMindItems.find(i => i.id === id) || null;
    try {
        const db = await getDatabase();
        return await db.getBackOfMindItem(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get back of mind item', { id, error });
        return mockBackOfMindItems.find(i => i.id === id) || null;
    }
}

export async function addBackOfMindItemAsync(item: Omit<BackOfMindItem, 'id' | 'createdAt' | 'updatedAt'>, userId?: string | null): Promise<BackOfMindItem> {
    const withId: BackOfMindItem = {
        ...item,
        id: `bom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    if (userId) withId.userId = userId;
    if (!isServer) { mockBackOfMindItems.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addBackOfMindItem(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add back of mind item', error);
        mockBackOfMindItems.push(withId);
        return withId;
    }
}

export async function updateBackOfMindItemAsync(item: BackOfMindItem, userId?: string | null): Promise<BackOfMindItem> {
    const withId: BackOfMindItem = { ...item, updatedAt: new Date().toISOString() };
    if (userId) withId.userId = userId;
    if (!isServer) {
        const idx = mockBackOfMindItems.findIndex(i => i.id === item.id);
        if (idx !== -1) mockBackOfMindItems[idx] = withId;
        return withId;
    }
    try {
        const db = await getDatabase();
        return await db.updateBackOfMindItem(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update back of mind item', error);
        const idx = mockBackOfMindItems.findIndex(i => i.id === item.id);
        if (idx !== -1) mockBackOfMindItems[idx] = withId;
        return withId;
    }
}

export async function deleteBackOfMindItemAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockBackOfMindItems.findIndex(i => i.id === id);
        if (idx !== -1) { mockBackOfMindItems.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteBackOfMindItem(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete back of mind item', error);
        return false;
    }
}

// === MISTAKE LOG ===

export async function getMistakeLogEntriesAsync(userId?: string | null): Promise<MistakeLogEntry[]> {
    if (!isServer) return mockMistakeLogEntries;
    try {
        const db = await getDatabase();
        return await db.getMistakeLogEntries(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get mistake log entries', error);
        return mockMistakeLogEntries;
    }
}

export async function getMistakeLogEntryAsync(id: string, userId?: string | null): Promise<MistakeLogEntry | null> {
    if (!isServer) return mockMistakeLogEntries.find(i => i.id === id) || null;
    try {
        const db = await getDatabase();
        return await db.getMistakeLogEntry(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to get mistake log entry', { id, error });
        return mockMistakeLogEntries.find(i => i.id === id) || null;
    }
}

export async function addMistakeLogEntryAsync(entry: Omit<MistakeLogEntry, 'id' | 'createdAt'>, userId?: string | null): Promise<MistakeLogEntry> {
    const withId: MistakeLogEntry = {
        ...entry,
        id: `mlog-${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    if (userId) withId.userId = userId;
    if (!isServer) { mockMistakeLogEntries.push(withId); return withId; }
    try {
        const db = await getDatabase();
        return await db.addMistakeLogEntry(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to add mistake log entry', error);
        mockMistakeLogEntries.push(withId);
        return withId;
    }
}

export async function updateMistakeLogEntryAsync(entry: MistakeLogEntry, userId?: string | null): Promise<MistakeLogEntry> {
    const withId = { ...entry };
    if (userId) withId.userId = userId;
    if (!isServer) {
        const idx = mockMistakeLogEntries.findIndex(i => i.id === entry.id);
        if (idx !== -1) mockMistakeLogEntries[idx] = withId;
        return withId;
    }
    try {
        const db = await getDatabase();
        return await db.updateMistakeLogEntry(withId, userId);
    } catch (error) {
        defaultLogger.warn('Failed to update mistake log entry', error);
        const idx = mockMistakeLogEntries.findIndex(i => i.id === entry.id);
        if (idx !== -1) mockMistakeLogEntries[idx] = withId;
        return withId;
    }
}

export async function deleteMistakeLogEntryAsync(id: string, userId?: string | null): Promise<boolean> {
    if (!isServer) {
        const idx = mockMistakeLogEntries.findIndex(i => i.id === id);
        if (idx !== -1) { mockMistakeLogEntries.splice(idx, 1); return true; }
        return false;
    }
    try {
        const db = await getDatabase();
        return await db.deleteMistakeLogEntry(id, userId);
    } catch (error) {
        defaultLogger.warn('Failed to delete mistake log entry', error);
        return false;
    }
}

// === FOCUS REMINDERS ===

export async function getFocusRemindersAsync(userId?: string | null): Promise<FocusReminders | null> {
    if (!isServer) return mockFocusReminders;
    try {
        const db = await getDatabase();
        return await db.getFocusReminders(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get focus reminders', error);
        return mockFocusReminders;
    }
}

export async function upsertFocusRemindersAsync(reminders: FocusReminders, userId?: string | null): Promise<FocusReminders> {
    if (userId) reminders.userId = userId;
    if (!isServer) { mockFocusReminders = reminders; return reminders; }
    try {
        const db = await getDatabase();
        return await db.upsertFocusReminders(reminders, userId);
    } catch (error) {
        defaultLogger.warn('Failed to upsert focus reminders', error);
        mockFocusReminders = reminders;
        return reminders;
    }
}

// === USER PROGRESS ===

export async function getUserProgressAsync(userId: string): Promise<UserProgress | null> {
    if (!isServer) return mockUserProgress;
    try {
        const db = await getDatabase();
        return await db.getUserProgress(userId);
    } catch (error) {
        defaultLogger.warn('Failed to get user progress', error);
        return mockUserProgress;
    }
}

export async function upsertUserProgressAsync(progress: UserProgress): Promise<UserProgress> {
    if (!isServer) { mockUserProgress = progress; return progress; }
    try {
        const db = await getDatabase();
        return await db.upsertUserProgress(progress);
    } catch (error) {
        defaultLogger.warn('Failed to upsert user progress', error);
        mockUserProgress = progress;
        return progress;
    }
}
