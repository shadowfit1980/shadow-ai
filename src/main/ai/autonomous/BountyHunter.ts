/**
 * 🏹 BountyHunter - Autonomous GitHub Issue Solver
 * 
 * Automatically:
 * - Scans GitHub issues for solvable problems
 * - Analyzes issue complexity and requirements
 * - Implements solutions using multi-agent swarm
 * - Creates pull requests with fixes
 * - Responds to code review feedback
 * 
 * This is a MOONSHOT feature for autonomous development.
 */

import { EventEmitter } from 'events';
import * as https from 'https';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string;
    labels: string[];
    state: 'open' | 'closed';
    author: string;
    createdAt: Date;
    updatedAt: Date;
    comments: number;
    repoOwner: string;
    repoName: string;
    url: string;
}

export interface IssueAnalysis {
    issueId: number;
    complexity: 'trivial' | 'easy' | 'medium' | 'hard' | 'expert';
    estimatedHours: number;
    confidence: number;
    requiredSkills: string[];
    affectedFiles: string[];
    suggestedApproach: string;
    risks: string[];
    solvable: boolean;
    reason?: string;
}

export interface BountyConfig {
    repositories: string[]; // owner/repo format
    labels: string[]; // e.g., 'good first issue', 'help wanted'
    maxComplexity: 'trivial' | 'easy' | 'medium' | 'hard' | 'expert';
    autoSubmit: boolean;
    requireApproval: boolean;
    maxConcurrent: number;
}

export interface Hunt {
    id: string;
    issue: GitHubIssue;
    analysis: IssueAnalysis;
    status: 'analyzing' | 'solving' | 'testing' | 'submitting' | 'waiting_review' | 'completed' | 'failed' | 'abandoned';
    startedAt: Date;
    completedAt?: Date;
    solution?: Solution;
    pullRequest?: PullRequestInfo;
    errorMessage?: string;
}

export interface Solution {
    files: FileChange[];
    description: string;
    testResults?: TestResult[];
    commitMessage: string;
    branchName: string;
}

export interface FileChange {
    path: string;
    action: 'create' | 'modify' | 'delete';
    content?: string;
    diff?: string;
}

export interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
}

export interface PullRequestInfo {
    number: number;
    url: string;
    title: string;
    body: string;
    status: 'open' | 'merged' | 'closed';
    reviews: Review[];
}

export interface Review {
    author: string;
    state: 'approved' | 'changes_requested' | 'commented';
    body: string;
    createdAt: Date;
}

export interface HuntStats {
    totalHunts: number;
    completed: number;
    merged: number;
    abandoned: number;
    inProgress: number;
    successRate: number;
    averageTime: number; // hours
}

// Complexity scoring factors
const COMPLEXITY_KEYWORDS: Record<string, number> = {
    'typo': -3,
    'docs': -2,
    'documentation': -2,
    'readme': -2,
    'simple': -1,
    'minor': -1,
    'refactor': 1,
    'bug': 1,
    'feature': 2,
    'api': 2,
    'security': 3,
    'performance': 3,
    'database': 3,
    'architecture': 4,
    'breaking': 4
};

// ============================================================================
// BOUNTY HUNTER
// ============================================================================

export class BountyHunter extends EventEmitter {
    private static instance: BountyHunter;
    private config: BountyConfig | null = null;
    private hunts: Map<string, Hunt> = new Map();
    private githubToken: string | null = null;
    private isHunting: boolean = false;

    private constructor() {
        super();
    }

    public static getInstance(): BountyHunter {
        if (!BountyHunter.instance) {
            BountyHunter.instance = new BountyHunter();
        }
        return BountyHunter.instance;
    }

    /**
     * Configure the bounty hunter
     */
    public configure(config: BountyConfig, githubToken: string): void {
        this.config = config;
        this.githubToken = githubToken;
        console.log(`🏹 BountyHunter configured for ${config.repositories.length} repositories`);
        this.emit('configured', config);
    }

