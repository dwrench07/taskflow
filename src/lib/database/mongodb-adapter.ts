/**
 * MongoDB adapter implementation for the database abstraction layer
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import type { DatabaseAdapter, DatabaseConfig, DatabaseLogger, DatabaseError, DailyPlan } from './types';
import type { Task, TaskTemplate, User, FocusSession, Goal, Pillar, Milestone, Chore, Interest, InterestConnection, BackOfMindItem, MistakeLogEntry, FocusReminders } from '../types';

export class MongoDBAdapter implements DatabaseAdapter {
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private isConnectedFlag = false;

    private tasksCollection: Collection<any> | null = null;
    private templatesCollection: Collection<any> | null = null;
    private dailyPlansCollection: Collection<any> | null = null;
    private usersCollection: Collection<any> | null = null;
    private focusSessionsCollection: Collection<any> | null = null;
    private goalsCollection: Collection<any> | null = null;
    private pillarsCollection: Collection<any> | null = null;
    private milestonesCollection: Collection<any> | null = null;
    private choresCollection: Collection<any> | null = null;
    private interestsCollection: Collection<any> | null = null;
    private interestConnectionsCollection: Collection<any> | null = null;
    private backOfMindCollection: Collection<any> | null = null;
    private mistakeLogCollection: Collection<any> | null = null;
    private focusRemindersCollection: Collection<any> | null = null;

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
            this.usersCollection = this.db.collection(this.config.collections?.users || 'users');
            this.focusSessionsCollection = this.db.collection(this.config.collections?.focusSessions || 'focus_sessions');
            this.goalsCollection = this.db.collection(this.config.collections?.goals || 'goals');
            this.pillarsCollection = this.db.collection(this.config.collections?.pillars || 'pillars');
            this.milestonesCollection = this.db.collection(this.config.collections?.milestones || 'milestones');
            this.choresCollection = this.db.collection(this.config.collections?.chores || 'chores');
            this.interestsCollection = this.db.collection(this.config.collections?.interests || 'interests');
            this.interestConnectionsCollection = this.db.collection(this.config.collections?.interestConnections || 'interest_connections');
            this.backOfMindCollection = this.db.collection(this.config.collections?.backOfMind || 'back_of_mind');
            this.mistakeLogCollection = this.db.collection(this.config.collections?.mistakeLog || 'mistake_log');
            this.focusRemindersCollection = this.db.collection(this.config.collections?.focusReminders || 'focus_reminders');

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
            const tasks = await this.tasksCollection!.find({ userId }).toArray();
            return tasks.map(t => this.convertFromMongo<Task>(t));
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
            const taskToInsert = this.convertToMongo({ ...task, userId });
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
            const templates = await this.templatesCollection!.find({ userId }).toArray();
            return templates.map(t => this.convertFromMongo<TaskTemplate>(t));
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
                { date: plan.date, userId },
                {
                    $set: {
                        ...planToUpdate,
                        userId,
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

    // Focus Session operations
    async getFocusSessions(userId?: string | null): Promise<FocusSession[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const sessions = await this.focusSessionsCollection!.find(query).toArray();
            return sessions.map(s => this.convertFromMongo<FocusSession>(s));
        } catch (error) {
            this.logger.error('Failed to get focus sessions', error);
            throw new Error(`Failed to get focus sessions: ${error}`);
        }
    }

    async getActiveFocusSession(userId?: string | null): Promise<FocusSession | null> {
        this.ensureConnected();
        try {
            const query: any = { status: 'active' };
            if (userId) query.userId = userId;
            const session = await this.focusSessionsCollection!.findOne(query);
            return session ? this.convertFromMongo<FocusSession>(session) : null;
        } catch (error) {
            this.logger.error('Failed to get active focus session', error);
            throw new Error(`Failed to get active focus session: ${error}`);
        }
    }

    async addFocusSession(session: FocusSession, userId?: string | null): Promise<FocusSession> {
        this.ensureConnected();
        try {
            const sessionToInsert = this.convertToMongo({ ...session, userId });
            const result = await this.focusSessionsCollection!.insertOne(sessionToInsert);

            if (!result.acknowledged) {
                throw new Error('Focus session insertion was not acknowledged');
            }

            return { ...session, id: result.insertedId.toString(), userId: userId || session.userId };
        } catch (error) {
            this.logger.error('Failed to add focus session', { session, error });
            throw new Error(`Failed to add focus session: ${error}`);
        }
    }

    async updateFocusSession(session: FocusSession, userId?: string | null): Promise<void> {
        this.ensureConnected();
        try {
            const sessionToUpdate = this.convertToMongo({ ...session, userId });
            const { _id, ...updateData } = sessionToUpdate;

            const query: any = { _id: session.id };
            if (userId) query.userId = userId;

            const result = await this.focusSessionsCollection!.updateOne(query, {
                $set: {
                    ...updateData,
                    updatedAt: new Date().toISOString()
                }
            });

            if (result.matchedCount === 0) {
                throw new Error('Focus session not found');
            }
        } catch (error) {
            this.logger.error('Failed to update focus session', { session, error });
            throw new Error(`Failed to update focus session: ${error}`);
        }
    }

    async finalizeOrphanedSessions(userId?: string | null): Promise<void> {
        this.ensureConnected();
        try {
            const query: any = { status: 'active', expectedEndTime: { $lt: new Date().toISOString() } };
            if (userId) query.userId = userId;

            // Find all orphaned and auto-close them.
            // We set their stop event to exactly their expected end time.
            const orphaned = await this.focusSessionsCollection!.find(query).toArray();
            for (const doc of orphaned) {
                const session = this.convertFromMongo<FocusSession>(doc);
                session.status = 'completed';
                session.endTime = session.expectedEndTime;

                // Add an artificial stop event 
                if (!session.events) session.events = [];
                session.events.push({
                    type: 'stop',
                    timestamp: session.expectedEndTime!
                });

                // Compute exact duration based on events... this can be complex, 
                // but as a fallback, we know it's roughly the expected duration.
                const startEvent = session.events.find(e => e.type === 'start');
                if (startEvent && session.expectedEndTime) {
                    const ms = new Date(session.expectedEndTime).getTime() - new Date(startEvent.timestamp).getTime();
                    session.duration = Math.floor(ms / 60000);
                }

                await this.updateFocusSession(session, userId);
            }
        } catch (error) {
            this.logger.error('Failed to finalize orphaned sessions', error);
            throw new Error(`Failed to finalize orphaned sessions: ${error}`);
        }
    }

    // Goal operations
    async getGoals(userId?: string | null): Promise<Goal[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const goals = await this.goalsCollection!.find(query).toArray();
            return goals.map(g => this.convertFromMongo<Goal>(g));
        } catch (error) {
            this.logger.error('Failed to get goals', error);
            throw new Error(`Failed to get goals: ${error}`);
        }
    }

    async getGoal(id: string, userId?: string | null): Promise<Goal | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const goal = await this.goalsCollection!.findOne(query);
            return goal ? this.convertFromMongo(goal) : null;
        } catch (error) {
            this.logger.error('Failed to get goal', { id, error });
            throw new Error(`Failed to get goal: ${error}`);
        }
    }

    async addGoal(goal: Goal, userId?: string | null): Promise<Goal> {
        this.ensureConnected();
        try {
            const goalToInsert = this.convertToMongo({ ...goal, userId });
            const result = await this.goalsCollection!.insertOne(goalToInsert);

            if (!result.acknowledged) {
                throw new Error('Goal insertion was not acknowledged');
            }

            return { ...goal, id: result.insertedId.toString(), userId: userId || goal.userId };
        } catch (error) {
            this.logger.error('Failed to add goal', { goal, error });
            throw new Error(`Failed to add goal: ${error}`);
        }
    }

    async updateGoal(goal: Goal, userId?: string | null): Promise<Goal> {
        this.ensureConnected();
        try {
            const goalToUpdate = this.convertToMongo({ ...goal, userId });
            const { _id, ...updateData } = goalToUpdate;

            const query: any = { _id: goal.id };
            if (userId) query.userId = userId;

            const result = await this.goalsCollection!.updateOne(query, {
                $set: {
                    ...updateData,
                    updatedAt: new Date().toISOString()
                }
            });

            if (result.matchedCount === 0) {
                throw new Error('Goal not found');
            }

            return { ...goal, userId: userId || goal.userId };
        } catch (error) {
            this.logger.error('Failed to update goal', { goal, error });
            throw new Error(`Failed to update goal: ${error}`);
        }
    }

    async deleteGoal(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.goalsCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete goal', { id, error });
            throw new Error(`Failed to delete goal: ${error}`);
        }
    }

    // Pillar operations
    async getPillars(userId?: string | null): Promise<Pillar[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.pillarsCollection!.find(query).toArray();
            return items.map(p => this.convertFromMongo<Pillar>(p));
        } catch (error) {
            this.logger.error('Failed to get pillars', error);
            throw new Error(`Failed to get pillars: ${error}`);
        }
    }

    async getPillar(id: string, userId?: string | null): Promise<Pillar | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const item = await this.pillarsCollection!.findOne(query);
            return item ? this.convertFromMongo<Pillar>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get pillar', { id, error });
            throw new Error(`Failed to get pillar: ${error}`);
        }
    }

    async addPillar(pillar: Pillar, userId?: string | null): Promise<Pillar> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...pillar, userId });
            const result = await this.pillarsCollection!.insertOne(toInsert);
            return { ...pillar, id: result.insertedId.toString(), userId: userId || pillar.userId };
        } catch (error) {
            this.logger.error('Failed to add pillar', { pillar, error });
            throw new Error(`Failed to add pillar: ${error}`);
        }
    }

    async updatePillar(pillar: Pillar, userId?: string | null): Promise<Pillar> {
        this.ensureConnected();
        try {
            const toUpdate = this.convertToMongo({ ...pillar, userId });
            const { _id, ...updateData } = toUpdate;
            const query: any = { _id: pillar.id };
            if (userId) query.userId = userId;
            await this.pillarsCollection!.updateOne(query, { $set: { ...updateData, updatedAt: new Date().toISOString() } });
            return { ...pillar, userId: userId || pillar.userId };
        } catch (error) {
            this.logger.error('Failed to update pillar', { pillar, error });
            throw new Error(`Failed to update pillar: ${error}`);
        }
    }

    async deletePillar(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.pillarsCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete pillar', { id, error });
            throw new Error(`Failed to delete pillar: ${error}`);
        }
    }

    // Milestone operations
    async getMilestones(userId?: string | null): Promise<Milestone[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.milestonesCollection!.find(query).toArray();
            return items.map(m => this.convertFromMongo<Milestone>(m));
        } catch (error) {
            this.logger.error('Failed to get milestones', error);
            throw new Error(`Failed to get milestones: ${error}`);
        }
    }

    async getMilestone(id: string, userId?: string | null): Promise<Milestone | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const item = await this.milestonesCollection!.findOne(query);
            return item ? this.convertFromMongo<Milestone>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get milestone', { id, error });
            throw new Error(`Failed to get milestone: ${error}`);
        }
    }

    async addMilestone(milestone: Milestone, userId?: string | null): Promise<Milestone> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...milestone, userId });
            const result = await this.milestonesCollection!.insertOne(toInsert);
            return { ...milestone, id: result.insertedId.toString(), userId: userId || milestone.userId };
        } catch (error) {
            this.logger.error('Failed to add milestone', { milestone, error });
            throw new Error(`Failed to add milestone: ${error}`);
        }
    }

    async updateMilestone(milestone: Milestone, userId?: string | null): Promise<Milestone> {
        this.ensureConnected();
        try {
            const toUpdate = this.convertToMongo({ ...milestone, userId });
            const { _id, ...updateData } = toUpdate;
            const query: any = { _id: milestone.id };
            if (userId) query.userId = userId;
            await this.milestonesCollection!.updateOne(query, { $set: { ...updateData, updatedAt: new Date().toISOString() } });
            return milestone;
        } catch (error) {
            this.logger.error('Failed to update milestone', { milestone, error });
            throw new Error(`Failed to update milestone: ${error}`);
        }
    }

    async deleteMilestone(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.milestonesCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete milestone', { id, error });
            throw new Error(`Failed to delete milestone: ${error}`);
        }
    }

    // Chore operations
    async getChores(userId?: string | null): Promise<Chore[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.choresCollection!.find(query).toArray();
            return items.map(c => this.convertFromMongo<Chore>(c));
        } catch (error) {
            this.logger.error('Failed to get chores', error);
            throw new Error(`Failed to get chores: ${error}`);
        }
    }

    async getChore(id: string, userId?: string | null): Promise<Chore | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const item = await this.choresCollection!.findOne(query);
            return item ? this.convertFromMongo<Chore>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get chore', { id, error });
            throw new Error(`Failed to get chore: ${error}`);
        }
    }

    async addChore(chore: Chore, userId?: string | null): Promise<Chore> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...chore, userId });
            const result = await this.choresCollection!.insertOne(toInsert);
            return { ...chore, id: result.insertedId.toString(), userId: userId || chore.userId };
        } catch (error) {
            this.logger.error('Failed to add chore', { chore, error });
            throw new Error(`Failed to add chore: ${error}`);
        }
    }

    async updateChore(chore: Chore, userId?: string | null): Promise<Chore> {
        this.ensureConnected();
        try {
            const toUpdate = this.convertToMongo({ ...chore, userId });
            const { _id, ...updateData } = toUpdate;
            const query: any = { _id: chore.id };
            if (userId) query.userId = userId;
            await this.choresCollection!.updateOne(query, { $set: { ...updateData, updatedAt: new Date().toISOString() } });
            return chore;
        } catch (error) {
            this.logger.error('Failed to update chore', { chore, error });
            throw new Error(`Failed to update chore: ${error}`);
        }
    }

    async deleteChore(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.choresCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete chore', { id, error });
            throw new Error(`Failed to delete chore: ${error}`);
        }
    }

    // Interest operations
    async getInterests(userId?: string | null): Promise<Interest[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.interestsCollection!.find(query).toArray();
            return items.map(i => this.convertFromMongo<Interest>(i));
        } catch (error) {
            this.logger.error('Failed to get interests', error);
            throw new Error(`Failed to get interests: ${error}`);
        }
    }

    async getInterest(id: string, userId?: string | null): Promise<Interest | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const item = await this.interestsCollection!.findOne(query);
            return item ? this.convertFromMongo<Interest>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get interest', { id, error });
            throw new Error(`Failed to get interest: ${error}`);
        }
    }

    async addInterest(interest: Interest, userId?: string | null): Promise<Interest> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...interest, userId });
            const result = await this.interestsCollection!.insertOne(toInsert);
            return { ...interest, id: result.insertedId.toString(), userId: userId || interest.userId };
        } catch (error) {
            this.logger.error('Failed to add interest', { interest, error });
            throw new Error(`Failed to add interest: ${error}`);
        }
    }

    async updateInterest(interest: Interest, userId?: string | null): Promise<Interest> {
        this.ensureConnected();
        try {
            const toUpdate = this.convertToMongo({ ...interest, userId });
            const { _id, ...updateData } = toUpdate;
            const query: any = { _id: interest.id };
            if (userId) query.userId = userId;
            await this.interestsCollection!.updateOne(query, { $set: { ...updateData, updatedAt: new Date().toISOString() } });
            return { ...interest, userId: userId || interest.userId };
        } catch (error) {
            this.logger.error('Failed to update interest', { interest, error });
            throw new Error(`Failed to update interest: ${error}`);
        }
    }

    async deleteInterest(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            // Also delete any connections involving this interest
            await this.interestConnectionsCollection!.deleteMany({ $or: [{ sourceId: id }, { targetId: id }] });
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.interestsCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete interest', { id, error });
            throw new Error(`Failed to delete interest: ${error}`);
        }
    }

    // InterestConnection operations
    async getInterestConnections(userId?: string | null): Promise<InterestConnection[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.interestConnectionsCollection!.find(query).toArray();
            return items.map(c => this.convertFromMongo<InterestConnection>(c));
        } catch (error) {
            this.logger.error('Failed to get interest connections', error);
            throw new Error(`Failed to get interest connections: ${error}`);
        }
    }

    async addInterestConnection(connection: InterestConnection, userId?: string | null): Promise<InterestConnection> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...connection, userId });
            const result = await this.interestConnectionsCollection!.insertOne(toInsert);
            return { ...connection, id: result.insertedId.toString(), userId: userId || connection.userId };
        } catch (error) {
            this.logger.error('Failed to add interest connection', { connection, error });
            throw new Error(`Failed to add interest connection: ${error}`);
        }
    }

    async deleteInterestConnection(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.interestConnectionsCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete interest connection', { id, error });
            throw new Error(`Failed to delete interest connection: ${error}`);
        }
    }

    // BackOfMind operations
    async getBackOfMindItems(userId?: string | null): Promise<BackOfMindItem[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.backOfMindCollection!.find(query).sort({ relevanceScore: -1 }).toArray();
            return items.map(i => this.convertFromMongo<BackOfMindItem>(i));
        } catch (error) {
            this.logger.error('Failed to get back of mind items', error);
            throw new Error(`Failed to get back of mind items: ${error}`);
        }
    }

    async getBackOfMindItem(id: string, userId?: string | null): Promise<BackOfMindItem | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const item = await this.backOfMindCollection!.findOne(query);
            return item ? this.convertFromMongo<BackOfMindItem>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get back of mind item', { id, error });
            throw new Error(`Failed to get back of mind item: ${error}`);
        }
    }

    async addBackOfMindItem(item: BackOfMindItem, userId?: string | null): Promise<BackOfMindItem> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...item, userId });
            const result = await this.backOfMindCollection!.insertOne(toInsert);
            return { ...item, id: result.insertedId.toString(), userId: userId || item.userId };
        } catch (error) {
            this.logger.error('Failed to add back of mind item', { item, error });
            throw new Error(`Failed to add back of mind item: ${error}`);
        }
    }

    async updateBackOfMindItem(item: BackOfMindItem, userId?: string | null): Promise<BackOfMindItem> {
        this.ensureConnected();
        try {
            const toUpdate = this.convertToMongo({ ...item, userId });
            const { _id, ...updateData } = toUpdate;
            const query: any = { _id: item.id };
            if (userId) query.userId = userId;
            await this.backOfMindCollection!.updateOne(query, { $set: { ...updateData, updatedAt: new Date().toISOString() } });
            return { ...item, userId: userId || item.userId };
        } catch (error) {
            this.logger.error('Failed to update back of mind item', { item, error });
            throw new Error(`Failed to update back of mind item: ${error}`);
        }
    }

    async deleteBackOfMindItem(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.backOfMindCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete back of mind item', { id, error });
            throw new Error(`Failed to delete back of mind item: ${error}`);
        }
    }

    // FocusReminders operations
    async getFocusReminders(userId?: string | null): Promise<FocusReminders | null> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const item = await this.focusRemindersCollection!.findOne(query);
            return item ? this.convertFromMongo<FocusReminders>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get focus reminders', error);
            throw new Error(`Failed to get focus reminders: ${error}`);
        }
    }

    async upsertFocusReminders(reminders: FocusReminders, userId?: string | null): Promise<FocusReminders> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : { userId: { $exists: false } };
            const doc = { ...reminders, userId: userId || reminders.userId };
            await this.focusRemindersCollection!.updateOne(
                query,
                { $set: doc },
                { upsert: true }
            );
            return doc;
        } catch (error) {
            this.logger.error('Failed to upsert focus reminders', error);
            throw new Error(`Failed to upsert focus reminders: ${error}`);
        }
    }

    // MistakeLog operations
    async getMistakeLogEntries(userId?: string | null): Promise<MistakeLogEntry[]> {
        this.ensureConnected();
        try {
            const query = userId ? { userId } : {};
            const items = await this.mistakeLogCollection!.find(query).sort({ createdAt: -1 }).toArray();
            return items.map(i => this.convertFromMongo<MistakeLogEntry>(i));
        } catch (error) {
            this.logger.error('Failed to get mistake log entries', error);
            throw new Error(`Failed to get mistake log entries: ${error}`);
        }
    }

    async getMistakeLogEntry(id: string, userId?: string | null): Promise<MistakeLogEntry | null> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const item = await this.mistakeLogCollection!.findOne(query);
            return item ? this.convertFromMongo<MistakeLogEntry>(item) : null;
        } catch (error) {
            this.logger.error('Failed to get mistake log entry', { id, error });
            throw new Error(`Failed to get mistake log entry: ${error}`);
        }
    }

    async addMistakeLogEntry(entry: MistakeLogEntry, userId?: string | null): Promise<MistakeLogEntry> {
        this.ensureConnected();
        try {
            const toInsert = this.convertToMongo({ ...entry, userId });
            const result = await this.mistakeLogCollection!.insertOne(toInsert);
            return { ...entry, id: result.insertedId.toString(), userId: userId || entry.userId };
        } catch (error) {
            this.logger.error('Failed to add mistake log entry', { entry, error });
            throw new Error(`Failed to add mistake log entry: ${error}`);
        }
    }

    async updateMistakeLogEntry(entry: MistakeLogEntry, userId?: string | null): Promise<MistakeLogEntry> {
        this.ensureConnected();
        try {
            const toUpdate = this.convertToMongo({ ...entry, userId });
            const { _id, ...updateData } = toUpdate;
            const query: any = { _id: entry.id };
            if (userId) query.userId = userId;
            await this.mistakeLogCollection!.updateOne(query, { $set: { ...updateData, updatedAt: new Date().toISOString() } });
            return { ...entry, userId: userId || entry.userId };
        } catch (error) {
            this.logger.error('Failed to update mistake log entry', { entry, error });
            throw new Error(`Failed to update mistake log entry: ${error}`);
        }
    }

    async deleteMistakeLogEntry(id: string, userId?: string | null): Promise<boolean> {
        this.ensureConnected();
        try {
            const query: any = { _id: id };
            if (userId) query.userId = userId;
            const result = await this.mistakeLogCollection!.deleteOne(query);
            return result.deletedCount > 0;
        } catch (error) {
            this.logger.error('Failed to delete mistake log entry', { id, error });
            throw new Error(`Failed to delete mistake log entry: ${error}`);
        }
    }

    // User operations
    async getUser(id: string): Promise<User | null> {
        this.ensureConnected();
        try {
            const user = await this.usersCollection!.findOne({ _id: id });
            return user ? this.convertFromMongo(user) : null;
        } catch (error) {
            this.logger.error('Failed to get user', { id, error });
            throw new Error(`Failed to get user: ${error}`);
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        this.ensureConnected();
        try {
            const user = await this.usersCollection!.findOne({ email: email });
            return user ? this.convertFromMongo(user) : null;
        } catch (error) {
            this.logger.error('Failed to get user by email', { email, error });
            throw new Error(`Failed to get user by email: ${error}`);
        }
    }

    async createUser(user: User): Promise<User> {
        this.ensureConnected();
        try {
            // Check if user already exists
            const existingUser = await this.getUserByEmail(user.email || '');
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            const userToInsert = this.convertToMongo(user);
            const result = await this.usersCollection!.insertOne(userToInsert);

            if (!result.acknowledged) {
                throw new Error('User insertion was not acknowledged');
            }

            return { ...user, id: result.insertedId.toString() };
        } catch (error: any) {
            this.logger.error('Failed to create user', { user, error });
            throw new Error(error.message || `Failed to create user: ${error}`);
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
        const mongoObj: any = {
            ...rest,
            createdAt: (rest as any).createdAt || new Date().toISOString(),
        };

        // Let MongoDB auto-generate _id if the provided string is empty
        if (id && id.trim() !== '') {
            mongoObj._id = id;
        }

        return mongoObj;
    }

    private convertFromMongo<T>(item: any): T {
        const { _id, ...rest } = item;
        return {
            id: _id ? _id.toString() : '',
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

            await this.dailyPlansCollection!.createIndex({ date: 1, userId: 1 }, { unique: true });

            await this.usersCollection!.createIndex({ email: 1 }, { unique: true });

            await this.focusSessionsCollection!.createIndex({ userId: 1 });
            await this.focusSessionsCollection!.createIndex({ taskId: 1 });
            await this.focusSessionsCollection!.createIndex({ createdAt: 1 });

            // Goal indexes
            await this.goalsCollection!.createIndex({ userId: 1 });
            await this.goalsCollection!.createIndex({ status: 1 });
            await this.goalsCollection!.createIndex({ createdAt: 1 });

            // New indexes
            await this.pillarsCollection!.createIndex({ userId: 1 });
            await this.milestonesCollection!.createIndex({ userId: 1 });
            await this.milestonesCollection!.createIndex({ status: 1 });
            await this.choresCollection!.createIndex({ userId: 1 });
            await this.choresCollection!.createIndex({ lastCompleted: 1 });
            await this.interestsCollection!.createIndex({ userId: 1 });
            await this.interestsCollection!.createIndex({ category: 1 });
            await this.interestConnectionsCollection!.createIndex({ userId: 1 });
            await this.interestConnectionsCollection!.createIndex({ sourceId: 1 });
            await this.interestConnectionsCollection!.createIndex({ targetId: 1 });

            // Utility logs
            await this.backOfMindCollection!.createIndex({ userId: 1 });
            await this.backOfMindCollection!.createIndex({ relevanceScore: -1 });
            await this.mistakeLogCollection!.createIndex({ userId: 1 });
            await this.mistakeLogCollection!.createIndex({ status: 1 });

            this.logger.info('Database indexes created successfully');
        } catch (error) {
            this.logger.warn('Failed to create some indexes', error);
        }
    }
}