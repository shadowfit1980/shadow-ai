/**
 * Audit Logger
 * Enterprise-grade activity tracking and compliance logging
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AuditEvent {
    id: string;
    timestamp: number;
    category: AuditCategory;
    action: string;
    actor: AuditActor;
    resource?: AuditResource;
    details?: Record<string, any>;
    result: 'success' | 'failure' | 'partial';
    ipAddress?: string;
    userAgent?: string;
}

export type AuditCategory =
    | 'auth'
    | 'ai_request'
    | 'file_access'
    | 'code_generation'
    | 'model_usage'
    | 'agent_task'
    | 'settings'
    | 'security'
    | 'admin';

export interface AuditActor {
    id: string;
    type: 'user' | 'agent' | 'system';
    name?: string;
    email?: string;
}

export interface AuditResource {
    type: string;
    id: string;
    name?: string;
    path?: string;
}

export interface AuditQuery {
    startDate?: number;
    endDate?: number;
    category?: AuditCategory;
    actor?: string;
    action?: string;
    result?: 'success' | 'failure';
    limit?: number;
    offset?: number;
}

export interface AuditSummary {
    totalEvents: number;
    byCategory: Record<string, number>;
    byResult: Record<string, number>;
    byActor: Record<string, number>;
    topActions: { action: string; count: number }[];
}

/**
 * AuditLogger
 * Comprehensive audit logging for enterprise compliance
 */
export class AuditLogger extends EventEmitter {
    private static instance: AuditLogger;
    private events: AuditEvent[] = [];
    private logPath: string;
    private maxMemoryEvents = 10000;
    private retentionDays = 90;

    private constructor() {
        super();
        this.logPath = path.join(process.cwd(), 'audit-logs');
    }

    static getInstance(): AuditLogger {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }

    /**
     * Configure the logger
     */
    configure(options: {
        logPath?: string;
        maxMemoryEvents?: number;
        retentionDays?: number;
    }): void {
        if (options.logPath) this.logPath = options.logPath;
        if (options.maxMemoryEvents) this.maxMemoryEvents = options.maxMemoryEvents;
        if (options.retentionDays) this.retentionDays = options.retentionDays;
    }

    /**
     * Log an audit event
     */
    async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
        const fullEvent: AuditEvent = {
            ...event,
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };

        this.events.push(fullEvent);
        this.emit('eventLogged', fullEvent);

        // Trim memory if needed
        if (this.events.length > this.maxMemoryEvents) {
            await this.flushToDisk();
        }

