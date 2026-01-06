/**
 * Session Manager
 * Manage user sessions and state
 */

import { EventEmitter } from 'events';

export interface Session {
    id: string;
    userId?: string;
    startTime: number;
    lastActivity: number;
    data: Record<string, any>;
    active: boolean;
}

/**
 * SessionManager
 * Manage user sessions
 */
export class SessionManager extends EventEmitter {
    private static instance: SessionManager;
    private sessions: Map<string, Session> = new Map();
    private currentSessionId: string | null = null;

    private constructor() {
        super();
    }

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Create new session
     */
    create(userId?: string): Session {
        const session: Session = {
            id: `session_${Date.now()}`,
            userId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            data: {},
            active: true,
        };

        this.sessions.set(session.id, session);
        this.currentSessionId = session.id;
        this.emit('sessionCreated', session);
        return session;
    }

    /**
     * Get current session
     */
    getCurrent(): Session | null {
        return this.currentSessionId ? this.sessions.get(this.currentSessionId) || null : null;
    }

    /**
     * Get session by ID
     */
    get(id: string): Session | null {
        return this.sessions.get(id) || null;
    }

    /**
     * Update session data
     */
    update(id: string, data: Record<string, any>): boolean {
        const session = this.sessions.get(id);
        if (!session) return false;

        session.data = { ...session.data, ...data };
        session.lastActivity = Date.now();
        this.emit('sessionUpdated', session);
        return true;
    }

    /**
     * End session
     */
    end(id: string): boolean {
        const session = this.sessions.get(id);
        if (!session) return false;

        session.active = false;
        if (this.currentSessionId === id) this.currentSessionId = null;
        this.emit('sessionEnded', session);
        return true;
    }

    /**
     * Get all sessions
     */
    getAll(): Session[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get active sessions
     */
    getActive(): Session[] {
        return this.getAll().filter(s => s.active);
    }

    /**
     * Touch session (update activity)
     */
    touch(id: string): void {
        const session = this.sessions.get(id);
        if (session) session.lastActivity = Date.now();
    }

    /**
     * Clear all sessions
     */
    clearAll(): void {
        this.sessions.clear();
        this.currentSessionId = null;
        this.emit('allCleared');
    }
}

// Singleton getter
export function getSessionManager(): SessionManager {
    return SessionManager.getInstance();
}
