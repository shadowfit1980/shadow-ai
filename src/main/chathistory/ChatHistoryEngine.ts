/**
 * Chat History - Persistent chat storage
 */
import { EventEmitter } from 'events';

export interface ChatConversation { id: string; title: string; modelId: string; messages: { role: string; content: string; timestamp: number }[]; createdAt: number; updatedAt: number; starred: boolean; }

export class ChatHistoryEngine extends EventEmitter {
    private static instance: ChatHistoryEngine;
    private conversations: Map<string, ChatConversation> = new Map();
    private constructor() { super(); }
    static getInstance(): ChatHistoryEngine { if (!ChatHistoryEngine.instance) ChatHistoryEngine.instance = new ChatHistoryEngine(); return ChatHistoryEngine.instance; }

    create(modelId: string, title?: string): ChatConversation { const conv: ChatConversation = { id: `conv_${Date.now()}`, title: title || `Chat ${new Date().toLocaleDateString()}`, modelId, messages: [], createdAt: Date.now(), updatedAt: Date.now(), starred: false }; this.conversations.set(conv.id, conv); return conv; }
    addMessage(convId: string, role: string, content: string): boolean { const c = this.conversations.get(convId); if (!c) return false; c.messages.push({ role, content, timestamp: Date.now() }); c.updatedAt = Date.now(); return true; }
    rename(convId: string, title: string): boolean { const c = this.conversations.get(convId); if (!c) return false; c.title = title; return true; }
    star(convId: string, starred: boolean): boolean { const c = this.conversations.get(convId); if (!c) return false; c.starred = starred; return true; }
    delete(convId: string): boolean { return this.conversations.delete(convId); }
    get(convId: string): ChatConversation | null { return this.conversations.get(convId) || null; }
    getAll(): ChatConversation[] { return Array.from(this.conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt); }
    getStarred(): ChatConversation[] { return this.getAll().filter(c => c.starred); }
    search(query: string): ChatConversation[] { const q = query.toLowerCase(); return this.getAll().filter(c => c.title.toLowerCase().includes(q) || c.messages.some(m => m.content.toLowerCase().includes(q))); }
}
export function getChatHistoryEngine(): ChatHistoryEngine { return ChatHistoryEngine.getInstance(); }
