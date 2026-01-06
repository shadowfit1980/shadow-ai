/**
 * AI Pair Programming Sessions
 * 
 * Live pair programming with AI that explains as it codes
 * and provides "rubber duck" debugging mode.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type PairMode = 'driver' | 'navigator' | 'rubber-duck' | 'mentor';

export interface PairSession {
    id: string;
    mode: PairMode;
    task: string;
    messages: PairMessage[];
    code: string[];
    startedAt: Date;
    status: 'active' | 'paused' | 'ended';
}

export interface PairMessage {
    role: 'user' | 'ai';
    type: 'thought' | 'explanation' | 'suggestion' | 'question' | 'code';
    content: string;
    timestamp: Date;
}

export interface CodingStep {
    action: string;
    code: string;
    explanation: string;
    thinking?: string;
}

// ============================================================================
// AI PAIR PROGRAMMER
// ============================================================================

export class AIPairProgrammer extends EventEmitter {
    private static instance: AIPairProgrammer;
    private modelManager: ModelManager;
    private currentSession: PairSession | null = null;
    private thinkAloud = true;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): AIPairProgrammer {
        if (!AIPairProgrammer.instance) {
            AIPairProgrammer.instance = new AIPairProgrammer();
        }
        return AIPairProgrammer.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    /**
     * Start a pair programming session
     */
    startSession(task: string, mode: PairMode = 'navigator'): PairSession {
        this.currentSession = {
            id: `pair_${Date.now()}`,
            mode,
            task,
            messages: [],
            code: [],
            startedAt: new Date(),
            status: 'active',
        };

        const intro = this.getModeIntro(mode);
        this.addMessage('ai', 'thought', intro);

        this.emit('session:started', this.currentSession);
        return this.currentSession;
    }

    private getModeIntro(mode: PairMode): string {
        switch (mode) {
            case 'driver':
                return "I'll take the lead on coding. You watch and guide when needed.";
            case 'navigator':
                return "You code, I'll guide and suggest improvements as we go.";
            case 'rubber-duck':
                return "Explain your code to me step by step. I'll help you spot issues.";
            case 'mentor':
                return "I'll teach as we code, explaining concepts and best practices.";
        }
    }

    /**
     * End session
     */
    endSession(): PairSession | null {
        if (this.currentSession) {
            this.currentSession.status = 'ended';
            this.emit('session:ended', this.currentSession);
            const session = this.currentSession;
            this.currentSession = null;
            return session;
        }
        return null;
    }

    // ========================================================================
    // PAIR PROGRAMMING
    // ========================================================================

    /**
     * Code together step by step
     */
    async codeStep(context: string): Promise<CodingStep> {
        if (!this.currentSession) {
            throw new Error('No active session');
        }

        const mode = this.currentSession.mode;
        const prompt = this.getStepPrompt(mode, context);

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        const step: CodingStep = {
            action: parsed.action || 'code',
            code: parsed.code || '',
            explanation: parsed.explanation || '',
            thinking: this.thinkAloud ? parsed.thinking : undefined,
        };

        if (step.thinking) {
            this.addMessage('ai', 'thought', step.thinking);
        }
        this.addMessage('ai', 'code', step.code);
        this.addMessage('ai', 'explanation', step.explanation);

        this.currentSession.code.push(step.code);
        this.emit('step:completed', step);

        return step;
    }

    private getStepPrompt(mode: PairMode, context: string): string {
        const base = `Current context: ${context}

Respond in JSON:
\`\`\`json
{
    "thinking": "your thought process (if think-aloud enabled)",
    "action": "what you're doing",
    "code": "the code you write",
    "explanation": "why you wrote it this way"
}
\`\`\``;

        switch (mode) {
            case 'driver':
                return `You are the driver in pair programming. Write the next piece of code.\n${base}`;
            case 'navigator':
                return `You are the navigator. Suggest the next improvement or code change.\n${base}`;
            case 'rubber-duck':
                return `The user is explaining their code. Listen and identify issues.\n${base}`;
            case 'mentor':
                return `You are teaching. Write code and explain the concepts.\n${base}`;
            default:
                return base;
        }
    }

    /**
     * Rubber duck mode: user explains, AI finds issues
     */
    async rubberDuck(userExplanation: string): Promise<{
        understanding: string;
        issues: string[];
        questions: string[];
        suggestions: string[];
    }> {
        this.addMessage('user', 'explanation', userExplanation);

        const prompt = `The user is explaining their code/approach:
"${userExplanation}"

As a rubber duck debugger:
1. Summarize your understanding
2. Identify any issues or gaps in their logic
3. Ask clarifying questions
4. Suggest improvements

Respond in JSON:
\`\`\`json
{
    "understanding": "what I understood",
    "issues": ["potential issue 1", "issue 2"],
    "questions": ["clarifying question 1"],
    "suggestions": ["suggestion 1"]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        if (parsed.issues?.length > 0) {
            this.addMessage('ai', 'suggestion', `Issues found: ${parsed.issues.join(', ')}`);
        }
        if (parsed.questions?.length > 0) {
            this.addMessage('ai', 'question', parsed.questions[0]);
        }

        return {
            understanding: parsed.understanding || '',
            issues: parsed.issues || [],
            questions: parsed.questions || [],
            suggestions: parsed.suggestions || [],
        };
    }

    /**
     * Ask AI for guidance
     */
    async askForHelp(question: string): Promise<string> {
        this.addMessage('user', 'question', question);

        const context = this.currentSession?.code.slice(-3).join('\n') || '';

        const prompt = `The user asks during pair programming:
"${question}"

Recent code context:
${context}

Provide helpful guidance.`;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        this.addMessage('ai', 'explanation', response);
        return response;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private addMessage(role: 'user' | 'ai', type: PairMessage['type'], content: string): void {
        if (!this.currentSession) return;

        const message: PairMessage = {
            role,
            type,
            content,
            timestamp: new Date(),
        };

        this.currentSession.messages.push(message);
        this.emit('message:added', message);
    }

    setThinkAloud(enabled: boolean): void {
        this.thinkAloud = enabled;
    }

    getSession(): PairSession | null {
        return this.currentSession;
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const aiPairProgrammer = AIPairProgrammer.getInstance();
