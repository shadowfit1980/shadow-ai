/**
 * Chat With Code - Inline code chat
 */
import { EventEmitter } from 'events';

export interface CodeChat { id: string; file: string; selection: { start: number; end: number }; messages: { role: 'user' | 'assistant'; content: string }[]; }

export class ChatWithCodeEngine extends EventEmitter {
    private static instance: ChatWithCodeEngine;
    private chats: Map<string, CodeChat> = new Map();
    private constructor() { super(); }
    static getInstance(): ChatWithCodeEngine { if (!ChatWithCodeEngine.instance) ChatWithCodeEngine.instance = new ChatWithCodeEngine(); return ChatWithCodeEngine.instance; }

    start(file: string, start: number, end: number): CodeChat {
        const chat: CodeChat = { id: `chat_${Date.now()}`, file, selection: { start, end }, messages: [] };
        this.chats.set(chat.id, chat); return chat;
    }

    addMessage(chatId: string, role: 'user' | 'assistant', content: string): boolean { const c = this.chats.get(chatId); if (!c) return false; c.messages.push({ role, content }); this.emit('message', { chatId, role, content }); return true; }
    async ask(chatId: string, question: string): Promise<string> { const c = this.chats.get(chatId); if (!c) return ''; c.messages.push({ role: 'user', content: question }); const response = `AI response about code in ${c.file}`; c.messages.push({ role: 'assistant', content: response }); return response; }
    get(chatId: string): CodeChat | null { return this.chats.get(chatId) || null; }
    getByFile(file: string): CodeChat[] { return Array.from(this.chats.values()).filter(c => c.file === file); }
}
export function getChatWithCodeEngine(): ChatWithCodeEngine { return ChatWithCodeEngine.getInstance(); }
