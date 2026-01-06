/**
 * Linear Integration
 * Connects Shadow AI with Linear for issue tracking
 * Similar to Cursor's Linear integration
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface LinearConfig {
    apiKey: string;
    teamId?: string;
    defaultProjectId?: string;
}

export interface LinearIssue {
    id: string;
    identifier: string;
    title: string;
    description?: string;
    state: { id: string; name: string; color: string };
    priority: number;
    priorityLabel: string;
    assignee?: { id: string; name: string };
    project?: { id: string; name: string };
    url: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIssueInput {
    title: string;
    description?: string;
    teamId: string;
    projectId?: string;
    priority?: number;
    stateId?: string;
    assigneeId?: string;
    labelIds?: string[];
}

export interface LinearTeam {
    id: string;
    name: string;
    key: string;
}

export interface LinearProject {
    id: string;
    name: string;
    state: string;
}

/**
 * LinearIntegration
 * Connects Shadow AI with Linear issue tracking
 */
export class LinearIntegration extends EventEmitter {
    private static instance: LinearIntegration;
    private store: Store;
    private config: LinearConfig | null = null;
    private isConnected = false;
    private readonly API_URL = 'https://api.linear.app/graphql';

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-linear' });
        this.loadConfig();
    }

    static getInstance(): LinearIntegration {
        if (!LinearIntegration.instance) {
            LinearIntegration.instance = new LinearIntegration();
        }
        return LinearIntegration.instance;
    }

    /**
     * Connect to Linear
     */
    async connect(apiKey: string): Promise<void> {
        // Validate the API key
        try {
            const response = await this.graphql(`
        query {
          viewer {
            id
            name
            email
          }
        }
      `, apiKey);

            if (response.errors) {
                throw new Error(response.errors[0]?.message || 'Invalid API key');
            }

            this.config = { apiKey };
            this.isConnected = true;
            this.saveConfig();

            this.emit('connected', response.data.viewer);
            console.log(`✅ Connected to Linear as: ${response.data.viewer.name}`);
        } catch (error: any) {
            this.isConnected = false;
            throw new Error(`Linear connection failed: ${error.message}`);
        }
    }

    /**
     * Disconnect from Linear
     */
    disconnect(): void {
        this.isConnected = false;
        this.emit('disconnected');
    }

    /**
     * Check connection status
     */
    isActive(): boolean {
        return this.isConnected && this.config !== null;
    }

    /**
     * Get teams
     */
    async getTeams(): Promise<LinearTeam[]> {
        const response = await this.query(`
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `);

        return response.data.teams.nodes;
    }

    /**
     * Get projects for a team
     */
    async getProjects(teamId: string): Promise<LinearProject[]> {
        const response = await this.query(`
      query($teamId: String!) {
        team(id: $teamId) {
          projects {
            nodes {
              id
              name
              state
            }
          }
        }
      }
    `, { teamId });

        return response.data.team.projects.nodes;
    }

    /**
     * Get issues
     */
    async getIssues(options?: {
        teamId?: string;
        projectId?: string;
        assigneeId?: string;
        first?: number;
    }): Promise<LinearIssue[]> {
        const filters: string[] = [];

        if (options?.teamId) {
            filters.push(`team: { id: { eq: "${options.teamId}" } }`);
        }
        if (options?.projectId) {
            filters.push(`project: { id: { eq: "${options.projectId}" } }`);
        }
        if (options?.assigneeId) {
            filters.push(`assignee: { id: { eq: "${options.assigneeId}" } }`);
        }

        const filterStr = filters.length > 0 ? `filter: { ${filters.join(', ')} }` : '';

        const response = await this.query(`
      query {
        issues(${filterStr} first: ${options?.first || 50}) {
          nodes {
            id
            identifier
            title
            description
            url
            priority
            priorityLabel
            createdAt
            updatedAt
            state {
              id
              name
              color
            }
            assignee {
              id
              name
            }
            project {
              id
              name
            }
          }
        }
      }
    `);

        return response.data.issues.nodes;
    }

    /**
     * Get a single issue
     */
    async getIssue(issueId: string): Promise<LinearIssue | null> {
        const response = await this.query(`
      query($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          url
          priority
          priorityLabel
          createdAt
          updatedAt
          state {
            id
            name
            color
          }
          assignee {
            id
            name
          }
          project {
            id
            name
          }
        }
      }
    `, { id: issueId });

        return response.data.issue;
    }

    /**
     * Create a new issue
     */
    async createIssue(input: CreateIssueInput): Promise<LinearIssue> {
        const response = await this.query(`
      mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
            state {
              id
              name
              color
            }
          }
        }
      }
    `, {
            input: {
                title: input.title,
                description: input.description,
                teamId: input.teamId,
                projectId: input.projectId,
                priority: input.priority,
                stateId: input.stateId,
                assigneeId: input.assigneeId,
                labelIds: input.labelIds,
            },
        });

        if (!response.data.issueCreate.success) {
            throw new Error('Failed to create issue');
        }

        this.emit('issueCreated', response.data.issueCreate.issue);
        return response.data.issueCreate.issue;
    }

    /**
     * Update issue status
     */
    async updateIssueStatus(issueId: string, stateId: string): Promise<void> {
        const response = await this.query(`
      mutation($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          success
        }
      }
    `, { id: issueId, stateId });

        if (!response.data.issueUpdate.success) {
            throw new Error('Failed to update issue status');
        }

        this.emit('issueUpdated', { issueId, stateId });
    }

    /**
     * Link commit to issue (via comment)
     */
    async linkCommit(issueId: string, commitHash: string, commitMessage: string): Promise<void> {
        const body = `🔗 Linked commit: \`${commitHash.substring(0, 7)}\`\n\n> ${commitMessage}`;

        await this.query(`
      mutation($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }
    `, { issueId, body });

        this.emit('commitLinked', { issueId, commitHash });
    }

    /**
     * Add comment to issue
     */
    async addComment(issueId: string, body: string): Promise<void> {
        const response = await this.query(`
      mutation($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }
    `, { issueId, body });

        if (!response.data.commentCreate.success) {
            throw new Error('Failed to add comment');
        }
    }

    /**
     * Get workflow states for a team
     */
    async getWorkflowStates(teamId: string): Promise<Array<{ id: string; name: string; color: string; type: string }>> {
        const response = await this.query(`
      query($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              color
              type
            }
          }
        }
      }
    `, { teamId });

        return response.data.team.states.nodes;
    }

    /**
     * Get configuration (masked)
     */
    getConfig(): { connected: boolean; teamId?: string; projectId?: string } {
        return {
            connected: this.isConnected,
            teamId: this.config?.teamId,
            projectId: this.config?.defaultProjectId,
        };
    }

    /**
     * Set default team and project
     */
    setDefaults(teamId: string, projectId?: string): void {
        if (this.config) {
            this.config.teamId = teamId;
            this.config.defaultProjectId = projectId;
            this.saveConfig();
        }
    }

    /**
     * Clear configuration
     */
    clearConfig(): void {
        this.config = null;
        this.isConnected = false;
        this.store.delete('linearConfig');
        this.emit('configCleared');
    }

    // Private methods

    private async query(query: string, variables?: Record<string, any>): Promise<any> {
        if (!this.config?.apiKey) {
            throw new Error('Not connected to Linear');
        }
        return this.graphql(query, this.config.apiKey, variables);
    }

    private async graphql(query: string, apiKey: string, variables?: Record<string, any>): Promise<any> {
        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            throw new Error(`Linear API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(data.errors[0]?.message || 'GraphQL error');
        }

        return data;
    }

    private loadConfig(): void {
        const stored = this.store.get('linearConfig') as LinearConfig | undefined;
        if (stored) {
            this.config = stored;
        }
    }

    private saveConfig(): void {
        if (this.config) {
            this.store.set('linearConfig', this.config);
        }
    }
}

// Singleton getter
export function getLinearIntegration(): LinearIntegration {
    return LinearIntegration.getInstance();
}
