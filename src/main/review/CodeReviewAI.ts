/**
 * Code Review AI
 * Automated code review with AI suggestions
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';

export interface ReviewComment {
    id: string;
    line: number;
    endLine?: number;
    severity: 'info' | 'warning' | 'error' | 'suggestion';
    category: ReviewCategory;
    message: string;
    suggestion?: string;
    autoFixable: boolean;
}

export type ReviewCategory =
    | 'security'
    | 'performance'
    | 'maintainability'
    | 'style'
    | 'bug'
    | 'duplication'
    | 'complexity';

export interface ReviewResult {
    id: string;
    filePath: string;
    comments: ReviewComment[];
    score: number;
    metrics: CodeMetrics;
    duration: number;
}

export interface CodeMetrics {
    linesOfCode: number;
    complexity: number;
    maintainability: number;
    coverage?: number;
}

/**
 * CodeReviewAI
 * AI-powered code review system
 */
export class CodeReviewAI extends EventEmitter {
    private static instance: CodeReviewAI;
    private reviews: Map<string, ReviewResult> = new Map();
    private rules: Map<string, (code: string) => ReviewComment[]> = new Map();

    private constructor() {
        super();
        this.initDefaultRules();
    }

    static getInstance(): CodeReviewAI {
        if (!CodeReviewAI.instance) {
            CodeReviewAI.instance = new CodeReviewAI();
        }
        return CodeReviewAI.instance;
    }

    /**
     * Initialize default review rules
     */
    private initDefaultRules(): void {
        // Security rules
        this.rules.set('hardcoded-secrets', (code) => {
            const comments: ReviewComment[] = [];
            const patterns = [
                /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
                /password\s*[:=]\s*['"][^'"]+['"]/gi,
                /secret\s*[:=]\s*['"][^'"]+['"]/gi,
            ];

            const lines = code.split('\n');
            lines.forEach((line, index) => {
                for (const pattern of patterns) {
                    if (pattern.test(line)) {
                        comments.push({
                            id: `sec_${index}`,
                            line: index + 1,
                            severity: 'error',
                            category: 'security',
                            message: 'Hardcoded secret detected',
                            suggestion: 'Use environment variables for sensitive data',
                            autoFixable: false,
                        });
                    }
                }
            });

            return comments;
        });

        // Performance rules
        this.rules.set('no-console', (code) => {
            const comments: ReviewComment[] = [];
            const lines = code.split('\n');

            lines.forEach((line, index) => {
                if (/console\.(log|debug|info)\(/.test(line)) {
                    comments.push({
                        id: `perf_${index}`,
                        line: index + 1,
                        severity: 'warning',
                        category: 'performance',
                        message: 'Console statement found',
                        suggestion: 'Remove console statements in production',
                        autoFixable: true,
                    });
                }
            });

            return comments;
        });

        // Maintainability rules
        this.rules.set('function-length', (code) => {
            const comments: ReviewComment[] = [];
            const funcPattern = /^(\s*)(async\s+)?function\s+(\w+)|(\s*)(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(/gm;

            let match;
            while ((match = funcPattern.exec(code)) !== null) {
                const startLine = code.slice(0, match.index).split('\n').length;
                // Check if function is too long (>50 lines)
                const remaining = code.slice(match.index);
                const lines = remaining.split('\n').slice(0, 60);

                if (lines.length > 50) {
                    comments.push({
                        id: `maint_${startLine}`,
                        line: startLine,
                        severity: 'suggestion',
                        category: 'complexity',
                        message: 'Function may be too long',
                        suggestion: 'Consider breaking into smaller functions',
                        autoFixable: false,
                    });
                }
            }

            return comments;
        });
    }

    /**
     * Review a file
     */
    async reviewFile(filePath: string): Promise<ReviewResult> {
        const startTime = Date.now();
        this.emit('reviewStarted', { filePath });

        const code = await fs.readFile(filePath, 'utf-8');
        const comments: ReviewComment[] = [];

        // Apply all rules
        for (const [name, rule] of this.rules) {
            try {
                const ruleComments = rule(code);
                comments.push(...ruleComments);
            } catch (error) {
                console.warn(`Rule ${name} failed:`, error);
            }
        }

        // Calculate metrics
        const lines = code.split('\n');
        const metrics: CodeMetrics = {
            linesOfCode: lines.filter(l => l.trim()).length,
            complexity: this.calculateComplexity(code),
            maintainability: this.calculateMaintainability(code, comments),
        };

        // Calculate score (0-100)
        const score = Math.max(0, 100 - comments.length * 5);

        const result: ReviewResult = {
            id: `review_${Date.now()}`,
            filePath,
            comments,
            score,
            metrics,
            duration: Date.now() - startTime,
        };

        this.reviews.set(result.id, result);
        this.emit('reviewCompleted', result);

        return result;
    }

    /**
     * Review multiple files
     */
    async reviewFiles(filePaths: string[]): Promise<ReviewResult[]> {
        const results: ReviewResult[] = [];

        for (const filePath of filePaths) {
            const result = await this.reviewFile(filePath);
            results.push(result);
        }

        return results;
    }

    /**
     * Calculate cyclomatic complexity
     */
    private calculateComplexity(code: string): number {
        let complexity = 1;
        const patterns = [/if\s*\(/g, /else/g, /for\s*\(/g, /while\s*\(/g, /case\s+/g, /\?\s*[^:]+:/g, /&&/g, /\|\|/g];

        for (const pattern of patterns) {
            const matches = code.match(pattern);
            if (matches) complexity += matches.length;
        }

        return complexity;
    }

    /**
     * Calculate maintainability index
     */
    private calculateMaintainability(code: string, comments: ReviewComment[]): number {
        const lines = code.split('\n').length;
        const complexity = this.calculateComplexity(code);
        const issues = comments.filter(c => c.severity === 'error' || c.severity === 'warning').length;

        // Simple maintainability formula
        let score = 100;
        score -= Math.min(20, lines / 50);
        score -= Math.min(30, complexity * 2);
        score -= issues * 5;

        return Math.max(0, Math.round(score));
    }

    /**
     * Add custom rule
     */
    addRule(name: string, rule: (code: string) => ReviewComment[]): void {
        this.rules.set(name, rule);
    }

    /**
     * Remove rule
     */
    removeRule(name: string): boolean {
        return this.rules.delete(name);
    }

    /**
     * Get review by ID
     */
    getReview(id: string): ReviewResult | null {
        return this.reviews.get(id) || null;
    }

    /**
     * Get all reviews
     */
    getAllReviews(): ReviewResult[] {
        return Array.from(this.reviews.values());
    }

    /**
     * Get reviews by file
     */
    getReviewsByFile(filePath: string): ReviewResult[] {
        return Array.from(this.reviews.values())
            .filter(r => r.filePath === filePath);
    }

    /**
     * Apply auto-fixes
     */
    async applyFixes(reviewId: string): Promise<number> {
        const review = this.reviews.get(reviewId);
        if (!review) return 0;

        const fixableComments = review.comments.filter(c => c.autoFixable && c.suggestion);

        // In production, would apply actual fixes
        this.emit('fixesApplied', { reviewId, count: fixableComments.length });

        return fixableComments.length;
    }
}

// Singleton getter
export function getCodeReviewAI(): CodeReviewAI {
    return CodeReviewAI.getInstance();
}