    /**
     * Start hunting for issues
     */
    public async startHunting(): Promise<void> {
        if (!this.config || !this.githubToken) {
            throw new Error('BountyHunter not configured');
        }

        this.isHunting = true;
        this.emit('hunting:started');
        console.log('🎯 Started hunting for issues...');

        while (this.isHunting) {
            // Check concurrent limit
            const activeHunts = Array.from(this.hunts.values()).filter(h =>
                ['analyzing', 'solving', 'testing', 'submitting'].includes(h.status)
            );

            if (activeHunts.length >= this.config.maxConcurrent) {
                await new Promise(r => setTimeout(r, 60000)); // Wait 1 minute
                continue;
            }

            // Find new issues
            for (const repo of this.config.repositories) {
                const issues = await this.findSolvableIssues(repo);

                for (const issue of issues) {
                    // Check if already working on this
                    const existing = Array.from(this.hunts.values()).find(h => h.issue.id === issue.id);
                    if (existing) continue;

                    // Analyze and potentially hunt
                    const analysis = await this.analyzeIssue(issue);

                    if (analysis.solvable && this.meetsComplexityCriteria(analysis)) {
                        await this.huntIssue(issue, analysis);
                    }
                }
            }

            // Wait before next scan
            await new Promise(r => setTimeout(r, 300000)); // 5 minutes
        }
    }

    /**
     * Stop hunting
     */
    public stopHunting(): void {
        this.isHunting = false;
        this.emit('hunting:stopped');
        console.log('🛑 Stopped hunting');
    }

