/**
 * IntelligentErrorRecovery - AI-Powered Error Detection and Auto-Fix
 * 
 * Analyzes runtime errors, generates fix suggestions, and can
 * automatically apply high-confidence fixes with rollback capability.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface RuntimeError {
    id: string;
    type: 'syntax' | 'runtime' | 'type' | 'reference' | 'network' | 'timeout' | 'unknown';
    message: string;
    stack?: string;
    file?: string;
    line?: number;
    column?: number;
    code?: string;
    timestamp: Date;
}

export interface ErrorAnalysis {
    error: RuntimeError;
    category: string;
    rootCause: string;
    relatedCode?: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    frequency: number;
    firstSeen: Date;
    lastSeen: Date;
    fixes: FixSuggestion[];
}

export interface FixSuggestion {
    id: string;
    description: string;
    confidence: number; // 0-1
    code: {
        before: string;
        after: string;
    };
    autoApplyable: boolean;
    category: 'quick-fix' | 'refactor' | 'workaround' | 'configuration';
    estimatedEffort: 'trivial' | 'minor' | 'moderate' | 'major';
}

export interface FixResult {
    suggestionId: string;
    applied: boolean;
    success: boolean;
    error?: string;
    rollbackAvailable: boolean;
}

// ============================================================================
// ERROR PATTERNS
// ============================================================================

interface ErrorPattern {
    pattern: RegExp;
    type: RuntimeError['type'];
    category: string;
    rootCause: (match: RegExpMatchArray) => string;
    generateFix?: (match: RegExpMatchArray, code?: string) => FixSuggestion | null;
}

const ERROR_PATTERNS: ErrorPattern[] = [
    // Undefined variable
    {
        pattern: /(\w+) is not defined/,
        type: 'reference',
        category: 'undefined-reference',
        rootCause: (m) => `Variable '${m[1]}' is used before being declared`,
        generateFix: (m) => ({
            id: `fix-undefined-${m[1]}`,
            description: `Add declaration for '${m[1]}'`,
            confidence: 0.7,
            code: { before: m[1], after: `const ${m[1]} = undefined; // TODO: Initialize` },
            autoApplyable: false,
            category: 'quick-fix',
            estimatedEffort: 'trivial'
        })
    },

    // Cannot read property of undefined
    {
        pattern: /Cannot read propert(?:y|ies) ['"](.*?)['"] of (undefined|null)/,
        type: 'runtime',
        category: 'null-reference',
        rootCause: (m) => `Attempted to access '${m[1]}' on ${m[2]}`,
        generateFix: (m) => ({
            id: `fix-null-check-${m[1]}`,
            description: `Add null check before accessing '${m[1]}'`,
            confidence: 0.85,
            code: {
                before: `.${m[1]}`,
                after: `?.${m[1]}`
            },
            autoApplyable: true,
            category: 'quick-fix',
            estimatedEffort: 'trivial'
        })
    },

    // Type error
    {
        pattern: /(.+) is not a function/,
        type: 'type',
        category: 'type-error',
        rootCause: (m) => `'${m[1]}' was expected to be a function but isn't`,
        generateFix: (m) => ({
            id: `fix-not-function-${Date.now()}`,
            description: `Check if '${m[1]}' is a function before calling`,
            confidence: 0.6,
            code: {
                before: `${m[1]}()`,
                after: `typeof ${m[1]} === 'function' && ${m[1]}()`
            },
            autoApplyable: false,
            category: 'workaround',
            estimatedEffort: 'minor'
        })
    },

    // Import error
    {
        pattern: /Cannot find module ['"](.*?)['"]/,
        type: 'reference',
        category: 'missing-module',
        rootCause: (m) => `Module '${m[1]}' is not installed or path is incorrect`,
        generateFix: (m) => ({
            id: `fix-install-${m[1].replace(/[^a-z0-9]/gi, '-')}`,
            description: `Install missing module '${m[1]}'`,
            confidence: 0.9,
            code: {
                before: '',
                after: `npm install ${m[1]}`
            },
            autoApplyable: false,
            category: 'configuration',
            estimatedEffort: 'trivial'
        })
    },

    // Syntax error
    {
        pattern: /Unexpected token (.*)/,
        type: 'syntax',
        category: 'syntax-error',
        rootCause: (m) => `Unexpected token '${m[1]}' - likely missing bracket or semicolon`,
    },

    // JSON parse error
    {
        pattern: /Unexpected end of JSON|JSON\.parse/,
        type: 'runtime',
        category: 'json-error',
        rootCause: () => 'Invalid JSON data - check API response or file content',
        generateFix: () => ({
            id: `fix-json-${Date.now()}`,
            description: 'Add try-catch around JSON parsing',
            confidence: 0.8,
            code: {
                before: 'JSON.parse(data)',
                after: `(() => { try { return JSON.parse(data); } catch { return null; } })()`
            },
            autoApplyable: false,
            category: 'workaround',
            estimatedEffort: 'minor'
        })
    },

    // Network timeout
    {
        pattern: /timeout|ETIMEDOUT|ECONNREFUSED/i,
        type: 'network',
        category: 'network-error',
        rootCause: () => 'Network request failed - server unreachable or timeout',
        generateFix: () => ({
            id: `fix-timeout-${Date.now()}`,
            description: 'Add retry logic for network requests',
            confidence: 0.75,
            code: {
                before: 'await fetch(url)',
                after: 'await fetchWithRetry(url, { retries: 3, backoff: 1000 })'
            },
            autoApplyable: false,
            category: 'refactor',
            estimatedEffort: 'moderate'
        })
    },

    // Memory limit
    {
        pattern: /JavaScript heap out of memory|allocation failed/i,
        type: 'runtime',
        category: 'memory-error',
        rootCause: () => 'Memory limit exceeded - possible memory leak or large data processing',
    },

    // Async/await without try-catch
    {
        pattern: /Unhandled promise rejection/i,
        type: 'runtime',
        category: 'unhandled-promise',
        rootCause: () => 'Promise rejection was not caught',
        generateFix: () => ({
            id: `fix-promise-${Date.now()}`,
            description: 'Add .catch() or try-catch for async operations',
            confidence: 0.85,
            code: {
                before: 'await someAsyncFn()',
                after: 'await someAsyncFn().catch(e => { console.error(e); return null; })'
            },
            autoApplyable: false,
            category: 'quick-fix',
            estimatedEffort: 'trivial'
        })
    }
];

// ============================================================================
// INTELLIGENT ERROR RECOVERY
// ============================================================================

export class IntelligentErrorRecovery extends EventEmitter {
    private static instance: IntelligentErrorRecovery;

    private errors: Map<string, ErrorAnalysis> = new Map();
    private appliedFixes: Map<string, { original: string; fixed: string; file?: string }> = new Map();
    private autoApplyThreshold = 0.9;

    private constructor() {
        super();
    }

    static getInstance(): IntelligentErrorRecovery {
        if (!IntelligentErrorRecovery.instance) {
            IntelligentErrorRecovery.instance = new IntelligentErrorRecovery();
        }
        return IntelligentErrorRecovery.instance;
    }

    // ========================================================================
    // ERROR ANALYSIS
    // ========================================================================

    /**
     * Analyze an error and generate fix suggestions
     */
    analyzeError(error: Omit<RuntimeError, 'id' | 'timestamp'>): ErrorAnalysis {
        const fullError: RuntimeError = {
            ...error,
            id: this.generateId(),
            timestamp: new Date()
        };

        // Find matching pattern
        let matchedPattern: ErrorPattern | null = null;
        let match: RegExpMatchArray | null = null;

        for (const pattern of ERROR_PATTERNS) {
            match = fullError.message.match(pattern.pattern);
            if (match) {
                matchedPattern = pattern;
                break;
            }
        }

        // Build analysis
        const analysis: ErrorAnalysis = {
            error: fullError,
            category: matchedPattern?.category || 'unknown',
            rootCause: matchedPattern && match
                ? matchedPattern.rootCause(match)
                : 'Unable to determine root cause',
            relatedCode: error.code,
            impact: this.assessImpact(fullError),
            frequency: 1,
            firstSeen: new Date(),
            lastSeen: new Date(),
            fixes: []
        };

        // Generate fix suggestions
        if (matchedPattern?.generateFix && match) {
            const fix = matchedPattern.generateFix(match, error.code);
            if (fix) {
                analysis.fixes.push(fix);
            }
        }

        // Add generic fixes
        analysis.fixes.push(...this.getGenericFixes(fullError));

        // Store or update
        const existingKey = this.getErrorKey(fullError);
        const existing = this.errors.get(existingKey);
        if (existing) {
            existing.frequency++;
            existing.lastSeen = new Date();
            this.emit('error:recurring', existing);
            return existing;
        }

        this.errors.set(existingKey, analysis);
        this.emit('error:new', analysis);

        console.log(`🔧 [ErrorRecovery] Analyzed: ${analysis.category} - ${analysis.fixes.length} fixes available`);
        return analysis;
    }

    private assessImpact(error: RuntimeError): ErrorAnalysis['impact'] {
        // Critical: crashes, security, data loss
        if (/crash|security|corrupt|data loss/i.test(error.message)) {
            return 'critical';
        }
        // High: functionality broken
        if (error.type === 'reference' || error.type === 'syntax') {
            return 'high';
        }
        // Medium: degraded functionality
        if (error.type === 'runtime' || error.type === 'network') {
            return 'medium';
        }
        // Low: cosmetic or recoverable
        return 'low';
    }

    private getGenericFixes(error: RuntimeError): FixSuggestion[] {
        const fixes: FixSuggestion[] = [];

        // Add logging
        fixes.push({
            id: `generic-log-${error.id}`,
            description: 'Add detailed logging around error location',
            confidence: 0.5,
            code: {
                before: '',
                after: `console.error('[Debug]', { error: ${JSON.stringify(error.message).slice(0, 50)}... });`
            },
            autoApplyable: false,
            category: 'workaround',
            estimatedEffort: 'trivial'
        });

        return fixes;
    }

    // ========================================================================
    // FIX APPLICATION
    // ========================================================================

    /**
     * Apply a suggested fix
     */
    async applyFix(analysisId: string, suggestionId: string, codeToFix: string): Promise<FixResult> {
        const analysis = Array.from(this.errors.values()).find(e => e.error.id === analysisId);
        if (!analysis) {
            return { suggestionId, applied: false, success: false, error: 'Analysis not found', rollbackAvailable: false };
        }

        const suggestion = analysis.fixes.find(f => f.id === suggestionId);
        if (!suggestion) {
            return { suggestionId, applied: false, success: false, error: 'Suggestion not found', rollbackAvailable: false };
        }

        try {
            // Apply the fix
            const fixedCode = codeToFix.replace(suggestion.code.before, suggestion.code.after);

            // Store for rollback
            this.appliedFixes.set(suggestionId, {
                original: codeToFix,
                fixed: fixedCode,
                file: analysis.error.file
            });

            this.emit('fix:applied', { suggestionId, analysis });
            console.log(`✅ [ErrorRecovery] Applied fix: ${suggestion.description}`);

            return {
                suggestionId,
                applied: true,
                success: true,
                rollbackAvailable: true
            };
        } catch (err: any) {
            return {
                suggestionId,
                applied: false,
                success: false,
                error: err.message,
                rollbackAvailable: false
            };
        }
    }

    /**
     * Automatically apply high-confidence fixes
     */
    async autoApplyFixes(analysis: ErrorAnalysis, codeToFix: string): Promise<FixResult[]> {
        const results: FixResult[] = [];

        for (const fix of analysis.fixes) {
            if (fix.autoApplyable && fix.confidence >= this.autoApplyThreshold) {
                const result = await this.applyFix(analysis.error.id, fix.id, codeToFix);
                results.push(result);

                if (result.success) {
                    codeToFix = this.appliedFixes.get(fix.id)?.fixed || codeToFix;
                }
            }
        }

        return results;
    }

    /**
     * Rollback a fix
     */
    rollback(suggestionId: string): { success: boolean; original?: string } {
        const fix = this.appliedFixes.get(suggestionId);
        if (!fix) {
            return { success: false };
        }

        this.appliedFixes.delete(suggestionId);
        this.emit('fix:rolledback', { suggestionId });

        return { success: true, original: fix.original };
    }

    // ========================================================================
    // QUERY & STATS
    // ========================================================================

    /**
     * Get all analyzed errors
     */
    getErrors(options?: {
        category?: string;
        impact?: ErrorAnalysis['impact'];
        limit?: number
    }): ErrorAnalysis[] {
        let results = Array.from(this.errors.values());

        if (options?.category) {
            results = results.filter(e => e.category === options.category);
        }
        if (options?.impact) {
            results = results.filter(e => e.impact === options.impact);
        }

        return results
            .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
            .slice(0, options?.limit || 50);
    }

    /**
     * Get recurring errors
     */
    getRecurringErrors(minFrequency: number = 3): ErrorAnalysis[] {
        return Array.from(this.errors.values())
            .filter(e => e.frequency >= minFrequency)
            .sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalErrors: number;
        byCategory: Record<string, number>;
        byImpact: Record<string, number>;
        fixesApplied: number;
        autoFixRate: number;
    } {
        const byCategory: Record<string, number> = {};
        const byImpact: Record<string, number> = {};
        let autoFixable = 0;

        for (const analysis of this.errors.values()) {
            byCategory[analysis.category] = (byCategory[analysis.category] || 0) + 1;
            byImpact[analysis.impact] = (byImpact[analysis.impact] || 0) + 1;
            if (analysis.fixes.some(f => f.autoApplyable)) autoFixable++;
        }

        return {
            totalErrors: this.errors.size,
            byCategory,
            byImpact,
            fixesApplied: this.appliedFixes.size,
            autoFixRate: this.errors.size > 0 ? autoFixable / this.errors.size : 0
        };
    }

    /**
     * Set auto-apply confidence threshold
     */
    setAutoApplyThreshold(threshold: number): void {
        this.autoApplyThreshold = Math.max(0, Math.min(1, threshold));
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private getErrorKey(error: RuntimeError): string {
        return `${error.type}:${error.message.substring(0, 100)}`;
    }

    private generateId(): string {
        return `err-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    clear(): void {
        this.errors.clear();
        this.appliedFixes.clear();
    }
}

// Export singleton
export const intelligentErrorRecovery = IntelligentErrorRecovery.getInstance();
