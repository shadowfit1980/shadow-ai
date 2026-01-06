/**
 * Domain Agent Streaming
 * 
 * Streaming support for domain-specific agent responses.
 * Enables real-time UI updates during long-running agent tasks.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamChunk {
    type: 'progress' | 'content' | 'complete' | 'error';
    agentId: string;
    taskId: string;
    data: any;
    timestamp: number;
}

export interface StreamingConfig {
    chunkSize: number;
    flushInterval: number;
    enableBuffer: boolean;
}

// ============================================================================
// DOMAIN STREAMING SERVICE
// ============================================================================

export class DomainStreamingService extends EventEmitter {
    private static instance: DomainStreamingService;
    private activeTasks: Map<string, { agentId: string; startTime: number }> = new Map();
    private buffer: StreamChunk[] = [];

    private config: StreamingConfig = {
        chunkSize: 512,
        flushInterval: 100,
        enableBuffer: true
    };

    private constructor() {
        super();
        this.setMaxListeners(50);
    }

    static getInstance(): DomainStreamingService {
        if (!DomainStreamingService.instance) {
            DomainStreamingService.instance = new DomainStreamingService();
        }
        return DomainStreamingService.instance;
    }

    // -------------------------------------------------------------------------
    // Task Management
    // -------------------------------------------------------------------------

    /**
     * Start streaming for a domain agent task
     */
    startTask(agentId: string, taskId: string): void {
        this.activeTasks.set(taskId, {
            agentId,
            startTime: Date.now()
        });

        this.emit('taskStarted', { agentId, taskId });
    }

    /**
     * End streaming for a task
     */
    endTask(taskId: string, success: boolean): void {
        const task = this.activeTasks.get(taskId);
        if (task) {
            const duration = Date.now() - task.startTime;
            this.emit('taskEnded', {
                agentId: task.agentId,
                taskId,
                success,
                duration
            });
            this.activeTasks.delete(taskId);
        }
    }

    // -------------------------------------------------------------------------
    // Streaming
    // -------------------------------------------------------------------------

    /**
     * Send progress update
     */
    sendProgress(taskId: string, percentage: number, message: string): void {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        const chunk: StreamChunk = {
            type: 'progress',
            agentId: task.agentId,
            taskId,
            data: { percentage, message },
            timestamp: Date.now()
        };

        this.emitChunk(chunk);
    }

    /**
     * Send content chunk
     */
    sendContent(taskId: string, content: string): void {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        // Split large content into chunks
        if (content.length > this.config.chunkSize) {
            for (let i = 0; i < content.length; i += this.config.chunkSize) {
                const chunk: StreamChunk = {
                    type: 'content',
                    agentId: task.agentId,
                    taskId,
                    data: content.slice(i, i + this.config.chunkSize),
                    timestamp: Date.now()
                };
                this.emitChunk(chunk);
            }
        } else {
            const chunk: StreamChunk = {
                type: 'content',
                agentId: task.agentId,
                taskId,
                data: content,
                timestamp: Date.now()
            };
            this.emitChunk(chunk);
        }
    }

    /**
     * Send completion
     */
    sendComplete(taskId: string, result: any): void {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        const chunk: StreamChunk = {
            type: 'complete',
            agentId: task.agentId,
            taskId,
            data: result,
            timestamp: Date.now()
        };

        this.emitChunk(chunk);
        this.endTask(taskId, true);
    }

    /**
     * Send error
     */
    sendError(taskId: string, error: Error): void {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        const chunk: StreamChunk = {
            type: 'error',
            agentId: task.agentId,
            taskId,
            data: { message: error.message, stack: error.stack },
            timestamp: Date.now()
        };

        this.emitChunk(chunk);
        this.endTask(taskId, false);
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    private emitChunk(chunk: StreamChunk): void {
        if (this.config.enableBuffer) {
            this.buffer.push(chunk);
            // Flush on next tick or when buffer is large
            if (this.buffer.length >= 10) {
                this.flushBuffer();
            }
        } else {
            this.emit('chunk', chunk);
        }
    }

    private flushBuffer(): void {
        const chunks = [...this.buffer];
        this.buffer = [];
        for (const chunk of chunks) {
            this.emit('chunk', chunk);
        }
    }

    // -------------------------------------------------------------------------
    // Subscription
    // -------------------------------------------------------------------------

    /**
     * Subscribe to task updates
     */
    subscribeToTask(taskId: string, callback: (chunk: StreamChunk) => void): () => void {
        const handler = (chunk: StreamChunk) => {
            if (chunk.taskId === taskId) {
                callback(chunk);
            }
        };

        this.on('chunk', handler);
        return () => this.off('chunk', handler);
    }

    /**
     * Subscribe to agent updates
     */
    subscribeToAgent(agentId: string, callback: (chunk: StreamChunk) => void): () => void {
        const handler = (chunk: StreamChunk) => {
            if (chunk.agentId === agentId) {
                callback(chunk);
            }
        };

        this.on('chunk', handler);
        return () => this.off('chunk', handler);
    }

    // -------------------------------------------------------------------------
    // Stats
    // -------------------------------------------------------------------------

    getActiveTasks(): { taskId: string; agentId: string; duration: number }[] {
        return Array.from(this.activeTasks.entries()).map(([taskId, task]) => ({
            taskId,
            agentId: task.agentId,
            duration: Date.now() - task.startTime
        }));
    }

    setConfig(config: Partial<StreamingConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Export singleton
export const domainStreaming = DomainStreamingService.getInstance();
