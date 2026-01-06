/**
 * Speech-to-Code Engine
 * 
 * Natural language dictation that converts to working code.
 * "Create a function that takes a list and returns unique items"
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface SpeechInput {
    transcript: string;
    confidence: number;
    language?: string;
    timestamp: Date;
}

export interface CodeOutput {
    code: string;
    language: string;
    explanation?: string;
    alternatives?: string[];
}

export interface SpeechSession {
    id: string;
    inputs: SpeechInput[];
    outputs: CodeOutput[];
    context: string[];
    startedAt: Date;
}

// ============================================================================
// SPEECH TO CODE
// ============================================================================

export class SpeechToCode extends EventEmitter {
    private static instance: SpeechToCode;
    private modelManager: ModelManager;
    private currentSession: SpeechSession | null = null;
    private codeContext: string[] = [];

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): SpeechToCode {
        if (!SpeechToCode.instance) {
            SpeechToCode.instance = new SpeechToCode();
        }
        return SpeechToCode.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    startSession(language = 'typescript'): SpeechSession {
        this.currentSession = {
            id: `speech_${Date.now()}`,
            inputs: [],
            outputs: [],
            context: [language],
            startedAt: new Date(),
        };
        this.emit('session:started', this.currentSession);
        return this.currentSession;
    }

    endSession(): void {
        if (this.currentSession) {
            this.emit('session:ended', this.currentSession);
            this.currentSession = null;
        }
    }

    // ========================================================================
    // SPEECH PROCESSING
    // ========================================================================

    /**
     * Convert speech to code
     */
    async processTranscript(transcript: string, options?: {
        language?: string;
        context?: string;
        style?: 'concise' | 'verbose' | 'documented';
    }): Promise<CodeOutput> {
        const { language = 'typescript', context = '', style = 'concise' } = options || {};

        const input: SpeechInput = {
            transcript,
            confidence: 1.0,
            language,
            timestamp: new Date(),
        };

        this.emit('input:received', input);

        const prompt = `Convert this natural language description into ${language} code.

Description: "${transcript}"
${context ? `Context: ${context}` : ''}
${this.codeContext.length > 0 ? `Previous code context:\n${this.codeContext.slice(-3).join('\n')}` : ''}

Style: ${style}
- concise: minimal code, no comments
- verbose: clear variable names, some comments
- documented: full JSDoc/docstrings

Return ONLY the code, no explanations.`;

        const code = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const cleanCode = this.extractCode(code, language);

        const output: CodeOutput = {
            code: cleanCode,
            language,
        };

        // Add to context
        this.codeContext.push(cleanCode);
        if (this.codeContext.length > 10) this.codeContext.shift();

        if (this.currentSession) {
            this.currentSession.inputs.push(input);
            this.currentSession.outputs.push(output);
        }

        this.emit('output:generated', output);
        return output;
    }

    /**
     * Generate code with alternatives
     */
    async processWithAlternatives(transcript: string, language = 'typescript'): Promise<CodeOutput> {
        const prompt = `Convert this description into ${language} code and provide 2 alternative implementations.

Description: "${transcript}"

Respond in JSON:
\`\`\`json
{
    "primary": "main implementation code",
    "alternatives": ["alternative 1", "alternative 2"],
    "explanation": "brief explanation of approaches"
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        return {
            code: parsed.primary || '',
            language,
            alternatives: parsed.alternatives || [],
            explanation: parsed.explanation,
        };
    }

    /**
     * Refine generated code based on feedback
     */
    async refineCode(code: string, feedback: string): Promise<string> {
        const prompt = `Refine this code based on the feedback.

Code:
\`\`\`
${code}
\`\`\`

Feedback: ${feedback}

Return only the refined code.`;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        return this.extractCode(response, 'typescript');
    }

    // ========================================================================
    // INTENT DETECTION
    // ========================================================================

    /**
     * Detect intent from transcript
     */
    detectIntent(transcript: string): {
        type: 'create' | 'modify' | 'delete' | 'explain' | 'test' | 'unknown';
        target?: string;
        action?: string;
    } {
        const lower = transcript.toLowerCase();

        if (lower.includes('create') || lower.includes('make') || lower.includes('add') || lower.includes('write')) {
            return { type: 'create', action: 'create' };
        }
        if (lower.includes('change') || lower.includes('modify') || lower.includes('update') || lower.includes('fix')) {
            return { type: 'modify', action: 'modify' };
        }
        if (lower.includes('delete') || lower.includes('remove')) {
            return { type: 'delete', action: 'delete' };
        }
        if (lower.includes('explain') || lower.includes('what') || lower.includes('how')) {
            return { type: 'explain', action: 'explain' };
        }
        if (lower.includes('test')) {
            return { type: 'test', action: 'test' };
        }

        return { type: 'unknown' };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private extractCode(text: string, language: string): string {
        const regex = new RegExp(`\`\`\`${language}?\\s*([\\s\\S]*?)\`\`\``, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : text.trim();
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    setCodeContext(context: string[]): void {
        this.codeContext = context;
    }

    getSession(): SpeechSession | null {
        return this.currentSession;
    }
}

// Export singleton
export const speechToCode = SpeechToCode.getInstance();
