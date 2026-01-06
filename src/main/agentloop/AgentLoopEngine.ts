/**
 * Agent Loop - Main autonomous loop
 */
import { EventEmitter } from 'events';

export interface LoopStep { iteration: number; thought: string; action: string; observation: string; timestamp: number; }
export interface AgentSession { id: string; goal: string; steps: LoopStep[]; status: 'running' | 'paused' | 'complete' | 'failed'; maxIterations: number; }

export class AgentLoopEngine extends EventEmitter {
    private static instance: AgentLoopEngine;
    private sessions: Map<string, AgentSession> = new Map();
    private constructor() { super(); }
    static getInstance(): AgentLoopEngine { if (!AgentLoopEngine.instance) AgentLoopEngine.instance = new AgentLoopEngine(); return AgentLoopEngine.instance; }

    start(goal: string, maxIterations = 25): AgentSession {
        const session: AgentSession = { id: `loop_${Date.now()}`, goal, steps: [], status: 'running', maxIterations };
        this.sessions.set(session.id, session); this.emit('started', session); return session;
    }

    addStep(sessionId: string, thought: string, action: string, observation: string): boolean {
        const s = this.sessions.get(sessionId); if (!s || s.status !== 'running') return false;
        s.steps.push({ iteration: s.steps.length + 1, thought, action, observation, timestamp: Date.now() });
        if (s.steps.length >= s.maxIterations) s.status = 'complete';
        this.emit('step', { sessionId, step: s.steps[s.steps.length - 1] }); return true;
    }

    pause(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'paused'; return true; }
    resume(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'running'; return true; }
    get(sessionId: string): AgentSession | null { return this.sessions.get(sessionId) || null; }
}
export function getAgentLoopEngine(): AgentLoopEngine { return AgentLoopEngine.getInstance(); }
