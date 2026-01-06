/**
 * Code Review Agent
 * 
 * Automated code review with:
 * - Security vulnerability scanning
 * - Style consistency checks
 * - Performance optimization suggestions
 * - Dependency audit
 * - Best practices enforcement
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ReviewIssue {
    id: string;
    type: 'security' | 'style' | 'performance' | 'quality' | 'dependency' | 'best-practice';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    file: string;
    line?: number;
    column?: number;
    message: string;
    suggestion?: string;
    rule: string;
    autoFixable: boolean;
}

export interface ReviewResult {
    id: string;
    timestamp: Date;
    files: string[];
    issues: ReviewIssue[];
    summary: ReviewSummary;
    duration: number;
}

export interface ReviewSummary {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    autoFixable: number;
    score: number; // 0-100
}

interface SecurityRule {
    id: string;
    pattern: RegExp;
    severity: ReviewIssue['severity'];
    message: string;
    suggestion: string;
}

interface StyleRule {
    id: string;
    check: (content: string, filename: string) => ReviewIssue | null;
}

/**
 * CodeReviewAgent performs automated code review
 */
export class CodeReviewAgent extends EventEmitter {
    private static instance: CodeReviewAgent;
    private reviewHistory: ReviewResult[] = [];
    private securityRules: SecurityRule[] = [];
    private styleRules: StyleRule[] = [];

    private constructor() {
        super();
        this.initializeSecurityRules();
        this.initializeStyleRules();
    }

    static getInstance(): CodeReviewAgent {
        if (!CodeReviewAgent.instance) {
            CodeReviewAgent.instance = new CodeReviewAgent();
        }
        return CodeReviewAgent.instance;
    }

