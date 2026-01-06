/**
 * Agent Copilot
 * AI-powered assistant for human agents
 * Provides real-time coaching, suggestions, and auto-summarization
 * Similar to Cognigy Agent Assist
 */

import { EventEmitter } from 'events';

export interface CopilotSuggestion {
    id: string;
    type: 'response' | 'action' | 'knowledge' | 'warning' | 'handoff';
    content: string;
    confidence: number;
    source?: string;
    timestamp: number;
}

export interface ConversationContext {
    messages: Array<{ role: 'user' | 'agent' | 'system'; content: string; timestamp: number }>;
    intent?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    entities?: Record<string, string>;
    summary?: string;
}

export interface AgentSession {
    id: string;
    agentId: string;
    conversationId: string;
    startTime: number;
    context: ConversationContext;
    suggestions: CopilotSuggestion[];
    metrics: SessionMetrics;
}

export interface SessionMetrics {
    suggestionsShown: number;
    suggestionsUsed: number;
    responseTimeAvg: number;
    escalationTriggered: boolean;
}

/**
 * AgentCopilot
 * Real-time AI coaching for human agents
 */
export class AgentCopilot extends EventEmitter {
    private static instance: AgentCopilot;
    private sessions: Map<string, AgentSession> = new Map();
    private knowledgeBase: Map<string, string> = new Map();
    private suggestionCounter = 0;

    private constructor() {
        super();
        this.loadKnowledgeBase();
    }

    static getInstance(): AgentCopilot {
        if (!AgentCopilot.instance) {
            AgentCopilot.instance = new AgentCopilot();
        }
        return AgentCopilot.instance;
    }

