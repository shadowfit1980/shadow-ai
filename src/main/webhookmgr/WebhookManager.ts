/**
 * Webhook Manager - Event webhooks
 */
import { EventEmitter } from 'events';

export interface Webhook { id: string; url: string; events: string[]; secret: string; enabled: boolean; lastTriggered?: number; failCount: number; }

export class WebhookManager extends EventEmitter {
    private static instance: WebhookManager;
    private webhooks: Map<string, Webhook> = new Map();
    private constructor() { super(); }
    static getInstance(): WebhookManager { if (!WebhookManager.instance) WebhookManager.instance = new WebhookManager(); return WebhookManager.instance; }

    register(url: string, events: string[]): Webhook { const webhook: Webhook = { id: `wh_${Date.now()}`, url, events, secret: `whsec_${Math.random().toString(36).slice(2)}`, enabled: true, failCount: 0 }; this.webhooks.set(webhook.id, webhook); return webhook; }

    async trigger(event: string, payload: Record<string, unknown>): Promise<{ webhookId: string; success: boolean }[]> {
        const results: { webhookId: string; success: boolean }[] = [];
        for (const wh of this.webhooks.values()) { if (wh.enabled && wh.events.includes(event)) { wh.lastTriggered = Date.now(); results.push({ webhookId: wh.id, success: true }); this.emit('triggered', { webhookId: wh.id, event }); } }
        return results;
    }

    toggle(webhookId: string): boolean { const wh = this.webhooks.get(webhookId); if (!wh) return false; wh.enabled = !wh.enabled; return true; }
    delete(webhookId: string): boolean { return this.webhooks.delete(webhookId); }
    getAll(): Webhook[] { return Array.from(this.webhooks.values()); }
}
export function getWebhookManager(): WebhookManager { return WebhookManager.getInstance(); }
