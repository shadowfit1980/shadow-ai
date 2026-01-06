/**
 * Intelligent Code Review Agent
 * 
 * Automated code review with AI-powered suggestions,
 * best practices enforcement, and security analysis.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface ReviewIssue {
    id: string;
    type: 'bug' | 'security' | 'performance' | 'style' | 'maintainability' | 'documentation';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    line?: number;
    message: string;
    suggestion?: string;
    code?: string;
    autofix?: string;
}

interface ReviewResult {
    file: string;
    issues: ReviewIssue[];
    score: number; // 0-100
    summary: string;
    metrics: {
        linesOfCode: number;
        complexity: number;
        coverage: number;
        maintainabilityIndex: number;
    };
}

interface ReviewRule {
    id: string;
    name: string;
    category: ReviewIssue['type'];
    check: (code: string, lines: string[]) => ReviewIssue[];
}

// ============================================================================
// INTELLIGENT CODE REVIEW AGENT
// ============================================================================

export class IntelligentCodeReviewAgent extends EventEmitter {
    private static instance: IntelligentCodeReviewAgent;
    private rules: ReviewRule[] = [];
    private reviewHistory: Map<string, ReviewResult[]> = new Map();

    private constructor() {
        super();
        this.initializeRules();
    }

    static getInstance(): IntelligentCodeReviewAgent {
        if (!IntelligentCodeReviewAgent.instance) {
            IntelligentCodeReviewAgent.instance = new IntelligentCodeReviewAgent();
        }
        return IntelligentCodeReviewAgent.instance;
    }

    // ========================================================================
    // RULES INITIALIZATION
    // ========================================================================

    private initializeRules(): void {
        // Security Rules
        this.rules.push({
            id: 'security-hardcoded-secrets',
            name: 'Hardcoded Secrets',
            category: 'security',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                const patterns = [
                    { pattern: /password\s*[=:]\s*['"][^'"]+['"]/gi, name: 'password' },
                    { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/gi, name: 'API key' },
                    { pattern: /secret\s*[=:]\s*['"][^'"]+['"]/gi, name: 'secret' },
                    { pattern: /token\s*[=:]\s*['"][A-Za-z0-9]{20,}['"]/gi, name: 'token' },
                ];

                lines.forEach((line, i) => {
                    patterns.forEach(({ pattern, name }) => {
                        if (pattern.test(line)) {
                            issues.push({
                                id: `sec-${i}`,
                                type: 'security',
                                severity: 'critical',
                                line: i + 1,
                                message: `Possible hardcoded ${name} detected`,
                                suggestion: `Move ${name} to environment variables`,
                                code: line.trim(),
                                autofix: line.replace(pattern, `${name.toUpperCase()}: process.env.${name.toUpperCase().replace(/\s/g, '_')}`),
                            });
                        }
                    });
                });

                return issues;
            },
        });

        this.rules.push({
            id: 'security-eval',
            name: 'Dangerous eval()',
            category: 'security',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                lines.forEach((line, i) => {
                    if (/\beval\s*\(/.test(line)) {
                        issues.push({
                            id: `eval-${i}`,
                            type: 'security',
                            severity: 'critical',
                            line: i + 1,
                            message: 'eval() is dangerous and can execute arbitrary code',
                            suggestion: 'Use safer alternatives like JSON.parse() or Function constructor',
                            code: line.trim(),
                        });
                    }
                });
                return issues;
            },
        });

        this.rules.push({
            id: 'security-sql-injection',
            name: 'SQL Injection Risk',
            category: 'security',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                lines.forEach((line, i) => {
                    if (/\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/i.test(line) ||
                        /(?:SELECT|INSERT|UPDATE|DELETE).*\+\s*\w+/i.test(line)) {
                        issues.push({
                            id: `sql-${i}`,
                            type: 'security',
                            severity: 'critical',
                            line: i + 1,
                            message: 'Potential SQL injection vulnerability',
                            suggestion: 'Use parameterized queries or an ORM',
                            code: line.trim(),
                        });
                    }
                });
                return issues;
            },
        });

        // Bug Detection Rules
        this.rules.push({
            id: 'bug-equality',
            name: 'Loose Equality',
            category: 'bug',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                lines.forEach((line, i) => {
                    const match = line.match(/[^=!]==[^=]/);
                    if (match && !line.includes('===')) {
                        issues.push({
                            id: `eq-${i}`,
                            type: 'bug',
                            severity: 'medium',
                            line: i + 1,
                            message: 'Using loose equality (==) instead of strict equality (===)',
                            suggestion: 'Use === for type-safe comparison',
                            code: line.trim(),
                            autofix: line.replace(/([^=!])={2}([^=])/g, '$1===$2'),
                        });
                    }
                });
                return issues;
            },
        });

        this.rules.push({
            id: 'bug-var-usage',
            name: 'Using var',
            category: 'bug',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                lines.forEach((line, i) => {
                    if (/\bvar\s+/.test(line)) {
                        issues.push({
                            id: `var-${i}`,
                            type: 'bug',
                            severity: 'low',
                            line: i + 1,
                            message: 'Using var instead of const/let',
                            suggestion: 'Use const for constants, let for mutable variables',
                            code: line.trim(),
                            autofix: line.replace(/\bvar\s+/, 'const '),
                        });
                    }
                });
                return issues;
            },
        });

        // Performance Rules
        this.rules.push({
            id: 'perf-sync-fs',
            name: 'Synchronous File Operations',
            category: 'performance',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                lines.forEach((line, i) => {
                    if (/Sync\(/.test(line)) {
                        issues.push({
                            id: `sync-${i}`,
                            type: 'performance',
                            severity: 'medium',
                            line: i + 1,
                            message: 'Synchronous operation blocks the event loop',
                            suggestion: 'Use async/await version for better performance',
                            code: line.trim(),
                        });
                    }
                });
                return issues;
            },
        });

        this.rules.push({
            id: 'perf-nested-loops',
            name: 'Nested Loops',
            category: 'performance',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                let loopDepth = 0;
                let loopStartLine = -1;

                lines.forEach((line, i) => {
                    if (/\b(for|while)\s*\(/.test(line)) {
                        if (loopDepth === 0) loopStartLine = i;
                        loopDepth++;
                        if (loopDepth >= 3) {
                            issues.push({
                                id: `loop-${i}`,
                                type: 'performance',
                                severity: 'high',
                                line: i + 1,
                                message: `Deeply nested loops (${loopDepth} levels) - O(n^${loopDepth}) complexity`,
                                suggestion: 'Consider using Map/Set for lookups or restructuring the algorithm',
                            });
                        }
                    }
                    if (line.includes('}') && loopDepth > 0) {
                        loopDepth--;
                    }
                });

                return issues;
            },
        });

        // Maintainability Rules
        this.rules.push({
            id: 'maintain-long-function',
            name: 'Long Function',
            category: 'maintainability',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                let functionStart = -1;
                let braceCount = 0;
                let inFunction = false;

                lines.forEach((line, i) => {
                    if (/function\s+\w+|=>\s*{/.test(line)) {
                        functionStart = i;
                        inFunction = true;
                        braceCount = 0;
                    }

                    if (inFunction) {
                        braceCount += (line.match(/{/g) || []).length;
                        braceCount -= (line.match(/}/g) || []).length;

                        if (braceCount <= 0 && functionStart >= 0) {
                            const functionLength = i - functionStart;
                            if (functionLength > 50) {
                                issues.push({
                                    id: `func-${functionStart}`,
                                    type: 'maintainability',
                                    severity: 'medium',
                                    line: functionStart + 1,
                                    message: `Function is ${functionLength} lines long`,
                                    suggestion: 'Consider breaking into smaller functions (aim for < 30 lines)',
                                });
                            }
                            inFunction = false;
                        }
                    }
                });

                return issues;
            },
        });

        // Documentation Rules
        this.rules.push({
            id: 'doc-missing-jsdoc',
            name: 'Missing JSDoc',
            category: 'documentation',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];

                lines.forEach((line, i) => {
                    if (/export\s+(?:async\s+)?function\s+\w+/.test(line) ||
                        /export\s+const\s+\w+\s*=\s*(?:async\s+)?\(/.test(line)) {
                        // Check if previous lines have JSDoc
                        let hasJsDoc = false;
                        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                            if (lines[j].includes('*/')) {
                                hasJsDoc = true;
                                break;
                            }
                            if (lines[j].trim() && !lines[j].includes('*')) {
                                break;
                            }
                        }

                        if (!hasJsDoc) {
                            issues.push({
                                id: `doc-${i}`,
                                type: 'documentation',
                                severity: 'info',
                                line: i + 1,
                                message: 'Exported function lacks JSDoc documentation',
                                suggestion: 'Add JSDoc comment with @param and @returns',
                            });
                        }
                    }
                });

                return issues;
            },
        });

        // Style Rules
        this.rules.push({
            id: 'style-console',
            name: 'Console Statements',
            category: 'style',
            check: (code, lines) => {
                const issues: ReviewIssue[] = [];
                lines.forEach((line, i) => {
                    if (/console\.(log|debug|info|warn)\s*\(/.test(line)) {
                        issues.push({
                            id: `console-${i}`,
                            type: 'style',
                            severity: 'low',
                            line: i + 1,
                            message: 'Console statement found',
                            suggestion: 'Remove or replace with proper logging',
                            code: line.trim(),
                        });
                    }
                });
                return issues;
            },
        });
    }

    // ========================================================================
    // CODE REVIEW
    // ========================================================================

    async reviewCode(file: string, code: string): Promise<ReviewResult> {
        const lines = code.split('\n');
        const allIssues: ReviewIssue[] = [];

        // Run all rules
        for (const rule of this.rules) {
            const issues = rule.check(code, lines);
            allIssues.push(...issues);
        }

        // Calculate metrics
        const metrics = this.calculateMetrics(code, lines);

        // Calculate score
        const score = this.calculateScore(allIssues, metrics);

        // Generate summary
        const summary = this.generateSummary(allIssues, score);

        const result: ReviewResult = {
            file,
            issues: allIssues,
            score,
            summary,
            metrics,
        };

        // Store in history
        const history = this.reviewHistory.get(file) || [];
        history.push(result);
        this.reviewHistory.set(file, history);

        this.emit('review:completed', result);
        return result;
    }

    private calculateMetrics(code: string, lines: string[]): ReviewResult['metrics'] {
        const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

        let complexity = 1;
        const complexityPatterns = [/if\s*\(/g, /else/g, /\?\s*:/g, /for\s*\(/g, /while\s*\(/g, /case\s+/g, /&&/g, /\|\|/g];
        for (const pattern of complexityPatterns) {
            complexity += (code.match(pattern) || []).length;
        }

        // Simple maintainability calculation
        const maintainabilityIndex = Math.max(0, Math.min(100, 100 - (complexity * 2) - (linesOfCode / 20)));

        return {
            linesOfCode,
            complexity,
            coverage: 0, // Would need actual test data
            maintainabilityIndex: Math.round(maintainabilityIndex),
        };
    }

    private calculateScore(issues: ReviewIssue[], metrics: ReviewResult['metrics']): number {
        let score = 100;

        // Deduct points for issues
        const severityDeductions = { critical: 20, high: 10, medium: 5, low: 2, info: 0 };
        for (const issue of issues) {
            score -= severityDeductions[issue.severity];
        }

        // Bonus for good metrics
        if (metrics.maintainabilityIndex > 70) score += 5;
        if (metrics.complexity < 10) score += 5;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    private generateSummary(issues: ReviewIssue[], score: number): string {
        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;

        if (score >= 90) return 'Excellent code quality! Minor improvements possible.';
        if (score >= 70) return `Good code quality. ${critical + high} issues need attention.`;
        if (score >= 50) return `Code needs improvement. Found ${critical} critical and ${high} high-severity issues.`;
        return `Significant issues detected. ${critical} critical issues require immediate attention.`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    getAutoFixes(file: string): Array<{ line: number; original: string; fix: string }> {
        const history = this.reviewHistory.get(file);
        if (!history || history.length === 0) return [];

        const latest = history[history.length - 1];
        return latest.issues
            .filter(i => i.autofix && i.line)
            .map(i => ({
                line: i.line!,
                original: i.code || '',
                fix: i.autofix!,
            }));
    }

    getIssuesByType(file: string, type: ReviewIssue['type']): ReviewIssue[] {
        const history = this.reviewHistory.get(file);
        if (!history || history.length === 0) return [];

        return history[history.length - 1].issues.filter(i => i.type === type);
    }

    getScoreHistory(file: string): number[] {
        const history = this.reviewHistory.get(file);
        return history?.map(r => r.score) || [];
    }
}

export const intelligentCodeReviewAgent = IntelligentCodeReviewAgent.getInstance();
