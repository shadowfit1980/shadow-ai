/**
 * Ticket Monitor
 * Autonomous task triggering from external ticket systems
 * Supports Jira, Linear, and GitHub Issues
 */

import { EventEmitter } from 'events';

export interface TicketConfig {
    provider: 'jira' | 'linear' | 'github';
    apiKey?: string;
    baseUrl?: string;
    projectKey?: string;
    pollInterval: number; // ms
    triggerLabels: string[];
    autoCreatePR: boolean;
}

export interface Ticket {
    id: string;
    key: string;
    title: string;
    description: string;
    type: 'bug' | 'feature' | 'task' | 'improvement';
    priority: 'low' | 'medium' | 'high' | 'critical';
    labels: string[];
    assignee?: string;
    reporter?: string;
    status: string;
    createdAt: number;
    url: string;
}

export interface TicketTask {
    ticketId: string;
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    result?: any;
    prUrl?: string;
}

/**
 * TicketMonitor
 * Polls ticket systems and triggers autonomous tasks
 */
export class TicketMonitor extends EventEmitter {
    private static instance: TicketMonitor;
    private configs: Map<string, TicketConfig> = new Map();
    private pollTimers: Map<string, NodeJS.Timeout> = new Map();
    private processedTickets: Set<string> = new Set();
    private activeTasks: Map<string, TicketTask> = new Map();
    private isRunning = false;

    private constructor() {
        super();
    }

    static getInstance(): TicketMonitor {
        if (!TicketMonitor.instance) {
            TicketMonitor.instance = new TicketMonitor();
        }
        return TicketMonitor.instance;
    }

    /**
     * Configure a ticket provider
     */
    configure(name: string, config: TicketConfig): void {
        this.configs.set(name, config);
        this.emit('configured', { name, provider: config.provider });
    }

    /**
     * Start monitoring all configured providers
     */
    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;

        for (const [name, config] of this.configs) {
            this.startPolling(name, config);
        }

