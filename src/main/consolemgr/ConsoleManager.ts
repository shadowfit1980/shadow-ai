/**
 * Console Manager - Interactive console/shell
 */
import { EventEmitter } from 'events';

export interface ConsoleSession { id: string; type: 'shell' | 'node' | 'python'; history: { command: string; output: string; timestamp: number }[]; }

export class ConsoleManager extends EventEmitter {
    private static instance: ConsoleManager;
    private sessions: Map<string, ConsoleSession> = new Map();
    private constructor() { super(); }
    static getInstance(): ConsoleManager { if (!ConsoleManager.instance) ConsoleManager.instance = new ConsoleManager(); return ConsoleManager.instance; }

    create(type: ConsoleSession['type'] = 'shell'): ConsoleSession {
        const session: ConsoleSession = { id: `console_${Date.now()}`, type, history: [] };
        this.sessions.set(session.id, session);
        return session;
    }

    async execute(sessionId: string, command: string): Promise<string> {
        const session = this.sessions.get(sessionId); if (!session) return 'Session not found';
        const output = `Executed: ${command}\n> Output simulated`;
        session.history.push({ command, output, timestamp: Date.now() });
        this.emit('executed', { sessionId, command, output });
        return output;
    }

    clear(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.history = []; return true; }
    getHistory(sessionId: string): ConsoleSession['history'] { return this.sessions.get(sessionId)?.history || []; }
    getAll(): ConsoleSession[] { return Array.from(this.sessions.values()); }
}
export function getConsoleManager(): ConsoleManager { return ConsoleManager.getInstance(); }
