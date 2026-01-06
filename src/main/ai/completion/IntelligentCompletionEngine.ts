/**
 * Intelligent Code Completion Engine
 * 
 * Provides context-aware code completion with multi-model support,
 * history tracking, and learning from user preferences.
 */

import { EventEmitter } from 'events';

export interface CompletionRequest {
    prefix: string;
    suffix?: string;
    language: string;
    filePath?: string;
    cursorPosition?: { line: number; column: number };
    context?: CompletionContext;
}

export interface CompletionContext {
    imports: string[];
    variables: string[];
    functions: string[];
    classes: string[];
    recentCode: string[];
    projectContext?: string;
}

export interface Completion {
    id: string;
    text: string;
    insertText: string;
    kind: CompletionKind;
    detail?: string;
    documentation?: string;
    score: number;
    source: CompletionSource;
}

export type CompletionKind =
    | 'snippet'
    | 'function'
    | 'variable'
    | 'class'
    | 'import'
    | 'keyword'
    | 'property'
    | 'method'
    | 'field';

export type CompletionSource =
    | 'ai'
    | 'local_symbols'
    | 'history'
    | 'common_patterns';

export interface CompletionSession {
    id: string;
    completions: Completion[];
    selectedIndex: number;
    accepted: boolean;
    timestamp: Date;
}

export interface CompletionStats {
    totalRequests: number;
    acceptanceRate: number;
    avgLatency: number;
    topCompletions: { text: string; count: number }[];
    byKind: { kind: CompletionKind; count: number }[];
}

export interface UserPattern {
    pattern: string;
    frequency: number;
    lastUsed: Date;
    context: string[];
}

const COMMON_PATTERNS: Record<string, string[]> = {
    typescript: [
        'const ${1:name} = ${2:value};',
        'function ${1:name}(${2:params}): ${3:ReturnType} {\n\t$0\n}',
        'interface ${1:Name} {\n\t$0\n}',
        'export const ${1:name} = ${2:value};',
        'if (${1:condition}) {\n\t$0\n}',
        'for (const ${1:item} of ${2:items}) {\n\t$0\n}',
        'try {\n\t$0\n} catch (error) {\n\t\n}',
        'async function ${1:name}(): Promise<${2:void}> {\n\t$0\n}',
    ],
    javascript: [
        'const ${1:name} = ${2:value};',
        'function ${1:name}(${2:params}) {\n\t$0\n}',
        'if (${1:condition}) {\n\t$0\n}',
        'for (const ${1:item} of ${2:items}) {\n\t$0\n}',
        'try {\n\t$0\n} catch (error) {\n\t\n}',
        'async function ${1:name}() {\n\t$0\n}',
    ],
    python: [
        'def ${1:name}(${2:params}):\n\t${0:pass}',
        'class ${1:Name}:\n\tdef __init__(self):\n\t\t${0:pass}',
        'if ${1:condition}:\n\t${0:pass}',
        'for ${1:item} in ${2:items}:\n\t${0:pass}',
        'try:\n\t${0:pass}\nexcept Exception as e:\n\tpass',
        'async def ${1:name}():\n\t${0:pass}',
    ],
};

export class IntelligentCompletionEngine extends EventEmitter {
    private static instance: IntelligentCompletionEngine;
    private sessions: Map<string, CompletionSession> = new Map();
    private userPatterns: Map<string, UserPattern> = new Map();
    private history: Completion[] = [];
    private stats = {
        totalRequests: 0,
        acceptedCompletions: 0,
        totalLatency: 0,
    };

    private constructor() {
        super();
    }

    static getInstance(): IntelligentCompletionEngine {
        if (!IntelligentCompletionEngine.instance) {
            IntelligentCompletionEngine.instance = new IntelligentCompletionEngine();
        }
        return IntelligentCompletionEngine.instance;
    }

    // ========================================================================
    // COMPLETION GENERATION
    // ========================================================================

