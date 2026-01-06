/**
 * Session Manager - Agent sessions
 */
import { EventEmitter } from 'events';

export interface AgentSession { id: string; agentId: string; userId: string; messages: { role: 'user' | 'assistant'; content: string; timestamp: number }[]; context: Record<string, unknown>; created: number; lastActive: number; }

export class SessionManagerEngine extends EventEmitter {
    private static instance: SessionManagerEngine;
    private sessions: Map<string, AgentSession> = new Map();
    private ttl = 3600000; // 1 hour
    private constructor() { super(); }
    static getInstance(): SessionManagerEngine { if (!SessionManagerEngine.instance) SessionManagerEngine.instance = new SessionManagerEngine(); return SessionManagerEngine.instance; }

    create(agentId: string, userId: string): AgentSession { const session: AgentSession = { id: `sess_${Date.now()}`, agentId, userId, messages: [], context: {}, created: Date.now(), lastActive: Date.now() }; this.sessions.set(session.id, session); return session; }

    addMessage(sessionId: string, role: 'user' | 'assistant', content: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.messages.push({ role, content, timestamp: Date.now() }); s.lastActive = Date.now(); return true; }
    setContext(sessionId: string, key: string, value: unknown): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.context[key] = value; return true; }
    get(sessionId: string): AgentSession | null { return this.sessions.get(sessionId) || null; }
    getByUser(userId: string): AgentSession[] { return Array.from(this.sessions.values()).filter(s => s.userId === userId && Date.now() - s.lastActive < this.ttl); }
    cleanup(): number { let count = 0; const now = Date.now(); for (const [id, s] of this.sessions) { if (now - s.lastActive > this.ttl) { this.sessions.delete(id); count++; } } return count; }
}
export function getSessionManagerEngine(): SessionManagerEngine { return SessionManagerEngine.getInstance(); }