        console.log('✅ TicketMonitor started');
        this.emit('started');
    }

    /**
     * Stop monitoring
     */
    stop(): void {
        this.isRunning = false;

        for (const timer of this.pollTimers.values()) {
            clearInterval(timer);
        }
        this.pollTimers.clear();

        console.log('⏹️ TicketMonitor stopped');
        this.emit('stopped');
    }

    /**
     * Get monitoring status
     */
    getStatus(): {
        isRunning: boolean;
        providers: string[];
        processedCount: number;
        activeTasks: number;
    } {
        return {
            isRunning: this.isRunning,
            providers: Array.from(this.configs.keys()),
            processedCount: this.processedTickets.size,
            activeTasks: this.activeTasks.size,
        };
    }

    /**
     * Get active tasks
     */
    getActiveTasks(): TicketTask[] {
        return Array.from(this.activeTasks.values());
    }

    /**
     * Manually trigger task from ticket
     */
    async triggerFromTicket(ticket: Ticket): Promise<TicketTask> {
        return this.processTicket(ticket, this.configs.values().next().value);
    }

    // Private methods

    private startPolling(name: string, config: TicketConfig): void {
        const poll = async () => {
            try {
                const tickets = await this.fetchTickets(config);

                for (const ticket of tickets) {
                    if (this.shouldProcess(ticket, config)) {
                        await this.processTicket(ticket, config);
                    }
                }
            } catch (error: any) {
                console.error(`[TicketMonitor] Poll error for ${name}:`, error.message);
                this.emit('error', { name, error: error.message });
            }
        };

        // Initial poll
        poll();

        // Set up interval
        const timer = setInterval(poll, config.pollInterval);
        this.pollTimers.set(name, timer);
    }

    private async fetchTickets(config: TicketConfig): Promise<Ticket[]> {
        switch (config.provider) {
            case 'jira':
                return this.fetchJiraTickets(config);
            case 'linear':
                return this.fetchLinearTickets(config);
            case 'github':
                return this.fetchGitHubIssues(config);
            default:
                return [];
        }
    }

    private async fetchJiraTickets(config: TicketConfig): Promise<Ticket[]> {
        if (!config.apiKey || !config.baseUrl) return [];

        try {
            // JQL query for tickets with trigger labels
            const jql = `project = ${config.projectKey} AND labels in (${config.triggerLabels.join(',')}) AND status = "To Do"`;

            const response = await fetch(
                `${config.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}`,
                {
                    headers: {
                        Authorization: `Basic ${config.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return (data.issues || []).map((issue: any) => this.mapJiraToTicket(issue, config));
        } catch (error) {
            console.error('[TicketMonitor] Jira fetch error:', error);
            return [];
        }
    }

    private async fetchLinearTickets(config: TicketConfig): Promise<Ticket[]> {
        if (!config.apiKey) return [];

        try {
            const query = `
        query {
          issues(filter: { labels: { name: { in: [${config.triggerLabels.map(l => `"${l}"`).join(',')}] } } }) {
            nodes {
              id
              identifier
              title
              description
              priority
              state { name }
              labels { nodes { name } }
              url
              createdAt
            }
          }
        }
      `;

            const response = await fetch('https://api.linear.app/graphql', {
                method: 'POST',
                headers: {
                    Authorization: config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) return [];

            const data = await response.json();
            return (data.data?.issues?.nodes || []).map((issue: any) => this.mapLinearToTicket(issue));
        } catch (error) {
            console.error('[TicketMonitor] Linear fetch error:', error);
            return [];
        }
    }

    private async fetchGitHubIssues(config: TicketConfig): Promise<Ticket[]> {
        if (!config.apiKey || !config.baseUrl) return [];

        try {
            const labels = config.triggerLabels.join(',');

            const response = await fetch(
                `https://api.github.com/repos/${config.baseUrl}/issues?labels=${labels}&state=open`,
                {
                    headers: {
                        Authorization: `Bearer ${config.apiKey}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            if (!response.ok) return [];

            const issues = await response.json();
            return issues.map((issue: any) => this.mapGitHubToTicket(issue));
        } catch (error) {
            console.error('[TicketMonitor] GitHub fetch error:', error);
            return [];
        }
    }

    private shouldProcess(ticket: Ticket, config: TicketConfig): boolean {
        // Skip already processed
        if (this.processedTickets.has(ticket.id)) return false;

        // Check labels match
        const hasMatchingLabel = config.triggerLabels.some(label =>
            ticket.labels.includes(label)
        );

        return hasMatchingLabel;
    }

    private async processTicket(ticket: Ticket, config: TicketConfig): Promise<TicketTask> {
        this.processedTickets.add(ticket.id);

        const task: TicketTask = {
            ticketId: ticket.id,
            taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            startTime: Date.now(),
        };

        this.activeTasks.set(task.taskId, task);
        this.emit('taskCreated', { ticket, task });

        try {
            task.status = 'processing';

            // Parse ticket into agentic task
            const agentTask = this.parseTicketToTask(ticket);

            // Emit for external processing
            this.emit('taskReady', { ticket, task, agentTask });

            // In production, this would trigger the AgentCoordinator
            console.log(`[TicketMonitor] Processing ticket: ${ticket.key} - ${ticket.title}`);

            // Simulate processing (in production, wait for agent completion)
            task.status = 'completed';
            task.endTime = Date.now();

            if (config.autoCreatePR) {
                // Would create PR here
                task.prUrl = `https://github.com/example/repo/pull/${Math.floor(Math.random() * 1000)}`;
            }

            this.emit('taskCompleted', { ticket, task });
        } catch (error: any) {
            task.status = 'failed';
            task.endTime = Date.now();
            task.result = { error: error.message };
            this.emit('taskFailed', { ticket, task, error: error.message });
        }

        return task;
    }

    private parseTicketToTask(ticket: Ticket): any {
        return {
            type: ticket.type === 'bug' ? 'bug_fix' : 'feature',
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            source: {
                type: 'ticket',
                id: ticket.id,
                key: ticket.key,
                url: ticket.url,
            },
            autoCommit: true,
            autoCreatePR: true,
        };
    }

    private mapJiraToTicket(issue: any, config: TicketConfig): Ticket {
        return {
            id: issue.id,
            key: issue.key,
            title: issue.fields.summary,
            description: issue.fields.description || '',
            type: this.mapJiraType(issue.fields.issuetype?.name),
            priority: this.mapJiraPriority(issue.fields.priority?.name),
            labels: issue.fields.labels || [],
            assignee: issue.fields.assignee?.displayName,
            reporter: issue.fields.reporter?.displayName,
            status: issue.fields.status?.name,
            createdAt: new Date(issue.fields.created).getTime(),
            url: `${config.baseUrl}/browse/${issue.key}`,
        };
    }

    private mapLinearToTicket(issue: any): Ticket {
        return {
            id: issue.id,
            key: issue.identifier,
            title: issue.title,
            description: issue.description || '',
            type: 'task',
            priority: this.mapLinearPriority(issue.priority),
            labels: issue.labels?.nodes?.map((l: any) => l.name) || [],
            status: issue.state?.name,
            createdAt: new Date(issue.createdAt).getTime(),
            url: issue.url,
        };
    }

    private mapGitHubToTicket(issue: any): Ticket {
        return {
            id: issue.id.toString(),
            key: `#${issue.number}`,
            title: issue.title,
            description: issue.body || '',
            type: issue.labels.some((l: any) => l.name === 'bug') ? 'bug' : 'feature',
            priority: 'medium',
            labels: issue.labels.map((l: any) => l.name),
            assignee: issue.assignee?.login,
            reporter: issue.user?.login,
            status: issue.state,
            createdAt: new Date(issue.created_at).getTime(),
            url: issue.html_url,
        };
    }

    private mapJiraType(type?: string): Ticket['type'] {
        switch (type?.toLowerCase()) {
            case 'bug': return 'bug';
            case 'story': case 'feature': return 'feature';
            case 'improvement': return 'improvement';
            default: return 'task';
        }
    }

    private mapJiraPriority(priority?: string): Ticket['priority'] {
        switch (priority?.toLowerCase()) {
            case 'highest': case 'blocker': return 'critical';
            case 'high': return 'high';
            case 'low': case 'lowest': return 'low';
            default: return 'medium';
        }
    }

    private mapLinearPriority(priority?: number): Ticket['priority'] {
        if (!priority) return 'medium';
        if (priority <= 1) return 'critical';
        if (priority === 2) return 'high';
        if (priority === 3) return 'medium';
        return 'low';
    }
}

// Singleton getter
export function getTicketMonitor(): TicketMonitor {
    return TicketMonitor.getInstance();
}
