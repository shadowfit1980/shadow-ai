/**
 * AI Chat
 * Conversational AI assistant with history
 */

import { EventEmitter } from 'events';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    model?: string;
    tokens?: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    model: string;
    systemPrompt?: string;
}

/**
 * AIChat
 * Manage chat sessions with AI models
 */
export class AIChat extends EventEmitter {
    private static instance: AIChat;
    private sessions: Map<string, ChatSession> = new Map();
    private currentSessionId: string | null = null;
    private defaultModel = 'gpt-4';
    private systemPrompt = 'You are a helpful AI assistant specialized in coding.';

    private constructor() {
        super();
    }

    static getInstance(): AIChat {
        if (!AIChat.instance) {
            AIChat.instance = new AIChat();
        }
        return AIChat.instance;
    }

    /**
     * Create new session
     */
    createSession(title?: string): ChatSession {
        const id = `session_${Date.now()}`;
        const session: ChatSession = {
            id,
            title: title || `Chat ${new Date().toLocaleDateString()}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: this.defaultModel,
            systemPrompt: this.systemPrompt,
        };

        this.sessions.set(id, session);
        this.currentSessionId = id;
        this.emit('sessionCreated', session);

        return session;
    }

    /**
     * Get current session
     */
    getCurrentSession(): ChatSession | null {
        if (!this.currentSessionId) return null;
        return this.sessions.get(this.currentSessionId) || null;
    }

    /**
     * Set current session
     */
    setCurrentSession(sessionId: string): boolean {
        if (!this.sessions.has(sessionId)) return false;
        this.currentSessionId = sessionId;
        return true;
    }

    /**
     * Send message
     */
    async sendMessage(content: string, sessionId?: string): Promise<ChatMessage> {
        const session = sessionId
            ? this.sessions.get(sessionId)
            : this.getCurrentSession();

        if (!session) {
            throw new Error('No active session');
        }

        // Add user message
        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        session.messages.push(userMessage);
        session.updatedAt = Date.now();
        this.emit('messageSent', userMessage);

        // Simulate AI response
        const response = await this.generateResponse(session, content);

        const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
            model: session.model,
            tokens: Math.floor(response.length / 4),
        };

        session.messages.push(assistantMessage);
        session.updatedAt = Date.now();
        this.emit('messageReceived', assistantMessage);

        return assistantMessage;
    }

    /**
     * Generate AI response
     */
    private async generateResponse(session: ChatSession, userMessage: string): Promise<string> {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Context-aware responses
        if (userMessage.toLowerCase().includes('help')) {
            return "I'm here to help! You can ask me to:\n- Write code\n- Explain concepts\n- Debug issues\n- Generate tests\n- Refactor code\n\nWhat would you like to work on?";
        }

        if (userMessage.toLowerCase().includes('code')) {
            return "Sure! I can help you with code. Please provide more details about what you'd like to create or modify.";
        }

        if (userMessage.toLowerCase().includes('test')) {
            return "I can help you write tests! Share the code you want to test, and I'll generate appropriate test cases.";
        }

        return `I understand. Based on your message about "${userMessage.slice(0, 50)}...", here's my response:\n\nLet me help you with that. Could you provide more context about what you're trying to achieve?`;
    }

    /**
     * Get session by ID
     */
    getSession(id: string): ChatSession | null {
        return this.sessions.get(id) || null;
    }

    /**
     * Get all sessions
     */
    getAllSessions(): ChatSession[] {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    /**
     * Delete session
     */
    deleteSession(id: string): boolean {
        const deleted = this.sessions.delete(id);
        if (deleted) {
            if (this.currentSessionId === id) {
                this.currentSessionId = null;
            }
            this.emit('sessionDeleted', { id });
        }
        return deleted;
    }

    /**
     * Clear session messages
     */
    clearSession(id: string): boolean {
        const session = this.sessions.get(id);
        if (!session) return false;

        session.messages = [];
        session.updatedAt = Date.now();
        this.emit('sessionCleared', { id });
        return true;
    }

    /**
     * Rename session
     */
    renameSession(id: string, title: string): boolean {
        const session = this.sessions.get(id);
        if (!session) return false;

        session.title = title;
        session.updatedAt = Date.now();
        this.emit('sessionRenamed', { id, title });
        return true;
    }

    /**
     * Set model for session
     */
    setModel(sessionId: string, model: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.model = model;
        this.emit('modelChanged', { sessionId, model });
        return true;
    }

    /**
     * Set default model
     */
    setDefaultModel(model: string): void {
        this.defaultModel = model;
    }

    /**
     * Set system prompt
     */
    setSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt;
    }

    /**
     * Export session
     */
    exportSession(id: string): string {
        const session = this.sessions.get(id);
        if (!session) throw new Error('Session not found');

        return JSON.stringify(session, null, 2);
    }

    /**
     * Import session
     */
    importSession(json: string): ChatSession {
        const session = JSON.parse(json) as ChatSession;
        session.id = `session_${Date.now()}`; // Assign new ID
        this.sessions.set(session.id, session);
        return session;
    }
}

// Singleton getter
export function getAIChat(): AIChat {
    return AIChat.getInstance();
}
