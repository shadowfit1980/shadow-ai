/**
 * Bugbot Reviewer - GitHub PR Code Review
 * AI-powered code review like Cursor's Bugbot
 */

import { EventEmitter } from 'events';

export interface CodeIssue {
    id: string;
    type: 'bug' | 'security' | 'performance' | 'style' | 'logic';
    severity: 'low' | 'medium' | 'high' | 'critical';
    file: string;
    line: number;
    endLine?: number;
    message: string;
    suggestion?: string;
    code?: string;
}

export interface CodeFix {
    issueId: string;
    file: string;
    line: number;
    oldCode: string;
    newCode: string;
    explanation: string;
}

export interface PRReviewResult {
    prNumber: number;
    owner: string;
    repo: string;
    issues: CodeIssue[];
    fixes: CodeFix[];
    summary: string;
    timestamp: number;
}

export interface GitHubConfig {
    token: string;
    baseUrl?: string;
}

/**
 * BugbotReviewer
 * Analyzes GitHub PRs for bugs, security issues, and code quality
 */
export class BugbotReviewer extends EventEmitter {
    private static instance: BugbotReviewer;
    private config: GitHubConfig | null = null;
    private reviewCache: Map<string, PRReviewResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): BugbotReviewer {
        if (!BugbotReviewer.instance) {
            BugbotReviewer.instance = new BugbotReviewer();
        }
        return BugbotReviewer.instance;
    }

    /**
     * Configure GitHub access
     */
    configure(config: GitHubConfig): void {
        this.config = config;
    }

    /**
     * Check if configured
     */
    isConfigured(): boolean {
        return this.config !== null && this.config.token !== '';
    }

    /**
     * Review a pull request
     */
    async reviewPullRequest(
        owner: string,
        repo: string,
        prNumber: number
    ): Promise<PRReviewResult> {
        if (!this.config) {
            throw new Error('GitHub not configured. Call configure() first.');
        }

        const cacheKey = `${owner}/${repo}#${prNumber}`;
        this.emit('reviewStarted', { owner, repo, prNumber });

        try {
            // Fetch PR diff
            const diff = await this.fetchPRDiff(owner, repo, prNumber);

            // Analyze the diff for issues
            const issues = await this.analyzeCode(diff);

            // Generate fixes for detected issues
            const fixes = await this.generateFixes(issues);

            // Create summary
            const summary = this.createSummary(issues);

            const result: PRReviewResult = {
                prNumber,
                owner,
                repo,
                issues,
                fixes,
                summary,
                timestamp: Date.now(),
            };

            this.reviewCache.set(cacheKey, result);
            this.emit('reviewCompleted', result);

            return result;
        } catch (error: any) {
            this.emit('reviewError', { owner, repo, prNumber, error: error.message });
            throw error;
        }
    }

    /**
     * Fetch PR diff from GitHub
     */
    private async fetchPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
        const baseUrl = this.config?.baseUrl || 'https://api.github.com';
        const url = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.config?.token}`,
                Accept: 'application/vnd.github.v3.diff',
                'User-Agent': 'Shadow-AI-Bugbot',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch PR: ${response.status} ${response.statusText}`);
        }

        return await response.text();
    }

    /**
     * Analyze code diff for issues
     */
    async analyzeCode(diff: string): Promise<CodeIssue[]> {
        const issues: CodeIssue[] = [];
        const lines = diff.split('\n');

        let currentFile = '';
        let lineNumber = 0;

        for (const line of lines) {
            // Track current file
            if (line.startsWith('+++ b/')) {
                currentFile = line.substring(6);
                lineNumber = 0;
                continue;
            }

            // Track line numbers from @@ headers
            const hunkMatch = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
            if (hunkMatch) {
                lineNumber = parseInt(hunkMatch[1], 10) - 1;
                continue;
            }

            // Only analyze added lines
            if (!line.startsWith('+') || line.startsWith('+++')) {
                if (!line.startsWith('-')) lineNumber++;
                continue;
            }

            lineNumber++;
            const code = line.substring(1);

            // Check for common issues
            const detectedIssues = this.detectIssues(code, currentFile, lineNumber);
            issues.push(...detectedIssues);
        }

        return issues;
    }

    /**
     * Detect issues in a line of code
     */
    private detectIssues(code: string, file: string, line: number): CodeIssue[] {
        const issues: CodeIssue[] = [];
        const trimmed = code.trim();

        // Security: Hardcoded secrets
        if (/(['"])(?:password|secret|api_?key|token)\1\s*[:=]/i.test(trimmed)) {
            issues.push({
                id: `sec_${line}_${Date.now()}`,
                type: 'security',
                severity: 'critical',
                file,
                line,
                message: 'Potential hardcoded secret or credential detected',
                suggestion: 'Use environment variables for sensitive data',
                code: trimmed,
            });
        }

        // Bug: Assignment in condition
        if (/if\s*\([^=]*[^!=<>]=[^=][^)]*\)/.test(trimmed)) {
            issues.push({
                id: `bug_${line}_${Date.now()}`,
                type: 'bug',
                severity: 'high',
                file,
                line,
                message: 'Assignment in conditional (possible typo, did you mean ==?)',
                suggestion: 'Use === for comparison',
                code: trimmed,
            });
        }

        // Bug: Console.log in production code
        if (/console\.(log|debug|info)\s*\(/.test(trimmed) && !file.includes('test')) {
            issues.push({
                id: `style_${line}_${Date.now()}`,
                type: 'style',
                severity: 'low',
                file,
                line,
                message: 'Console statement left in code',
                suggestion: 'Remove or use proper logging framework',
                code: trimmed,
            });
        }

        // Security: SQL injection risk
        if (/query\s*\([`'"]\s*SELECT.*\$\{/.test(trimmed) || /execute\s*\([`'"]\s*.*\$\{/.test(trimmed)) {
            issues.push({
                id: `sec_${line}_${Date.now()}`,
                type: 'security',
                severity: 'critical',
                file,
                line,
                message: 'Potential SQL injection vulnerability',
                suggestion: 'Use parameterized queries',
                code: trimmed,
            });
        }

        // Performance: Await in loop
        if (/for\s*\(.*\)\s*\{[^}]*await\s+/.test(trimmed) || trimmed.includes('await') && /\.forEach\s*\(/.test(trimmed)) {
            issues.push({
                id: `perf_${line}_${Date.now()}`,
                type: 'performance',
                severity: 'medium',
                file,
                line,
                message: 'Await inside loop may cause performance issues',
                suggestion: 'Use Promise.all() for parallel execution',
                code: trimmed,
            });
        }

        // Logic: Empty catch block
        if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(trimmed)) {
            issues.push({
                id: `logic_${line}_${Date.now()}`,
                type: 'logic',
                severity: 'medium',
                file,
                line,
                message: 'Empty catch block silently swallows errors',
                suggestion: 'Add error handling or logging',
                code: trimmed,
            });
        }

        return issues;
    }

    /**
     * Generate fix suggestions for issues
     */
    async generateFixes(issues: CodeIssue[]): Promise<CodeFix[]> {
        const fixes: CodeFix[] = [];

        for (const issue of issues) {
            if (!issue.code) continue;

            let fix: CodeFix | null = null;

            switch (issue.type) {
                case 'bug':
                    if (issue.message.includes('Assignment in conditional')) {
                        fix = {
                            issueId: issue.id,
                            file: issue.file,
                            line: issue.line,
                            oldCode: issue.code,
                            newCode: issue.code.replace(/([^!=<>])=([^=])/, '$1===$2'),
                            explanation: 'Changed assignment (=) to strict equality (===)',
                        };
                    }
                    break;

                case 'style':
                    if (issue.message.includes('Console statement')) {
                        fix = {
                            issueId: issue.id,
                            file: issue.file,
                            line: issue.line,
                            oldCode: issue.code,
                            newCode: `// ${issue.code}`,
                            explanation: 'Commented out console statement',
                        };
                    }
                    break;
            }

            if (fix) {
                fixes.push(fix);
            }
        }

        return fixes;
    }

    /**
     * Create review summary
     */
    private createSummary(issues: CodeIssue[]): string {
        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;
        const medium = issues.filter(i => i.severity === 'medium').length;
        const low = issues.filter(i => i.severity === 'low').length;

        const parts: string[] = [];

        if (critical > 0) parts.push(`🔴 ${critical} critical`);
        if (high > 0) parts.push(`🟠 ${high} high`);
        if (medium > 0) parts.push(`🟡 ${medium} medium`);
        if (low > 0) parts.push(`🟢 ${low} low`);

        if (parts.length === 0) {
            return '✅ No issues found';
        }

        return `Found ${issues.length} issues: ${parts.join(', ')}`;
    }

    /**
     * Post review comment to GitHub PR
     */
    async postComment(
        owner: string,
        repo: string,
        prNumber: number,
        body: string
    ): Promise<void> {
        if (!this.config) {
            throw new Error('GitHub not configured');
        }

        const baseUrl = this.config.baseUrl || 'https://api.github.com';
        const url = `${baseUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Shadow-AI-Bugbot',
            },
            body: JSON.stringify({ body }),
        });

        if (!response.ok) {
            throw new Error(`Failed to post comment: ${response.status}`);
        }
    }

    /**
     * Get cached review result
     */
    getCachedReview(owner: string, repo: string, prNumber: number): PRReviewResult | null {
        const key = `${owner}/${repo}#${prNumber}`;
        return this.reviewCache.get(key) || null;
    }
}

// Singleton getter
export function getBugbotReviewer(): BugbotReviewer {
    return BugbotReviewer.getInstance();
}