    /**
     * Start a new copilot session
     */
    startSession(agentId: string, conversationId: string): AgentSession {
        const id = `copilot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session: AgentSession = {
            id,
            agentId,
            conversationId,
            startTime: Date.now(),
            context: { messages: [] },
            suggestions: [],
            metrics: {
                suggestionsShown: 0,
                suggestionsUsed: 0,
                responseTimeAvg: 0,
                escalationTriggered: false,
            },
        };

        this.sessions.set(id, session);
        this.emit('sessionStarted', session);
        return session;
    }

    /**
     * Add message to conversation context
     */
    async addMessage(sessionId: string, role: 'user' | 'agent', content: string): Promise<CopilotSuggestion[]> {
        const session = this.sessions.get(sessionId);
        if (!session) return [];

        session.context.messages.push({
            role,
            content,
            timestamp: Date.now(),
        });

        // Analyze and generate suggestions if user message
        if (role === 'user') {
            const suggestions = await this.generateSuggestions(session);
            session.suggestions = suggestions;
            session.metrics.suggestionsShown += suggestions.length;

            this.emit('suggestionsGenerated', { sessionId, suggestions });
            return suggestions;
        }

        return [];
    }

    /**
     * Mark suggestion as used
     */
    useSuggestion(sessionId: string, suggestionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const suggestion = session.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            session.metrics.suggestionsUsed++;
            this.emit('suggestionUsed', { sessionId, suggestion });
        }
    }

    /**
     * Get next best action
     */
    async getNextBestAction(sessionId: string): Promise<CopilotSuggestion | null> {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const suggestions = await this.generateSuggestions(session);
        return suggestions.length > 0 ? suggestions[0] : null;
    }

    /**
     * Generate conversation summary
     */
    async generateSummary(sessionId: string): Promise<string> {
        const session = this.sessions.get(sessionId);
        if (!session) return '';

        const messages = session.context.messages;
        if (messages.length === 0) return 'No conversation yet.';

        // Generate summary from messages
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
        const agentMessages = messages.filter(m => m.role === 'agent').map(m => m.content);

        const summary = [
            `Conversation with ${messages.length} messages.`,
            `Customer inquired about: ${userMessages.slice(0, 2).join('; ').substring(0, 100)}...`,
            `Topics discussed: ${this.extractTopics(messages).join(', ')}`,
            `Sentiment: ${session.context.sentiment || 'neutral'}`,
        ].join('\n');

        session.context.summary = summary;
        return summary;
    }

    /**
     * Detect intent from messages
     */
    async detectIntent(sessionId: string): Promise<string | null> {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const lastUserMessage = session.context.messages
            .filter(m => m.role === 'user')
            .pop();

        if (!lastUserMessage) return null;

        const content = lastUserMessage.content.toLowerCase();

        // Simple intent detection
        const intents: Record<string, string[]> = {
            'billing_inquiry': ['bill', 'charge', 'payment', 'invoice', 'refund'],
            'technical_support': ['not working', 'error', 'bug', 'broken', 'help'],
            'account_management': ['password', 'login', 'account', 'profile', 'settings'],
            'product_info': ['feature', 'how to', 'what is', 'does it', 'can I'],
            'complaint': ['angry', 'frustrated', 'terrible', 'worst', 'cancel'],
            'compliment': ['thank', 'great', 'amazing', 'helpful', 'love'],
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(kw => content.includes(kw))) {
                session.context.intent = intent;
                return intent;
            }
        }

        return 'general_inquiry';
    }

    /**
     * Analyze sentiment
     */
    async analyzeSentiment(sessionId: string): Promise<'positive' | 'neutral' | 'negative'> {
        const session = this.sessions.get(sessionId);
        if (!session) return 'neutral';

        const lastMessages = session.context.messages.slice(-3);
        const text = lastMessages.map(m => m.content).join(' ').toLowerCase();

        // Simple sentiment analysis
        const positiveWords = ['thank', 'great', 'excellent', 'helpful', 'awesome', 'perfect', 'love'];
        const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'worst', 'hate', 'disappointed'];

        let score = 0;
        for (const word of positiveWords) {
            if (text.includes(word)) score++;
        }
        for (const word of negativeWords) {
            if (text.includes(word)) score--;
        }

        const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
        session.context.sentiment = sentiment;

        // Emit warning for negative sentiment
        if (sentiment === 'negative') {
            this.emit('sentimentAlert', { sessionId, sentiment });
        }

        return sentiment;
    }

    /**
     * Search knowledge base
     */
    searchKnowledge(query: string): string[] {
        const results: string[] = [];
        const queryLower = query.toLowerCase();

        for (const [key, value] of this.knowledgeBase) {
            if (key.toLowerCase().includes(queryLower) || value.toLowerCase().includes(queryLower)) {
                results.push(value);
            }
        }

        return results.slice(0, 5);
    }

    /**
     * Add to knowledge base
     */
    addKnowledge(topic: string, content: string): void {
        this.knowledgeBase.set(topic, content);
        this.emit('knowledgeAdded', { topic, content });
    }

    /**
     * Trigger escalation
     */
    triggerEscalation(sessionId: string, reason: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.metrics.escalationTriggered = true;
        this.emit('escalationTriggered', { sessionId, reason });
    }

    /**
     * End session and get metrics
     */
    endSession(sessionId: string): SessionMetrics | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        this.emit('sessionEnded', { sessionId, metrics: session.metrics });
        return session.metrics;
    }

    /**
     * Get session
     */
    getSession(sessionId: string): AgentSession | null {
        return this.sessions.get(sessionId) || null;
    }

    // Private methods

    private async generateSuggestions(session: AgentSession): Promise<CopilotSuggestion[]> {
        const suggestions: CopilotSuggestion[] = [];
        const lastMessage = session.context.messages.filter(m => m.role === 'user').pop();

        if (!lastMessage) return suggestions;

        const content = lastMessage.content.toLowerCase();

        // Response suggestions
        if (content.includes('refund')) {
            suggestions.push(this.createSuggestion('response',
                'I understand you\'re looking for a refund. Let me check your account and see what options are available for you.',
                0.9, 'refund_template'));
        }

        if (content.includes('not working') || content.includes('error')) {
            suggestions.push(this.createSuggestion('response',
                'I\'m sorry to hear you\'re experiencing issues. Could you please describe what\'s happening in more detail so I can help troubleshoot?',
                0.85, 'troubleshoot_template'));
        }

        // Knowledge suggestions
        const knowledgeResults = this.searchKnowledge(content);
        for (const result of knowledgeResults.slice(0, 2)) {
            suggestions.push(this.createSuggestion('knowledge', result, 0.75, 'knowledge_base'));
        }

        // Warning suggestions
        if (content.includes('cancel') || content.includes('competitor')) {
            suggestions.push(this.createSuggestion('warning',
                '⚠️ Customer may be at risk of churn. Consider offering retention incentives.',
                0.95, 'churn_detector'));
        }

        // Sentiment-based suggestions
        const sentiment = await this.analyzeSentiment(session.id);
        if (sentiment === 'negative') {
            suggestions.push(this.createSuggestion('action',
                'Customer sentiment is negative. Consider offering compensation or escalating to supervisor.',
                0.9, 'sentiment_analyzer'));
        }

        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    private createSuggestion(
        type: CopilotSuggestion['type'],
        content: string,
        confidence: number,
        source: string
    ): CopilotSuggestion {
        return {
            id: `sug_${++this.suggestionCounter}_${Date.now()}`,
            type,
            content,
            confidence,
            source,
            timestamp: Date.now(),
        };
    }

    private extractTopics(messages: Array<{ role: string; content: string }>): string[] {
        const allText = messages.map(m => m.content).join(' ').toLowerCase();
        const topicKeywords: Record<string, string[]> = {
            'billing': ['bill', 'payment', 'charge', 'invoice'],
            'account': ['account', 'profile', 'settings', 'password'],
            'product': ['feature', 'product', 'service', 'plan'],
            'support': ['help', 'issue', 'problem', 'error'],
        };

        const topics: string[] = [];
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(kw => allText.includes(kw))) {
                topics.push(topic);
            }
        }

        return topics.length > 0 ? topics : ['general'];
    }

    private loadKnowledgeBase(): void {
        // Pre-populate with common knowledge
        this.knowledgeBase.set('refund_policy', 'Refunds are available within 30 days of purchase. For subscriptions, prorated refunds may be offered.');
        this.knowledgeBase.set('password_reset', 'To reset your password, click "Forgot Password" on the login page and follow the email instructions.');
        this.knowledgeBase.set('business_hours', 'Our support team is available Monday-Friday, 9 AM - 6 PM EST.');
        this.knowledgeBase.set('subscription_plans', 'We offer Free, Pro ($19/mo), and Enterprise (custom) plans.');
    }
}

// Singleton getter
export function getAgentCopilot(): AgentCopilot {
    return AgentCopilot.getInstance();
}
