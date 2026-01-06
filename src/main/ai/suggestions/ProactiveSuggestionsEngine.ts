/**
 * Proactive Suggestions Engine
 * 
 * Anticipates user needs and provides helpful suggestions
 * based on code analysis and learned patterns.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface Suggestion {
    id: string;
    type: 'refactor' | 'test' | 'security' | 'performance' | 'documentation' | 'cleanup' | 'feature';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    file?: string;
    line?: number;
    action?: string;
    reasoning: string;
    dismissed: boolean;
    createdAt: number;
}

interface CodeContext {
    file: string;
    content: string;
    linesOfCode: number;
    functions: number;
    classes: number;
    imports: number;
    complexity: number;
}

interface SuggestionRule {
    id: string;
    name: string;
    check: (context: CodeContext) => Suggestion | null;
}

// ============================================================================
// PROACTIVE SUGGESTIONS ENGINE
// ============================================================================

export class ProactiveSuggestionsEngine extends EventEmitter {
    private static instance: ProactiveSuggestionsEngine;
    private suggestions: Map<string, Suggestion> = new Map();
    private rules: SuggestionRule[] = [];
    private dismissedIds: Set<string> = new Set();

    private constructor() {
        super();
        this.initializeRules();
    }

    static getInstance(): ProactiveSuggestionsEngine {
        if (!ProactiveSuggestionsEngine.instance) {
            ProactiveSuggestionsEngine.instance = new ProactiveSuggestionsEngine();
        }
        return ProactiveSuggestionsEngine.instance;
    }

    // ========================================================================
    // SUGGESTION RULES
    // ========================================================================

    private initializeRules(): void {
        // Large file refactoring
        this.rules.push({
            id: 'large-file',
            name: 'Large File Detection',
            check: (ctx) => {
                if (ctx.linesOfCode > 500) {
                    return {
                        id: `large-file-${ctx.file}`,
                        type: 'refactor',
                        priority: ctx.linesOfCode > 1000 ? 'high' : 'medium',
                        title: 'Consider splitting this file',
                        description: `This file has ${ctx.linesOfCode} lines. Consider breaking it into smaller modules.`,
                        file: ctx.file,
                        action: 'Split into multiple files based on functionality',
                        reasoning: 'Large files are harder to maintain and test',
                        dismissed: false,
                        createdAt: Date.now(),
                    };
                }
                return null;
            },
        });

        // Missing tests
        this.rules.push({
            id: 'missing-tests',
            name: 'Missing Tests Detection',
            check: (ctx) => {
                if (ctx.functions > 3 && !ctx.file.includes('.test.') && !ctx.file.includes('.spec.')) {
                    const hasExports = ctx.content.includes('export');
                    if (hasExports) {
                        return {
                            id: `missing-tests-${ctx.file}`,
                            type: 'test',
                            priority: 'medium',
                            title: 'Add tests for this module',
                            description: `This file has ${ctx.functions} functions without tests.`,
                            file: ctx.file,
                            action: 'Generate unit tests',
                            reasoning: 'Tests ensure code reliability and catch regressions',
                            dismissed: false,
                            createdAt: Date.now(),
                        };
                    }
                }
                return null;
            },
        });

        // Console.log cleanup
        this.rules.push({
            id: 'console-cleanup',
            name: 'Console Log Cleanup',
            check: (ctx) => {
                const consoleCount = (ctx.content.match(/console\.(log|debug|info)/g) || []).length;
                if (consoleCount > 3) {
                    return {
                        id: `console-cleanup-${ctx.file}`,
                        type: 'cleanup',
                        priority: 'low',
                        title: 'Remove console statements',
                        description: `Found ${consoleCount} console statements that should be removed or replaced with proper logging.`,
                        file: ctx.file,
                        action: 'Replace with proper logging or remove',
                        reasoning: 'Console statements slow down production and expose internal info',
                        dismissed: false,
                        createdAt: Date.now(),
                    };
                }
                return null;
            },
        });

        // Security - hardcoded credentials
        this.rules.push({
            id: 'hardcoded-secrets',
            name: 'Hardcoded Secrets Detection',
            check: (ctx) => {
                const patterns = [
                    /password\s*[=:]\s*['"][^'"]+['"]/i,
                    /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/i,
                    /secret\s*[=:]\s*['"][^'"]+['"]/i,
                    /token\s*[=:]\s*['"][A-Za-z0-9]{20,}['"]/i,
                ];

                for (const pattern of patterns) {
                    if (pattern.test(ctx.content)) {
                        return {
                            id: `hardcoded-secrets-${ctx.file}`,
                            type: 'security',
                            priority: 'critical',
                            title: '⚠️ Possible hardcoded credentials',
                            description: 'Potential secrets detected in source code.',
                            file: ctx.file,
                            action: 'Move credentials to environment variables',
                            reasoning: 'Hardcoded credentials are a major security risk',
                            dismissed: false,
                            createdAt: Date.now(),
                        };
                    }
                }
                return null;
            },
        });

        // High complexity
        this.rules.push({
            id: 'high-complexity',
            name: 'High Complexity Detection',
            check: (ctx) => {
                if (ctx.complexity > 20) {
                    return {
                        id: `high-complexity-${ctx.file}`,
                        type: 'refactor',
                        priority: 'medium',
                        title: 'Reduce code complexity',
                        description: `Cyclomatic complexity is ${ctx.complexity}. Consider simplifying.`,
                        file: ctx.file,
                        action: 'Extract functions, reduce nesting',
                        reasoning: 'High complexity makes code harder to understand and maintain',
                        dismissed: false,
                        createdAt: Date.now(),
                    };
                }
                return null;
            },
        });

        // Missing documentation
        this.rules.push({
            id: 'missing-docs',
            name: 'Missing Documentation',
            check: (ctx) => {
                const hasJSDoc = ctx.content.includes('/**');
                const hasExports = ctx.content.includes('export');

                if (hasExports && !hasJSDoc && ctx.functions > 2) {
                    return {
                        id: `missing-docs-${ctx.file}`,
                        type: 'documentation',
                        priority: 'low',
                        title: 'Add documentation',
                        description: 'Exported functions lack JSDoc comments.',
                        file: ctx.file,
                        action: 'Generate JSDoc comments',
                        reasoning: 'Documentation improves code maintainability',
                        dismissed: false,
                        createdAt: Date.now(),
                    };
                }
                return null;
            },
        });

        // Duplicate code potential
        this.rules.push({
            id: 'duplicate-potential',
            name: 'Duplicate Code Detection',
            check: (ctx) => {
                const lines = ctx.content.split('\n');
                const lineGroups = new Map<string, number>();

                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.length > 30) {
                        lineGroups.set(trimmed, (lineGroups.get(trimmed) || 0) + 1);
                    }
                });

                const duplicates = Array.from(lineGroups.entries()).filter(([_, count]) => count > 2);

                if (duplicates.length > 3) {
                    return {
                        id: `duplicate-code-${ctx.file}`,
                        type: 'refactor',
                        priority: 'medium',
                        title: 'Extract duplicate code',
                        description: `Found ${duplicates.length} repeated code patterns.`,
                        file: ctx.file,
                        action: 'Extract to reusable functions',
                        reasoning: 'DRY principle - Don\'t Repeat Yourself',
                        dismissed: false,
                        createdAt: Date.now(),
                    };
                }
                return null;
            },
        });

        // Performance - synchronous file operations
        this.rules.push({
            id: 'sync-operations',
            name: 'Synchronous Operations',
            check: (ctx) => {
                const syncOps = (ctx.content.match(/Sync\(/g) || []).length;
                if (syncOps > 2) {
                    return {
                        id: `sync-ops-${ctx.file}`,
                        type: 'performance',
                        priority: 'medium',
                        title: 'Replace synchronous operations',
                        description: `Found ${syncOps} synchronous file operations.`,
                        file: ctx.file,
                        action: 'Use async versions for better performance',
                        reasoning: 'Sync operations block the event loop',
                        dismissed: false,
                        createdAt: Date.now(),
                    };
                }
                return null;
            },
        });
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    async analyzeCode(file: string, content: string): Promise<Suggestion[]> {
        const context = this.buildContext(file, content);
        const newSuggestions: Suggestion[] = [];

        for (const rule of this.rules) {
            const suggestion = rule.check(context);
            if (suggestion && !this.dismissedIds.has(suggestion.id)) {
                if (!this.suggestions.has(suggestion.id)) {
                    this.suggestions.set(suggestion.id, suggestion);
                    newSuggestions.push(suggestion);
                }
            }
        }

        if (newSuggestions.length > 0) {
            this.emit('suggestions:new', newSuggestions);
        }

        return newSuggestions;
    }

    private buildContext(file: string, content: string): CodeContext {
        const lines = content.split('\n');
        const functions = (content.match(/function\s+\w+|=>\s*{|=>\s*\(/g) || []).length;
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const imports = (content.match(/import\s+/g) || []).length;

        // Calculate complexity
        let complexity = 1;
        const complexityPatterns = [/if\s*\(/g, /else/g, /for\s*\(/g, /while\s*\(/g, /case\s+/g, /\?\?/g, /&&/g, /\|\|/g];
        for (const pattern of complexityPatterns) {
            complexity += (content.match(pattern) || []).length;
        }

        return {
            file,
            content,
            linesOfCode: lines.length,
            functions,
            classes,
            imports,
            complexity,
        };
    }

    // ========================================================================
    // SUGGESTION MANAGEMENT
    // ========================================================================

    getSuggestions(priority?: string): Suggestion[] {
        const all = Array.from(this.suggestions.values()).filter(s => !s.dismissed);

        if (priority) {
            return all.filter(s => s.priority === priority);
        }

        return all.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    getSuggestionsByType(type: Suggestion['type']): Suggestion[] {
        return Array.from(this.suggestions.values())
            .filter(s => s.type === type && !s.dismissed);
    }

    dismissSuggestion(id: string): void {
        const suggestion = this.suggestions.get(id);
        if (suggestion) {
            suggestion.dismissed = true;
            this.dismissedIds.add(id);
            this.emit('suggestion:dismissed', suggestion);
        }
    }

    clearSuggestions(): void {
        this.suggestions.clear();
        this.emit('suggestions:cleared');
    }

    getStats(): { total: number; byType: Record<string, number>; byPriority: Record<string, number> } {
        const suggestions = this.getSuggestions();

        const byType: Record<string, number> = {};
        const byPriority: Record<string, number> = {};

        suggestions.forEach(s => {
            byType[s.type] = (byType[s.type] || 0) + 1;
            byPriority[s.priority] = (byPriority[s.priority] || 0) + 1;
        });

        return { total: suggestions.length, byType, byPriority };
    }
}

export const proactiveSuggestionsEngine = ProactiveSuggestionsEngine.getInstance();