        return fullEvent;
    }

    /**
     * Log AI request
     */
    async logAIRequest(options: {
        actor: AuditActor;
        model: string;
        prompt: string;
        tokensUsed?: number;
        success: boolean;
    }): Promise<AuditEvent> {
        return this.log({
            category: 'ai_request',
            action: 'model_invocation',
            actor: options.actor,
            resource: {
                type: 'model',
                id: options.model,
                name: options.model,
            },
            details: {
                promptLength: options.prompt.length,
                tokensUsed: options.tokensUsed,
            },
            result: options.success ? 'success' : 'failure',
        });
    }

    /**
     * Log file access
     */
    async logFileAccess(options: {
        actor: AuditActor;
        action: 'read' | 'write' | 'delete' | 'create';
        filePath: string;
        success: boolean;
    }): Promise<AuditEvent> {
        return this.log({
            category: 'file_access',
            action: `file_${options.action}`,
            actor: options.actor,
            resource: {
                type: 'file',
                id: options.filePath,
                path: options.filePath,
                name: path.basename(options.filePath),
            },
            result: options.success ? 'success' : 'failure',
        });
    }

    /**
     * Log code generation
     */
    async logCodeGeneration(options: {
        actor: AuditActor;
        language: string;
        linesGenerated: number;
        model: string;
        success: boolean;
    }): Promise<AuditEvent> {
        return this.log({
            category: 'code_generation',
            action: 'generate_code',
            actor: options.actor,
            details: {
                language: options.language,
                linesGenerated: options.linesGenerated,
                model: options.model,
            },
            result: options.success ? 'success' : 'failure',
        });
    }

    /**
     * Log agent task
     */
    async logAgentTask(options: {
        actor: AuditActor;
        taskId: string;
        action: 'start' | 'complete' | 'fail' | 'cancel';
        details?: Record<string, any>;
    }): Promise<AuditEvent> {
        return this.log({
            category: 'agent_task',
            action: `task_${options.action}`,
            actor: options.actor,
            resource: {
                type: 'task',
                id: options.taskId,
            },
            details: options.details,
            result: options.action === 'fail' ? 'failure' : 'success',
        });
    }

    /**
     * Log security event
     */
    async logSecurityEvent(options: {
        actor: AuditActor;
        action: string;
        threat?: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        success: boolean;
    }): Promise<AuditEvent> {
        return this.log({
            category: 'security',
            action: options.action,
            actor: options.actor,
            details: {
                threat: options.threat,
                severity: options.severity,
            },
            result: options.success ? 'success' : 'failure',
        });
    }

    /**
     * Query events
     */
    query(options: AuditQuery = {}): AuditEvent[] {
        let results = [...this.events];

        if (options.startDate) {
            results = results.filter(e => e.timestamp >= options.startDate!);
        }
        if (options.endDate) {
            results = results.filter(e => e.timestamp <= options.endDate!);
        }
        if (options.category) {
            results = results.filter(e => e.category === options.category);
        }
        if (options.actor) {
            results = results.filter(e => e.actor.id === options.actor);
        }
        if (options.action) {
            results = results.filter(e => e.action.includes(options.action!));
        }
        if (options.result) {
            results = results.filter(e => e.result === options.result);
        }

        const offset = options.offset || 0;
        const limit = options.limit || 100;

        return results.slice(offset, offset + limit);
    }

    /**
     * Get summary
     */
    getSummary(startDate?: number, endDate?: number): AuditSummary {
        let events = this.events;

        if (startDate) {
            events = events.filter(e => e.timestamp >= startDate);
        }
        if (endDate) {
            events = events.filter(e => e.timestamp <= endDate);
        }

        const byCategory: Record<string, number> = {};
        const byResult: Record<string, number> = {};
        const byActor: Record<string, number> = {};
        const actionCounts: Record<string, number> = {};

        for (const event of events) {
            byCategory[event.category] = (byCategory[event.category] || 0) + 1;
            byResult[event.result] = (byResult[event.result] || 0) + 1;
            byActor[event.actor.id] = (byActor[event.actor.id] || 0) + 1;
            actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
        }

        const topActions = Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalEvents: events.length,
            byCategory,
            byResult,
            byActor,
            topActions,
        };
    }

    /**
     * Export to JSON
     */
    async exportToJSON(): Promise<string> {
        return JSON.stringify(this.events, null, 2);
    }

    /**
     * Export to CSV
     */
    async exportToCSV(): Promise<string> {
        const headers = ['id', 'timestamp', 'category', 'action', 'actor_id', 'actor_type', 'result'];
        const lines = [headers.join(',')];

        for (const event of this.events) {
            const row = [
                event.id,
                new Date(event.timestamp).toISOString(),
                event.category,
                event.action,
                event.actor.id,
                event.actor.type,
                event.result,
            ];
            lines.push(row.map(v => `"${v}"`).join(','));
        }

        return lines.join('\n');
    }

    /**
     * Flush to disk
     */
    async flushToDisk(): Promise<void> {
        try {
            await fs.mkdir(this.logPath, { recursive: true });

            const date = new Date().toISOString().split('T')[0];
            const filename = path.join(this.logPath, `audit-${date}.json`);

            let existing: AuditEvent[] = [];
            try {
                const content = await fs.readFile(filename, 'utf-8');
                existing = JSON.parse(content);
            } catch {
                // File doesn't exist
            }

            const toFlush = this.events.slice(0, this.events.length - 1000);
            await fs.writeFile(filename, JSON.stringify([...existing, ...toFlush], null, 2));

            this.events = this.events.slice(-1000);
            this.emit('flushed', { count: toFlush.length });
        } catch (error) {
            this.emit('flushError', error);
        }
    }

    /**
     * Clear events
     */
    clear(): void {
        this.events = [];
        this.emit('cleared');
    }

    /**
     * Get event count
     */
    getEventCount(): number {
        return this.events.length;
    }
}

// Singleton getter
export function getAuditLogger(): AuditLogger {
    return AuditLogger.getInstance();
}
