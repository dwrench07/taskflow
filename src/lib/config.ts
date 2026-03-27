/**
 * Database configuration for TaskFlow
 * Reads from environment variables with sensible defaults
 */

import type { DatabaseConfig } from './database/types';

export interface AppConfig {
    env: 'development' | 'production' | 'test';
    port: number;
    hostname: string;
    database: DatabaseConfig;
    features: {
        telemetryDisabled: boolean;
    };
}

/**
 * Parse environment variables and return configuration object
 */
function createConfig(): AppConfig {
    const env = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

    // Database configuration
    const dbType = (process.env.DB_TYPE || 'memory') as 'mongodb' | 'memory';

    let databaseConfig: DatabaseConfig;

    if (dbType === 'mongodb') {
        databaseConfig = {
            type: 'mongodb',
            connectionString: process.env.MONGODB_URI,
            host: process.env.MONGODB_HOST || 'localhost',
            port: parseInt(process.env.MONGODB_PORT || '27017', 10),
            username: process.env.MONGODB_USERNAME || 'admin',
            password: process.env.MONGODB_PASSWORD || 'password',
            databaseName: process.env.MONGODB_DATABASE || 'taskflow',
            collections: {
                tasks: process.env.MONGODB_TASKS_COLLECTION || 'tasks',
                templates: process.env.MONGODB_TEMPLATES_COLLECTION || 'templates',
                dailyPlans: process.env.MONGODB_DAILY_PLANS_COLLECTION || 'dailyPlans',
                focusSessions: process.env.MONGODB_FOCUS_SESSIONS_COLLECTION || 'focus_sessions',
                goals: process.env.MONGODB_GOALS_COLLECTION || 'goals',
                // Rename users_dev to users in production
                users: process.env.NODE_ENV === 'production'
                    ? (process.env.MONGODB_USERS_COLLECTION || 'users')
                    : (process.env.MONGODB_USERS_DEV_COLLECTION || 'users_dev'),
                pillars: process.env.MONGODB_PILLARS_COLLECTION || 'pillars',
                milestones: process.env.MONGODB_MILESTONES_COLLECTION || 'milestones',
                chores: process.env.MONGODB_CHORES_COLLECTION || 'chores',
                interests: process.env.MONGODB_INTERESTS_COLLECTION || 'interests',
                interestConnections: process.env.MONGODB_INTEREST_CONNECTIONS_COLLECTION || 'interest_connections',
                backOfMind: process.env.MONGODB_BACK_OF_MIND_COLLECTION || 'back_of_mind',
                mistakeLog: process.env.MONGODB_MISTAKE_LOG_COLLECTION || 'mistake_log',
                focusReminders: process.env.MONGODB_FOCUS_REMINDERS_COLLECTION || 'focus_reminders',
            },
        };
    } else {
        // In-memory configuration for testing
        databaseConfig = {
            type: 'memory',
            collections: {
                tasks: 'tasks',
                templates: 'templates',
                dailyPlans: 'dailyPlans',
                focusSessions: 'focus_sessions',
                goals: 'goals',
                // Add users collection for in-memory DB
                users: process.env.NODE_ENV === 'production' ? 'users' : 'users_dev',
                pillars: 'pillars',
                milestones: 'milestones',
                chores: 'chores',
                interests: 'interests',
                interestConnections: 'interest_connections',
                backOfMind: 'back_of_mind',
                mistakeLog: 'mistake_log',
                focusReminders: 'focus_reminders',
            },
        };
    }

    return {
        env,
        port: parseInt(process.env.PORT || '3000', 10),
        hostname: process.env.HOSTNAME || '0.0.0.0',
        database: databaseConfig,
        features: {
            telemetryDisabled: process.env.NEXT_TELEMETRY_DISABLED === '1',
        },
    };
}

/**
 * Application configuration singleton
 */
export const config: AppConfig = createConfig();

/**
 * Helper function to check if we're in server environment
 */
export const isServer = typeof window === 'undefined';

/**
 * Log configuration on startup (server-side only)
 */
if (isServer) {
    console.log('[config] Application configuration loaded:', {
        env: config.env,
        port: config.port,
        hostname: config.hostname,
        database: {
            type: config.database.type,
            // Only log host/port if connection string is missing to avoid confusion
            host: config.database.connectionString ? 'via Connection String' : config.database.host,
            port: config.database.connectionString ? 'via Connection String' : config.database.port,
            databaseName: config.database.databaseName,
            // Don't log sensitive information
            hasConnectionString: !!config.database.connectionString,
            hasUsername: !!config.database.username,
            hasPassword: !!config.database.password,
            collections: config.database.collections,
        },
        features: config.features,
    });
}