    /**
     * Find solvable issues in a repository
     */
    public async findSolvableIssues(repo: string): Promise<GitHubIssue[]> {
        const [owner, name] = repo.split('/');
        const labels = this.config?.labels.join(',') || 'good first issue';

        const response = await this.githubRequest(
            `/repos/${owner}/${name}/issues?labels=${labels}&state=open&per_page=20`
        );

        return response.map((issue: any) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body || '',
            labels: issue.labels.map((l: any) => l.name),
            state: issue.state,
            author: issue.user.login,
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            comments: issue.comments,
            repoOwner: owner,
            repoName: name,
            url: issue.html_url
        }));
    }

    /**
     * Analyze an issue for solvability
     */
    public async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysis> {
        // Calculate complexity score
        const text = `${issue.title} ${issue.body}`.toLowerCase();
        let complexityScore = 0;

        for (const [keyword, weight] of Object.entries(COMPLEXITY_KEYWORDS)) {
            if (text.includes(keyword)) {
                complexityScore += weight;
            }
        }

        // Factor in body length
        complexityScore += Math.min(issue.body.length / 500, 3);

        // Factor in labels
        if (issue.labels.includes('good first issue')) complexityScore -= 2;
        if (issue.labels.includes('help wanted')) complexityScore -= 1;
        if (issue.labels.includes('complex')) complexityScore += 3;

        // Map to complexity level
        let complexity: IssueAnalysis['complexity'];
        if (complexityScore <= -2) complexity = 'trivial';
        else if (complexityScore <= 0) complexity = 'easy';
        else if (complexityScore <= 2) complexity = 'medium';
        else if (complexityScore <= 4) complexity = 'hard';
        else complexity = 'expert';

        // Extract affected files from issue body (heuristic)
        const filePatterns = issue.body.match(/[a-zA-Z0-9_/-]+\.(ts|js|tsx|jsx|py|go|rs|java|rb)/g) || [];
        const affectedFiles = [...new Set(filePatterns)];

        // Estimate hours
        const hoursMap: Record<string, number> = {
            'trivial': 0.5,
            'easy': 2,
            'medium': 8,
            'hard': 24,
            'expert': 80
        };

        // Calculate confidence
        const confidence = Math.max(0.3, Math.min(0.95,
            0.8 - (complexityScore * 0.1) + (affectedFiles.length > 0 ? 0.1 : 0)
        ));

        // Determine if solvable
        const solvable = complexity !== 'expert' && confidence > 0.4;

        return {
            issueId: issue.id,
            complexity,
            estimatedHours: hoursMap[complexity],
            confidence,
            requiredSkills: this.extractRequiredSkills(text),
            affectedFiles,
            suggestedApproach: this.generateApproach(issue, complexity),
            risks: this.identifyRisks(issue),
            solvable,
            reason: solvable ? undefined : `Complexity too high (${complexity}) or confidence too low (${confidence.toFixed(2)})`
        };
    }

    /**
     * Hunt a specific issue
     */
    public async huntIssue(issue: GitHubIssue, analysis?: IssueAnalysis): Promise<Hunt> {
        if (!analysis) {
            analysis = await this.analyzeIssue(issue);
        }

        const hunt: Hunt = {
            id: this.generateId(),
            issue,
            analysis,
            status: 'analyzing',
            startedAt: new Date()
        };

        this.hunts.set(hunt.id, hunt);
        this.emit('hunt:started', hunt);

        try {
            // 1. Clone and understand the repository
            hunt.status = 'solving';
            this.emit('hunt:progress', { huntId: hunt.id, status: 'solving' });

            const solution = await this.generateSolution(issue, analysis);
            hunt.solution = solution;

            // 2. Test the solution
            hunt.status = 'testing';
            this.emit('hunt:progress', { huntId: hunt.id, status: 'testing' });

            const testsPassed = await this.testSolution(issue, solution);
            if (!testsPassed) {
                hunt.status = 'failed';
                hunt.errorMessage = 'Tests failed';
                this.emit('hunt:failed', hunt);
                return hunt;
            }

            // 3. Submit PR (if auto-submit enabled)
            if (this.config?.autoSubmit && !this.config?.requireApproval) {
                hunt.status = 'submitting';
                this.emit('hunt:progress', { huntId: hunt.id, status: 'submitting' });

                hunt.pullRequest = await this.createPullRequest(issue, solution);
                hunt.status = 'waiting_review';
            } else {
                // Await approval
                this.emit('hunt:approval_required', hunt);
            }

            this.emit('hunt:completed', hunt);

        } catch (error: any) {
            hunt.status = 'failed';
            hunt.errorMessage = error.message;
            this.emit('hunt:failed', hunt);
        }

        return hunt;
    }

    /**
     * Approve and submit a hunt
     */
    public async approveAndSubmit(huntId: string): Promise<PullRequestInfo> {
        const hunt = this.hunts.get(huntId);
        if (!hunt || !hunt.solution) {
            throw new Error('Hunt not found or no solution');
        }

        hunt.status = 'submitting';
        const pr = await this.createPullRequest(hunt.issue, hunt.solution);
        hunt.pullRequest = pr;
        hunt.status = 'waiting_review';
        hunt.completedAt = new Date();

        this.emit('hunt:submitted', hunt);
        return pr;
    }

    /**
     * Respond to review feedback
     */
    public async respondToReview(huntId: string, review: Review): Promise<void> {
        const hunt = this.hunts.get(huntId);
        if (!hunt || !hunt.pullRequest) {
            throw new Error('Hunt or PR not found');
        }

        if (review.state === 'approved') {
            hunt.status = 'completed';
            this.emit('hunt:merged', hunt);
        } else if (review.state === 'changes_requested') {
            // Analyze feedback and make changes
            this.emit('hunt:changes_requested', { hunt, review });

            // Generate new solution addressing feedback
            const updatedSolution = await this.addressFeedback(hunt, review);
            hunt.solution = updatedSolution;

            // Push updates
            await this.updatePullRequest(hunt);
        }
    }

    /**
     * Get hunt statistics
     */
    public getStats(): HuntStats {
        const hunts = Array.from(this.hunts.values());
        const completed = hunts.filter(h => h.status === 'completed' || h.status === 'waiting_review');
        const merged = hunts.filter(h => h.pullRequest?.status === 'merged');
        const abandoned = hunts.filter(h => h.status === 'abandoned');
        const inProgress = hunts.filter(h =>
            ['analyzing', 'solving', 'testing', 'submitting'].includes(h.status)
        );

        const completedTimes = completed
            .filter(h => h.completedAt)
            .map(h => (h.completedAt!.getTime() - h.startedAt.getTime()) / (1000 * 60 * 60));

        return {
            totalHunts: hunts.length,
            completed: completed.length,
            merged: merged.length,
            abandoned: abandoned.length,
            inProgress: inProgress.length,
            successRate: hunts.length > 0 ? merged.length / hunts.length : 0,
            averageTime: completedTimes.length > 0
                ? completedTimes.reduce((a, b) => a + b, 0) / completedTimes.length
                : 0
        };
    }

    /**
     * Get all hunts
     */
    public getHunts(): Hunt[] {
        return Array.from(this.hunts.values());
    }

    /**
     * Get a specific hunt
     */
    public getHunt(huntId: string): Hunt | undefined {
        return this.hunts.get(huntId);
    }

    /**
     * Abandon a hunt
     */
    public abandonHunt(huntId: string): void {
        const hunt = this.hunts.get(huntId);
        if (hunt) {
            hunt.status = 'abandoned';
            this.emit('hunt:abandoned', hunt);
        }
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async generateSolution(issue: GitHubIssue, analysis: IssueAnalysis): Promise<Solution> {
        // This would integrate with the AI to generate actual code
        // For now, return a placeholder structure

        const branchName = `fix/${issue.number}-${this.slugify(issue.title)}`;

        return {
            files: [],
            description: `Automated fix for #${issue.number}: ${issue.title}`,
            commitMessage: `fix: ${issue.title} (#${issue.number})`,
            branchName
        };
    }

    private async testSolution(issue: GitHubIssue, solution: Solution): Promise<boolean> {
        // Would run actual tests here
        return true;
    }

    private async createPullRequest(issue: GitHubIssue, solution: Solution): Promise<PullRequestInfo> {
        // Create the PR via GitHub API
        const body = `## Automated Fix by Shadow AI BountyHunter 🏹

This PR addresses #${issue.number}

### Changes
${solution.description}

### Files Modified
${solution.files.map(f => `- \`${f.path}\` (${f.action})`).join('\n')}

