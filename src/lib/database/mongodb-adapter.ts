/**
 * MongoDB adapter implementation for the database abstraction layer
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import type { DatabaseAdapter, DatabaseConfig, DatabaseLogger, DatabaseError, DailyPlan } from './types';
import type { Task, TaskTemplate, User } from '../types';

export class MongoDBAdapter implements DatabaseAdapter {
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private isConnectedFlag = false;

    private tasksCollection: Collection<Task> | null = null;
    private templatesCollection: Collection<TaskTemplate> | null = null;
    private dailyPlansCollection: Collection<DailyPlan> | null = null;
    private usersCollection: Collection<User> | null = null;

    constructor(
        private config: DatabaseConfig,
        private logger: DatabaseLogger
    ) { }

    async connect(): Promise<boolean> {
        try {
            this.logger.info('Connecting to MongoDB...', {
                host: this.config.host,
                port: this.config.port,
                database: this.config.databaseName,
            });

            const connectionString = this.config.connectionString ||
                `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.databaseName}?authSource=${this.config.username}`;

            this.client = new MongoClient(connectionString, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            await this.client.connect();
            this.db = this.client.db(this.config.databaseName);

            // Initialize collections
            this.tasksCollection = this.db.collection(this.config.collections?.tasks || 'tasks');
            this.templatesCollection = this.db.collection(this.config.collections?.templates || 'templates');
            this.dailyPlansCollection = this.db.collection(this.config.collections?.dailyPlans || 'dailyPlans');
            this.usersCollection = this.db.collection(this.config.collections?.users_dev || 'users_dev');

            // Create indexes for better performance
            await this.createIndexes();

            this.isConnectedFlag = true;
            this.logger.info('Successfully connected to MongoDB');
            return true;
        } catch (error) {
            this.logger.error('Failed to connect to MongoDB', error);
            throw new Error(`MongoDB connection failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            this.isConnectedFlag = false;
            this.logger.info('Disconnected from MongoDB');
        }
    }

    isConnected(): boolean {
        return this.isConnectedFlag && this.client !== null;
    }

    // Task operations
    async getAllTasks(userId: string | null = null): Promise<Task[]> {
        this.ensureConnected();
        try {
            const tasks = await this.tasksCollection!.find({userId}).toArray();
            return tasks.map(this.convertFromMongo);
        } catch (error) {
            this.logger.error('Failed to get all tasks', error);
            throw new Error(`Failed to get tasks: ${error}`);
        }
    }

    async getTask(id: string, userId: string | null = null): Promise<Task | null> {
        this.ensureConnected();
        try {
            const task = await this.tasksCollection!.findOne({ _id: id, userId });
            return task ? this.convertFromMongo(task) : null;
        } catch (error) {
            this.logger.error('Failed to get task', { id, error });
            throw new Error(`Failed to get task: ${error}`);
        }
    }

    async addTask(task: Task, userId: string | null = null): Promise<Task> {
        this.ensureConnected();
        try {
            const taskToInsert = this.convertToMongo({...task, userId});
            const result = await this.tasksCollection!.insertOne(taskToInsert);

            if (!result.acknowledged) {
                throw new Error('Task insertion was not acknowledged');
            }

            return { ...task, id: result.insertedId.toString() };
        } catch (error) {
            this.logger.error('Failed to add task', { task, error });
            throw new Error(`Failed to add task: ${error}`);
        }
    }

    async updateTask(task: Task, userId: string | null = null): Promise<Task> {
        this.ensureConnected();
        try {
            const taskToUpdate = this.convertToMongo(task);
            const { _id, ...updateData } = taskToUpdate;

            const result = await this.tasksCollection!.updateOne(
                { _id: task.id },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date().toISOString()
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Task not found');
            }

            return task;
        } catch (error) {
            this.logger.error('Failed to update task', { task, error });
            throw new Error(`Failed to update task: ${error}`);
        }
    }

    async deleteTask(id: string, userId: string | null = null): Promise<boolean> {
        this.ensureConnected();
        try {
            const result = await this.tasksCollection!.deleteOne({ _id: id, userId });
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete task', { id, error });
            throw new Error(`Failed to delete task: ${error}`);
        }
    }

    // Template operations
    async getAllTemplates(userId: string | null = null): Promise<TaskTemplate[]> {
        this.ensureConnected();
        try {
            const templates = await this.templatesCollection!.find({userId}).toArray();
            return templates.map(this.convertFromMongo);
        } catch (error) {
            this.logger.error('Failed to get all templates', error);
            throw new Error(`Failed to get templates: ${error}`);
        }
    }

    async getTemplate(id: string, userId: string | null = null): Promise<TaskTemplate | null> {
        this.ensureConnected();
        try {
            const template = await this.templatesCollection!.findOne({ _id: id, userId });
            return template ? this.convertFromMongo(template) : null;
        } catch (error) {
            this.logger.error('Failed to get template', { id, error });
            throw new Error(`Failed to get template: ${error}`);
        }
    }

    async addTemplate(template: TaskTemplate, userId: string | null = null): Promise<TaskTemplate> {
        this.ensureConnected();
        try {
            const templateToInsert = this.convertToMongo(template);
            const result = await this.templatesCollection!.insertOne(templateToInsert);

            if (!result.acknowledged) {
                throw new Error('Template insertion was not acknowledged');
            }

            return { ...template, id: result.insertedId.toString() };
        } catch (error) {
            this.logger.error('Failed to add template', { template, error });
            throw new Error(`Failed to add template: ${error}`);
        }
    }

    async updateTemplate(template: TaskTemplate, userId: string | null = null): Promise<TaskTemplate> {
        this.ensureConnected();
        try {
            const templateToUpdate = this.convertToMongo(template);
            const { _id, ...updateData } = templateToUpdate;

            const result = await this.templatesCollection!.updateOne(
                { _id: template.id },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date().toISOString()
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            this.logger.error('Failed to update template', { template, error });
            throw new Error(`Failed to update template: ${error}`);
        }
    }

    async deleteTemplate(id: string, userId: string | null = null): Promise<boolean> {
        this.ensureConnected();
        try {
            const result = await this.templatesCollection!.deleteOne({ _id: id, userId });
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete template', { id, error });
            throw new Error(`Failed to delete template: ${error}`);
        }
    }

    // Daily plan operations
    async getDailyPlan(date: string, userId: string | null = null): Promise<DailyPlan | null> {
        this.ensureConnected();
        try {
            const plan = await this.dailyPlansCollection!.findOne({ date, userId });
            return plan ? this.convertFromMongo(plan) : null;
        } catch (error) {
            this.logger.error('Failed to get daily plan', { date, error });
            throw new Error(`Failed to get daily plan: ${error}`);
        }
    }

    async updateDailyPlan(plan: DailyPlan, userId: string | null = null): Promise<DailyPlan> {
        this.ensureConnected();
        try {
            const planToUpdate = this.convertToMongo(plan);
            const result = await this.dailyPlansCollection!.updateOne(
                { date: plan.date },
                {
                    $set: {
                        ...planToUpdate,
                        updatedAt: new Date().toISOString()
                    }
                },
                { upsert: true }
            );

            return plan;
        } catch (error) {
            this.logger.error('Failed to update daily plan', { plan, error });
            throw new Error(`Failed to update daily plan: ${error}`);
        }
    }

    // User operations
    async getUser(id: string): Promise<User | null> {
        this.ensureConnected();
        try {
            const user = await this.usersCollection!.findOne({ login_id: id });
            console.log('MongoDBAdapter.getUser - retrieved user:', user, id);
            return user ? this.convertFromMongo(user) : null;
        } catch (error) {
            this.logger.error('Failed to get user', { id, error });
            throw new Error(`Failed to get user: ${error}`);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            if (!this.isConnected()) {
                return false;
            }

            // Ping the database
            await this.db!.admin().ping();
            return true;
        } catch (error) {
            this.logger.error('Health check failed', error);
            return false;
        }
    }

    // Helper methods
    private ensureConnected(): void {
        if (!this.isConnected()) {
            throw new Error('Database not connected');
        }
    }

    private convertToMongo<T extends { id: string }>(item: T): any {
        const { id, ...rest } = item;
        return {
            _id: id,
            ...rest,
            createdAt: (rest as any).createdAt || new Date().toISOString(),
        };
    }

    private convertFromMongo<T>(item: any): T {
        const { _id, ...rest } = item;
        return {
            id: _id,
            ...rest,
        } as T;
    }

    private async createIndexes(): Promise<void> {
        try {
            // Create indexes for better performance
            await this.tasksCollection!.createIndex({ status: 1 });
            await this.tasksCollection!.createIndex({ priority: 1 });
            await this.tasksCollection!.createIndex({ tags: 1 });
            await this.tasksCollection!.createIndex({ createdAt: 1 });

            await this.templatesCollection!.createIndex({ tags: 1 });
            await this.templatesCollection!.createIndex({ createdAt: 1 });

            await this.dailyPlansCollection!.createIndex({ date: 1 }, { unique: true });

            await this.usersCollection!.createIndex({ email: 1 }, { unique: true });

            this.logger.info('Database indexes created successfully');
        } catch (error) {
            this.logger.warn('Failed to create some indexes', error);
        }
    }
}