/**
 * Jira Integration
 * Full Atlassian Jira API integration
 * Supports issue management, project tracking, and automation
 */

import { EventEmitter } from 'events';

export interface JiraConfig {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    summary: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    assignee?: string;
    reporter: string;
    labels: string[];
    components: string[];
    created: number;
    updated: number;
    url: string;
}

export interface JiraProject {
    id: string;
    key: string;
    name: string;
    issueTypes: string[];
}

export interface JiraTransition {
    id: string;
    name: string;
    to: { id: string; name: string };
}

/**
 * JiraIntegration
 * Full Jira API client
 */
export class JiraIntegration extends EventEmitter {
    private static instance: JiraIntegration;
    private config: JiraConfig | null = null;

    private constructor() {
        super();
    }

    static getInstance(): JiraIntegration {
        if (!JiraIntegration.instance) {
            JiraIntegration.instance = new JiraIntegration();
        }
        return JiraIntegration.instance;
    }

    /**
     * Configure Jira connection
     */
    configure(config: JiraConfig): void {
        this.config = config;
        this.emit('configured', { baseUrl: config.baseUrl, projectKey: config.projectKey });
    }

    /**
     * Test connection
     */
    async testConnection(): Promise<boolean> {
        if (!this.config) return false;

        try {
            const response = await this.request('GET', '/rest/api/3/myself');
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get issue by key
     */
    async getIssue(issueKey: string): Promise<JiraIssue | null> {
        if (!this.config) return null;

        try {
            const response = await this.request('GET', `/rest/api/3/issue/${issueKey}`);
            if (!response.ok) return null;

            const data = await response.json();
            return this.mapIssue(data);
        } catch (error) {
            console.error('[Jira] Get issue error:', error);
            return null;
        }
    }

    /**
     * Search issues with JQL
     */
    async searchIssues(jql: string, maxResults = 50): Promise<JiraIssue[]> {
        if (!this.config) return [];

        try {
            const response = await this.request('GET',
                `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`
            );
            if (!response.ok) return [];

            const data = await response.json();
            return (data.issues || []).map((issue: any) => this.mapIssue(issue));
        } catch (error) {
            console.error('[Jira] Search error:', error);
            return [];
        }
    }

    /**
     * Get issues by project
     */
    async getProjectIssues(status?: string): Promise<JiraIssue[]> {
        if (!this.config) return [];

        let jql = `project = ${this.config.projectKey}`;
        if (status) jql += ` AND status = "${status}"`;
        jql += ' ORDER BY created DESC';

        return this.searchIssues(jql);
    }

    /**
     * Create issue
     */
    async createIssue(options: {
        summary: string;
        description?: string;
        type?: string;
        priority?: string;
        labels?: string[];
        assignee?: string;
    }): Promise<JiraIssue | null> {
        if (!this.config) return null;

        const body = {
            fields: {
                project: { key: this.config.projectKey },
                summary: options.summary,
                description: options.description ? {
                    type: 'doc',
                    version: 1,
                    content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: options.description }],
                    }],
                } : undefined,
                issuetype: { name: options.type || 'Task' },
                priority: options.priority ? { name: options.priority } : undefined,
                labels: options.labels,
                assignee: options.assignee ? { accountId: options.assignee } : undefined,
            },
        };

        try {
            const response = await this.request('POST', '/rest/api/3/issue', body);
            if (!response.ok) return null;

            const data = await response.json();
            return this.getIssue(data.key);
        } catch (error) {
            console.error('[Jira] Create issue error:', error);
            return null;
        }
    }

    /**
     * Update issue
     */
    async updateIssue(issueKey: string, updates: {
        summary?: string;
        description?: string;
        labels?: string[];
    }): Promise<boolean> {
        if (!this.config) return false;

        const fields: any = {};
        if (updates.summary) fields.summary = updates.summary;
        if (updates.labels) fields.labels = updates.labels;
        if (updates.description) {
            fields.description = {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: updates.description }],
                }],
            };
        }

        try {
            const response = await this.request('PUT', `/rest/api/3/issue/${issueKey}`, { fields });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Add comment to issue
     */
    async addComment(issueKey: string, comment: string): Promise<boolean> {
        if (!this.config) return false;

        const body = {
            body: {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: comment }],
                }],
            },
        };

        try {
            const response = await this.request('POST', `/rest/api/3/issue/${issueKey}/comment`, body);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get available transitions for issue
     */
    async getTransitions(issueKey: string): Promise<JiraTransition[]> {
        if (!this.config) return [];

        try {
            const response = await this.request('GET', `/rest/api/3/issue/${issueKey}/transitions`);
            if (!response.ok) return [];

            const data = await response.json();
            return (data.transitions || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                to: { id: t.to.id, name: t.to.name },
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Transition issue to new status
     */
    async transitionIssue(issueKey: string, transitionId: string): Promise<boolean> {
        if (!this.config) return false;

        try {
            const response = await this.request('POST', `/rest/api/3/issue/${issueKey}/transitions`, {
                transition: { id: transitionId },
            });
            return response.ok || response.status === 204;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get project info
     */
    async getProject(): Promise<JiraProject | null> {
        if (!this.config) return null;

        try {
            const response = await this.request('GET', `/rest/api/3/project/${this.config.projectKey}`);
            if (!response.ok) return null;

            const data = await response.json();
            return {
                id: data.id,
                key: data.key,
                name: data.name,
                issueTypes: (data.issueTypes || []).map((t: any) => t.name),
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Link commit to issue
     */
    async linkCommit(issueKey: string, commitUrl: string, message: string): Promise<boolean> {
        return this.addComment(issueKey, `Commit: [${message}](${commitUrl})`);
    }

    /**
     * Link PR to issue
     */
    async linkPR(issueKey: string, prUrl: string, title: string): Promise<boolean> {
        return this.addComment(issueKey, `Pull Request: [${title}](${prUrl})`);
    }

    // Private methods

    private async request(method: string, path: string, body?: any): Promise<Response> {
        if (!this.config) throw new Error('Jira not configured');

        const auth = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');

        return fetch(`${this.config.baseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    private mapIssue(data: any): JiraIssue {
        const fields = data.fields || {};

        return {
            id: data.id,
            key: data.key,
            summary: fields.summary || '',
            description: this.extractDescription(fields.description),
            type: fields.issuetype?.name || 'Task',
            status: fields.status?.name || 'Open',
            priority: fields.priority?.name || 'Medium',
            assignee: fields.assignee?.displayName,
            reporter: fields.reporter?.displayName || 'Unknown',
            labels: fields.labels || [],
            components: (fields.components || []).map((c: any) => c.name),
            created: new Date(fields.created).getTime(),
            updated: new Date(fields.updated).getTime(),
            url: `${this.config?.baseUrl}/browse/${data.key}`,
        };
    }

    private extractDescription(description: any): string {
        if (!description) return '';
        if (typeof description === 'string') return description;

        // Handle Atlassian Document Format
        if (description.type === 'doc' && description.content) {
            return description.content
                .flatMap((block: any) =>
                    block.content?.map((node: any) => node.text) || []
                )
                .join('\n');
        }

        return '';
    }
}

// Singleton getter
export function getJiraIntegration(): JiraIntegration {
    return JiraIntegration.getInstance();
}
