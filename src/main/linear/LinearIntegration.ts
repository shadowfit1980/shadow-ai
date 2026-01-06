/**
 * Linear Integration
 * Connect to Linear for issue tracking
 */

import { EventEmitter } from 'events';

export interface LinearConfig {
    apiKey: string;
    teamId?: string;
}

export interface LinearIssue {
    id: string;
    identifier: string;
    title: string;
    description?: string;
    state: string;
    priority: number;
    assignee?: string;
    labels: string[];
    createdAt: string;
    updatedAt: string;
}

export class LinearIntegration extends EventEmitter {
    private static instance: LinearIntegration;
    private config: LinearConfig | null = null;
    private cache: Map<string, LinearIssue> = new Map();

    private constructor() { super(); }

    static getInstance(): LinearIntegration {
        if (!LinearIntegration.instance) LinearIntegration.instance = new LinearIntegration();
        return LinearIntegration.instance;
    }

    configure(config: LinearConfig): void {
        this.config = config;
        this.emit('configured');
    }

    private async graphql(query: string, variables?: Record<string, any>): Promise<any> {
        if (!this.config) throw new Error('Linear not configured');

        const res = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: { 'Authorization': this.config.apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });

        const data = await res.json();
        if (data.errors) throw new Error(data.errors[0].message);
        return data.data;
    }

    async getIssue(id: string): Promise<LinearIssue> {
        const data = await this.graphql(`query { issue(id: "${id}") { id identifier title description state { name } priority assignee { name } labels { nodes { name } } createdAt updatedAt } }`);
        const i = data.issue;
        const issue: LinearIssue = {
            id: i.id, identifier: i.identifier, title: i.title, description: i.description,
            state: i.state.name, priority: i.priority, assignee: i.assignee?.name,
            labels: i.labels.nodes.map((l: any) => l.name), createdAt: i.createdAt, updatedAt: i.updatedAt,
        };
        this.cache.set(id, issue);
        return issue;
    }

    async createIssue(title: string, description?: string): Promise<LinearIssue> {
        const teamId = this.config?.teamId;
        if (!teamId) throw new Error('Team ID required');

        const data = await this.graphql(
            `mutation ($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier } } }`,
            { input: { teamId, title, description } }
        );

        this.emit('issueCreated', data.issueCreate.issue);
        return this.getIssue(data.issueCreate.issue.id);
    }

    async updateState(id: string, stateName: string): Promise<boolean> {
        // Get state ID
        const states = await this.graphql(`query { workflowStates { nodes { id name } } }`);
        const state = states.workflowStates.nodes.find((s: any) => s.name.toLowerCase() === stateName.toLowerCase());
        if (!state) return false;

        await this.graphql(`mutation { issueUpdate(id: "${id}", input: { stateId: "${state.id}" }) { success } }`);
        this.emit('stateUpdated', { id, state: stateName });
        return true;
    }

    async addComment(id: string, body: string): Promise<void> {
        await this.graphql(`mutation { commentCreate(input: { issueId: "${id}", body: "${body}" }) { success } }`);
        this.emit('commentAdded', { id, body });
    }

    async getTeamIssues(limit = 50): Promise<LinearIssue[]> {
        const data = await this.graphql(`query { issues(first: ${limit}) { nodes { id identifier title state { name } priority createdAt updatedAt } } }`);
        return data.issues.nodes.map((i: any) => ({
            id: i.id, identifier: i.identifier, title: i.title, state: i.state.name,
            priority: i.priority, labels: [], createdAt: i.createdAt, updatedAt: i.updatedAt,
        }));
    }

    isConfigured(): boolean { return !!this.config; }
    getCached(): LinearIssue[] { return Array.from(this.cache.values()); }
}

export function getLinearIntegration(): LinearIntegration { return LinearIntegration.getInstance(); }
