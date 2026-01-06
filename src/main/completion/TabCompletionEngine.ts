/**
 * Advanced Tab Completion Engine
 * Multi-line predictive completions like Cursor Tab
 */

import { EventEmitter } from 'events';

export interface CompletionContext {
    file: string;
    language: string;
    content: string;
    cursorLine: number;
    cursorColumn: number;
    prefix: string;
    suffix: string;
}

export interface CompletionItem {
    id: string;
    text: string;
    displayText: string;
    type: 'line' | 'block' | 'snippet';
    score: number;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}

export interface CompletionSession {
    id: string;
    context: CompletionContext;
    items: CompletionItem[];
    selectedIndex: number;
    active: boolean;
}

/**
 * TabCompletionEngine
 * Provides intelligent multi-line code completions
 */
export class TabCompletionEngine extends EventEmitter {
    private static instance: TabCompletionEngine;
    private sessions: Map<string, CompletionSession> = new Map();
    private activeSession: string | null = null;
    private completionCache: Map<string, CompletionItem[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TabCompletionEngine {
        if (!TabCompletionEngine.instance) {
            TabCompletionEngine.instance = new TabCompletionEngine();
        }
        return TabCompletionEngine.instance;
    }

    /**
     * Request completions for context
     */
    async getCompletions(context: CompletionContext): Promise<CompletionItem[]> {
        const cacheKey = this.getCacheKey(context);

        // Check cache
        if (this.completionCache.has(cacheKey)) {
            return this.completionCache.get(cacheKey)!;
        }

        const items: CompletionItem[] = [];

        // Generate line completions
        const lineCompletions = this.generateLineCompletions(context);
        items.push(...lineCompletions);

        // Generate block completions
        const blockCompletions = this.generateBlockCompletions(context);
        items.push(...blockCompletions);

        // Generate snippet completions
        const snippetCompletions = this.generateSnippetCompletions(context);
        items.push(...snippetCompletions);

        // Sort by score
        items.sort((a, b) => b.score - a.score);

        // Cache results
        this.completionCache.set(cacheKey, items);

        // Create session
        const sessionId = `session_${Date.now()}`;
        this.sessions.set(sessionId, {
            id: sessionId,
            context,
            items,
            selectedIndex: 0,
            active: true,
        });
        this.activeSession = sessionId;

        this.emit('completionsReady', { sessionId, items });
        return items;
    }

    /**
     * Accept the current completion
     */
    acceptCompletion(sessionId?: string): CompletionItem | null {
        const id = sessionId || this.activeSession;
        if (!id) return null;

        const session = this.sessions.get(id);
        if (!session || !session.active) return null;

        const item = session.items[session.selectedIndex];
        session.active = false;

        this.emit('completionAccepted', { sessionId: id, item });
        return item;
    }

    /**
     * Accept next word/line
     */
    acceptPartial(sessionId?: string): string | null {
        const id = sessionId || this.activeSession;
        if (!id) return null;

        const session = this.sessions.get(id);
        if (!session || !session.active) return null;

        const item = session.items[session.selectedIndex];
        const lines = item.text.split('\n');
        const firstLine = lines[0];

        // Update the completion to remaining text
        if (lines.length > 1) {
            item.text = lines.slice(1).join('\n');
        } else {
            session.active = false;
        }

        this.emit('partialAccepted', { sessionId: id, text: firstLine });
        return firstLine;
    }

    /**
     * Reject current completion
     */
    rejectCompletion(sessionId?: string): void {
        const id = sessionId || this.activeSession;
        if (!id) return;

        const session = this.sessions.get(id);
        if (session) {
            session.active = false;
        }

        this.emit('completionRejected', { sessionId: id });
    }

    /**
     * Navigate to next item
     */
    nextItem(sessionId?: string): CompletionItem | null {
        const id = sessionId || this.activeSession;
        if (!id) return null;

        const session = this.sessions.get(id);
        if (!session || !session.active) return null;

        session.selectedIndex = (session.selectedIndex + 1) % session.items.length;
        return session.items[session.selectedIndex];
    }

    /**
     * Navigate to previous item
     */
    prevItem(sessionId?: string): CompletionItem | null {
        const id = sessionId || this.activeSession;
        if (!id) return null;

        const session = this.sessions.get(id);
        if (!session || !session.active) return null;

        session.selectedIndex = session.selectedIndex === 0
            ? session.items.length - 1
            : session.selectedIndex - 1;
        return session.items[session.selectedIndex];
    }

    /**
     * Get active session
     */
    getActiveSession(): CompletionSession | null {
        if (!this.activeSession) return null;
        return this.sessions.get(this.activeSession) || null;
    }

    // Private methods

    private getCacheKey(context: CompletionContext): string {
        return `${context.file}:${context.cursorLine}:${context.prefix.slice(-50)}`;
    }

    private generateLineCompletions(context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];
        const { prefix, cursorLine, cursorColumn, language } = context;
        const trimmed = prefix.trim();

        // Common patterns by language
        const patterns = this.getLanguagePatterns(language);

        for (const pattern of patterns) {
            if (trimmed.endsWith(pattern.trigger) || trimmed.includes(pattern.trigger)) {
                items.push({
                    id: `line_${items.length}`,
                    text: pattern.completion,
                    displayText: pattern.description,
                    type: 'line',
                    score: pattern.priority,
                    range: {
                        startLine: cursorLine,
                        startColumn: cursorColumn,
                        endLine: cursorLine,
                        endColumn: cursorColumn + pattern.completion.length,
                    },
                });
            }
        }

        return items;
    }

