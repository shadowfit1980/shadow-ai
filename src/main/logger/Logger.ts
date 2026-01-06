/**
 * Advanced Logger
 * Structured logging with levels
 */

import { EventEmitter } from 'events';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
}

export class Logger extends EventEmitter {
    private static instance: Logger;
    private entries: LogEntry[] = [];
    private level: LogLevel = 'info';
    private maxEntries = 1000;

    private constructor() { super(); }

    static getInstance(): Logger {
        if (!Logger.instance) Logger.instance = new Logger();
        return Logger.instance;
    }

    private log(level: LogLevel, message: string, context?: Record<string, any>): void {
        const entry: LogEntry = { timestamp: Date.now(), level, message, context };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) this.entries.shift();
        this.emit('log', entry);
    }

    debug(message: string, context?: Record<string, any>): void { this.log('debug', message, context); }
    info(message: string, context?: Record<string, any>): void { this.log('info', message, context); }
    warn(message: string, context?: Record<string, any>): void { this.log('warn', message, context); }
    error(message: string, context?: Record<string, any>): void { this.log('error', message, context); }

    getEntries(level?: LogLevel, limit = 100): LogEntry[] {
        let result = this.entries;
        if (level) result = result.filter(e => e.level === level);
        return result.slice(-limit);
    }

    setLevel(level: LogLevel): void { this.level = level; }
    clear(): void { this.entries = []; }
}

export function getLogger(): Logger { return Logger.getInstance(); }
