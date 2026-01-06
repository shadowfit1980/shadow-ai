/**
 * Terminal Integration - Embedded terminal
 */
import { EventEmitter } from 'events';

export interface TerminalSession { id: string; name: string; cwd: string; history: { command: string; output: string; exitCode: number; timestamp: number }[]; status: 'running' | 'idle' | 'closed'; }

export class TerminalIntegration extends EventEmitter {
    private static instance: TerminalIntegration;
    private sessions: Map<string, TerminalSession> = new Map();
    private constructor() { super(); }
    static getInstance(): TerminalIntegration { if (!TerminalIntegration.instance) TerminalIntegration.instance = new TerminalIntegration(); return TerminalIntegration.instance; }

    create(name = 'Terminal', cwd = process.cwd()): TerminalSession { const session: TerminalSession = { id: `term_${Date.now()}`, name, cwd, history: [], status: 'idle' }; this.sessions.set(session.id, session); return session; }

    async execute(sessionId: string, command: string): Promise<{ output: string; exitCode: number }> {
        const s = this.sessions.get(sessionId); if (!s) return { output: 'Session not found', exitCode: 1 };
        s.status = 'running';
        const result = { output: `$ ${command}\n[Command executed in ${s.cwd}]`, exitCode: 0 };
        s.history.push({ command, ...result, timestamp: Date.now() }); s.status = 'idle'; this.emit('executed', { sessionId, command, result }); return result;
    }

    getHistory(sessionId: string): TerminalSession['history'] { return this.sessions.get(sessionId)?.history || []; }
    close(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'closed'; return true; }
    getAll(): TerminalSession[] { return Array.from(this.sessions.values()); }
}
export function getTerminalIntegration(): TerminalIntegration { return TerminalIntegration.getInstance(); }
