
import type { DatabaseAdapter, DatabaseLogger } from './types';
import type { User, Pillar, Milestone, Chore, Interest, InterestConnection, BackOfMindItem, MistakeLogEntry } from '../types';

// Initial mock data for development
const initialTasks = [
    {
        id: "task-1",
        title: "Design new homepage",
        description: "Create mockups and a prototype for the new homepage design.",
        priority: "high",
        status: "in-progress",
        userId: "user-1",
        tags: ["design", "website", "ux"],
        startDate: "2024-08-01T10:00:00.000Z",
        endDate: "2024-08-10T17:00:00.000Z",
        doDate: "2024-08-05T10:00:00.000Z",
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
        userId: "user-1",
        tags: ["development", "backend", "api"],
        startDate: "2024-08-05T09:00:00.000Z",
        endDate: "2024-08-15T18:00:00.000Z",
        doDate: "2024-08-10T09:00:00.000Z",
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
        userId: "user-1",
        tags: ["marketing", "planning", "strategy"],
        startDate: "2024-08-12T09:00:00.000Z",
        subtasks: [],
        notes: ["Focus on social media and content marketing.", "Need to coordinate with the sales team for promotions."],
    }
];

const initialTemplates = [
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

const initialDailyPlan = ['task-1'];

const initialUsers: User[] = [
    {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['user']
    },
    {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['admin']
    }
];

/**
 * In-memory adapter for testing and development
 */
export class MemoryAdapter implements DatabaseAdapter {
    private tasks: Map<string, any> = new Map();
    private templates: Map<string, any> = new Map();
    private dailyPlans: Map<string, any> = new Map();
    private users: Map<string, User> = new Map();
    private focusSessions: Map<string, any> = new Map();
    private goals: Map<string, any> = new Map();
    private pillars: Map<string, any> = new Map();
    private milestones: Map<string, any> = new Map();
    private chores: Map<string, any> = new Map();
    private interests: Map<string, any> = new Map();
    private interestConnections: Map<string, any> = new Map();
    private backOfMind: Map<string, any> = new Map();
    private mistakeLog: Map<string, any> = new Map();
    private focusReminders: Map<string, any> = new Map();
    private userProgress: Map<string, any> = new Map();
    private connected = false;

    constructor(private logger: DatabaseLogger) { }

    async connect(): Promise<boolean> {
        this.connected = true;

        // Initialize with mock data
        initialTasks.forEach(task => this.tasks.set(task.id, task));
        initialTemplates.forEach(template => this.templates.set(template.id, template));
        initialUsers.forEach(user => this.users.set(user.id, user));
        this.dailyPlans.set('default', initialDailyPlan);

        this.logger.info('Connected to in-memory database with initial data');
        return true;
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        this.tasks.clear();
        this.templates.clear();
        this.dailyPlans.clear();
        this.users.clear();
        this.goals.clear();
        this.pillars.clear();
        this.milestones.clear();
        this.chores.clear();
        this.interests.clear();
        this.interestConnections.clear();
        this.backOfMind.clear();
        this.mistakeLog.clear();
        this.focusReminders.clear();
        this.userProgress.clear();
        this.logger.info('Disconnected from in-memory database');
    }

    isConnected(): boolean {
        return this.connected;
    }

    async getAllTasks(userId?: string | null): Promise<any[]> {
        return Array.from(this.tasks.values()).filter(t => !userId || t.userId === userId);
    }

    async getTask(id: string, userId?: string | null): Promise<any | null> {
        const item = this.tasks.get(id);
        if (item && (!userId || item.userId === userId)) return item;
        return null;
    }

    async addTask(task: any, userId?: string | null): Promise<any> {
        const taskWithId = { ...task, userId: userId || task.userId, id: task.id || Date.now().toString() };
        this.tasks.set(taskWithId.id, taskWithId);
        return taskWithId;
    }

    async updateTask(task: any, userId?: string | null): Promise<any> {
        const taskWithUserId = { ...task, userId: userId || task.userId };
        this.tasks.set(taskWithUserId.id, taskWithUserId);
        return taskWithUserId;
    }

    async deleteTask(id: string, userId?: string | null): Promise<boolean> {
        return this.tasks.delete(id);
    }

    async getAllTemplates(): Promise<any[]> {
        return Array.from(this.templates.values());
    }

    async getTemplate(id: string): Promise<any | null> {
        return this.templates.get(id) || null;
    }

    async addTemplate(template: any): Promise<any> {
        const templateWithId = { ...template, id: template.id || Date.now().toString() };
        this.templates.set(templateWithId.id, templateWithId);
        return templateWithId;
    }

    async updateTemplate(template: any): Promise<any> {
        this.templates.set(template.id, template);
        return template;
    }

    async deleteTemplate(id: string): Promise<boolean> {
        return this.templates.delete(id);
    }

    async getDailyPlan(date: string, userId?: string | null): Promise<any | null> {
        const key = userId ? `${userId}_${date}` : date;
        return this.dailyPlans.get(key) || null;
    }

    async updateDailyPlan(plan: any, userId?: string | null): Promise<any> {
        const key = userId ? `${userId}_${plan.date}` : plan.date;
        this.dailyPlans.set(key, plan);
        return plan;
    }

    async getFocusSessions(userId?: string | null): Promise<any[]> {
        return Array.from(this.focusSessions.values()).filter(session => !userId || session.userId === userId);
    }

    async getActiveFocusSession(userId?: string | null): Promise<any | null> {
        return Array.from(this.focusSessions.values()).find(
            session => session.status === 'active' && (!userId || session.userId === userId)
        ) || null;
    }

    async addFocusSession(session: any, userId?: string | null): Promise<any> {
        const sessionWithId = { ...session, userId: userId || session.userId, id: session.id || Date.now().toString() };
        this.focusSessions.set(sessionWithId.id, sessionWithId);
        return sessionWithId;
    }

    async updateFocusSession(session: any, userId?: string | null): Promise<void> {
        const sessionWithUserId = { ...session, userId: userId || session.userId };
        if (this.focusSessions.has(sessionWithUserId.id)) {
            this.focusSessions.set(sessionWithUserId.id, sessionWithUserId);
        }
    }

    async finalizeOrphanedSessions(userId?: string | null): Promise<void> {
        const now = new Date().getTime();
        const fourHoursGrace = 4 * 60 * 60 * 1000;
        for (const [id, session] of this.focusSessions.entries()) {
            if (session.status === 'active' && (!userId || session.userId === userId)) {
                if (session.expectedEndTime && new Date(session.expectedEndTime).getTime() + fourHoursGrace < now) {
                    const updatedSession = { ...session };
                    updatedSession.status = 'completed';
                    updatedSession.endTime = updatedSession.expectedEndTime;
                    if (!updatedSession.events) updatedSession.events = [];
                    updatedSession.events.push({
                        type: 'stop',
                        timestamp: updatedSession.expectedEndTime
                    });

                    const startEvent = updatedSession.events.find((e: any) => e.type === 'start');
                    if (startEvent) {
                        const ms = new Date(updatedSession.expectedEndTime).getTime() - new Date(startEvent.timestamp).getTime();
                        updatedSession.duration = Math.floor(ms / 60000);
                    }

                    this.focusSessions.set(id, updatedSession);
                }
            }
        }
    }

    async getGoals(userId?: string | null): Promise<any[]> {
        return Array.from(this.goals.values()).filter(goal => !userId || goal.userId === userId);
    }

    async getGoal(id: string, userId?: string | null): Promise<any | null> {
        const goal = this.goals.get(id);
        if (goal && (!userId || goal.userId === userId)) return goal;
        return null;
    }

    async addGoal(goal: any, userId?: string | null): Promise<any> {
        const goalWithId = { ...goal, userId: userId || goal.userId, id: goal.id || Date.now().toString() };
        this.goals.set(goalWithId.id, goalWithId);
        return goalWithId;
    }

    async updateGoal(goal: any, userId?: string | null): Promise<any> {
        const goalWithId = { ...goal, userId: userId || goal.userId };
        this.goals.set(goalWithId.id, goalWithId);
        return goalWithId;
    }

    async deleteGoal(id: string, userId?: string | null): Promise<boolean> {
        return this.goals.delete(id);
    }

    async getUser(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return Array.from(this.users.values()).find(u => u.email === email) || null;
    }

    async createUser(user: User): Promise<User> {
        if (user.email && await this.getUserByEmail(user.email)) {
            throw new Error('User with this email already exists');
        }
        const userWithId = { ...user, id: user.id || Date.now().toString() };
        this.users.set(userWithId.id, userWithId);
        return userWithId;
    }

    async healthCheck(): Promise<boolean> {
        return this.connected;
    }

    // Pillar operations
    async getPillars(userId?: string | null): Promise<any[]> {
        return Array.from(this.pillars.values()).filter(p => !userId || p.userId === userId);
    }
    async getPillar(id: string, userId?: string | null): Promise<any | null> {
        const pillar = this.pillars.get(id);
        if (pillar && (!userId || pillar.userId === userId)) return pillar;
        return null;
    }
    async addPillar(pillar: any, userId?: string | null): Promise<any> {
        const pillarWithId = { ...pillar, userId: userId || pillar.userId, id: pillar.id || Date.now().toString() };
        this.pillars.set(pillarWithId.id, pillarWithId);
        return pillarWithId;
    }
    async updatePillar(pillar: any, userId?: string | null): Promise<any> {
        const pWithId = { ...pillar, userId: userId || pillar.userId };
        this.pillars.set(pWithId.id, pWithId);
        return pWithId;
    }
    async deletePillar(id: string, userId?: string | null): Promise<boolean> {
        return this.pillars.delete(id);
    }

    // Milestone operations
    async getMilestones(userId?: string | null): Promise<any[]> {
        return Array.from(this.milestones.values()).filter(m => !userId || m.userId === userId);
    }
    async getMilestone(id: string, userId?: string | null): Promise<any | null> {
        const milestone = this.milestones.get(id);
        if (milestone && (!userId || milestone.userId === userId)) return milestone;
        return null;
    }
    async addMilestone(milestone: any, userId?: string | null): Promise<any> {
        const mWithId = { ...milestone, userId: userId || milestone.userId, id: milestone.id || Date.now().toString() };
        this.milestones.set(mWithId.id, mWithId);
        return mWithId;
    }
    async updateMilestone(milestone: any, userId?: string | null): Promise<any> {
        const mWithId = { ...milestone, userId: userId || milestone.userId };
        this.milestones.set(mWithId.id, mWithId);
        return mWithId;
    }
    async deleteMilestone(id: string, userId?: string | null): Promise<boolean> {
        return this.milestones.delete(id);
    }

    // Chore operations
    async getChores(userId?: string | null): Promise<any[]> {
        return Array.from(this.chores.values()).filter(c => !userId || c.userId === userId);
    }
    async getChore(id: string, userId?: string | null): Promise<any | null> {
        const chore = this.chores.get(id);
        if (chore && (!userId || chore.userId === userId)) return chore;
        return null;
    }
    async addChore(chore: any, userId?: string | null): Promise<any> {
        const cWithId = { ...chore, userId: userId || chore.userId, id: chore.id || Date.now().toString() };
        this.chores.set(cWithId.id, cWithId);
        return cWithId;
    }
    async updateChore(chore: any, userId?: string | null): Promise<any> {
        const cWithId = { ...chore, userId: userId || chore.userId };
        this.chores.set(cWithId.id, cWithId);
        return cWithId;
    }
    async deleteChore(id: string, userId?: string | null): Promise<boolean> {
        return this.chores.delete(id);
    }

    // Interest operations
    async getInterests(userId?: string | null): Promise<any[]> {
        return Array.from(this.interests.values()).filter(i => !userId || i.userId === userId);
    }
    async getInterest(id: string, userId?: string | null): Promise<any | null> {
        const interest = this.interests.get(id);
        if (interest && (!userId || interest.userId === userId)) return interest;
        return null;
    }
    async addInterest(interest: any, userId?: string | null): Promise<any> {
        const iWithId = { ...interest, userId: userId || interest.userId, id: interest.id || Date.now().toString() };
        this.interests.set(iWithId.id, iWithId);
        return iWithId;
    }
    async updateInterest(interest: any, userId?: string | null): Promise<any> {
        const iWithId = { ...interest, userId: userId || interest.userId };
        this.interests.set(iWithId.id, iWithId);
        return iWithId;
    }
    async deleteInterest(id: string, userId?: string | null): Promise<boolean> {
        // Also delete any connections involving this interest
        for (const [connId, conn] of this.interestConnections.entries()) {
            if (conn.sourceId === id || conn.targetId === id) {
                this.interestConnections.delete(connId);
            }
        }
        return this.interests.delete(id);
    }

    // InterestConnection operations
    async getInterestConnections(userId?: string | null): Promise<any[]> {
        return Array.from(this.interestConnections.values()).filter(c => !userId || c.userId === userId);
    }
    async addInterestConnection(connection: any, userId?: string | null): Promise<any> {
        const cWithId = { ...connection, userId: userId || connection.userId, id: connection.id || Date.now().toString() };
        this.interestConnections.set(cWithId.id, cWithId);
        return cWithId;
    }
    async deleteInterestConnection(id: string, userId?: string | null): Promise<boolean> {
        return this.interestConnections.delete(id);
    }

    // BackOfMind operations
    async getBackOfMindItems(userId?: string | null): Promise<any[]> {
        const items = Array.from(this.backOfMind.values()).filter(i => !userId || i.userId === userId);
        return items.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    async getBackOfMindItem(id: string, userId?: string | null): Promise<any | null> {
        const item = this.backOfMind.get(id);
        if (item && (!userId || item.userId === userId)) return item;
        return null;
    }
    async addBackOfMindItem(item: any, userId?: string | null): Promise<any> {
        const iWithId = { ...item, userId: userId || item.userId, id: item.id || Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.backOfMind.set(iWithId.id, iWithId);
        return iWithId;
    }
    async updateBackOfMindItem(item: any, userId?: string | null): Promise<any> {
        const iWithId = { ...item, userId: userId || item.userId, updatedAt: new Date().toISOString() };
        this.backOfMind.set(iWithId.id, iWithId);
        return iWithId;
    }
    async deleteBackOfMindItem(id: string, userId?: string | null): Promise<boolean> {
        return this.backOfMind.delete(id);
    }

    // FocusReminders operations
    async getFocusReminders(userId?: string | null): Promise<any | null> {
        const key = userId || 'default';
        return this.focusReminders.get(key) || null;
    }
    async upsertFocusReminders(reminders: any, userId?: string | null): Promise<any> {
        const key = userId || 'default';
        const data = { ...reminders, userId: userId || reminders.userId };
        this.focusReminders.set(key, data);
        return data;
    }

    // MistakeLog operations
    async getMistakeLogEntries(userId?: string | null): Promise<any[]> {
        const items = Array.from(this.mistakeLog.values()).filter(i => !userId || i.userId === userId);
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getMistakeLogEntry(id: string, userId?: string | null): Promise<any | null> {
        const item = this.mistakeLog.get(id);
        if (item && (!userId || item.userId === userId)) return item;
        return null;
    }
    async addMistakeLogEntry(entry: any, userId?: string | null): Promise<any> {
        const eWithId = { ...entry, userId: userId || entry.userId, id: entry.id || Date.now().toString(), createdAt: new Date().toISOString() };
        this.mistakeLog.set(eWithId.id, eWithId);
        return eWithId;
    }
    async updateMistakeLogEntry(entry: any, userId?: string | null): Promise<any> {
        const eWithId = { ...entry, userId: userId || entry.userId };
        this.mistakeLog.set(eWithId.id, eWithId);
        return eWithId;
    }
    async deleteMistakeLogEntry(id: string, userId?: string | null): Promise<boolean> {
        return this.mistakeLog.delete(id);
    }

    // UserProgress operations
    async getUserProgress(userId: string): Promise<any | null> {
        return this.userProgress.get(userId) || null;
    }
    
    async upsertUserProgress(progress: any): Promise<any> {
        const userId = progress.userId;
        if (!userId) throw new Error("userId is required for UserProgress");
        this.userProgress.set(userId, progress);
        return progress;
    }
}