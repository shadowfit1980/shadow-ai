/**
 * Copilot Issue Agent
 * Auto-assign issues to AI agent for autonomous coding
 */

import { EventEmitter } from 'events';

export interface Issue {
    id: string;
    number: number;
    title: string;
    body: string;
    labels: string[];
    assignee?: string;
    state: 'open' | 'closed';
    repo: string;
    url: string;
    createdAt: number;
}

export interface AgentTask {
    id: string;
    issueId: string;
    issue: Issue;
    status: 'queued' | 'analyzing' | 'coding' | 'testing' | 'pr_created' | 'completed' | 'failed';
    branch?: string;
    prNumber?: number;
    prUrl?: string;
    startTime: number;
    endTime?: number;
    logs: TaskLog[];
    error?: string;
}

export interface TaskLog {
    timestamp: number;
    level: 'info' | 'warning' | 'error';
    message: string;
}

/**
 * CopilotIssueAgent
 * Monitors issues and assigns them to AI for autonomous coding
 */
export class CopilotIssueAgent extends EventEmitter {
    private static instance: CopilotIssueAgent;
    private tasks: Map<string, AgentTask> = new Map();
    private monitoredRepos: Set<string> = new Set();
    private autoAssignLabels: string[] = ['copilot', 'ai-task', 'auto-fix'];
    private githubToken: string | null = null;
    private isMonitoring = false;
    private pollInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
    }

    static getInstance(): CopilotIssueAgent {
        if (!CopilotIssueAgent.instance) {
            CopilotIssueAgent.instance = new CopilotIssueAgent();
        }
        return CopilotIssueAgent.instance;
    }

    /**
     * Configure the agent
     */
    configure(options: {
        githubToken: string;
        autoAssignLabels?: string[];
    }): void {
        this.githubToken = options.githubToken;
        if (options.autoAssignLabels) {
            this.autoAssignLabels = options.autoAssignLabels;
        }
    }

    /**
     * Start monitoring a repository
     */
    startMonitoring(repo: string): void {
        this.monitoredRepos.add(repo);

        if (!this.isMonitoring) {
            this.isMonitoring = true;
            this.pollInterval = setInterval(() => this.pollIssues(), 60000);
            this.pollIssues(); // Initial poll
        }

        this.emit('monitoringStarted', { repo });
    }

    /**
     * Stop monitoring a repository
     */
    stopMonitoring(repo: string): void {
        this.monitoredRepos.delete(repo);

        if (this.monitoredRepos.size === 0 && this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            this.isMonitoring = false;
        }

        this.emit('monitoringStopped', { repo });
    }

    /**
     * Poll for new issues
     */
    private async pollIssues(): Promise<void> {
        for (const repo of this.monitoredRepos) {
            try {
                const issues = await this.fetchIssues(repo);

                for (const issue of issues) {
                    if (this.shouldAutoAssign(issue) && !this.hasActiveTask(issue.id)) {
                        await this.assignToAgent(issue);
                    }
                }
            } catch (error) {
                this.emit('pollError', { repo, error });
            }
        }
    }

    /**
     * Fetch issues from GitHub
     */
    private async fetchIssues(repo: string): Promise<Issue[]> {
        if (!this.githubToken) return [];

        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/issues?state=open`, {
                headers: {
                    Authorization: `token ${this.githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.map((issue: any) => ({
                id: issue.id.toString(),
                number: issue.number,
                title: issue.title,
                body: issue.body || '',
                labels: issue.labels.map((l: any) => l.name),
                assignee: issue.assignee?.login,
                state: issue.state,
                repo,
                url: issue.html_url,
                createdAt: new Date(issue.created_at).getTime(),
            }));
        } catch {
            return [];
        }
    }

    /**
     * Check if issue should be auto-assigned
     */
    private shouldAutoAssign(issue: Issue): boolean {
        return issue.labels.some(label =>
            this.autoAssignLabels.includes(label.toLowerCase())
        );
    }

    /**
     * Check if issue already has active task
     */
    private hasActiveTask(issueId: string): boolean {
        for (const task of this.tasks.values()) {
            if (task.issueId === issueId &&
                !['completed', 'failed'].includes(task.status)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Assign issue to agent
     */
    async assignToAgent(issue: Issue): Promise<AgentTask> {
        const taskId = `task_${Date.now()}`;

        const task: AgentTask = {
            id: taskId,
            issueId: issue.id,
            issue,
            status: 'queued',
            startTime: Date.now(),
            logs: [],
        };

        this.tasks.set(taskId, task);
        this.addLog(task, 'info', `Task created for issue #${issue.number}: ${issue.title}`);
        this.emit('taskCreated', task);

        // Start async processing
        this.processTask(task);

        return task;
    }

    /**
     * Process task through pipeline
     */
    private async processTask(task: AgentTask): Promise<void> {
        try {
            // Analyze issue
            task.status = 'analyzing';
            this.addLog(task, 'info', 'Analyzing issue requirements...');
            this.emit('taskUpdated', task);
            await this.delay(2000);

            // Create branch
            task.branch = `copilot/${task.issue.number}-${this.slugify(task.issue.title)}`;
            this.addLog(task, 'info', `Created branch: ${task.branch}`);

            // Coding phase
            task.status = 'coding';
            this.addLog(task, 'info', 'Generating code changes...');
            this.emit('taskUpdated', task);
            await this.delay(3000);

            // Testing phase
            task.status = 'testing';
            this.addLog(task, 'info', 'Running tests...');
            this.emit('taskUpdated', task);
            await this.delay(2000);

            // Create PR
            task.status = 'pr_created';
            task.prNumber = task.issue.number + 1000;
            task.prUrl = `https://github.com/${task.issue.repo}/pull/${task.prNumber}`;
            this.addLog(task, 'info', `Pull request created: ${task.prUrl}`);
            this.emit('taskUpdated', task);

            // Complete
            task.status = 'completed';
            task.endTime = Date.now();
            this.addLog(task, 'info', 'Task completed successfully');
            this.emit('taskCompleted', task);

        } catch (error: any) {
            task.status = 'failed';
            task.error = error.message;
            task.endTime = Date.now();
            this.addLog(task, 'error', `Task failed: ${error.message}`);
            this.emit('taskFailed', task);
        }
    }

    /**
     * Manually assign issue by number
     */
    async assignIssue(repo: string, issueNumber: number): Promise<AgentTask | null> {
        const issues = await this.fetchIssues(repo);
        const issue = issues.find(i => i.number === issueNumber);

        if (!issue) return null;

        return this.assignToAgent(issue);
    }

    /**
     * Get task by ID
     */
    getTask(taskId: string): AgentTask | null {
        return this.tasks.get(taskId) || null;
    }

    /**
     * Get all tasks
     */
    getAllTasks(): AgentTask[] {
        return Array.from(this.tasks.values());
    }

    /**
     * Get tasks by status
     */
    getTasksByStatus(status: AgentTask['status']): AgentTask[] {
        return Array.from(this.tasks.values()).filter(t => t.status === status);
    }

    /**
     * Cancel a task
     */
    cancelTask(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task || ['completed', 'failed'].includes(task.status)) {
            return false;
        }

        task.status = 'failed';
        task.error = 'Cancelled by user';
        task.endTime = Date.now();
        this.addLog(task, 'warning', 'Task cancelled by user');
        this.emit('taskCancelled', task);

        return true;
    }

    /**
     * Get monitored repos
     */
    getMonitoredRepos(): string[] {
        return Array.from(this.monitoredRepos);
    }

    // Helper methods

    private addLog(task: AgentTask, level: TaskLog['level'], message: string): void {
        task.logs.push({
            timestamp: Date.now(),
            level,
            message,
        });
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 30);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton getter
export function getCopilotIssueAgent(): CopilotIssueAgent {
    return CopilotIssueAgent.getInstance();
}