    async getCompletions(request: CompletionRequest): Promise<Completion[]> {
        const startTime = Date.now();
        const completions: Completion[] = [];

        // Get local symbol completions
        completions.push(...this.getLocalSymbolCompletions(request));

        // Get pattern-based completions
        completions.push(...this.getPatternCompletions(request));

        // Get history-based completions
        completions.push(...this.getHistoryCompletions(request));

        // Get AI-generated completions
        completions.push(...await this.getAICompletions(request));

        // Score and sort completions
        const scored = this.scoreCompletions(completions, request);
        const unique = this.deduplicateCompletions(scored);

        // Create session
        const session: CompletionSession = {
            id: `session_${Date.now()}`,
            completions: unique,
            selectedIndex: 0,
            accepted: false,
            timestamp: new Date(),
        };
        this.sessions.set(session.id, session);

        // Update stats
        this.stats.totalRequests++;
        this.stats.totalLatency += Date.now() - startTime;

        this.emit('completions:generated', { sessionId: session.id, count: unique.length });
        return unique;
    }

    private getLocalSymbolCompletions(request: CompletionRequest): Completion[] {
        const completions: Completion[] = [];
        const prefix = request.prefix.split(/[\s\.\(\)\[\]\{\}]+/).pop()?.toLowerCase() || '';

        if (!request.context) return completions;

        // Variables
        for (const variable of request.context.variables || []) {
            if (variable.toLowerCase().startsWith(prefix)) {
                completions.push({
                    id: `local_var_${variable}`,
                    text: variable,
                    insertText: variable,
                    kind: 'variable',
                    detail: 'Local variable',
                    score: 0.9,
                    source: 'local_symbols',
                });
            }
        }

        // Functions
        for (const func of request.context.functions || []) {
            if (func.toLowerCase().startsWith(prefix)) {
                completions.push({
                    id: `local_fn_${func}`,
                    text: func,
                    insertText: `${func}()`,
                    kind: 'function',
                    detail: 'Local function',
                    score: 0.85,
                    source: 'local_symbols',
                });
            }
        }

        // Classes
        for (const cls of request.context.classes || []) {
            if (cls.toLowerCase().startsWith(prefix)) {
                completions.push({
                    id: `local_cls_${cls}`,
                    text: cls,
                    insertText: cls,
                    kind: 'class',
                    detail: 'Local class',
                    score: 0.85,
                    source: 'local_symbols',
                });
            }
        }

        return completions;
    }

    private getPatternCompletions(request: CompletionRequest): Completion[] {
        const completions: Completion[] = [];
        const patterns = COMMON_PATTERNS[request.language] || [];
        const prefix = request.prefix.trim().split('\n').pop() || '';

        for (const pattern of patterns) {
            // Check if pattern matches current context
            const patternStart = pattern.split(/[\$\{]/, 1)[0];
            if (patternStart.toLowerCase().includes(prefix.toLowerCase())) {
                completions.push({
                    id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    text: pattern.replace(/\$\{\d+:([^}]+)\}/g, '$1'),
                    insertText: pattern,
                    kind: 'snippet',
                    detail: 'Code pattern',
                    score: 0.7,
                    source: 'common_patterns',
                });
            }
        }

        // Add user patterns
        for (const [_, userPattern] of this.userPatterns) {
            if (userPattern.pattern.toLowerCase().includes(prefix.toLowerCase())) {
                completions.push({
                    id: `user_pattern_${Date.now()}`,
                    text: userPattern.pattern,
                    insertText: userPattern.pattern,
                    kind: 'snippet',
                    detail: `Used ${userPattern.frequency} times`,
                    score: 0.75 + (userPattern.frequency * 0.01),
                    source: 'history',
                });
            }
        }

        return completions;
    }

    private getHistoryCompletions(request: CompletionRequest): Completion[] {
        const prefix = request.prefix.trim().split('\n').pop() || '';

        return this.history
            .filter(c => c.text.toLowerCase().includes(prefix.toLowerCase()))
            .slice(-5)
            .map(c => ({
                ...c,
                id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                score: c.score * 0.8, // Slightly lower score than fresh completions
                source: 'history' as CompletionSource,
            }));
    }

