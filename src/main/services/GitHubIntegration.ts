/**
 * GitHubIntegration - GitHub API Integration
 * 
 * Provides GitHub operations for:
 * - Creating branches and commits
 * - Creating draft pull requests
 * - Managing issues and labels
 * - Repository analysis
 */

import { EventEmitter } from 'events';

export interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
    baseUrl?: string;  // For enterprise
}

export interface PRCreateParams {
    title: string;
    body: string;
    head: string;  // source branch
    base: string;  // target branch (usually main)
    draft?: boolean;
    labels?: string[];
    reviewers?: string[];
}

export interface PRResult {
    number: number;
    title: string;
    url: string;
    htmlUrl: string;
    state: 'open' | 'closed' | 'merged';
    created: string;
}

export interface CommitParams {
    message: string;
    files: Array<{
        path: string;
        content: string;
        mode?: '100644' | '100755' | '040000' | '160000' | '120000';
    }>;
    branch: string;
    parentSha?: string;
}

export interface BranchInfo {
    name: string;
    sha: string;
    protected: boolean;
}

export class GitHubIntegration extends EventEmitter {
    private static instance: GitHubIntegration;
    private config: GitHubConfig | null = null;
    private baseUrl: string = 'https://api.github.com';

    private constructor() {
        super();
    }

    static getInstance(): GitHubIntegration {
        if (!GitHubIntegration.instance) {
            GitHubIntegration.instance = new GitHubIntegration();
        }
        return GitHubIntegration.instance;
    }

    /**
     * Configure GitHub connection
     */
    configure(config: GitHubConfig): void {
        this.config = config;
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
        console.log(`[GitHub] Configured for ${config.owner}/${config.repo}`);
    }

    /**
     * Check if configured
     */
    isConfigured(): boolean {
        return this.config !== null && !!this.config.token;
    }

    /**
     * Make authenticated API request
     */
    private async apiRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        if (!this.config) {
            throw new Error('GitHub not configured. Call configure() first.');
        }

        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${error}`);
        }

        return response.json() as T;
    }

    // ========================================================================
    // BRANCHES
    // ========================================================================

    /**
     * List branches
     */
    async listBranches(): Promise<BranchInfo[]> {
        const branches = await this.apiRequest<any[]>(
            `/repos/${this.config!.owner}/${this.config!.repo}/branches`
        );

        return branches.map(b => ({
            name: b.name,
            sha: b.commit.sha,
            protected: b.protected
        }));
    }

    /**
     * Create a new branch
     */
    async createBranch(name: string, fromBranch: string = 'main'): Promise<BranchInfo> {
        // Get the SHA of the source branch
        const sourceBranch = await this.apiRequest<any>(
            `/repos/${this.config!.owner}/${this.config!.repo}/git/ref/heads/${fromBranch}`
        );

        const sha = sourceBranch.object.sha;

        // Create new branch
        const ref = await this.apiRequest<any>(
            `/repos/${this.config!.owner}/${this.config!.repo}/git/refs`,
            'POST',
            {
                ref: `refs/heads/${name}`,
                sha
            }
        );

        console.log(`[GitHub] Created branch: ${name}`);

        return {
            name,
            sha: ref.object.sha,
            protected: false
        };
    }

    /**
     * Delete a branch
     */
    async deleteBranch(name: string): Promise<void> {
        await this.apiRequest<void>(
            `/repos/${this.config!.owner}/${this.config!.repo}/git/refs/heads/${name}`,
            'DELETE'
        );
        console.log(`[GitHub] Deleted branch: ${name}`);
    }

    // ========================================================================
    // COMMITS
    // ========================================================================

    /**
     * Create a commit with multiple files
     */
    async createCommit(params: CommitParams): Promise<string> {
        const { owner, repo } = this.config!;

        // 1. Get the current commit SHA of the branch
        const branchRef = await this.apiRequest<any>(
            `/repos/${owner}/${repo}/git/ref/heads/${params.branch}`
        );
        const currentCommitSha = branchRef.object.sha;

        // 2. Get the tree SHA of the current commit
        const commit = await this.apiRequest<any>(
            `/repos/${owner}/${repo}/git/commits/${currentCommitSha}`
        );
        const baseTreeSha = commit.tree.sha;

        // 3. Create blobs for each file
        const treeItems = await Promise.all(
            params.files.map(async (file) => {
                const blob = await this.apiRequest<any>(
                    `/repos/${owner}/${repo}/git/blobs`,
                    'POST',
                    {
                        content: Buffer.from(file.content).toString('base64'),
                        encoding: 'base64'
                    }
                );
                return {
                    path: file.path,
                    mode: file.mode || '100644',
                    type: 'blob',
                    sha: blob.sha
                };
            })
        );

        // 4. Create a new tree
        const tree = await this.apiRequest<any>(
            `/repos/${owner}/${repo}/git/trees`,
            'POST',
            {
                base_tree: baseTreeSha,
                tree: treeItems
            }
        );

        // 5. Create the commit
        const newCommit = await this.apiRequest<any>(
            `/repos/${owner}/${repo}/git/commits`,
            'POST',
            {
                message: params.message,
                tree: tree.sha,
                parents: [currentCommitSha]
            }
        );

        // 6. Update the branch reference
        await this.apiRequest<any>(
            `/repos/${owner}/${repo}/git/refs/heads/${params.branch}`,
            'PATCH',
            {
                sha: newCommit.sha,
                force: false
            }
        );

        console.log(`[GitHub] Created commit: ${newCommit.sha.substring(0, 7)}`);
        return newCommit.sha;
    }

    // ========================================================================
    // PULL REQUESTS
    // ========================================================================

    /**
     * Create a pull request
     */
    async createPR(params: PRCreateParams): Promise<PRResult> {
        const { owner, repo } = this.config!;

        const pr = await this.apiRequest<any>(
            `/repos/${owner}/${repo}/pulls`,
            'POST',
            {
                title: params.title,
                body: params.body,
                head: params.head,
                base: params.base,
                draft: params.draft ?? true
            }
        );

        // Add labels if specified
        if (params.labels && params.labels.length > 0) {
            await this.apiRequest<any>(
                `/repos/${owner}/${repo}/issues/${pr.number}/labels`,
                'POST',
                { labels: params.labels }
            );
        }

        // Request reviewers if specified
        if (params.reviewers && params.reviewers.length > 0) {
            try {
                await this.apiRequest<any>(
                    `/repos/${owner}/${repo}/pulls/${pr.number}/requested_reviewers`,
                    'POST',
                    { reviewers: params.reviewers }
                );
            } catch (e) {
                console.warn('[GitHub] Failed to add reviewers:', e);
            }
        }

        console.log(`[GitHub] Created PR #${pr.number}: ${params.title}`);
        this.emit('pr:created', pr);

