/**
 * Agent Stream Manager
 * 
 * Manages real-time streaming of agent thoughts, actions, and outputs
 * to the UI for transparency and better user experience.
 */

import { EventEmitter } from 'events';

export interface StreamChunk {
    id: string;
    type: 'thought' | 'action' | 'result' | 'error' | 'progress';
    agentId: string;
    agentName: string;
    content: string;
    timestamp: number;
    metadata?: {
        taskId?: string;
        stepNumber?: number;
        totalSteps?: number;
        confidence?: number;
        duration?: number;
    };
}

export interface StreamSession {
    sessionId: string;
    taskDescription: string;
    startTime: number;
    endTime?: number;
    chunks: StreamChunk[];
    status: 'active' | 'completed' | 'error' | 'cancelled';
}

export class AgentStreamManager extends EventEmitter {
    private static instance: AgentStreamManager;
    private sessions: Map<string, StreamSession> = new Map();
    private currentSessionId: string | null = null;
    private buffer: StreamChunk[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private bufferSize = 10;
    private flushDelay = 100; // ms

    static getInstance(): AgentStreamManager {
        if (!AgentStreamManager.instance) {
            AgentStreamManager.instance = new AgentStreamManager();
        }
        return AgentStreamManager.instance;
    }

    constructor() {
        super();
        this.startBufferFlush();
    }

    private startBufferFlush(): void {
        if (this.flushInterval) return;
        this.flushInterval = setInterval(() => {
            this.flushBuffer();
        }, this.flushDelay);
    }

    private flushBuffer(): void {
        if (this.buffer.length === 0) return;

        const chunks = [...this.buffer];
        this.buffer = [];

        this.emit('chunks', chunks);
        chunks.forEach(chunk => {
            if (this.currentSessionId) {
                const session = this.sessions.get(this.currentSessionId);
                if (session) {
                    session.chunks.push(chunk);
                }
            }
        });
    }

    /**
     * Start a new streaming session
     */
    startSession(taskDescription: string): string {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session: StreamSession = {
            sessionId,
            taskDescription,
            startTime: Date.now(),
            chunks: [],
            status: 'active'
        };

        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;

        this.emit('session-start', session);
        console.log(`📺 Stream session started: ${sessionId}`);

        return sessionId;
    }

    /**
     * End the current streaming session
     */
    endSession(status: 'completed' | 'error' | 'cancelled' = 'completed'): void {
        if (!this.currentSessionId) return;

        this.flushBuffer();

        const session = this.sessions.get(this.currentSessionId);
        if (session) {
            session.status = status;
            session.endTime = Date.now();
            this.emit('session-end', session);
            console.log(`📺 Stream session ended: ${this.currentSessionId} (${status})`);
        }

        this.currentSessionId = null;
    }

    /**
     * Stream a thought from an agent
     */
    streamThought(agentId: string, agentName: string, thought: string, metadata?: StreamChunk['metadata']): void {
        this.queueChunk({
            id: this.generateChunkId(),
            type: 'thought',
            agentId,
            agentName,
            content: thought,
            timestamp: Date.now(),
            metadata
        });
    }

    /**
     * Stream an action being taken
     */
    streamAction(agentId: string, agentName: string, action: string, metadata?: StreamChunk['metadata']): void {
        this.queueChunk({
            id: this.generateChunkId(),
            type: 'action',
            agentId,
            agentName,
            content: action,
            timestamp: Date.now(),
            metadata
        });
    }

    /**
     * Stream a result
     */
    streamResult(agentId: string, agentName: string, result: string, metadata?: StreamChunk['metadata']): void {
        this.queueChunk({
            id: this.generateChunkId(),
            type: 'result',
            agentId,
            agentName,
            content: result,
            timestamp: Date.now(),
            metadata
        });
    }

    /**
     * Stream an error
     */
    streamError(agentId: string, agentName: string, error: string, metadata?: StreamChunk['metadata']): void {
        this.queueChunk({
            id: this.generateChunkId(),
            type: 'error',
            agentId,
            agentName,
            content: error,
            timestamp: Date.now(),
            metadata
        });
    }

    /**
     * Stream progress update
     */
    streamProgress(
        agentId: string,
        agentName: string,
        progress: string,
        stepNumber: number,
        totalSteps: number
    ): void {
        this.queueChunk({
            id: this.generateChunkId(),
            type: 'progress',
            agentId,
            agentName,
            content: progress,
            timestamp: Date.now(),
            metadata: { stepNumber, totalSteps }
        });
    }

    private queueChunk(chunk: StreamChunk): void {
        this.buffer.push(chunk);
        this.emit('chunk', chunk);

        // Force flush if buffer is full
        if (this.buffer.length >= this.bufferSize) {
            this.flushBuffer();
        }
    }

    private generateChunkId(): string {
        return `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): StreamSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get current session
     */
    getCurrentSession(): StreamSession | null {
        if (!this.currentSessionId) return null;
        return this.sessions.get(this.currentSessionId) || null;
    }

    /**
     * Get recent sessions
     */
    getRecentSessions(limit: number = 10): StreamSession[] {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }

    /**
     * Clear old sessions
     */
    clearOldSessions(maxAge: number = 3600000): void {
        const cutoff = Date.now() - maxAge;
        for (const [id, session] of this.sessions.entries()) {
            if (session.startTime < cutoff) {
                this.sessions.delete(id);
            }
        }
    }

    /**
     * Subscribe to stream events
     */
    subscribe(callback: (chunk: StreamChunk) => void): () => void {
        this.on('chunk', callback);
        return () => this.off('chunk', callback);
    }

    /**
     * Subscribe to bulk chunks
     */
    subscribeBulk(callback: (chunks: StreamChunk[]) => void): () => void {
        this.on('chunks', callback);
        return () => this.off('chunks', callback);
    }

    destroy(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.removeAllListeners();
    }
}

export const agentStreamManager = AgentStreamManager.getInstance();