    private async getAICompletions(request: CompletionRequest): Promise<Completion[]> {
        // Simulate AI completion generation
        const completions: Completion[] = [];

        // In real implementation, this would call an AI model
        const prefix = request.prefix.trim();
        const lastLine = prefix.split('\n').pop() || '';

        // Simulate context-aware suggestions
        if (lastLine.includes('function') || lastLine.includes('const')) {
            completions.push({
                id: `ai_${Date.now()}_1`,
                text: 'Complete function implementation',
                insertText: '// AI-generated implementation\n',
                kind: 'snippet',
                detail: 'AI suggestion',
                documentation: 'AI-powered code completion',
                score: 0.8,
                source: 'ai',
            });
        }

        if (lastLine.includes('if') || lastLine.includes('else')) {
            completions.push({
                id: `ai_${Date.now()}_2`,
                text: 'Handle edge case',
                insertText: '// Handle edge case\n',
                kind: 'snippet',
                detail: 'AI suggestion',
                score: 0.75,
                source: 'ai',
            });
        }

        return completions;
    }

    private scoreCompletions(completions: Completion[], request: CompletionRequest): Completion[] {
        const prefix = request.prefix.trim().split('\n').pop()?.toLowerCase() || '';

        return completions.map(c => {
            let score = c.score;

            // Boost exact prefix matches
            if (c.text.toLowerCase().startsWith(prefix)) {
                score += 0.2;
            }

            // Boost based on source priority
            const sourcePriority: Record<CompletionSource, number> = {
                local_symbols: 0.15,
                ai: 0.1,
                history: 0.05,
                common_patterns: 0,
            };
            score += sourcePriority[c.source] || 0;

            return { ...c, score: Math.min(1, score) };
        }).sort((a, b) => b.score - a.score);
    }

    private deduplicateCompletions(completions: Completion[]): Completion[] {
        const seen = new Set<string>();
        return completions.filter(c => {
            const key = c.text.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // ========================================================================
    // COMPLETION ACCEPTANCE
    // ========================================================================

    acceptCompletion(sessionId: string, completionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const completion = session.completions.find(c => c.id === completionId);
        if (!completion) return false;

        session.accepted = true;
        this.stats.acceptedCompletions++;

        // Add to history
        this.history.push(completion);
        if (this.history.length > 100) {
            this.history.shift();
        }

        // Update user patterns
        this.updateUserPattern(completion.text);

        this.emit('completion:accepted', { sessionId, completion });
        return true;
    }

    private updateUserPattern(text: string): void {
        const key = text.toLowerCase().trim();
        const existing = this.userPatterns.get(key);

        if (existing) {
            existing.frequency++;
            existing.lastUsed = new Date();
        } else {
            this.userPatterns.set(key, {
                pattern: text,
                frequency: 1,
                lastUsed: new Date(),
                context: [],
            });
        }
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    getStats(): CompletionStats {
        const kindCounts = new Map<CompletionKind, number>();
        const textCounts = new Map<string, number>();

        for (const completion of this.history) {
            kindCounts.set(completion.kind, (kindCounts.get(completion.kind) || 0) + 1);
            textCounts.set(completion.text, (textCounts.get(completion.text) || 0) + 1);
        }

        const topCompletions = Array.from(textCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([text, count]) => ({ text, count }));

        const byKind = Array.from(kindCounts.entries())
            .map(([kind, count]) => ({ kind, count }));

        return {
            totalRequests: this.stats.totalRequests,
            acceptanceRate: this.stats.totalRequests > 0
                ? this.stats.acceptedCompletions / this.stats.totalRequests
                : 0,
            avgLatency: this.stats.totalRequests > 0
                ? this.stats.totalLatency / this.stats.totalRequests
                : 0,
            topCompletions,
            byKind,
        };
    }

    getSession(id: string): CompletionSession | undefined {
        return this.sessions.get(id);
    }

    clearHistory(): void {
        this.history = [];
        this.userPatterns.clear();
        this.emit('history:cleared');
    }
}

export const intelligentCompletionEngine = IntelligentCompletionEngine.getInstance();
