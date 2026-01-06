/**
 * Cascade Engine - Windsurf's core AI
 */
import { EventEmitter } from 'events';

export interface CascadeStep { id: string; type: 'think' | 'search' | 'read' | 'write' | 'run' | 'ask'; content: string; status: 'pending' | 'running' | 'complete' | 'failed'; result?: string; }
export interface CascadeSession { id: string; goal: string; steps: CascadeStep[]; context: string[]; status: 'active' | 'complete' | 'paused'; }

export class CascadeEngine extends EventEmitter {
    private static instance: CascadeEngine;
    private sessions: Map<string, CascadeSession> = new Map();
    private constructor() { super(); }
    static getInstance(): CascadeEngine { if (!CascadeEngine.instance) CascadeEngine.instance = new CascadeEngine(); return CascadeEngine.instance; }

    start(goal: string, context: string[] = []): CascadeSession {
        const session: CascadeSession = { id: `cascade_${Date.now()}`, goal, steps: [], context, status: 'active' };
        this.sessions.set(session.id, session); this.emit('started', session); return session;
    }

    addStep(sessionId: string, type: CascadeStep['type'], content: string): CascadeStep | null {
        const s = this.sessions.get(sessionId); if (!s) return null;
        const step: CascadeStep = { id: `step_${Date.now()}_${s.steps.length}`, type, content, status: 'pending' };
        s.steps.push(step); this.emit('step', { sessionId, step }); return step;
    }

    executeStep(sessionId: string, stepId: string, result: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; const step = s.steps.find(st => st.id === stepId); if (!step) return false; step.status = 'complete'; step.result = result; return true; }
    complete(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'complete'; return true; }
    get(sessionId: string): CascadeSession | null { return this.sessions.get(sessionId) || null; }
}
export function getCascadeEngine(): CascadeEngine { return CascadeEngine.getInstance(); }
