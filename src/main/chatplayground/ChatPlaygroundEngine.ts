/**
 * Chat Playground - Interactive AI chat
 */
import { EventEmitter } from 'events';

export interface PlaygroundSession { id: string; modelId: string; messages: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[]; settings: PlaygroundSettings; }
export interface PlaygroundSettings { temperature: number; topP: number; maxTokens: number; systemPrompt: string; stopSequences: string[]; }

export class ChatPlaygroundEngine extends EventEmitter {
    private static instance: ChatPlaygroundEngine;
    private sessions: Map<string, PlaygroundSession> = new Map();
    private defaultSettings: PlaygroundSettings = { temperature: 0.7, topP: 0.9, maxTokens: 2048, systemPrompt: 'You are a helpful assistant.', stopSequences: [] };
    private constructor() { super(); }
    static getInstance(): ChatPlaygroundEngine { if (!ChatPlaygroundEngine.instance) ChatPlaygroundEngine.instance = new ChatPlaygroundEngine(); return ChatPlaygroundEngine.instance; }

    createSession(modelId: string, settings: Partial<PlaygroundSettings> = {}): PlaygroundSession { const session: PlaygroundSession = { id: `play_${Date.now()}`, modelId, messages: [], settings: { ...this.defaultSettings, ...settings } }; if (session.settings.systemPrompt) session.messages.push({ role: 'system', content: session.settings.systemPrompt, timestamp: Date.now() }); this.sessions.set(session.id, session); return session; }

    addMessage(sessionId: string, role: 'user' | 'assistant', content: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.messages.push({ role, content, timestamp: Date.now() }); this.emit('message', { sessionId, role, content }); return true; }
    updateSettings(sessionId: string, settings: Partial<PlaygroundSettings>): boolean { const s = this.sessions.get(sessionId); if (!s) return false; Object.assign(s.settings, settings); return true; }
    clearMessages(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.messages = s.settings.systemPrompt ? [{ role: 'system', content: s.settings.systemPrompt, timestamp: Date.now() }] : []; return true; }
    get(sessionId: string): PlaygroundSession | null { return this.sessions.get(sessionId) || null; }
    getAll(): PlaygroundSession[] { return Array.from(this.sessions.values()); }
}
export function getChatPlaygroundEngine(): ChatPlaygroundEngine { return ChatPlaygroundEngine.getInstance(); }
