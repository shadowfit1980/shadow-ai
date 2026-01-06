/**
 * AI Code Reviewer Bot
 * 
 * Auto-review every commit with style consistency checks
 * and proactive improvement suggestions.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type ReviewCategory = 'style' | 'logic' | 'performance' | 'security' | 'naming' | 'docs' | 'testing';

export interface ReviewComment {
    id: string;
    file: string;
    line: number;
    category: ReviewCategory;
    severity: 'suggestion' | 'warning' | 'error';
    message: string;
    suggestion?: string;
}

export interface CommitReview {
    commitHash: string;
    author: string;
    message: string;
    files: string[];
    comments: ReviewComment[];
    score: number; // 0-100
    approved: boolean;
    summary: string;
    reviewedAt: Date;
}

export interface ReviewConfig {
    autoApproveThreshold: number;
    requireTests: boolean;
    requireDocs: boolean;
    maxLineLength: number;
    strictMode: boolean;
}

// ============================================================================
// AI CODE REVIEWER
// ============================================================================

export class AICodeReviewerBot extends EventEmitter {
    private static instance: AICodeReviewerBot;
    private modelManager: ModelManager;
    private config: ReviewConfig = {
        autoApproveThreshold: 90,
        requireTests: true,
        requireDocs: true,
        maxLineLength: 120,
        strictMode: false,
    };

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): AICodeReviewerBot {
        if (!AICodeReviewerBot.instance) {
            AICodeReviewerBot.instance = new AICodeReviewerBot();
        }
        return AICodeReviewerBot.instance;
    }

    // ========================================================================
    // COMMIT REVIEW
    // ========================================================================

    /**
     * Review a commit
     */
    async reviewCommit(projectPath: string, commitHash = 'HEAD'): Promise<CommitReview> {
        this.emit('review:started', { commitHash });

        // Get commit info
        const { stdout: commitInfo } = await execAsync(
            `git log -1 --format="%H|%an|%s" ${commitHash}`,
            { cwd: projectPath }
        );
        const [hash, author, message] = commitInfo.trim().split('|');

        // Get changed files
        const { stdout: filesOutput } = await execAsync(
            `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
            { cwd: projectPath }
        );
        const files = filesOutput.trim().split('\n').filter(Boolean);

        // Get diff
        const { stdout: diff } = await execAsync(
            `git show ${commitHash} --format="" | head -500`,
            { cwd: projectPath }
        );

        // AI review
        const comments = await this.analyzeChanges(diff, files);

        // Calculate score
        const score = this.calculateScore(comments);

        const review: CommitReview = {
            commitHash: hash,
            author,
            message,
            files,
            comments,
            score,
            approved: score >= this.config.autoApproveThreshold,
            summary: this.generateSummary(comments, score),
            reviewedAt: new Date(),
        };

        this.emit('review:completed', review);
        return review;
    }

    /**
     * Analyze code changes
     */
    private async analyzeChanges(diff: string, files: string[]): Promise<ReviewComment[]> {
        const comments: ReviewComment[] = [];

        // Static analysis
        comments.push(...this.staticAnalysis(diff));

        // AI analysis
        const aiComments = await this.aiAnalysis(diff, files);
        comments.push(...aiComments);

        return comments;
    }

    /**
     * Static code analysis
     */
    private staticAnalysis(diff: string): ReviewComment[] {
        const comments: ReviewComment[] = [];
        const lines = diff.split('\n');
        let currentFile = '';
        let lineNum = 0;

        for (const line of lines) {
            // Track file
            if (line.startsWith('+++ b/')) {
                currentFile = line.slice(6);
                lineNum = 0;
                continue;
            }

            // Track line number
            const lineMatch = line.match(/^@@ -\d+,?\d* \+(\d+)/);
            if (lineMatch) {
                lineNum = parseInt(lineMatch[1]);
                continue;
            }

            // Only check added lines
            if (!line.startsWith('+') || line.startsWith('+++')) continue;
            lineNum++;

            const content = line.slice(1);

            // Long lines
            if (content.length > this.config.maxLineLength) {
                comments.push({
                    id: `static_${comments.length}`,
                    file: currentFile,
                    line: lineNum,
                    category: 'style',
                    severity: 'warning',
                    message: `Line exceeds ${this.config.maxLineLength} characters`,
                });
            }

            // Console.log
            if (/console\.log/.test(content)) {
                comments.push({
                    id: `static_${comments.length}`,
                    file: currentFile,
                    line: lineNum,
                    category: 'style',
                    severity: 'warning',
                    message: 'Remove console.log before committing',
                    suggestion: 'Use a proper logging library instead',
                });
            }

            // TODO comments
            if (/TODO|FIXME|HACK/.test(content)) {
                comments.push({
                    id: `static_${comments.length}`,
                    file: currentFile,
                    line: lineNum,
                    category: 'docs',
                    severity: 'suggestion',
                    message: 'TODO comment found - consider creating an issue',
                });
            }

            // Any/unknown types
            if (/:\s*any\b/.test(content)) {
                comments.push({
                    id: `static_${comments.length}`,
                    file: currentFile,
                    line: lineNum,
                    category: 'style',
                    severity: 'warning',
                    message: 'Avoid using `any` type',
                    suggestion: 'Use a specific type or `unknown`',
                });
            }
        }

        return comments;
    }

    /**
     * AI-powered analysis
     */
    private async aiAnalysis(diff: string, files: string[]): Promise<ReviewComment[]> {
        const prompt = `Review this git diff and provide code review comments.

Files changed: ${files.join(', ')}

Diff:
\`\`\`diff
${diff.slice(0, 4000)}
\`\`\`

Look for:
1. Logic errors
2. Performance issues
3. Security concerns
4. Naming improvements
5. Missing error handling

Respond in JSON:
\`\`\`json
{
    "comments": [
        {
            "file": "filename",
            "line": 10,
            "category": "logic|performance|security|naming|docs|testing",
            "severity": "suggestion|warning|error",
            "message": "issue description",
            "suggestion": "how to fix"
        }
    ]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);
        return (parsed.comments || []).map((c: any, i: number) => ({
            id: `ai_${i}`,
            ...c,
        }));
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private calculateScore(comments: ReviewComment[]): number {
        let score = 100;

        for (const comment of comments) {
            if (comment.severity === 'error') score -= 15;
            else if (comment.severity === 'warning') score -= 5;
            else score -= 1;
        }

        return Math.max(0, score);
    }

    private generateSummary(comments: ReviewComment[], score: number): string {
        if (score >= 90) return '✅ Excellent code quality';
        if (score >= 70) return '👍 Good with minor suggestions';
        if (score >= 50) return '⚠️ Needs improvements';
        return '❌ Significant issues found';
    }

    /**
     * Review all recent commits
     */
    async reviewRecent(projectPath: string, count = 5): Promise<CommitReview[]> {
        const { stdout } = await execAsync(
            `git log --oneline -n ${count} --format="%H"`,
            { cwd: projectPath }
        );
        const commits = stdout.trim().split('\n').filter(Boolean);

        const reviews: CommitReview[] = [];
        for (const commit of commits) {
            const review = await this.reviewCommit(projectPath, commit);
            reviews.push(review);
        }

        return reviews;
    }

    setConfig(config: Partial<ReviewConfig>): void {
        this.config = { ...this.config, ...config };
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const aiCodeReviewerBot = AICodeReviewerBot.getInstance();
