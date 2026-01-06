/**
 * Chat History - Conversation history
 */
import { EventEmitter } from 'events';

export interface ChatMessage { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number; }
export interface ChatSession { id: string; title: string; messages: ChatMessage[]; createdAt: number; }

export class ChatHistoryManager extends EventEmitter {
    private static instance: ChatHistoryManager;
    private sessions: Map<string, ChatSession> = new Map();
    private currentId?: string;
    private constructor() { super(); }
    static getInstance(): ChatHistoryManager { if (!ChatHistoryManager.instance) ChatHistoryManager.instance = new ChatHistoryManager(); return ChatHistoryManager.instance; }

    newSession(title = 'New Chat'): ChatSession {
        const session: ChatSession = { id: `chat_${Date.now()}`, title, messages: [], createdAt: Date.now() };
        this.sessions.set(session.id, session);
        this.currentId = session.id;
        return session;
    }

    addMessage(role: ChatMessage['role'], content: string): ChatMessage | null {
        if (!this.currentId) return null;
        const session = this.sessions.get(this.currentId);
        if (!session) return null;
        const msg: ChatMessage = { id: `msg_${Date.now()}`, role, content, timestamp: Date.now() };
        session.messages.push(msg);
        this.emit('message', msg);
        return msg;
    }

    getCurrent(): ChatSession | null { return this.currentId ? this.sessions.get(this.currentId) || null : null; }
    getAll(): ChatSession[] { return Array.from(this.sessions.values()); }
    search(query: string): ChatSession[] { return Array.from(this.sessions.values()).filter(s => s.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))); }
    delete(id: string): boolean { return this.sessions.delete(id); }
}
export function getChatHistoryManager(): ChatHistoryManager { return ChatHistoryManager.getInstance(); }
