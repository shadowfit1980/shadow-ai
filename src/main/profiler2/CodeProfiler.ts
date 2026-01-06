/**
 * Code Profiler - Performance profiling
 */
import { EventEmitter } from 'events';

export interface ProfileSample { timestamp: number; duration: number; function: string; file?: string; line?: number; memory?: number; }
export interface ProfileSession { id: string; name: string; samples: ProfileSample[]; startTime: number; endTime?: number; }

export class CodeProfiler extends EventEmitter {
    private static instance: CodeProfiler;
    private sessions: Map<string, ProfileSession> = new Map();
    private active?: string;
    private constructor() { super(); }
    static getInstance(): CodeProfiler { if (!CodeProfiler.instance) CodeProfiler.instance = new CodeProfiler(); return CodeProfiler.instance; }

    start(name: string): ProfileSession {
        const session: ProfileSession = { id: `prof_${Date.now()}`, name, samples: [], startTime: Date.now() };
        this.sessions.set(session.id, session);
        this.active = session.id;
        this.emit('started', session);
        return session;
    }

    sample(fn: string, duration: number, file?: string, line?: number): void {
        if (!this.active) return;
        const session = this.sessions.get(this.active);
        if (!session) return;
        const sample: ProfileSample = { timestamp: Date.now(), duration, function: fn, file, line, memory: process.memoryUsage().heapUsed };
        session.samples.push(sample);
        this.emit('sampled', sample);
    }

    stop(): ProfileSession | null {
        if (!this.active) return null;
        const session = this.sessions.get(this.active);
        if (!session) return null;
        session.endTime = Date.now();
        this.active = undefined;
        this.emit('stopped', session);
        return session;
    }

    getHotspots(sessionId: string, limit = 10): ProfileSample[] {
        const s = this.sessions.get(sessionId);
        if (!s) return [];
        return [...s.samples].sort((a, b) => b.duration - a.duration).slice(0, limit);
    }

    getAll(): ProfileSession[] { return Array.from(this.sessions.values()); }
}

export function getCodeProfiler(): CodeProfiler { return CodeProfiler.getInstance(); }
