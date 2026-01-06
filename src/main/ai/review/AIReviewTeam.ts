/**
 * AIReviewTeam - Multiple AI Perspectives for Code Review
 * 
 * Implements the multi-agent review pattern from Claude's critique:
 * Multiple specialized AI reviewers analyze code from different perspectives
 * and synthesize findings into coherent feedback.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ReviewerRole =
    | 'security'        // Security vulnerabilities
    | 'performance'     // Performance issues
    | 'maintainability' // Code quality, readability
    | 'testing'         // Test coverage, test quality
    | 'accessibility'   // A11y issues for UI code
    | 'documentation'   // Doc completeness
    | 'architecture';   // Design patterns, structure

export interface ReviewFinding {
    id: string;
    reviewer: ReviewerRole;
    severity: 'info' | 'warning' | 'error' | 'critical';
    line?: number;
    endLine?: number;
    message: string;
    suggestion?: string;
    code?: string;
    category: string;
}

export interface ReviewerConfig {
    role: ReviewerRole;
    enabled: boolean;
    strictness: 'lenient' | 'moderate' | 'strict';
    focusAreas?: string[];
}

export interface ReviewRequest {
    files: Array<{
        path: string;
        content: string;
        language?: string;
    }>;
    context?: string;
    focusAreas?: string[];
}

export interface ReviewResult {
    id: string;
    requestedAt: Date;
    completedAt: Date;
    files: string[];
    findings: ReviewFinding[];
    summary: ReviewSummary;
    byReviewer: Record<ReviewerRole, ReviewFinding[]>;
}

export interface ReviewSummary {
    totalFindings: number;
    bySeverity: Record<string, number>;
    topIssues: string[];
    overallScore: number; // 0-100
    recommendation: 'approve' | 'request_changes' | 'needs_discussion';
}

// ============================================================================
// SPECIALIZED REVIEWERS
// ============================================================================

abstract class BaseReviewer {
    abstract role: ReviewerRole;
    abstract description: string;

    protected patterns: Array<{
        pattern: RegExp;
        message: string;
        severity: ReviewFinding['severity'];
        category: string;
        suggestion?: string;
    }> = [];

    async review(content: string, filePath: string): Promise<ReviewFinding[]> {
        const findings: ReviewFinding[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            for (const check of this.patterns) {
                if (check.pattern.test(lines[i])) {
                    findings.push({
                        id: this.generateId(),
                        reviewer: this.role,
                        severity: check.severity,
                        line: i + 1,
                        message: check.message,
                        suggestion: check.suggestion,
                        code: lines[i].trim(),
                        category: check.category
                    });
                }
            }
        }

        return findings;
    }

    protected generateId(): string {
        return `${this.role}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }
}

class SecurityReviewer extends BaseReviewer {
    role: ReviewerRole = 'security';
    description = 'Analyzes code for security vulnerabilities';

    patterns = [
        { pattern: /eval\s*\(/, message: 'Avoid eval() - potential code injection', severity: 'critical' as const, category: 'injection', suggestion: 'Use safer alternatives like JSON.parse() or Function constructor' },
        { pattern: /innerHTML\s*=/, message: 'innerHTML can lead to XSS vulnerabilities', severity: 'error' as const, category: 'xss', suggestion: 'Use textContent or sanitize input' },
        { pattern: /dangerouslySetInnerHTML/, message: 'dangerouslySetInnerHTML bypasses XSS protection', severity: 'warning' as const, category: 'xss', suggestion: 'Sanitize content using DOMPurify' },
        { pattern: /password\s*[:=]\s*['"][^'"]+['"]/, message: 'Hardcoded password detected', severity: 'critical' as const, category: 'secrets', suggestion: 'Use environment variables or secrets manager' },
        { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/, message: 'Hardcoded API key detected', severity: 'critical' as const, category: 'secrets', suggestion: 'Use environment variables' },
        { pattern: /exec\s*\(/, message: 'exec() can be dangerous with untrusted input', severity: 'warning' as const, category: 'injection', suggestion: 'Validate and sanitize inputs' },
        { pattern: /\$\{.*\}.*query|query.*\$\{/, message: 'Possible SQL injection via template literal', severity: 'error' as const, category: 'sql-injection', suggestion: 'Use parameterized queries' },
        { pattern: /http:\/\/(?!localhost)/, message: 'Insecure HTTP URL detected', severity: 'warning' as const, category: 'transport', suggestion: 'Use HTTPS' },
    ];
}

class PerformanceReviewer extends BaseReviewer {
    role: ReviewerRole = 'performance';
    description = 'Identifies performance issues and optimization opportunities';

    patterns = [
        { pattern: /\.forEach\s*\(.*\.forEach/, message: 'Nested forEach loops - O(n²) complexity', severity: 'warning' as const, category: 'complexity', suggestion: 'Consider using Map/Set or restructuring' },
        { pattern: /\[\s*\.\.\..*\].*\.filter|\.filter.*\[\s*\.\.\./, message: 'Spread + filter creates unnecessary copies', severity: 'info' as const, category: 'memory', suggestion: 'Chain operations or use reduce()' },
        { pattern: /new RegExp\s*\(.*\)/, message: 'RegExp in loop may cause performance issues', severity: 'info' as const, category: 'regex', suggestion: 'Compile RegExp outside loop' },
        { pattern: /JSON\.parse\s*\(\s*JSON\.stringify/, message: 'JSON deep clone is slow for large objects', severity: 'warning' as const, category: 'memory', suggestion: 'Use structuredClone() or lodash cloneDeep' },
        { pattern: /document\.querySelector.*loop|for.*document\.querySelector/, message: 'DOM query in loop is slow', severity: 'warning' as const, category: 'dom', suggestion: 'Cache DOM references outside loop' },
        { pattern: /await\s+.*\s+await|await.*for\s*\(/, message: 'Sequential awaits may block', severity: 'info' as const, category: 'async', suggestion: 'Consider Promise.all() for parallel execution' },
        { pattern: /\.map\(.*\)\.filter\(.*\)\.map/, message: 'Multiple array iterations', severity: 'info' as const, category: 'iteration', suggestion: 'Combine into single reduce()' },
    ];
}

class MaintainabilityReviewer extends BaseReviewer {
    role: ReviewerRole = 'maintainability';
    description = 'Evaluates code quality and maintainability';

    patterns = [
        { pattern: /function\s*\([^)]{100,}\)/, message: 'Too many function parameters', severity: 'warning' as const, category: 'complexity', suggestion: 'Use an options object' },
        { pattern: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK/, message: 'TODO/FIXME comment found', severity: 'info' as const, category: 'technical-debt' },
        { pattern: /console\.(log|debug|info)\s*\(/, message: 'Console statement in production code', severity: 'warning' as const, category: 'logging', suggestion: 'Use proper logging service' },
        { pattern: /any(?:\s|;|,|\)|\]|>)/, message: 'TypeScript "any" type reduces type safety', severity: 'info' as const, category: 'typing', suggestion: 'Use specific types or unknown' },
        { pattern: /\/\*\s*eslint-disable/, message: 'ESLint rule disabled', severity: 'info' as const, category: 'linting', suggestion: 'Fix the underlying issue if possible' },
        { pattern: /^\s*\/\/.*\n\s*\/\/.*\n\s*\/\//, message: 'Large comment block - consider JSDoc', severity: 'info' as const, category: 'documentation' },
        { pattern: /{[^}]{500,}}/, message: 'Very long function body', severity: 'warning' as const, category: 'complexity', suggestion: 'Extract into smaller functions' },
    ];
}

class TestingReviewer extends BaseReviewer {
    role: ReviewerRole = 'testing';
    description = 'Checks test coverage and quality';

    patterns = [
        { pattern: /\.skip\s*\(/, message: 'Skipped test detected', severity: 'warning' as const, category: 'coverage' },
        { pattern: /\.only\s*\(/, message: 'Exclusive test detected (.only)', severity: 'error' as const, category: 'test-isolation', suggestion: 'Remove .only before committing' },
        { pattern: /expect\s*\([^)]+\)\s*;?\s*$/, message: 'Expect without assertion', severity: 'error' as const, category: 'assertions' },
        { pattern: /setTimeout.*test|test.*setTimeout/, message: 'setTimeout in test - may cause flakiness', severity: 'warning' as const, category: 'flaky', suggestion: 'Use fake timers' },
        { pattern: /Math\.random.*test|test.*Math\.random/, message: 'Random in test - may cause flakiness', severity: 'warning' as const, category: 'flaky', suggestion: 'Use deterministic values' },
    ];
}

class DocumentationReviewer extends BaseReviewer {
    role: ReviewerRole = 'documentation';
    description = 'Verifies documentation completeness';

    patterns = [
        { pattern: /export\s+(function|class|const)\s+\w+.*{?\s*$/, message: 'Exported symbol missing JSDoc', severity: 'info' as const, category: 'missing-docs', suggestion: 'Add JSDoc documentation' },
        { pattern: /\* @param\s+\w+\s*$/, message: 'JSDoc @param missing description', severity: 'info' as const, category: 'incomplete-docs' },
        { pattern: /\* @returns?\s*$/, message: 'JSDoc @returns missing description', severity: 'info' as const, category: 'incomplete-docs' },
    ];
}

// ============================================================================
// AI REVIEW TEAM
// ============================================================================

export class AIReviewTeam extends EventEmitter {
    private static instance: AIReviewTeam;

    private reviewers: Map<ReviewerRole, BaseReviewer> = new Map();
    private config: Map<ReviewerRole, ReviewerConfig> = new Map();
    private reviewHistory: ReviewResult[] = [];

    private constructor() {
        super();
        this.initializeReviewers();
    }

    static getInstance(): AIReviewTeam {
        if (!AIReviewTeam.instance) {
            AIReviewTeam.instance = new AIReviewTeam();
        }
        return AIReviewTeam.instance;
    }

    private initializeReviewers(): void {
        this.reviewers.set('security', new SecurityReviewer());
        this.reviewers.set('performance', new PerformanceReviewer());
        this.reviewers.set('maintainability', new MaintainabilityReviewer());
        this.reviewers.set('testing', new TestingReviewer());
        this.reviewers.set('documentation', new DocumentationReviewer());

        // Default config - all enabled
        for (const role of this.reviewers.keys()) {
            this.config.set(role, {
                role,
                enabled: true,
                strictness: 'moderate'
            });
        }

        console.log(`🔍 [AIReviewTeam] Initialized with ${this.reviewers.size} reviewers`);
    }

    // ========================================================================
    // REVIEW EXECUTION
    // ========================================================================

    /**
     * Run full review with all enabled reviewers
     */
    async review(request: ReviewRequest): Promise<ReviewResult> {
        const startTime = new Date();
        const allFindings: ReviewFinding[] = [];
        const byReviewer: Record<ReviewerRole, ReviewFinding[]> = {} as any;

        this.emit('review:start', { files: request.files.length });

        // Run all reviewers in parallel
        const reviewPromises: Promise<void>[] = [];

        for (const [role, reviewer] of this.reviewers) {
            const cfg = this.config.get(role);
            if (!cfg?.enabled) continue;

            byReviewer[role] = [];

            for (const file of request.files) {
                reviewPromises.push(
                    reviewer.review(file.content, file.path).then(findings => {
                        byReviewer[role].push(...findings);
                        allFindings.push(...findings);
                    })
                );
            }
        }

        await Promise.all(reviewPromises);

        // Generate summary
        const summary = this.generateSummary(allFindings);

        const result: ReviewResult = {
            id: this.generateId(),
            requestedAt: startTime,
            completedAt: new Date(),
            files: request.files.map(f => f.path),
            findings: allFindings.sort((a, b) => this.severityOrder(b.severity) - this.severityOrder(a.severity)),
            summary,
            byReviewer
        };

        this.reviewHistory.push(result);
        if (this.reviewHistory.length > 100) {
            this.reviewHistory = this.reviewHistory.slice(-50);
        }

        this.emit('review:complete', result);
        console.log(`🔍 [AIReviewTeam] Review complete: ${allFindings.length} findings`);

        return result;
    }

    /**
     * Quick security-only review
     */
    async securityReview(content: string, filePath: string): Promise<ReviewFinding[]> {
        const reviewer = this.reviewers.get('security');
        return reviewer ? reviewer.review(content, filePath) : [];
    }

    /**
     * Quick performance-only review
     */
    async performanceReview(content: string, filePath: string): Promise<ReviewFinding[]> {
        const reviewer = this.reviewers.get('performance');
        return reviewer ? reviewer.review(content, filePath) : [];
    }

    // ========================================================================
    // SUMMARY GENERATION
    // ========================================================================

    private generateSummary(findings: ReviewFinding[]): ReviewSummary {
        const bySeverity: Record<string, number> = {
            critical: 0,
            error: 0,
            warning: 0,
            info: 0
        };

        for (const f of findings) {
            bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
        }

        // Calculate score (100 - deductions)
        let score = 100;
        score -= bySeverity.critical * 20;
        score -= bySeverity.error * 10;
        score -= bySeverity.warning * 3;
        score -= bySeverity.info * 1;
        score = Math.max(0, score);

        // Top issues
        const topIssues = findings
            .filter(f => f.severity === 'critical' || f.severity === 'error')
            .slice(0, 5)
            .map(f => f.message);

        // Recommendation
        let recommendation: ReviewSummary['recommendation'] = 'approve';
        if (bySeverity.critical > 0) {
            recommendation = 'request_changes';
        } else if (bySeverity.error > 2) {
            recommendation = 'request_changes';
        } else if (bySeverity.error > 0 || bySeverity.warning > 5) {
            recommendation = 'needs_discussion';
        }

        return {
            totalFindings: findings.length,
            bySeverity,
            topIssues,
            overallScore: score,
            recommendation
        };
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    /**
     * Configure a specific reviewer
     */
    configureReviewer(role: ReviewerRole, config: Partial<ReviewerConfig>): void {
        const existing = this.config.get(role) || { role, enabled: true, strictness: 'moderate' as const };
        this.config.set(role, { ...existing, ...config });
    }

    /**
     * Enable/disable a reviewer
     */
    setReviewerEnabled(role: ReviewerRole, enabled: boolean): void {
        this.configureReviewer(role, { enabled });
    }

    /**
     * Get available reviewers
     */
    getReviewers(): Array<{ role: ReviewerRole; description: string; enabled: boolean }> {
        return Array.from(this.reviewers.entries()).map(([role, reviewer]) => ({
            role,
            description: reviewer.description,
            enabled: this.config.get(role)?.enabled ?? true
        }));
    }

    // ========================================================================
    // HISTORY & STATS
    // ========================================================================

    /**
     * Get review history
     */
    getHistory(limit: number = 10): ReviewResult[] {
        return this.reviewHistory.slice(-limit);
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalReviews: number;
        totalFindings: number;
        avgFindingsPerReview: number;
        byCategory: Record<string, number>;
    } {
        let totalFindings = 0;
        const byCategory: Record<string, number> = {};

        for (const review of this.reviewHistory) {
            totalFindings += review.findings.length;
            for (const finding of review.findings) {
                byCategory[finding.category] = (byCategory[finding.category] || 0) + 1;
            }
        }

        return {
            totalReviews: this.reviewHistory.length,
            totalFindings,
            avgFindingsPerReview: this.reviewHistory.length > 0
                ? totalFindings / this.reviewHistory.length
                : 0,
            byCategory
        };
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private severityOrder(severity: ReviewFinding['severity']): number {
        const order = { critical: 4, error: 3, warning: 2, info: 1 };
        return order[severity] || 0;
    }

    private generateId(): string {
        return `review-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    clear(): void {
        this.reviewHistory = [];
    }
}

// Export singleton
export const aiReviewTeam = AIReviewTeam.getInstance();
