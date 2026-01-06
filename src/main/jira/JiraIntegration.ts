/**
 * Jira Integration
 * Connect to Jira for issue tracking
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
    description?: string;
    status: string;
    assignee?: string;
    priority: string;
    type: string;
    labels: string[];
    created: string;
    updated: string;
}

export class JiraIntegration extends EventEmitter {
    private static instance: JiraIntegration;
    private config: JiraConfig | null = null;
    private cache: Map<string, JiraIssue> = new Map();

    private constructor() { super(); }

    static getInstance(): JiraIntegration {
        if (!JiraIntegration.instance) JiraIntegration.instance = new JiraIntegration();
        return JiraIntegration.instance;
    }

    configure(config: JiraConfig): void {
        this.config = config;
        this.emit('configured', { baseUrl: config.baseUrl });
    }

    private async request(endpoint: string, method = 'GET', body?: any): Promise<any> {
        if (!this.config) throw new Error('Jira not configured');

        const auth = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
        const res = await fetch(`${this.config.baseUrl}/rest/api/3/${endpoint}`, {
            method,
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) throw new Error(`Jira API error: ${res.status}`);
        return res.json();
    }

    async getIssue(key: string): Promise<JiraIssue> {
        const data = await this.request(`issue/${key}`);
        const issue: JiraIssue = {
            id: data.id, key: data.key, summary: data.fields.summary,
            description: data.fields.description?.content?.[0]?.content?.[0]?.text,
            status: data.fields.status.name, assignee: data.fields.assignee?.displayName,
            priority: data.fields.priority?.name || 'Medium', type: data.fields.issuetype.name,
            labels: data.fields.labels || [], created: data.fields.created, updated: data.fields.updated,
        };
        this.cache.set(key, issue);
        return issue;
    }

    async createIssue(summary: string, description: string, type = 'Task'): Promise<JiraIssue> {
        if (!this.config) throw new Error('Jira not configured');

        const data = await this.request('issue', 'POST', {
            fields: {
                project: { key: this.config.projectKey },
                summary, description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }] },
                issuetype: { name: type },
            },
        });

        this.emit('issueCreated', data);
        return this.getIssue(data.key);
    }

    async updateStatus(key: string, transitionName: string): Promise<boolean> {
        const transitions = await this.request(`issue/${key}/transitions`);
        const transition = transitions.transitions.find((t: any) => t.name.toLowerCase() === transitionName.toLowerCase());
        if (!transition) return false;

        await this.request(`issue/${key}/transitions`, 'POST', { transition: { id: transition.id } });
        this.emit('statusUpdated', { key, status: transitionName });
        return true;
    }

    async addComment(key: string, comment: string): Promise<void> {
        await this.request(`issue/${key}/comment`, 'POST', {
            body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }] },
        });
        this.emit('commentAdded', { key, comment });
    }

    async searchIssues(jql: string): Promise<JiraIssue[]> {
        const data = await this.request(`search?jql=${encodeURIComponent(jql)}`);
        return data.issues.map((i: any) => ({
            id: i.id, key: i.key, summary: i.fields.summary, status: i.fields.status.name,
            priority: i.fields.priority?.name, type: i.fields.issuetype.name, labels: i.fields.labels,
            created: i.fields.created, updated: i.fields.updated,
        }));
    }

    async getProjectIssues(): Promise<JiraIssue[]> {
        if (!this.config) throw new Error('Jira not configured');
        return this.searchIssues(`project = ${this.config.projectKey} ORDER BY updated DESC`);
    }

    isConfigured(): boolean { return !!this.config; }
    getCached(): JiraIssue[] { return Array.from(this.cache.values()); }
}

export function getJiraIntegration(): JiraIntegration { return JiraIntegration.getInstance(); }
