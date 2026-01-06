/**
 * Debugger Manager - Debug sessions
 */
import { EventEmitter } from 'events';

export interface Breakpoint { id: string; file: string; line: number; enabled: boolean; condition?: string; }
export interface DebugSession { id: string; name: string; state: 'idle' | 'running' | 'paused' | 'stopped'; breakpoints: Breakpoint[]; startedAt: number; }

export class DebuggerManager extends EventEmitter {
    private static instance: DebuggerManager;
    private sessions: Map<string, DebugSession> = new Map();
    private current?: string;
    private constructor() { super(); }
    static getInstance(): DebuggerManager { if (!DebuggerManager.instance) DebuggerManager.instance = new DebuggerManager(); return DebuggerManager.instance; }

    createSession(name: string): DebugSession {
        const session: DebugSession = { id: `dbg_${Date.now()}`, name, state: 'idle', breakpoints: [], startedAt: Date.now() };
        this.sessions.set(session.id, session);
        this.emit('sessionCreated', session);
        return session;
    }

    start(id: string): boolean { const s = this.sessions.get(id); if (!s) return false; s.state = 'running'; this.current = id; this.emit('started', s); return true; }
    pause(id: string): boolean { const s = this.sessions.get(id); if (!s || s.state !== 'running') return false; s.state = 'paused'; this.emit('paused', s); return true; }
    resume(id: string): boolean { const s = this.sessions.get(id); if (!s || s.state !== 'paused') return false; s.state = 'running'; this.emit('resumed', s); return true; }
    stop(id: string): boolean { const s = this.sessions.get(id); if (!s) return false; s.state = 'stopped'; this.emit('stopped', s); return true; }

    addBreakpoint(sessionId: string, file: string, line: number, condition?: string): Breakpoint | null {
        const s = this.sessions.get(sessionId);
        if (!s) return null;
        const bp: Breakpoint = { id: `bp_${Date.now()}`, file, line, enabled: true, condition };
        s.breakpoints.push(bp);
        this.emit('breakpointAdded', bp);
        return bp;
    }

    getCurrent(): DebugSession | null { return this.current ? this.sessions.get(this.current) || null : null; }
    getAll(): DebugSession[] { return Array.from(this.sessions.values()); }
}

export function getDebuggerManager(): DebuggerManager { return DebuggerManager.getInstance(); }
