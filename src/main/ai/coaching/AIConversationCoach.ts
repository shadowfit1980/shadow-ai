/**
 * AI Conversation Coach
 * 
 * Provides real-time feedback and suggestions for better
 * AI interactions, helping users get better results.
 */

import { EventEmitter } from 'events';

export interface ConversationFeedback {
    id: string;
    type: FeedbackType;
    message: string;
    suggestion?: string;
    examples?: string[];
    severity: 'tip' | 'improvement' | 'important';
}

export type FeedbackType =
    | 'clarity'
    | 'specificity'
    | 'context'
    | 'structure'
    | 'scope'
    | 'efficiency';

export interface PromptAnalysis {
    score: number;
    clarity: number;
    specificity: number;
    actionability: number;
    feedback: ConversationFeedback[];
    suggestedRewrite?: string;
}

export interface ConversationSession {
    id: string;
    messages: AnalyzedMessage[];
    overallQuality: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    startedAt: Date;
}

export interface AnalyzedMessage {
    role: 'user' | 'assistant';
    content: string;
    analysis: PromptAnalysis;
    timestamp: Date;
}

export interface PromptTemplate {
    id: string;
    name: string;
    category: string;
    template: string;
    placeholders: string[];
    examples: string[];
}

// Prompt improvement patterns
const IMPROVEMENT_PATTERNS: {
    pattern: RegExp;
    feedback: Omit<ConversationFeedback, 'id'>;
}[] = [
        {
            pattern: /^(do|make|create|write)\s+\w+$/i,
            feedback: {
                type: 'specificity',
                message: 'Prompt is too vague',
                suggestion: 'Add more details about what you want. Include context, format, or specific requirements.',
                examples: [
                    'Instead of: "Create a function" → "Create a TypeScript function that validates email addresses and returns true/false"',
                ],
                severity: 'improvement',
            },
        },
        {
            pattern: /help|can you|please|want|need/i,
            feedback: {
                type: 'efficiency',
                message: 'Unnecessary preamble detected',
                suggestion: 'You can skip phrases like "Can you help me" or "I want you to". Get straight to the point.',
                severity: 'tip',
            },
        },
        {
            pattern: /^.{1,20}$/,
            feedback: {
                type: 'context',
                message: 'Prompt may lack sufficient context',
                suggestion: 'Consider adding more context about your goal, constraints, or expected output format.',
                severity: 'improvement',
            },
        },
        {
            pattern: /everything|all|anything|any/i,
            feedback: {
                type: 'scope',
                message: 'Scope may be too broad',
                suggestion: 'Consider narrowing down to specific aspects. Broader requests often lead to generic responses.',
                severity: 'improvement',
            },
        },
    ];

// Prompt templates for common tasks
const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        id: 'code_review',
        name: 'Code Review Request',
        category: 'development',
        template: 'Review this {language} code for {focus}:\n\n```{language}\n{code}\n```\n\nSpecifically check for: {aspects}',
        placeholders: ['language', 'focus', 'code', 'aspects'],
        examples: [
            'Review this TypeScript code for performance issues:\n\n```typescript\n// code here\n```\n\nSpecifically check for: memory leaks, unnecessary rerenders, async issues',
        ],
    },
    {
        id: 'debug_help',
        name: 'Debugging Assistance',
        category: 'development',
        template: 'I\'m experiencing {error_type} in {context}.\n\nError: {error}\n\nCode:\n```{language}\n{code}\n```\n\nWhat I\'ve tried: {attempts}',
        placeholders: ['error_type', 'context', 'error', 'language', 'code', 'attempts'],
        examples: [],
    },
    {
        id: 'feature_implementation',
        name: 'Feature Implementation',
        category: 'development',
        template: 'Implement {feature} in {language}/{framework}.\n\nRequirements:\n{requirements}\n\nConstraints:\n{constraints}\n\nExisting code context:\n```{language}\n{context}\n```',
        placeholders: ['feature', 'language', 'framework', 'requirements', 'constraints', 'context'],
        examples: [],
    },
    {
        id: 'explanation',
        name: 'Code Explanation',
        category: 'learning',
        template: 'Explain this {language} code at a {level} level:\n\n```{language}\n{code}\n```\n\nFocus on: {focus}',
        placeholders: ['language', 'level', 'code', 'focus'],
        examples: [],
    },
];

export class AIConversationCoach extends EventEmitter {
    private static instance: AIConversationCoach;
    private sessions: Map<string, ConversationSession> = new Map();
    private templates: PromptTemplate[] = [...PROMPT_TEMPLATES];

    private constructor() {
        super();
    }

    static getInstance(): AIConversationCoach {
        if (!AIConversationCoach.instance) {
            AIConversationCoach.instance = new AIConversationCoach();
        }
        return AIConversationCoach.instance;
    }

    // ========================================================================
    // PROMPT ANALYSIS
    // ========================================================================

    analyzePrompt(prompt: string): PromptAnalysis {
        const feedback: ConversationFeedback[] = [];

        // Check against improvement patterns
        for (const { pattern, feedback: fb } of IMPROVEMENT_PATTERNS) {
            if (pattern.test(prompt)) {
                feedback.push({
                    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    ...fb,
                });
            }
        }

        // Calculate metrics
        const clarity = this.calculateClarity(prompt);
        const specificity = this.calculateSpecificity(prompt);
        const actionability = this.calculateActionability(prompt);

        const score = (clarity + specificity + actionability) / 3;

        // Generate suggested rewrite if score is low
        const suggestedRewrite = score < 60 ? this.generateRewrite(prompt) : undefined;

        return {
            score,
            clarity,
            specificity,
            actionability,
            feedback,
            suggestedRewrite,
        };
    }

