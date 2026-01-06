/**
 * GitHub Actions Integration
 * CI/CD pipeline integration for automated workflows
 */

import { EventEmitter } from 'events';

export interface GitHubActionsConfig {
    token: string;
    owner: string;
    repo: string;
}

export interface WorkflowRun {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out';
    branch: string;
    commitSha: string;
    startedAt: number;
    completedAt?: number;
    url: string;
}

export interface WorkflowTemplate {
    name: string;
    type: 'ci' | 'cd' | 'test' | 'lint' | 'deploy' | 'custom';
    content: string;
}

/**
 * GitHubActionsManager
 * Manages GitHub Actions workflows and triggers
 */
export class GitHubActionsManager extends EventEmitter {
    private static instance: GitHubActionsManager;
    private config: GitHubActionsConfig | null = null;

    private constructor() {
        super();
    }

    static getInstance(): GitHubActionsManager {
        if (!GitHubActionsManager.instance) {
            GitHubActionsManager.instance = new GitHubActionsManager();
        }
        return GitHubActionsManager.instance;
    }

    /**
     * Configure GitHub Actions
     */
    configure(config: GitHubActionsConfig): void {
        this.config = config;
        this.emit('configured', { owner: config.owner, repo: config.repo });
    }

    /**
     * Trigger a workflow
     */
    async triggerWorkflow(workflowId: string, ref = 'main', inputs?: Record<string, string>): Promise<boolean> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/workflows/${workflowId}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ref, inputs: inputs || {} }),
                }
            );

            if (response.ok || response.status === 204) {
                this.emit('workflowTriggered', { workflowId, ref, inputs });
                return true;
            }

            console.error('[GitHubActions] Trigger failed:', response.status);
            return false;
        } catch (error: any) {
            console.error('[GitHubActions] Trigger error:', error.message);
            return false;
        }
    }

    /**
     * Get workflow runs
     */
    async getWorkflowRuns(workflowId?: string, status?: string, limit = 20): Promise<WorkflowRun[]> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        let url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/runs?per_page=${limit}`;
        if (workflowId) url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/workflows/${workflowId}/runs?per_page=${limit}`;
        if (status) url += `&status=${status}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.config.token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) return [];

            const data = await response.json();
            return (data.workflow_runs || []).map((run: any) => this.mapWorkflowRun(run));
        } catch (error: any) {
            console.error('[GitHubActions] Fetch error:', error.message);
            return [];
        }
    }

    /**
     * Get latest run status
     */
    async getLatestRunStatus(workflowId: string): Promise<WorkflowRun | null> {
        const runs = await this.getWorkflowRuns(workflowId, undefined, 1);
        return runs[0] || null;
    }

    /**
     * Cancel a workflow run
     */
    async cancelRun(runId: number): Promise<boolean> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}/cancel`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            return response.ok || response.status === 202;
        } catch (error) {
            return false;
        }
    }

    /**
     * Re-run a failed workflow
     */
    async rerunWorkflow(runId: number): Promise<boolean> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}/rerun`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            return response.ok || response.status === 201;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get workflow logs
     */
    async getRunLogs(runId: number): Promise<string> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}/logs`,
                {
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            if (!response.ok) return '';

            // GitHub returns a redirect to the logs zip file
            return `Logs available at: ${response.url}`;
        } catch (error) {
            return '';
        }
    }

    /**
     * List available workflows
     */
    async listWorkflows(): Promise<Array<{ id: number; name: string; path: string; state: string }>> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/actions/workflows`,
                {
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return (data.workflows || []).map((w: any) => ({
                id: w.id,
                name: w.name,
                path: w.path,
                state: w.state,
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Generate workflow template
     */
    generateWorkflow(template: WorkflowTemplate['type'], options?: {
        nodeVersion?: string;
        pythonVersion?: string;
        branches?: string[];
        onPush?: boolean;
        onPR?: boolean;
    }): string {
        const branches = options?.branches || ['main'];
        const triggers = [];

        if (options?.onPush !== false) {
            triggers.push(`push:\n    branches: [${branches.join(', ')}]`);
        }
        if (options?.onPR !== false) {
            triggers.push(`pull_request:\n    branches: [${branches.join(', ')}]`);
        }

        const nodeVersion = options?.nodeVersion || '18';

        switch (template) {
            case 'ci':
                return `name: CI
on:
  ${triggers.join('\n  ')}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm test
`;

            case 'test':
                return `name: Tests
on:
  ${triggers.join('\n  ')}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
`;

            case 'lint':
                return `name: Lint
on:
  ${triggers.join('\n  ')}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
`;

            case 'deploy':
                return `name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      # Add deployment steps here
`;

            default:
                return `name: Custom Workflow
on:
  workflow_dispatch:

jobs:
  custom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Custom workflow"
`;
        }
    }

    /**
     * Create/update workflow file
     */
    async createWorkflowFile(name: string, content: string): Promise<boolean> {
        if (!this.config) throw new Error('GitHub Actions not configured');

        const path = `.github/workflows/${name}.yml`;
        const encodedContent = Buffer.from(content).toString('base64');

        try {
            // Check if file exists
            const checkResponse = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            let sha: string | undefined;
            if (checkResponse.ok) {
                const existing = await checkResponse.json();
                sha = existing.sha;
            }

            // Create/update file
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${this.config.token}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: sha ? `Update ${name} workflow` : `Add ${name} workflow`,
                        content: encodedContent,
                        sha,
                    }),
                }
            );

            return response.ok || response.status === 201;
        } catch (error) {
            return false;
        }
    }

    // Private methods

    private mapWorkflowRun(run: any): WorkflowRun {
        return {
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            branch: run.head_branch,
            commitSha: run.head_sha,
            startedAt: new Date(run.created_at).getTime(),
            completedAt: run.updated_at ? new Date(run.updated_at).getTime() : undefined,
            url: run.html_url,
        };
    }
}

// Singleton getter
export function getGitHubActionsManager(): GitHubActionsManager {
    return GitHubActionsManager.getInstance();
}