    private generateBlockCompletions(context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];
        const { prefix, cursorLine, cursorColumn, language } = context;

        // Function/class detection
        if (/function\s+\w+\s*\([^)]*\)\s*\{?\s*$/.test(prefix)) {
            items.push({
                id: 'block_function',
                text: '\n  // TODO: Implement\n  return;\n}',
                displayText: 'Function body',
                type: 'block',
                score: 0.8,
                range: {
                    startLine: cursorLine,
                    startColumn: cursorColumn,
                    endLine: cursorLine + 3,
                    endColumn: 1,
                },
            });
        }

        if (/if\s*\([^)]+\)\s*\{?\s*$/.test(prefix)) {
            items.push({
                id: 'block_if',
                text: '\n  // Handle condition\n}',
                displayText: 'If block',
                type: 'block',
                score: 0.7,
                range: {
                    startLine: cursorLine,
                    startColumn: cursorColumn,
                    endLine: cursorLine + 2,
                    endColumn: 1,
                },
            });
        }

        if (/try\s*\{?\s*$/.test(prefix)) {
            items.push({
                id: 'block_try',
                text: '\n  // Try block\n} catch (error) {\n  console.error(error);\n}',
                displayText: 'Try-catch block',
                type: 'block',
                score: 0.75,
                range: {
                    startLine: cursorLine,
                    startColumn: cursorColumn,
                    endLine: cursorLine + 4,
                    endColumn: 1,
                },
            });
        }

        return items;
    }

    private generateSnippetCompletions(context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];
        const { prefix, cursorLine, cursorColumn, language } = context;

        const snippets = this.getLanguageSnippets(language);

        for (const snippet of snippets) {
            if (prefix.trim().endsWith(snippet.prefix)) {
                items.push({
                    id: `snippet_${snippet.name}`,
                    text: snippet.body,
                    displayText: snippet.description,
                    type: 'snippet',
                    score: 0.9,
                    range: {
                        startLine: cursorLine,
                        startColumn: cursorColumn - snippet.prefix.length,
                        endLine: cursorLine + snippet.body.split('\n').length - 1,
                        endColumn: cursorColumn + snippet.body.length,
                    },
                });
            }
        }

        return items;
    }

    private getLanguagePatterns(language: string): Array<{ trigger: string; completion: string; description: string; priority: number }> {
        const common = [
            { trigger: 'console.', completion: 'log()', description: 'console.log()', priority: 0.9 },
            { trigger: 'const ', completion: '= ', description: 'const assignment', priority: 0.7 },
            { trigger: 'return ', completion: '', description: 'return statement', priority: 0.6 },
        ];

        const byLanguage: Record<string, typeof common> = {
            typescript: [
                ...common,
                { trigger: 'async ', completion: 'function ', description: 'async function', priority: 0.8 },
                { trigger: 'interface ', completion: '{\n  \n}', description: 'interface definition', priority: 0.8 },
                { trigger: 'export ', completion: 'function ', description: 'export function', priority: 0.8 },
            ],
            javascript: [
                ...common,
                { trigger: 'async ', completion: 'function ', description: 'async function', priority: 0.8 },
                { trigger: 'export ', completion: 'default ', description: 'export default', priority: 0.8 },
            ],
            python: [
                { trigger: 'def ', completion: '():\n    pass', description: 'function definition', priority: 0.9 },
                { trigger: 'class ', completion: ':\n    def __init__(self):\n        pass', description: 'class definition', priority: 0.9 },
                { trigger: 'print(', completion: ')', description: 'print()', priority: 0.8 },
            ],
        };

        return byLanguage[language] || common;
    }

    private getLanguageSnippets(language: string): Array<{ name: string; prefix: string; body: string; description: string }> {
        const snippets: Record<string, Array<{ name: string; prefix: string; body: string; description: string }>> = {
            typescript: [
                { name: 'arrow', prefix: 'af', body: '() => {\n  \n}', description: 'Arrow function' },
                { name: 'asyncarrow', prefix: 'aaf', body: 'async () => {\n  \n}', description: 'Async arrow function' },
                { name: 'useState', prefix: 'us', body: 'const [state, setState] = useState()', description: 'useState hook' },
                { name: 'useEffect', prefix: 'ue', body: 'useEffect(() => {\n  \n}, [])', description: 'useEffect hook' },
            ],
            javascript: [
                { name: 'arrow', prefix: 'af', body: '() => {\n  \n}', description: 'Arrow function' },
                { name: 'promise', prefix: 'prom', body: 'new Promise((resolve, reject) => {\n  \n})', description: 'Promise' },
            ],
            python: [
                { name: 'main', prefix: 'main', body: 'if __name__ == "__main__":\n    main()', description: 'Main block' },
                { name: 'with', prefix: 'with', body: 'with open("file.txt", "r") as f:\n    content = f.read()', description: 'With statement' },
            ],
        };

        return snippets[language] || [];
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.completionCache.clear();
    }
}

// Singleton getter
export function getTabCompletionEngine(): TabCompletionEngine {
    return TabCompletionEngine.getInstance();
}