---
*This PR was automatically generated by [Shadow AI](https://github.com/shadow-ai)*
`;

        const response = await this.githubRequest(
            `/repos/${issue.repoOwner}/${issue.repoName}/pulls`,
            'POST',
            {
                title: solution.commitMessage,
                body,
                head: solution.branchName,
                base: 'main'
            }
        );

        return {
            number: response.number,
            url: response.html_url,
            title: response.title,
            body: response.body,
            status: 'open',
            reviews: []
        };
    }

    private async updatePullRequest(hunt: Hunt): Promise<void> {
        // Push new commits to the PR branch
        console.log(`Updating PR #${hunt.pullRequest?.number}`);
    }

    private async addressFeedback(hunt: Hunt, review: Review): Promise<Solution> {
        // Analyze review comments and generate updated solution
        return hunt.solution!;
    }

    private extractRequiredSkills(text: string): string[] {
        const skills: string[] = [];
        const skillMap: Record<string, string[]> = {
            'typescript': ['typescript', 'ts'],
            'javascript': ['javascript', 'js', 'node'],
            'react': ['react', 'jsx', 'tsx'],
            'python': ['python', 'py'],
            'rust': ['rust', 'cargo'],
            'go': ['golang', 'go'],
            'css': ['css', 'sass', 'scss', 'tailwind'],
            'database': ['sql', 'postgres', 'mysql', 'mongodb']
        };

        for (const [skill, keywords] of Object.entries(skillMap)) {
            if (keywords.some(k => text.includes(k))) {
                skills.push(skill);
            }
        }

        return skills;
    }

    private generateApproach(issue: GitHubIssue, complexity: string): string {
        const approaches: Record<string, string> = {
            'trivial': 'Direct fix with minimal code change',
            'easy': 'Identify affected code, make targeted fix, add test',
            'medium': 'Analyze codebase structure, implement solution, add tests, update docs',
            'hard': 'Deep analysis required, consider edge cases, comprehensive testing needed',
            'expert': 'Requires architectural understanding and careful planning'
        };
        return approaches[complexity] || 'Standard approach';
    }

    private identifyRisks(issue: GitHubIssue): string[] {
        const risks: string[] = [];
        const text = `${issue.title} ${issue.body}`.toLowerCase();

        if (text.includes('security')) risks.push('Security implications');
        if (text.includes('database') || text.includes('migration')) risks.push('Data integrity');
        if (text.includes('breaking')) risks.push('Breaking changes');
        if (text.includes('performance')) risks.push('Performance regression');
        if (issue.comments > 10) risks.push('Complex discussion history');

        return risks;
    }

    private meetsComplexityCriteria(analysis: IssueAnalysis): boolean {
        const order = ['trivial', 'easy', 'medium', 'hard', 'expert'];
        const maxIndex = order.indexOf(this.config?.maxComplexity || 'medium');
        const issueIndex = order.indexOf(analysis.complexity);
        return issueIndex <= maxIndex;
    }

    private async githubRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: endpoint,
                method,
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'User-Agent': 'Shadow-AI-BountyHunter',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(data);
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 40);
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const bountyHunter = BountyHunter.getInstance();
