/**
 * AI Code Reviewer
 * Automated code review with style, quality, and security analysis
 * Grok Recommendation: Intelligent Code Review System
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface CodeReview {
    id: string;
    filePath: string;
    language: string;
    code: string;
    issues: ReviewIssue[];
    suggestions: ReviewSuggestion[];
    metrics: CodeMetrics;
    score: number;
    summary: string;
    reviewedAt: Date;
}

interface ReviewIssue {
    id: string;
    type: 'error' | 'warning' | 'info' | 'style';
    category: 'security' | 'performance' | 'maintainability' | 'reliability' | 'style';
    severity: 'critical' | 'major' | 'minor' | 'trivial';
    line: number;
    column: number;
    message: string;
    rule: string;
    fix?: string;
}

interface ReviewSuggestion {
    id: string;
    type: 'refactor' | 'modernize' | 'simplify' | 'document' | 'test';
    line: number;
    description: string;
    before: string;
    after: string;
    benefit: string;
}

interface CodeMetrics {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
    duplicateLines: number;
    testCoverage?: number;
    documentationCoverage: number;
}

interface ReviewRules {
    maxLineLength: number;
    maxFunctionLength: number;
    maxComplexity: number;
    maxNesting: number;
    requireJSDoc: boolean;
    enforceNaming: boolean;
}

const SECURITY_PATTERNS = [
    { pattern: /eval\s*\(/, message: 'Avoid using eval() - potential code injection', severity: 'critical' as const },
    { pattern: /innerHTML\s*=/, message: 'Direct innerHTML assignment - XSS risk', severity: 'major' as const },
    { pattern: /document\.write\s*\(/, message: 'Avoid document.write() - XSS risk', severity: 'major' as const },
    { pattern: /new Function\s*\(/, message: 'Dynamic function creation - security risk', severity: 'critical' as const },
    { pattern: /password\s*=\s*['"]/, message: 'Hardcoded password detected', severity: 'critical' as const },
    { pattern: /api[_-]?key\s*=\s*['"]/, message: 'Hardcoded API key detected', severity: 'critical' as const }
];

const STYLE_PATTERNS = [
    { pattern: /console\.log\s*\(/, message: 'Remove console.log in production code', severity: 'minor' as const },
    { pattern: /debugger;/, message: 'Remove debugger statement', severity: 'minor' as const },
    { pattern: /TODO|FIXME|HACK|XXX/, message: 'TODO comment found - address or remove', severity: 'trivial' as const },
    { pattern: /\bvar\b/, message: 'Use const/let instead of var', severity: 'minor' as const }
];

const DEFAULT_RULES: ReviewRules = {
    maxLineLength: 120,
    maxFunctionLength: 50,
    maxComplexity: 10,
    maxNesting: 4,
    requireJSDoc: true,
    enforceNaming: true
};

export class AICodeReviewer extends EventEmitter {
    private static instance: AICodeReviewer;
    private reviews: Map<string, CodeReview> = new Map();
    private rules: ReviewRules = { ...DEFAULT_RULES };

    private constructor() {
        super();
    }

    static getInstance(): AICodeReviewer {
        if (!AICodeReviewer.instance) {
            AICodeReviewer.instance = new AICodeReviewer();
        }
        return AICodeReviewer.instance;
    }

    reviewCode(code: string, filePath: string, language = 'typescript'): CodeReview {
        const issues = this.analyzeIssues(code, filePath);
        const suggestions = this.generateSuggestions(code);
        const metrics = this.calculateMetrics(code);
        const score = this.calculateScore(issues, metrics);
        const summary = this.generateSummary(issues, metrics, score);

        const review: CodeReview = {
            id: crypto.randomUUID(),
            filePath,
            language,
            code,
            issues,
            suggestions,
            metrics,
            score,
            summary,
            reviewedAt: new Date()
        };

        this.reviews.set(review.id, review);
        this.emit('reviewCompleted', review);
        return review;
    }

    private analyzeIssues(code: string, filePath: string): ReviewIssue[] {
        const issues: ReviewIssue[] = [];
        const lines = code.split('\n');

        // Check security patterns
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const pattern of SECURITY_PATTERNS) {
                if (pattern.pattern.test(line)) {
                    issues.push({
                        id: crypto.randomUUID(),
                        type: 'error',
                        category: 'security',
                        severity: pattern.severity,
                        line: i + 1,
                        column: 0,
                        message: pattern.message,
                        rule: 'security-check'
                    });
                }
            }

            // Check style patterns
            for (const pattern of STYLE_PATTERNS) {
                if (pattern.pattern.test(line)) {
                    issues.push({
                        id: crypto.randomUUID(),
                        type: 'warning',
                        category: 'style',
                        severity: pattern.severity,
                        line: i + 1,
                        column: 0,
                        message: pattern.message,
                        rule: 'style-check'
                    });
                }
            }

            // Line length check
            if (line.length > this.rules.maxLineLength) {
                issues.push({
                    id: crypto.randomUUID(),
                    type: 'style',
                    category: 'style',
                    severity: 'trivial',
                    line: i + 1,
                    column: this.rules.maxLineLength,
                    message: `Line exceeds ${this.rules.maxLineLength} characters`,
                    rule: 'max-line-length'
                });
            }
        }

        // Check function length and complexity
        const functions = code.match(/(?:function|const|let|var)\s+\w+\s*(?:=\s*)?(?:async\s*)?\([^)]*\)\s*(?:=>)?\s*\{[^}]*\}/g) || [];
        for (const func of functions) {
            const funcLines = func.split('\n').length;
            if (funcLines > this.rules.maxFunctionLength) {
                issues.push({
                    id: crypto.randomUUID(),
                    type: 'warning',
                    category: 'maintainability',
                    severity: 'major',
                    line: 0,
                    column: 0,
                    message: `Function has ${funcLines} lines, exceeds limit of ${this.rules.maxFunctionLength}`,
                    rule: 'max-function-length'
                });
            }
        }

        // Check nesting depth
        let maxNesting = 0;
        let currentNesting = 0;
        for (const char of code) {
            if (char === '{') {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            } else if (char === '}') {
                currentNesting--;
            }
        }

        if (maxNesting > this.rules.maxNesting) {
            issues.push({
                id: crypto.randomUUID(),
                type: 'warning',
                category: 'maintainability',
                severity: 'minor',
                line: 0,
                column: 0,
                message: `Maximum nesting depth is ${maxNesting}, exceeds limit of ${this.rules.maxNesting}`,
                rule: 'max-nesting'
            });
        }

        return issues;
    }

    private generateSuggestions(code: string): ReviewSuggestion[] {
        const suggestions: ReviewSuggestion[] = [];

        // Suggest arrow functions
        const traditionalFunctions = code.match(/function\s+(\w+)\s*\([^)]*\)\s*\{/g) || [];
        for (const func of traditionalFunctions) {
            const name = func.match(/function\s+(\w+)/)?.[1];
            suggestions.push({
                id: crypto.randomUUID(),
                type: 'modernize',
                line: 0,
                description: `Consider converting ${name} to an arrow function`,
                before: func,
                after: `const ${name} = () => {`,
                benefit: 'Arrow functions are more concise and handle "this" consistently'
            });
        }

        // Suggest optional chaining
        if (code.match(/&&\s*\w+\./g)) {
            suggestions.push({
                id: crypto.randomUUID(),
                type: 'modernize',
                line: 0,
                description: 'Use optional chaining (?.) instead of && for property access',
                before: 'obj && obj.property',
                after: 'obj?.property',
                benefit: 'Cleaner null checks with optional chaining'
            });
        }

        // Suggest nullish coalescing
        if (code.match(/\|\|\s*[^|]/g) && code.match(/null|undefined/g)) {
            suggestions.push({
                id: crypto.randomUUID(),
                type: 'modernize',
                line: 0,
                description: 'Consider using nullish coalescing (??) instead of ||',
                before: 'value || defaultValue',
                after: 'value ?? defaultValue',
                benefit: 'Nullish coalescing only applies for null/undefined, not falsy values'
            });
        }

        // Suggest template literals
        if (code.match(/["']\s*\+\s*\w+\s*\+\s*["']/g)) {
            suggestions.push({
                id: crypto.randomUUID(),
                type: 'modernize',
                line: 0,
                description: 'Use template literals instead of string concatenation',
                before: '"Hello, " + name + "!"',
                after: '`Hello, ${name}!`',
                benefit: 'Template literals are more readable and support multi-line strings'
            });
        }

        return suggestions;
    }

    private calculateMetrics(code: string): CodeMetrics {
        const lines = code.split('\n');
        const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

        // Cyclomatic complexity
        const conditionals = (code.match(/if|else|switch|case|for|while|&&|\|\||\?:|catch/g) || []).length;
        const cyclomaticComplexity = conditionals + 1;

        // Cognitive complexity (simplified)
        const cognitiveComplexity = cyclomaticComplexity + (code.match(/\{[^}]*\{[^}]*\{/g) || []).length * 2;

        // Maintainability index (simplified formula)
        const maintainabilityIndex = Math.max(0, Math.min(100,
            171 - 5.2 * Math.log(linesOfCode) - 0.23 * cyclomaticComplexity
        ));

        // Duplicate lines (simplified)
        const lineSet = new Set(lines.map(l => l.trim()).filter(l => l.length > 20));
        const duplicateLines = lines.length - lineSet.size;

        // Documentation coverage
        const jsdocCount = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
        const functionCount = (code.match(/(?:function|=>)/g) || []).length;
        const documentationCoverage = functionCount > 0
            ? Math.min(100, Math.round((jsdocCount / functionCount) * 100))
            : 100;

        return {
            linesOfCode,
            cyclomaticComplexity,
            cognitiveComplexity,
            maintainabilityIndex: Math.round(maintainabilityIndex),
            duplicateLines,
            documentationCoverage
        };
    }

    private calculateScore(issues: ReviewIssue[], metrics: CodeMetrics): number {
        let score = 100;

        // Deduct for issues
        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical': score -= 15; break;
                case 'major': score -= 10; break;
                case 'minor': score -= 5; break;
                case 'trivial': score -= 2; break;
            }
        }

        // Deduct for poor metrics
        if (metrics.cyclomaticComplexity > 15) score -= 10;
        if (metrics.maintainabilityIndex < 50) score -= 10;
        if (metrics.documentationCoverage < 50) score -= 5;

        return Math.max(0, Math.min(100, score));
    }

    private generateSummary(issues: ReviewIssue[], metrics: CodeMetrics, score: number): string {
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const majorCount = issues.filter(i => i.severity === 'major').length;

        let summary = '';

        if (score >= 90) {
            summary = '✅ Excellent code quality! Minor improvements possible.';
        } else if (score >= 70) {
            summary = '🔵 Good code quality with some issues to address.';
        } else if (score >= 50) {
            summary = '⚠️ Code needs attention. Several issues found.';
        } else {
            summary = '🔴 Critical issues found. Review urgently required.';
        }

        if (criticalCount > 0) {
            summary += ` ${criticalCount} critical issues.`;
        }
        if (majorCount > 0) {
            summary += ` ${majorCount} major issues.`;
        }

        return summary;
    }

    setRules(rules: Partial<ReviewRules>): void {
        this.rules = { ...this.rules, ...rules };
    }

    getRules(): ReviewRules {
        return { ...this.rules };
    }

    getReview(id: string): CodeReview | undefined {
        return this.reviews.get(id);
    }

    getReviews(): CodeReview[] {
        return Array.from(this.reviews.values());
    }

    clearReviews(): void {
        this.reviews.clear();
    }
}

export const aiCodeReviewer = AICodeReviewer.getInstance();
