/**
 * Notification Webhooks Service
 * 
 * Send notifications to external services (Slack, Discord, custom webhooks)
 */

import { EventEmitter } from 'events';

export interface WebhookConfig {
    id: string;
    name: string;
    type: 'slack' | 'discord' | 'teams' | 'custom';
    url: string;
    enabled: boolean;
    events: string[];
    headers?: Record<string, string>;
    template?: string;
}

export interface NotificationPayload {
    event: string;
    title: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    data?: Record<string, any>;
    timestamp: Date;
}

/**
 * NotificationWebhooks - External notification service
 */
export class NotificationWebhooks extends EventEmitter {
    private static instance: NotificationWebhooks;
    private webhooks: Map<string, WebhookConfig> = new Map();
    private history: Array<{ payload: NotificationPayload; webhookId: string; status: 'success' | 'failed'; timestamp: Date }> = [];

    private constructor() {
        super();
    }

    static getInstance(): NotificationWebhooks {
        if (!NotificationWebhooks.instance) {
            NotificationWebhooks.instance = new NotificationWebhooks();
        }
        return NotificationWebhooks.instance;
    }

    /**
     * Register a webhook
     */
    registerWebhook(config: Omit<WebhookConfig, 'id'>): WebhookConfig {
        const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const webhook: WebhookConfig = { ...config, id };
        this.webhooks.set(id, webhook);
        this.emit('webhook:registered', webhook);
        return webhook;
    }

    /**
     * Update a webhook
     */
    updateWebhook(id: string, updates: Partial<WebhookConfig>): WebhookConfig | null {
        const existing = this.webhooks.get(id);
        if (!existing) return null;

        const updated = { ...existing, ...updates, id };
        this.webhooks.set(id, updated);
        this.emit('webhook:updated', updated);
        return updated;
    }

    /**
     * Remove a webhook
     */
    removeWebhook(id: string): boolean {
        const result = this.webhooks.delete(id);
        if (result) {
            this.emit('webhook:removed', id);
        }
        return result;
    }

    /**
     * Get all webhooks
     */
    getWebhooks(): WebhookConfig[] {
        return Array.from(this.webhooks.values());
    }

    /**
     * Toggle webhook enabled state
     */
    toggleWebhook(id: string): boolean {
        const webhook = this.webhooks.get(id);
        if (!webhook) return false;

        webhook.enabled = !webhook.enabled;
        this.webhooks.set(id, webhook);
        return webhook.enabled;
    }

    /**
     * Send notification to all matching webhooks
     */
    async notify(payload: Omit<NotificationPayload, 'timestamp'>): Promise<{ sent: number; failed: number }> {
        const fullPayload: NotificationPayload = {
            ...payload,
            timestamp: new Date(),
        };

        const results = { sent: 0, failed: 0 };

        for (const webhook of this.webhooks.values()) {
            if (!webhook.enabled) continue;
            if (!webhook.events.includes(payload.event) && !webhook.events.includes('*')) continue;

            try {
                await this.sendToWebhook(webhook, fullPayload);
                results.sent++;
                this.history.push({
                    payload: fullPayload,
                    webhookId: webhook.id,
                    status: 'success',
                    timestamp: new Date(),
                });
            } catch (error) {
                results.failed++;
                this.history.push({
                    payload: fullPayload,
                    webhookId: webhook.id,
                    status: 'failed',
                    timestamp: new Date(),
                });
                console.error(`Webhook ${webhook.id} failed:`, error);
            }
        }

        this.emit('notification:sent', { payload: fullPayload, results });
        return results;
    }

    /**
     * Send to specific webhook
     */
    private async sendToWebhook(webhook: WebhookConfig, payload: NotificationPayload): Promise<void> {
        let body: string;
        let headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...webhook.headers,
        };

        switch (webhook.type) {
            case 'slack':
                body = this.formatSlackMessage(payload);
                break;
            case 'discord':
                body = this.formatDiscordMessage(payload);
                break;
            case 'teams':
                body = this.formatTeamsMessage(payload);
                break;
            case 'custom':
            default:
                body = JSON.stringify(this.applyTemplate(webhook.template, payload));
                break;
        }

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    /**
     * Format Slack message
     */
    private formatSlackMessage(payload: NotificationPayload): string {
        const colorMap = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
        };

        return JSON.stringify({
            attachments: [{
                color: colorMap[payload.level],
                title: payload.title,
                text: payload.message,
                fields: payload.data ? Object.entries(payload.data).map(([title, value]) => ({
                    title,
                    value: String(value),
                    short: true,
                })) : [],
                footer: 'Shadow AI',
                ts: Math.floor(payload.timestamp.getTime() / 1000),
            }],
        });
    }

    /**
     * Format Discord message
     */
    private formatDiscordMessage(payload: NotificationPayload): string {
        const colorMap = {
            info: 0x2196F3,
            success: 0x4CAF50,
            warning: 0xFF9800,
            error: 0xF44336,
        };

        return JSON.stringify({
            embeds: [{
                title: payload.title,
                description: payload.message,
                color: colorMap[payload.level],
                fields: payload.data ? Object.entries(payload.data).map(([name, value]) => ({
                    name,
                    value: String(value),
                    inline: true,
                })) : [],
                footer: { text: 'Shadow AI' },
                timestamp: payload.timestamp.toISOString(),
            }],
        });
    }

    /**
     * Format Microsoft Teams message
     */
    private formatTeamsMessage(payload: NotificationPayload): string {
        const colorMap = {
            info: '0078D7',
            success: '00A36C',
            warning: 'FFA500',
            error: 'FF0000',
        };

        return JSON.stringify({
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            themeColor: colorMap[payload.level],
            summary: payload.title,
            sections: [{
                activityTitle: payload.title,
                activitySubtitle: 'Shadow AI',
                facts: payload.data ? Object.entries(payload.data).map(([name, value]) => ({
                    name,
                    value: String(value),
                })) : [],
                text: payload.message,
            }],
        });
    }

    /**
     * Apply custom template
     */
    private applyTemplate(template: string | undefined, payload: NotificationPayload): Record<string, any> {
        if (!template) {
            return payload;
        }

        try {
            let result = template;
            result = result.replace(/\{\{event\}\}/g, payload.event);
            result = result.replace(/\{\{title\}\}/g, payload.title);
            result = result.replace(/\{\{message\}\}/g, payload.message);
            result = result.replace(/\{\{level\}\}/g, payload.level);
            result = result.replace(/\{\{timestamp\}\}/g, payload.timestamp.toISOString());

            if (payload.data) {
                for (const [key, value] of Object.entries(payload.data)) {
                    result = result.replace(new RegExp(`\\{\\{data\\.${key}\\}\\}`, 'g'), String(value));
                }
            }

            return JSON.parse(result);
        } catch {
            return payload;
        }
    }

    /**
     * Get notification history
     */
    getHistory(limit: number = 100): typeof this.history {
        return this.history.slice(-limit);
    }

    /**
     * Test a webhook
     */
    async testWebhook(id: string): Promise<boolean> {
        const webhook = this.webhooks.get(id);
        if (!webhook) return false;

        try {
            await this.sendToWebhook(webhook, {
                event: 'test',
                title: 'Test Notification',
                message: 'This is a test notification from Shadow AI',
                level: 'info',
                timestamp: new Date(),
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.history = [];
    }
}

export default NotificationWebhooks;
