/**
 * Slack Integration
 * Enables task triggering and notifications via Slack
 * Similar to Cursor's Slack integration for team workflows
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface SlackConfig {
    botToken: string;
    appToken?: string;
    signingSecret?: string;
    defaultChannel?: string;
    webhookUrl?: string;
}

export interface SlackMessage {
    channel: string;
    user: string;
    text: string;
    timestamp: string;
    threadTs?: string;
}

export interface TaskTrigger {
    description: string;
    source: 'slack';
    channel: string;
    user: string;
    messageTs: string;
}

export interface SlackNotification {
    channel: string;
    text: string;
    blocks?: any[];
    threadTs?: string;
}

/**
 * SlackIntegration
 * Connects Shadow AI with Slack for team collaboration
 */
export class SlackIntegration extends EventEmitter {
    private static instance: SlackIntegration;
    private store: Store;
    private config: SlackConfig | null = null;
    private isConnected = false;
    private messageHandlers: ((message: SlackMessage) => Promise<void>)[] = [];

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-slack' });
        this.loadConfig();
    }

    static getInstance(): SlackIntegration {
        if (!SlackIntegration.instance) {
            SlackIntegration.instance = new SlackIntegration();
        }
        return SlackIntegration.instance;
    }

    /**
     * Connect to Slack
     */
    async connect(config: SlackConfig): Promise<void> {
        this.config = config;
        this.saveConfig();

        if (!config.botToken) {
            throw new Error('Bot token is required');
        }

        // Validate token
        try {
            const response = await fetch('https://slack.com/api/auth.test', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.botToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.error || 'Failed to authenticate with Slack');
            }

            this.isConnected = true;
            this.emit('connected', { team: data.team, user: data.user });

            console.log(`✅ Connected to Slack workspace: ${data.team}`);
        } catch (error: any) {
            this.isConnected = false;
            throw new Error(`Slack connection failed: ${error.message}`);
        }
    }

    /**
     * Disconnect from Slack
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
     * Register message handler
     */
    onMessage(handler: (message: SlackMessage) => Promise<void>): void {
        this.messageHandlers.push(handler);
    }

    /**
     * Send a message to Slack
     */
    async sendMessage(channel: string, text: string, options?: { threadTs?: string }): Promise<string | null> {
        if (!this.isConnected || !this.config) {
            throw new Error('Not connected to Slack');
        }

        try {
            const response = await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.botToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channel,
                    text,
                    thread_ts: options?.threadTs,
                }),
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            return data.ts;
        } catch (error: any) {
            console.error('Failed to send Slack message:', error);
            return null;
        }
    }

    /**
     * Send rich notification with blocks
     */
    async sendNotification(notification: SlackNotification): Promise<string | null> {
        if (!this.isConnected || !this.config) {
            throw new Error('Not connected to Slack');
        }

        try {
            const response = await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.botToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channel: notification.channel,
                    text: notification.text,
                    blocks: notification.blocks,
                    thread_ts: notification.threadTs,
                }),
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.error || 'Failed to send notification');
            }

            return data.ts;
        } catch (error: any) {
            console.error('Failed to send Slack notification:', error);
            return null;
        }
    }

    /**
     * Post task result to Slack
     */
    async postTaskResult(channel: string, result: {
        taskId: string;
        description: string;
        status: 'completed' | 'failed';
        summary?: string;
        error?: string;
        duration?: number;
    }, threadTs?: string): Promise<string | null> {
        const emoji = result.status === 'completed' ? '✅' : '❌';
        const status = result.status === 'completed' ? 'Completed' : 'Failed';

        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Task ${status}`,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Task:*\n${result.description}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*ID:*\n\`${result.taskId}\``,
                    },
                ],
            },
        ];

        if (result.summary) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Summary:*\n${result.summary}`,
                },
            } as any);
        }

        if (result.error) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Error:*\n\`\`\`${result.error}\`\`\``,
                },
            } as any);
        }

        if (result.duration) {
            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `⏱️ Duration: ${Math.round(result.duration / 1000)}s`,
                    },
                ],
            } as any);
        }

        return this.sendNotification({
            channel,
            text: `${emoji} Task ${result.description} ${status.toLowerCase()}`,
            blocks,
            threadTs,
        });
    }

    /**
     * Parse command from message
     */
    parseCommand(text: string): { command: string; args: string } | null {
        // Expected format: /shadow <command> <args>
        const match = text.match(/^\/shadow\s+(\w+)\s*(.*)?$/i);

        if (!match) return null;

        return {
            command: match[1].toLowerCase(),
            args: (match[2] || '').trim(),
        };
    }

    /**
     * Send webhook notification
     */
    async sendWebhook(payload: any): Promise<boolean> {
        if (!this.config?.webhookUrl) {
            return false;
        }

        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.ok;
        } catch (error) {
            console.error('Webhook failed:', error);
            return false;
        }
    }

    /**
     * Get configuration (masked)
     */
    getConfig(): { connected: boolean; defaultChannel?: string; hasWebhook: boolean } {
        return {
            connected: this.isConnected,
            defaultChannel: this.config?.defaultChannel,
            hasWebhook: !!this.config?.webhookUrl,
        };
    }

    /**
     * Clear configuration
     */
    clearConfig(): void {
        this.config = null;
        this.isConnected = false;
        this.store.delete('slackConfig');
        this.emit('configCleared');
    }

    // Private methods

    private loadConfig(): void {
        const stored = this.store.get('slackConfig') as SlackConfig | undefined;
        if (stored) {
            this.config = stored;
        }
    }

    private saveConfig(): void {
        if (this.config) {
            this.store.set('slackConfig', this.config);
        }
    }
}

// Singleton getter
export function getSlackIntegration(): SlackIntegration {
    return SlackIntegration.getInstance();
}
