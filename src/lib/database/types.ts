/**
 * Database abstraction layer for TaskFlow
 * Provides a unified interface for different database implementations
 */

import type { Task, TaskTemplate, User, FocusSession, Goal } from '../types';

export interface DailyPlan {
    id: string;
    date: string;
    tasks: string[];
    notes: string[];
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Base database interface that all database adapters must implement
 */
export interface DatabaseAdapter {
    // Connection management
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    isConnected(): boolean;

    // Task operations
    getAllTasks(userId?: string | null): Promise<Task[]>;
    getTask(id: string, userId?: string | null): Promise<Task | null>;
    addTask(task: Task, userId?: string | null): Promise<Task>;
    updateTask(task: Task, userId?: string | null): Promise<Task>;
    deleteTask(id: string, userId?: string | null): Promise<boolean>;

    // Template operations
    getAllTemplates(): Promise<TaskTemplate[]>;
    getTemplate(id: string): Promise<TaskTemplate | null>;
    addTemplate(template: TaskTemplate): Promise<TaskTemplate>;
    updateTemplate(template: TaskTemplate): Promise<TaskTemplate>;
    deleteTemplate(id: string): Promise<boolean>;

    // Daily plan operations
    getDailyPlan(date: string, userId?: string | null): Promise<DailyPlan | null>;
    updateDailyPlan(plan: DailyPlan, userId?: string | null): Promise<DailyPlan>;

    // Focus Session operations
    getFocusSessions(userId?: string | null): Promise<FocusSession[]>;
    addFocusSession(session: FocusSession, userId?: string | null): Promise<FocusSession>;
    getActiveFocusSession(userId?: string | null): Promise<FocusSession | null>;
    updateFocusSession(session: FocusSession, userId?: string | null): Promise<void>;
    finalizeOrphanedSessions(userId?: string | null): Promise<void>;

    // Goal operations
    getGoals(userId?: string | null): Promise<Goal[]>;
    getGoal(id: string, userId?: string | null): Promise<Goal | null>;
    addGoal(goal: Goal, userId?: string | null): Promise<Goal>;
    updateGoal(goal: Goal, userId?: string | null): Promise<Goal>;
    deleteGoal(id: string, userId?: string | null): Promise<boolean>;

    // User operations
    getUser(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    createUser(user: User): Promise<User>;

    // Health check
    healthCheck(): Promise<boolean>;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
    type: 'mongodb' | 'memory';
    connectionString?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    databaseName?: string;
    collections?: {
        tasks: string;
        templates: string;
        dailyPlans: string;
        users: string;
        focusSessions: string;
        goals: string;
    };
}

/**
 * Database error class for better error handling
 */
export class DatabaseError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

/**
 * Logger interface for database operations
 */
export interface DatabaseLogger {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
}

/**
 * Default console logger implementation
 */
export const defaultLogger: DatabaseLogger = {
    debug: (message: string, meta?: any) => {
        console.debug(`[DB] ${message}`, meta || '');
    },
    info: (message: string, meta?: any) => {
        console.info(`[DB] ${message}`, meta || '');
    },
    warn: (message: string, meta?: any) => {
        console.warn(`[DB] ${message}`, meta || '');
    },
    error: (message: string, meta?: any) => {
        console.error(`[DB] ${message}`, meta || '');
    },
};