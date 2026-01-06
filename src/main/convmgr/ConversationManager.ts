/**
 * Conversation Manager - Multi-turn conversations
 */
import { EventEmitter } from 'events';

export interface Conversation { id: string; title: string; messages: { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[]; metadata: { model?: string; tokens?: number }; }

export class ConversationManager extends EventEmitter {
    private static instance: ConversationManager;
    private conversations: Map<string, Conversation> = new Map();
    private activeId?: string;
    private constructor() { super(); }
    static getInstance(): ConversationManager { if (!ConversationManager.instance) ConversationManager.instance = new ConversationManager(); return ConversationManager.instance; }

    create(title = 'New Conversation'): Conversation { const conv: Conversation = { id: `conv_${Date.now()}`, title, messages: [], metadata: {} }; this.conversations.set(conv.id, conv); this.activeId = conv.id; return conv; }

    addMessage(convId: string, role: Conversation['messages'][0]['role'], content: string): boolean {
        const c = this.conversations.get(convId); if (!c) return false;
        c.messages.push({ id: `msg_${Date.now()}`, role, content, timestamp: Date.now() });
        this.emit('message', { convId, role, content }); return true;
    }

    getActive(): Conversation | null { return this.activeId ? this.conversations.get(this.activeId) || null : null; }
    setActive(convId: string): void { this.activeId = convId; }
    get(convId: string): Conversation | null { return this.conversations.get(convId) || null; }
    getAll(): Conversation[] { return Array.from(this.conversations.values()); }
    delete(convId: string): boolean { return this.conversations.delete(convId); }
}
export function getConversationManager(): ConversationManager { return ConversationManager.getInstance(); }
