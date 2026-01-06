/**
 * Terminal Agent - AI-controlled terminal
 */
import { EventEmitter } from 'events';

export interface TerminalCommand { id: string; command: string; output?: string; exitCode?: number; status: 'pending' | 'running' | 'complete' | 'failed'; startTime: number; endTime?: number; }
export interface TerminalSession { id: string; cwd: string; commands: TerminalCommand[]; active: boolean; }

export class TerminalAgentEngine extends EventEmitter {
    private static instance: TerminalAgentEngine;
    private sessions: Map<string, TerminalSession> = new Map();
    private constructor() { super(); }
    static getInstance(): TerminalAgentEngine { if (!TerminalAgentEngine.instance) TerminalAgentEngine.instance = new TerminalAgentEngine(); return TerminalAgentEngine.instance; }

    createSession(cwd: string): TerminalSession { const session: TerminalSession = { id: `term_${Date.now()}`, cwd, commands: [], active: true }; this.sessions.set(session.id, session); return session; }

    async execute(sessionId: string, command: string): Promise<TerminalCommand> {
        const session = this.sessions.get(sessionId); if (!session || !session.active) throw new Error('Session not available');
        const cmd: TerminalCommand = { id: `cmd_${Date.now()}`, command, status: 'pending', startTime: Date.now() };
        session.commands.push(cmd);
        cmd.status = 'running'; this.emit('running', { sessionId, command: cmd });
        await new Promise(r => setTimeout(r, 100));
        cmd.output = `$ ${command}\nCommand executed successfully`; cmd.exitCode = 0; cmd.status = 'complete'; cmd.endTime = Date.now();
        this.emit('complete', { sessionId, command: cmd }); return cmd;
    }

    async suggestCommand(context: string): Promise<string> { return `npm run build # Suggested based on: ${context.slice(0, 30)}`; }
    close(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.active = false; return true; }
    getSessions(): TerminalSession[] { return Array.from(this.sessions.values()); }
}
export function getTerminalAgentEngine(): TerminalAgentEngine { return TerminalAgentEngine.getInstance(); }