        return {
            number: pr.number,
            title: pr.title,
            url: pr.url,
            htmlUrl: pr.html_url,
            state: pr.state,
            created: pr.created_at
        };
    }

    /**
     * List open pull requests
     */
    async listPRs(state: 'open' | 'closed' | 'all' = 'open'): Promise<PRResult[]> {
        const prs = await this.apiRequest<any[]>(
            `/repos/${this.config!.owner}/${this.config!.repo}/pulls?state=${state}`
        );

        return prs.map(pr => ({
            number: pr.number,
            title: pr.title,
            url: pr.url,
            htmlUrl: pr.html_url,
            state: pr.state,
            created: pr.created_at
        }));
    }

    /**
     * Get PR details
     */
    async getPR(prNumber: number): Promise<PRResult & { body: string; mergeable: boolean }> {
        const pr = await this.apiRequest<any>(
            `/repos/${this.config!.owner}/${this.config!.repo}/pulls/${prNumber}`
        );

        return {
            number: pr.number,
            title: pr.title,
            url: pr.url,
            htmlUrl: pr.html_url,
            state: pr.merged ? 'merged' : pr.state,
            created: pr.created_at,
            body: pr.body,
            mergeable: pr.mergeable
        };
    }

    // ========================================================================
    // REPOSITORY
    // ========================================================================

    /**
     * Get repository info
     */
    async getRepoInfo(): Promise<{
        name: string;
        fullName: string;
        description: string;
        defaultBranch: string;
        private: boolean;
        stars: number;
        forks: number;
    }> {
        const repo = await this.apiRequest<any>(
            `/repos/${this.config!.owner}/${this.config!.repo}`
        );

        return {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || '',
            defaultBranch: repo.default_branch,
            private: repo.private,
            stars: repo.stargazers_count,
            forks: repo.forks_count
        };
    }

    /**
     * Get file content
     */
    async getFileContent(path: string, branch?: string): Promise<string> {
        let endpoint = `/repos/${this.config!.owner}/${this.config!.repo}/contents/${path}`;
        if (branch) {
            endpoint += `?ref=${branch}`;
        }

        const file = await this.apiRequest<any>(endpoint);

        if (file.type !== 'file') {
            throw new Error(`${path} is not a file`);
        }

        return Buffer.from(file.content, 'base64').toString('utf-8');
    }
}

export const githubIntegration = GitHubIntegration.getInstance();