    private calculateClarity(prompt: string): number {
        let score = 70; // Base score

        // Longer prompts tend to be clearer
        if (prompt.length > 50) score += 10;
        if (prompt.length > 100) score += 10;

        // Sentences indicate structure
        const sentences = prompt.split(/[.!?]/).filter(s => s.trim().length > 0);
        if (sentences.length > 1) score += 5;

        // Code blocks show specificity
        if (prompt.includes('```')) score += 10;

        // Numbered lists show structure
        if (/\d+\.\s/.test(prompt)) score += 5;

        return Math.min(100, score);
    }

    private calculateSpecificity(prompt: string): number {
        let score = 50;

        // Technical terms suggest specificity
        const technicalTerms = [
            'function', 'class', 'api', 'component', 'database', 'async',
            'typescript', 'javascript', 'react', 'node', 'error', 'bug',
        ];
        const termCount = technicalTerms.filter(t =>
            prompt.toLowerCase().includes(t)
        ).length;
        score += termCount * 5;

        // Explicit requirements
        if (/should|must|need to|require/i.test(prompt)) score += 10;

        // File paths or specific identifiers
        if (/\w+\.\w+|\w+\/\w+/.test(prompt)) score += 10;

        return Math.min(100, score);
    }

    private calculateActionability(prompt: string): number {
        let score = 60;

        // Action verbs at start
        const actionVerbs = ['create', 'implement', 'fix', 'debug', 'explain', 'review', 'refactor', 'optimize'];
        for (const verb of actionVerbs) {
            if (prompt.toLowerCase().startsWith(verb)) {
                score += 20;
                break;
            }
        }

        // Questions are actionable
        if (prompt.includes('?')) score += 5;

        // Imperative mood
        if (/^(please\s+)?(can you\s+)?(\w+)\s+/i.test(prompt)) score += 5;

        return Math.min(100, score);
    }

    private generateRewrite(prompt: string): string {
        // Simple rewrite suggestions
        const cleaned = prompt.replace(/^(can you|please|help me|I want you to)\s*/i, '');

        if (cleaned.length < 30) {
            return `${cleaned}\n\nContext: [Add relevant context here]\nExpected output: [Describe what you want]\nConstraints: [Any limitations or requirements]`;
        }

        return cleaned;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    startSession(): ConversationSession {
        const session: ConversationSession = {
            id: `session_${Date.now()}`,
            messages: [],
            overallQuality: 0,
            improvementTrend: 'stable',
            startedAt: new Date(),
        };

        this.sessions.set(session.id, session);
        this.emit('session:started', session);
        return session;
    }

    addMessage(sessionId: string, role: 'user' | 'assistant', content: string): AnalyzedMessage {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const analysis = this.analyzePrompt(content);

        const message: AnalyzedMessage = {
            role,
            content,
            analysis,
            timestamp: new Date(),
        };

        session.messages.push(message);
        this.updateSessionMetrics(session);

        this.emit('message:analyzed', { sessionId, message });
        return message;
    }

    private updateSessionMetrics(session: ConversationSession): void {
        const userMessages = session.messages.filter(m => m.role === 'user');

        if (userMessages.length === 0) {
            session.overallQuality = 0;
            return;
        }

        // Calculate overall quality
        session.overallQuality = userMessages.reduce((sum, m) =>
            sum + m.analysis.score, 0
        ) / userMessages.length;

        // Determine trend
        if (userMessages.length >= 3) {
            const recent = userMessages.slice(-3);
            const first = recent[0].analysis.score;
            const last = recent[2].analysis.score;

            if (last > first + 5) session.improvementTrend = 'improving';
            else if (last < first - 5) session.improvementTrend = 'declining';
            else session.improvementTrend = 'stable';
        }
    }

    // ========================================================================
    // TEMPLATES
    // ========================================================================

    getTemplates(): PromptTemplate[] {
        return [...this.templates];
    }

    getTemplatesByCategory(category: string): PromptTemplate[] {
        return this.templates.filter(t => t.category === category);
    }

    fillTemplate(templateId: string, values: Record<string, string>): string {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) throw new Error('Template not found');

        let result = template.template;
        for (const [key, value] of Object.entries(values)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        }

        return result;
    }

    addTemplate(template: Omit<PromptTemplate, 'id'>): PromptTemplate {
        const newTemplate: PromptTemplate = {
            ...template,
            id: `template_${Date.now()}`,
        };
        this.templates.push(newTemplate);
        return newTemplate;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSession(id: string): ConversationSession | undefined {
        return this.sessions.get(id);
    }

    getAllSessions(): ConversationSession[] {
        return Array.from(this.sessions.values());
    }

    getImprovementStats(): {
        totalSessions: number;
        avgQuality: number;
        improvingCount: number;
    } {
        const sessions = Array.from(this.sessions.values());
        const withMessages = sessions.filter(s => s.messages.length > 0);

        return {
            totalSessions: sessions.length,
            avgQuality: withMessages.length > 0
                ? withMessages.reduce((sum, s) => sum + s.overallQuality, 0) / withMessages.length
                : 0,
            improvingCount: sessions.filter(s => s.improvementTrend === 'improving').length,
        };
    }
}

export const aiConversationCoach = AIConversationCoach.getInstance();
