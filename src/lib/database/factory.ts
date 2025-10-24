/**
 * Database factory for creating and managing database adapters
 */

import type { DatabaseAdapter, DatabaseConfig, DatabaseLogger } from './types';
import { MongoDBAdapter } from './mongodb-adapter';
import { MemoryAdapter } from './in-memory-adapter';
import { defaultLogger } from './types';

/**
 * Database factory class
 */
export class DatabaseFactory {
    private static instance: DatabaseAdapter | null = null;
    private static config: DatabaseConfig | null = null;

    /**
     * Create a database adapter based on configuration
     */
    static createAdapter(config: DatabaseConfig, logger: DatabaseLogger = defaultLogger): DatabaseAdapter {
        switch (config.type) {
            case 'mongodb':
                return new MongoDBAdapter(config, logger);
            case 'memory':
                return new MemoryAdapter(logger);
            default:
                logger.warn('Unsupported DB adapter, falling back to memory adapter');
                return new MemoryAdapter(logger);
        }
    }

    /**
     * Get or create singleton database instance
     */
    static getInstance(config?: DatabaseConfig, logger: DatabaseLogger = defaultLogger): DatabaseAdapter {
        if (!this.instance || (config && config !== this.config)) {
            if (this.instance) {
                // Disconnect previous instance
                this.instance.disconnect().catch(() => {
                    // Ignore disconnect errors during switching
                });
            }

            if (!config) {
                throw new Error('Database configuration is required for first initialization');
            }

            this.instance = this.createAdapter(config, logger);
            this.config = config;
        }

        return this.instance;
    }

    /**
     * Reset the singleton instance (useful for testing)
     */
    static async reset(): Promise<void> {
        if (this.instance) {
            await this.instance.disconnect();
            this.instance = null;
            this.config = null;
        }
    }

    /**
     * Initialize and connect to the database
     */
    static async initialize(config: DatabaseConfig, logger: DatabaseLogger = defaultLogger): Promise<DatabaseAdapter> {
        const adapter = this.getInstance(config, logger);

        if (!adapter.isConnected()) {
            await adapter.connect();
        }

        return adapter;
    }
}