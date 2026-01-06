/**
 * Project Chat - Conversational project interaction
 */
import { EventEmitter } from 'events';

export interface ChatMessage { id: string; role: 'user' | 'assistant' | 'system'; content: string; attachments: { type: string; path: string }[]; timestamp: number; }
export interface ProjectChatSession { id: string; projectPath: string; messages: ChatMessage[]; context: { files: string[]; symbols: string[] }; createdAt: number; }

export class ProjectChatEngine extends EventEmitter {
    private static instance: ProjectChatEngine;
    private sessions: Map<string, ProjectChatSession> = new Map();
    private constructor() { super(); }
    static getInstance(): ProjectChatEngine { if (!ProjectChatEngine.instance) ProjectChatEngine.instance = new ProjectChatEngine(); return ProjectChatEngine.instance; }

    createSession(projectPath: string): ProjectChatSession { const session: ProjectChatSession = { id: `pchat_${Date.now()}`, projectPath, messages: [{ id: 'm0', role: 'system', content: `Project assistant for ${projectPath}`, attachments: [], timestamp: Date.now() }], context: { files: [], symbols: [] }, createdAt: Date.now() }; this.sessions.set(session.id, session); return session; }

    async sendMessage(sessionId: string, content: string, attachments: { type: string; path: string }[] = []): Promise<ChatMessage> {
        const session = this.sessions.get(sessionId); if (!session) throw new Error('Session not found');
        const userMsg: ChatMessage = { id: `um_${Date.now()}`, role: 'user', content, attachments, timestamp: Date.now() };
        session.messages.push(userMsg);
        await new Promise(r => setTimeout(r, 100));
        const assistantMsg: ChatMessage = { id: `am_${Date.now()}`, role: 'assistant', content: `I'll help you with: ${content.slice(0, 50)}...`, attachments: [], timestamp: Date.now() };
        session.messages.push(assistantMsg); this.emit('response', { sessionId, message: assistantMsg }); return assistantMsg;
    }

    addContext(sessionId: string, files: string[], symbols: string[]): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.context.files.push(...files); s.context.symbols.push(...symbols); return true; }
    get(sessionId: string): ProjectChatSession | null { return this.sessions.get(sessionId) || null; }
}
export function getProjectChatEngine(): ProjectChatEngine { return ProjectChatEngine.getInstance(); }
