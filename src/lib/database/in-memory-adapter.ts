
import type { DatabaseAdapter, DatabaseLogger } from './types';

// Initial mock data for development
const initialTasks = [
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
    {
        id: 'habit-1',
        title: 'Daily Reading',
        description: 'Read for at least 30 minutes every day',
        priority: 'medium',
        status: 'in-progress',
        isHabit: true,
        habitFrequency: 'daily',
        streakGoal: 30,
        completionHistory: ['2024-08-01', '2024-08-02', '2024-08-03'],
        lastCompletedDate: '2024-08-03',
        subtasks: [],
        notes: [],
        tags: ['reading', 'personal-development'],
        dailyStatus: [
            { date: '2024-08-01', status: 'changes observed' },
            { date: '2024-08-02', status: 'changes observed' },
            { date: '2024-08-03', status: 'no changes' },
        ]
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

/**
 * In-memory adapter for testing and development
 */
export class MemoryAdapter implements DatabaseAdapter {
    private tasks: Map<string, any> = new Map();
    private templates: Map<string, any> = new Map();
    private dailyPlans: Map<string, any> = new Map();
    private connected = false;

    constructor(private logger: DatabaseLogger) { }

    async connect(): Promise<boolean> {
        this.connected = true;

        // Initialize with mock data
        initialTasks.forEach(task => this.tasks.set(task.id, task));
        initialTemplates.forEach(template => this.templates.set(template.id, template));
        this.dailyPlans.set('default', initialDailyPlan);

        this.logger.info('Connected to in-memory database with initial data');
        return true;
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        this.tasks.clear();
        this.templates.clear();
        this.dailyPlans.clear();
        this.logger.info('Disconnected from in-memory database');
    }

    isConnected(): boolean {
        return this.connected;
    }

    async getAllTasks(): Promise<any[]> {
        return Array.from(this.tasks.values());
    }

    async getTask(id: string): Promise<any | null> {
        return this.tasks.get(id) || null;
    }

    async addTask(task: any): Promise<any> {
        const taskWithId = { ...task, id: task.id || Date.now().toString() };
        this.tasks.set(taskWithId.id, taskWithId);
        return taskWithId;
    }

    async updateTask(task: any): Promise<any> {
        this.tasks.set(task.id, task);
        return task;
    }

    async deleteTask(id: string): Promise<boolean> {
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

    async getDailyPlan(date: string): Promise<any | null> {
        return this.dailyPlans.get(date) || null;
    }

    async updateDailyPlan(plan: any): Promise<any> {
        this.dailyPlans.set(plan.date, plan);
        return plan;
    }

    async healthCheck(): Promise<boolean> {
        return this.connected;
    }
}