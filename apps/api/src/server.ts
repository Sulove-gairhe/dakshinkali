/**
 * HTTP Server Entry Point
 * 
 * Starts the Express server with proper lifecycle management:
 * - Database initialization before server start
 * - Graceful shutdown handling
 * - Structured logging
 */

import { createApp } from './app';
import { env } from './config/env.config';
import { initializeDatabase, closeDatabase } from './lib/database';
import { logger } from './lib/logger';

/**
 * Start the HTTP server
 */
async function startServer() {
    try {
        // Step 1: Initialize database connection
        logger.info('Starting server initialization...');
        await initializeDatabase();

        // Step 2: Create Express app
        const app = createApp();

        // Step 3: Start HTTP server
        const server = app.listen(env.port, () => {
            logger.info('Server started successfully', {
                environment: env.nodeEnv,
                port: env.port,
                healthEndpoint: `http://localhost:${env.port}/health`,
                apiBase: `http://localhost:${env.port}/api/v1`,
            });
        });

        // Step 4: Setup graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            // Stop accepting new connections
            server.close(async () => {
                logger.info('HTTP server closed');

                // Close database connections
                await closeDatabase();

                logger.info('Graceful shutdown completed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection', reason);
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}

export { startServer };
