
import type { DatabaseAdapter, DatabaseLogger } from './types';

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
        this.logger.info('Connected to in-memory database');
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