    /**
     * Initialize security vulnerability patterns
     */
    private initializeSecurityRules(): void {
        this.securityRules = [
            {
                id: 'SEC001',
                pattern: /eval\s*\(/gi,
                severity: 'critical',
                message: 'Use of eval() is dangerous and can lead to code injection',
                suggestion: 'Use safer alternatives like JSON.parse() or Function constructor with validation',
            },
            {
                id: 'SEC002',
                pattern: /innerHTML\s*=/gi,
                severity: 'high',
                message: 'Setting innerHTML directly can lead to XSS vulnerabilities',
                suggestion: 'Use textContent or sanitize HTML with DOMPurify',
            },
            {
                id: 'SEC003',
                pattern: /document\.write\s*\(/gi,
                severity: 'high',
                message: 'document.write() can overwrite the entire document and is a security risk',
                suggestion: 'Use DOM manipulation methods instead',
            },
            {
                id: 'SEC004',
                pattern: /new\s+Function\s*\(/gi,
                severity: 'high',
                message: 'Dynamic function creation can be exploited for code injection',
                suggestion: 'Use predefined functions or safer evaluation methods',
            },
            {
                id: 'SEC005',
                pattern: /\$\{[^}]*\}\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
                severity: 'critical',
                message: 'Potential SQL injection via template literals',
                suggestion: 'Use parameterized queries or prepared statements',
            },
            {
                id: 'SEC006',
                pattern: /atob\s*\(|btoa\s*\(/gi,
                severity: 'medium',
                message: 'Base64 encoding is not encryption - sensitive data may be exposed',
                suggestion: 'Use proper encryption for sensitive data',
            },
            {
                id: 'SEC007',
                pattern: /localStorage\.|sessionStorage\./gi,
                severity: 'medium',
                message: 'Storing sensitive data in browser storage is insecure',
                suggestion: 'Use secure cookies with httpOnly flag or encrypt data',
            },
            {
                id: 'SEC008',
                pattern: /password\s*=\s*["'][^"']+["']/gi,
                severity: 'critical',
                message: 'Hardcoded password detected',
                suggestion: 'Use environment variables or secure vaults for credentials',
            },
            {
                id: 'SEC009',
                pattern: /api[_-]?key\s*[=:]\s*["'][^"']+["']/gi,
                severity: 'critical',
                message: 'Hardcoded API key detected',
                suggestion: 'Use environment variables for API keys',
            },
            {
                id: 'SEC010',
                pattern: /https?:\/\/[^\s"']+\?[^\s"']*(?:token|key|password|secret)=/gi,
                severity: 'high',
                message: 'Sensitive data in URL query parameters',
                suggestion: 'Pass sensitive data in request body or headers',
            },
            {
                id: 'SEC011',
                pattern: /child_process\.(exec|spawn)\s*\([^)]*\$\{/gi,
                severity: 'critical',
                message: 'Command injection vulnerability via template literals',
                suggestion: 'Validate and sanitize all user input before executing commands',
            },
            {
                id: 'SEC012',
                pattern: /\.createObjectURL\s*\(/gi,
                severity: 'medium',
                message: 'Object URLs can lead to memory leaks if not revoked',
                suggestion: 'Always call URL.revokeObjectURL() when done',
            },
        ];

        console.log(`🔍 [CodeReviewAgent] Loaded ${this.securityRules.length} security rules`);
    }

    /**
     * Initialize style and quality rules
     */
    private initializeStyleRules(): void {
        this.styleRules = [
            {
                id: 'STYLE001',
                check: (content, filename) => {
                    if (!filename.endsWith('.ts') && !filename.endsWith('.tsx')) return null;
                    if (content.includes(': any') || content.includes(':any')) {
                        return {
                            id: '',
                            type: 'style',
                            severity: 'medium',
                            file: filename,
                            message: 'Use of "any" type reduces type safety',
                            suggestion: 'Define proper types or use "unknown" instead',
                            rule: 'STYLE001',
                            autoFixable: false,
                        };
                    }
                    return null;
                },
            },
            {
                id: 'STYLE002',
                check: (content, filename) => {
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].length > 120) {
                            return {
                                id: '',
                                type: 'style',
                                severity: 'low',
                                file: filename,
                                line: i + 1,
                                message: 'Line exceeds 120 characters',
                                suggestion: 'Break long lines for better readability',
                                rule: 'STYLE002',
                                autoFixable: false,
                            };
                        }
                    }
                    return null;
                },
            },
            {
                id: 'STYLE003',
                check: (content, filename) => {
                    if (/console\.(log|debug|info)\s*\(/.test(content)) {
                        return {
                            id: '',
                            type: 'quality',
                            severity: 'low',
                            file: filename,
                            message: 'Console statements should be removed in production',
                            suggestion: 'Use a proper logging library or remove debug statements',
                            rule: 'STYLE003',
                            autoFixable: true,
                        };
                    }
                    return null;
                },
            },
            {
                id: 'STYLE004',
                check: (content, filename) => {
                    if (/TODO|FIXME|HACK|XXX/i.test(content)) {
                        return {
                            id: '',
                            type: 'quality',
                            severity: 'info',
                            file: filename,
                            message: 'TODO/FIXME comment found',
                            suggestion: 'Address pending tasks or create issues to track them',
                            rule: 'STYLE004',
                            autoFixable: false,
                        };
                    }
                    return null;
                },
            },
            {
                id: 'STYLE005',
                check: (content, filename) => {
                    const functionMatch = content.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g);
                    if (functionMatch) {
                        for (const fn of functionMatch) {
                            const lines = fn.split('\n').length;
                            if (lines > 50) {
                                return {
                                    id: '',
                                    type: 'quality',
                                    severity: 'medium',
                                    file: filename,
                                    message: 'Function exceeds 50 lines',
                                    suggestion: 'Consider breaking down into smaller functions',
                                    rule: 'STYLE005',
                                    autoFixable: false,
                                };
                            }
                        }
                    }
                    return null;
                },
            },
        ];

        // Performance rules
        this.styleRules.push({
            id: 'PERF001',
            check: (content, filename) => {
                if (/\.forEach\s*\([^)]*=>\s*\{[^}]*\.push\s*\(/g.test(content)) {
                    return {
                        id: '',
                        type: 'performance',
                        severity: 'low',
                        file: filename,
                        message: 'forEach with push is less efficient than map',
                        suggestion: 'Use Array.map() instead of forEach with push',
                        rule: 'PERF001',
                        autoFixable: true,
                    };
                }
                return null;
            },
        });

        this.styleRules.push({
            id: 'PERF002',
            check: (content, filename) => {
                if (/for\s*\([^)]*\.length[^)]*\)/g.test(content) && !/const\s+\w+\s*=\s*\w+\.length/g.test(content)) {
                    return {
                        id: '',
                        type: 'performance',
                        severity: 'low',
                        file: filename,
                        message: 'Array length is calculated on each iteration',
                        suggestion: 'Cache array length in a variable before the loop',
                        rule: 'PERF002',
                        autoFixable: true,
                    };
                }
                return null;
            },
        });

        this.styleRules.push({
            id: 'PERF003',
            check: (content, filename) => {
                if (/JSON\.parse\s*\(\s*JSON\.stringify/g.test(content)) {
                    return {
                        id: '',
                        type: 'performance',
                        severity: 'medium',
                        file: filename,
                        message: 'JSON.parse(JSON.stringify()) is slow for deep cloning',
                        suggestion: 'Use structuredClone() or a library like lodash.cloneDeep',
                        rule: 'PERF003',
                        autoFixable: false,
                    };
                }
                return null;
            },
        });

        console.log(`📐 [CodeReviewAgent] Loaded ${this.styleRules.length} style/quality rules`);
    }

    /**
     * Review a single file
     */
    async reviewFile(filePath: string): Promise<ReviewIssue[]> {
        const issues: ReviewIssue[] = [];

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const filename = path.basename(filePath);

            // Apply security rules
            for (const rule of this.securityRules) {
                let match;
                const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

                while ((match = regex.exec(content)) !== null) {
                    // Find line number
                    const beforeMatch = content.substring(0, match.index);
                    const lineNumber = beforeMatch.split('\n').length;

                    issues.push({
                        id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                        type: 'security',
                        severity: rule.severity,
                        file: filePath,
                        line: lineNumber,
                        message: rule.message,
                        suggestion: rule.suggestion,
                        rule: rule.id,
                        autoFixable: false,
                    });
                }
            }

            // Apply style rules
            for (const rule of this.styleRules) {
                const issue = rule.check(content, filePath);
                if (issue) {
                    issue.id = `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    issues.push(issue);
                }
            }

        } catch (error: any) {
            console.error(`Failed to review file ${filePath}:`, error.message);
        }

        return issues;
    }

    /**
     * Review multiple files or a directory
     */
    async reviewProject(params: {
        path: string;
        include?: string[];
        exclude?: string[];
    }): Promise<ReviewResult> {
        const startTime = Date.now();
        const reviewId = `review-${Date.now()}`;
        const allIssues: ReviewIssue[] = [];
        const reviewedFiles: string[] = [];

        this.emit('review:started', { id: reviewId, path: params.path });

        try {
            const files = await this.collectFiles(params.path, params.include, params.exclude);

            for (const file of files) {
                this.emit('review:progress', { file, total: files.length, current: reviewedFiles.length });

                const issues = await this.reviewFile(file);
                allIssues.push(...issues);
                reviewedFiles.push(file);
            }

        } catch (error: any) {
            console.error('Review failed:', error.message);
        }

        const duration = Date.now() - startTime;
        const summary = this.calculateSummary(allIssues);

        const result: ReviewResult = {
            id: reviewId,
            timestamp: new Date(),
            files: reviewedFiles,
            issues: allIssues,
            summary,
            duration,
        };

        this.reviewHistory.push(result);
        this.emit('review:completed', result);

        console.log(`✅ [CodeReviewAgent] Reviewed ${reviewedFiles.length} files in ${duration}ms, found ${allIssues.length} issues`);

        return result;
    }

    /**
     * Collect files to review
     */
    private async collectFiles(
        dirPath: string,
        include?: string[],
        exclude?: string[]
    ): Promise<string[]> {
        const files: string[] = [];
        const defaultInclude = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go'];
        const defaultExclude = ['node_modules', 'dist', 'build', '.git', 'coverage'];

        const includeExts = include || defaultInclude;
        const excludeDirs = exclude || defaultExclude;

        async function scanDir(dir: string) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        if (!excludeDirs.includes(entry.name)) {
                            await scanDir(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (includeExts.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch {
                // Ignore read errors
            }
        }

        await scanDir(dirPath);
        return files;
    }

    /**
     * Calculate review summary
     */
    private calculateSummary(issues: ReviewIssue[]): ReviewSummary {
        const bySeverity: Record<string, number> = {};
        const byType: Record<string, number> = {};
        let autoFixable = 0;

        for (const issue of issues) {
            bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
            byType[issue.type] = (byType[issue.type] || 0) + 1;
            if (issue.autoFixable) autoFixable++;
        }

        // Calculate score (100 - weighted issues)
        const weights = { critical: 20, high: 10, medium: 5, low: 2, info: 0 };
        let deductions = 0;
        for (const [severity, count] of Object.entries(bySeverity)) {
            deductions += (weights[severity as keyof typeof weights] || 0) * count;
        }
        const score = Math.max(0, Math.min(100, 100 - deductions));

        return {
            total: issues.length,
            bySeverity,
            byType,
            autoFixable,
            score,
        };
    }

    /**
     * Get suggestions for fixing an issue
     */
    getSuggestions(issue: ReviewIssue): string[] {
        const suggestions: string[] = [];

        if (issue.suggestion) {
            suggestions.push(issue.suggestion);
        }

        // Add context-specific suggestions
        switch (issue.rule) {
            case 'SEC001':
                suggestions.push('If parsing JSON, use JSON.parse() instead');
                suggestions.push('For dynamic code, consider using a sandboxed evaluation');
                break;
            case 'SEC002':
                suggestions.push('import DOMPurify from "dompurify"');
                suggestions.push('element.innerHTML = DOMPurify.sanitize(html)');
                break;
            case 'SEC008':
            case 'SEC009':
                suggestions.push('const apiKey = process.env.API_KEY');
                suggestions.push('Use dotenv to load environment variables');
                break;
        }

        return suggestions;
    }

    /**
     * Get review history
     */
    getHistory(limit: number = 10): ReviewResult[] {
        return this.reviewHistory.slice(-limit);
    }

    /**
     * Get the latest review
     */
    getLatestReview(): ReviewResult | undefined {
        return this.reviewHistory[this.reviewHistory.length - 1];
    }

    /**
     * Add custom security rule
     */
    addSecurityRule(rule: SecurityRule): void {
        this.securityRules.push(rule);
        this.emit('rule:added', { type: 'security', rule });
    }

    /**
     * Get all rules
     */
    getRules(): { security: SecurityRule[]; style: StyleRule[] } {
        return {
            security: this.securityRules,
            style: this.styleRules,
        };
    }
}

export default CodeReviewAgent;
