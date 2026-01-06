/**
 * GitHub Agent
 * 
 * Autonomous GitHub operations including issue-to-code,
 * PR generation, and automated code review.
 * Inspired by Google Jules and GitHub Copilot Workspace.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    labels: string[];
    assignees: string[];
    state: 'open' | 'closed';
    url: string;
}

export interface PullRequest {
    number: number;
    title: string;
    body: string;
    branch: string;
    baseBranch: string;
    files: string[];
    additions: number;
    deletions: number;
    state: 'open' | 'closed' | 'merged';
    url: string;
}

export interface CodeChange {
    file: string;
    type: 'add' | 'modify' | 'delete';
    content?: string;
    diff?: string;
}

export interface IssueResolution {
    issue: GitHubIssue;
    plan: string;
    changes: CodeChange[];
    tests: string[];
    prTitle: string;
    prBody: string;
}

export interface ReviewComment {
    file: string;
    line: number;
    body: string;
    severity: 'info' | 'warning' | 'error';
    suggestion?: string;
}

export interface PRReview {
    approved: boolean;
    summary: string;
    comments: ReviewComment[];
    suggestedChanges: CodeChange[];
}

// ============================================================================
// GITHUB AGENT
// ============================================================================

export class GitHubAgent extends EventEmitter {
    private static instance: GitHubAgent;
    private modelManager: ModelManager;
    private repoPath: string = '';

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): GitHubAgent {
        if (!GitHubAgent.instance) {
            GitHubAgent.instance = new GitHubAgent();
        }
        return GitHubAgent.instance;
    }

    /**
     * Set working repository
     */
    setRepository(repoPath: string): void {
        this.repoPath = repoPath;
    }

    // ========================================================================
    // ISSUE OPERATIONS
    // ========================================================================

    /**
     * Fetch issues from GitHub
     */
    async fetchIssues(options: {
        state?: 'open' | 'closed' | 'all';
        labels?: string[];
        limit?: number;
    } = {}): Promise<GitHubIssue[]> {
        const { state = 'open', labels = [], limit = 10 } = options;

        try {
            const labelFilter = labels.length > 0 ? `--label "${labels.join(',')}"` : '';
            const cmd = `gh issue list --state ${state} ${labelFilter} --limit ${limit} --json number,title,body,labels,assignees,state,url`;

            const { stdout } = await execAsync(cmd, { cwd: this.repoPath });
            return JSON.parse(stdout);
        } catch (error: any) {
            this.emit('error', { operation: 'fetchIssues', error: error.message });
            return [];
        }
    }

    /**
     * Get a specific issue
     */
    async getIssue(issueNumber: number): Promise<GitHubIssue | null> {
        try {
            const cmd = `gh issue view ${issueNumber} --json number,title,body,labels,assignees,state,url`;
            const { stdout } = await execAsync(cmd, { cwd: this.repoPath });
            return JSON.parse(stdout);
        } catch (error: any) {
            this.emit('error', { operation: 'getIssue', error: error.message });
            return null;
        }
    }

    /**
     * Resolve an issue by generating code changes
     */
    async resolveIssue(issueNumber: number): Promise<IssueResolution | null> {
        this.emit('issue:resolving', { issueNumber });

        const issue = await this.getIssue(issueNumber);
        if (!issue) return null;

        // Generate a plan to resolve the issue
        const prompt = `You are an AI coding agent tasked with resolving a GitHub issue.

ISSUE #${issue.number}: ${issue.title}

${issue.body}

Analyze the issue and create a detailed plan to resolve it. Include:
1. Understanding of the problem
2. Files that need to be modified/created
3. Specific code changes
4. Tests to add

Respond in JSON:
\`\`\`json
{
    "plan": "Step-by-step plan",
    "changes": [
        {
            "file": "path/to/file",
            "type": "add|modify|delete",
            "content": "new file content or description of changes"
        }
    ],
    "tests": ["test descriptions"],
    "prTitle": "PR title",
    "prBody": "PR description with closes #${issueNumber}"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        const resolution: IssueResolution = {
            issue,
            plan: parsed.plan || '',
            changes: parsed.changes || [],
            tests: parsed.tests || [],
            prTitle: parsed.prTitle || `Fix #${issueNumber}: ${issue.title}`,
            prBody: parsed.prBody || `Resolves #${issueNumber}`,
        };

        this.emit('issue:resolved', resolution);
        return resolution;
    }

    // ========================================================================
    // BRANCH & PR OPERATIONS
    // ========================================================================

    /**
     * Create a branch for an issue
     */
    async createIssueBranch(issueNumber: number): Promise<string> {
        const branchName = `issue-${issueNumber}`;

        try {
            await execAsync('git fetch origin', { cwd: this.repoPath });
            await execAsync(`git checkout -b ${branchName}`, { cwd: this.repoPath });
            this.emit('branch:created', { branch: branchName });
            return branchName;
        } catch (error: any) {
            this.emit('error', { operation: 'createBranch', error: error.message });
            throw error;
        }
    }

    /**
     * Commit changes
     */
    async commitChanges(message: string, files?: string[]): Promise<void> {
        try {
            if (files && files.length > 0) {
                await execAsync(`git add ${files.join(' ')}`, { cwd: this.repoPath });
            } else {
                await execAsync('git add -A', { cwd: this.repoPath });
            }
            await execAsync(`git commit -m "${message}"`, { cwd: this.repoPath });
            this.emit('commit:created', { message });
        } catch (error: any) {
            this.emit('error', { operation: 'commit', error: error.message });
            throw error;
        }
    }

    /**
     * Push changes and create PR
     */
    async createPullRequest(options: {
        title: string;
        body: string;
        branch: string;
        baseBranch?: string;
        draft?: boolean;
    }): Promise<PullRequest | null> {
        const { title, body, branch, baseBranch = 'main', draft = false } = options;

        try {
            // Push branch
            await execAsync(`git push -u origin ${branch}`, { cwd: this.repoPath });

            // Create PR
            const draftFlag = draft ? '--draft' : '';
            const cmd = `gh pr create --title "${title}" --body "${body}" --base ${baseBranch} ${draftFlag} --json number,title,body,url`;

            const { stdout } = await execAsync(cmd, { cwd: this.repoPath });
            const pr = JSON.parse(stdout);

            this.emit('pr:created', pr);
            return {
                ...pr,
                branch,
                baseBranch,
                files: [],
                additions: 0,
                deletions: 0,
                state: 'open',
            };
        } catch (error: any) {
            this.emit('error', { operation: 'createPR', error: error.message });
            return null;
        }
    }

    // ========================================================================
    // PR REVIEW
    // ========================================================================

    /**
     * Get PR details
     */
    async getPR(prNumber: number): Promise<PullRequest | null> {
        try {
            const cmd = `gh pr view ${prNumber} --json number,title,body,headRefName,baseRefName,files,additions,deletions,state,url`;
            const { stdout } = await execAsync(cmd, { cwd: this.repoPath });
            const data = JSON.parse(stdout);
            return {
                number: data.number,
                title: data.title,
                body: data.body,
                branch: data.headRefName,
                baseBranch: data.baseRefName,
                files: data.files?.map((f: any) => f.path) || [],
                additions: data.additions,
                deletions: data.deletions,
                state: data.state.toLowerCase(),
                url: data.url,
            };
        } catch (error: any) {
            this.emit('error', { operation: 'getPR', error: error.message });
            return null;
        }
    }

    /**
     * Review a PR and generate feedback
     */
    async reviewPR(prNumber: number): Promise<PRReview | null> {
        this.emit('pr:reviewing', { prNumber });

        const pr = await this.getPR(prNumber);
        if (!pr) return null;

        // Get the diff
        let diff = '';
        try {
            const { stdout } = await execAsync(`gh pr diff ${prNumber}`, { cwd: this.repoPath });
            diff = stdout;
        } catch {
            diff = 'Unable to get diff';
        }

        const prompt = `You are an AI code reviewer. Review this pull request.

PR #${pr.number}: ${pr.title}

${pr.body}

Files changed: ${pr.files.join(', ')}
Additions: +${pr.additions}, Deletions: -${pr.deletions}

DIFF:
${diff.slice(0, 10000)}

Provide a comprehensive code review:
1. Overall assessment
2. Security concerns
3. Code quality issues
4. Suggestions for improvement

Respond in JSON:
\`\`\`json
{
    "approved": true/false,
    "summary": "Overall review summary",
    "comments": [
        {
            "file": "path/to/file",
            "line": 10,
            "body": "Comment text",
            "severity": "info|warning|error",
            "suggestion": "Suggested fix if applicable"
        }
    ],
    "suggestedChanges": []
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        const review: PRReview = {
            approved: parsed.approved ?? false,
            summary: parsed.summary || '',
            comments: parsed.comments || [],
            suggestedChanges: parsed.suggestedChanges || [],
        };

        this.emit('pr:reviewed', { prNumber, review });
        return review;
    }

    /**
     * Submit a review to GitHub
     */
    async submitReview(prNumber: number, review: PRReview): Promise<boolean> {
        try {
            const event = review.approved ? 'APPROVE' : 'REQUEST_CHANGES';
            const cmd = `gh pr review ${prNumber} --${event.toLowerCase().replace('_', '-')} --body "${review.summary}"`;

            await execAsync(cmd, { cwd: this.repoPath });
            this.emit('review:submitted', { prNumber, approved: review.approved });
            return true;
        } catch (error: any) {
            this.emit('error', { operation: 'submitReview', error: error.message });
            return false;
        }
    }

    // ========================================================================
    // AUTOMATED WORKFLOWS
    // ========================================================================

    /**
     * Fully automated issue resolution workflow
     */
    async autoResolveIssue(issueNumber: number): Promise<PullRequest | null> {
        this.emit('workflow:started', { type: 'autoResolve', issueNumber });

        try {
            // 1. Resolve issue (generate plan and changes)
            const resolution = await this.resolveIssue(issueNumber);
            if (!resolution) {
                throw new Error('Failed to resolve issue');
            }

            // 2. Create branch
            const branch = await this.createIssueBranch(issueNumber);

            // 3. Apply changes (this would be done by the caller)
            this.emit('workflow:applyChanges', { resolution });

            // 4. Commit
            await this.commitChanges(`Fix #${issueNumber}: ${resolution.issue.title}`);

            // 5. Create PR
            const pr = await this.createPullRequest({
                title: resolution.prTitle,
                body: resolution.prBody,
                branch,
                draft: true, // Create as draft for review
            });

            this.emit('workflow:completed', { type: 'autoResolve', issueNumber, pr });
            return pr;

        } catch (error: any) {
            this.emit('workflow:failed', { type: 'autoResolve', issueNumber, error: error.message });
            return null;
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async callModel(prompt: string): Promise<string> {
        return this.modelManager.chat([
            {
                role: 'system',
                content: 'You are an AI GitHub agent. Analyze issues and generate high-quality code changes and reviews.',
                timestamp: new Date()
            },
            {
                role: 'user',
                content: prompt,
                timestamp: new Date()
            }
        ]);
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    /**
     * Check if GitHub CLI is available
     */
    async isGitHubCLIAvailable(): Promise<boolean> {
        try {
            await execAsync('gh --version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if authenticated with GitHub
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            await execAsync('gh auth status');
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton
export const githubAgent = GitHubAgent.getInstance();
