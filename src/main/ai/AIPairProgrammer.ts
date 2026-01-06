/**
 * AI Pair Programming Service
 * 
 * Real-time AI suggestions as you type
 */

import { EventEmitter } from 'events';

interface Suggestion {
    id: string;
    text: string;
    range: { start: number; end: number };
    type: 'completion' | 'refactor' | 'fix' | 'documentation';
    confidence: number;
    preview?: string;
}

interface CodeContext {
    file: string;
    language: string;
    content: string;
    cursorPosition: number;
    selectedText?: string;
}

/**
 * AIPairProgrammer - Real-time AI coding assistance
 */
export class AIPairProgrammer extends EventEmitter {
    private static instance: AIPairProgrammer;
    private debounceTimer: NodeJS.Timeout | null = null;
    private debounceMs = 300;
    private isEnabled = true;
    private lastContext: CodeContext | null = null;
    private pendingSuggestion: AbortController | null = null;

    private constructor() {
        super();
    }

    static getInstance(): AIPairProgrammer {
        if (!AIPairProgrammer.instance) {
            AIPairProgrammer.instance = new AIPairProgrammer();
        }
        return AIPairProgrammer.instance;
    }

    /**
     * Enable/disable pair programming
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.emit('status:changed', { enabled });
    }

    /**
     * Check if enabled
     */
    getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Process code change and generate suggestions
     */
    async onCodeChange(context: CodeContext): Promise<Suggestion[]> {
        if (!this.isEnabled) return [];

        // Cancel previous pending suggestion
        if (this.pendingSuggestion) {
            this.pendingSuggestion.abort();
        }

        // Debounce
        return new Promise((resolve) => {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.debounceTimer = setTimeout(async () => {
                const suggestions = await this.generateSuggestions(context);
                resolve(suggestions);
            }, this.debounceMs);
        });
    }

    /**
     * Generate suggestions based on context
     */
    private async generateSuggestions(context: CodeContext): Promise<Suggestion[]> {
        this.lastContext = context;
        this.pendingSuggestion = new AbortController();

        try {
            const { ModelManager } = await import('./ModelManager');
            const manager = ModelManager.getInstance();

            // Get context around cursor
            const lines = context.content.split('\n');
            const beforeCursor = context.content.substring(0, context.cursorPosition);
            const lineNumber = beforeCursor.split('\n').length;
            const currentLine = lines[lineNumber - 1];

            // Build prompt for completion
            const contextLines = lines.slice(Math.max(0, lineNumber - 10), lineNumber + 5).join('\n');

            const prompt = `Complete this ${context.language} code. Return ONLY the completion, no explanation.

Context:
\`\`\`${context.language}
${contextLines}
\`\`\`

Current line: ${currentLine}
Complete from cursor position.`;

            const response = await manager.chat([
                { role: 'user', content: prompt, timestamp: new Date() },
            ]);

            // Parse response
            const suggestion: Suggestion = {
                id: `sugg_${Date.now()}`,
                text: this.cleanSuggestion(response),
                range: { start: context.cursorPosition, end: context.cursorPosition },
                type: 'completion',
                confidence: 0.8,
                preview: this.cleanSuggestion(response).substring(0, 50),
            };

            this.emit('suggestion:generated', suggestion);
            return [suggestion];
        } catch (error: any) {
            if (error.name === 'AbortError') return [];
            this.emit('suggestion:error', { error: error.message });
            return [];
        }
    }

    /**
     * Clean suggestion text
     */
    private cleanSuggestion(text: string): string {
        // Remove markdown code blocks
        const codeMatch = text.match(/```\w*\n?([\s\S]*?)```/);
        if (codeMatch) return codeMatch[1].trim();
        return text.trim();
    }

    /**
     * Get quick fix for an error
     */
    async getQuickFix(context: CodeContext, error: string): Promise<Suggestion | null> {
        try {
            const { ModelManager } = await import('./ModelManager');
            const manager = ModelManager.getInstance();

            const prompt = `Fix this ${context.language} error:

Error: ${error}

Code:
\`\`\`${context.language}
${context.content}
\`\`\`

Return ONLY the fixed code, no explanation.`;

            const response = await manager.chat([
                { role: 'user', content: prompt, timestamp: new Date() },
            ]);

            return {
                id: `fix_${Date.now()}`,
                text: this.cleanSuggestion(response),
                range: { start: 0, end: context.content.length },
                type: 'fix',
                confidence: 0.75,
                preview: 'Apply fix',
            };
        } catch {
            return null;
        }
    }

    /**
     * Generate documentation for code
     */
    async generateDocumentation(context: CodeContext): Promise<Suggestion | null> {
        try {
            const { ModelManager } = await import('./ModelManager');
            const manager = ModelManager.getInstance();

            const code = context.selectedText || context.content;
            const prompt = `Generate JSDoc/documentation comments for this ${context.language} code:

\`\`\`${context.language}
${code}
\`\`\`

Return ONLY the documentation comment, no explanation.`;

            const response = await manager.chat([
                { role: 'user', content: prompt, timestamp: new Date() },
            ]);

            return {
                id: `doc_${Date.now()}`,
                text: this.cleanSuggestion(response) + '\n',
                range: { start: 0, end: 0 },
                type: 'documentation',
                confidence: 0.9,
                preview: 'Add documentation',
            };
        } catch {
            return null;
        }
    }

    /**
     * Suggest refactoring
     */
    async suggestRefactor(context: CodeContext): Promise<Suggestion | null> {
        try {
            const { ModelManager } = await import('./ModelManager');
            const manager = ModelManager.getInstance();

            const code = context.selectedText || context.content;
            const prompt = `Refactor this ${context.language} code to be cleaner and more efficient:

\`\`\`${context.language}
${code}
\`\`\`

Return ONLY the refactored code, no explanation.`;

            const response = await manager.chat([
                { role: 'user', content: prompt, timestamp: new Date() },
            ]);

            return {
                id: `refactor_${Date.now()}`,
                text: this.cleanSuggestion(response),
                range: { start: 0, end: context.content.length },
                type: 'refactor',
                confidence: 0.7,
                preview: 'Apply refactoring',
            };
        } catch {
            return null;
        }
    }

    /**
     * Set debounce time
     */
    setDebounceMs(ms: number): void {
        this.debounceMs = ms;
    }

    /**
     * Cancel pending suggestions
     */
    cancel(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        if (this.pendingSuggestion) {
            this.pendingSuggestion.abort();
        }
    }
}

export default AIPairProgrammer;
