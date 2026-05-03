/**
 * Database Connection Manager
 * 
 * Handles Supabase connection lifecycle with health checks
 */

import { createSupabaseClient } from '@dakshinkali/database';
import { logger } from './logger';

let dbClient: ReturnType<typeof createSupabaseClient> | null = null;
let isConnected = false;

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
    try {
        logger.info('Initializing database connection...');

        dbClient = createSupabaseClient();

        // Test connection with a simple query
        const { error } = await dbClient
            .from('products')
            .select('id')
            .limit(1);

        // PGRST116 = no rows (fine)
        // PGRST204 = schema cache not loaded yet (retry or warn)
        if (error && error.code !== 'PGRST116') {
            if (error.message.includes('schema cache')) {
                logger.warn('Schema cache not ready yet. This may resolve automatically.', {
                    provider: 'Supabase',
                    error: error.message,
                });
                // Don't throw - allow server to start
                // The cache will refresh within 5 minutes
            } else {
                throw new Error(`Database connection test failed: ${error.message}`);
            }
        }

        isConnected = true;
        logger.info('Database connection established', {
            provider: 'Supabase',
            status: 'connected',
        });
    } catch (error) {
        isConnected = false;
        logger.error('Failed to initialize database', error, {
            provider: 'Supabase',
        });
        throw error;
    }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
    if (!dbClient) {
        return false;
    }

    try {
        const { error } = await dbClient
            .from('products')
            .select('id')
            .limit(1);

        return !error || error.code === 'PGRST116';
    } catch {
        return false;
    }
}

/**
 * Get database connection status
 */
export function isDatabaseConnected(): boolean {
    return isConnected;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
    if (dbClient) {
        logger.info('Closing database connection...');
        // Supabase client doesn't need explicit closing
        // but we mark it as disconnected
        isConnected = false;
        dbClient = null;
        logger.info('Database connection closed');
    }
}

/**
 * Get database client (for internal use)
 */
export function getDatabaseClient() {
    if (!dbClient) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbClient;
}
