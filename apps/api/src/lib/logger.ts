/**
 * Structured Logger
 * 
 * Minimal production-ready logging utility
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: any;
}

class Logger {
    private log(level: LogLevel, message: string, context?: LogContext): void {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...context,
        };

        const output = JSON.stringify(logEntry);

        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }

    info(message: string, context?: LogContext): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log('warn', message, context);
    }

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        const errorContext = error instanceof Error
            ? { error: error.message, stack: error.stack, ...context }
            : { error: String(error), ...context };

        this.log('error', message, errorContext);
    }
}

export const logger = new Logger();
