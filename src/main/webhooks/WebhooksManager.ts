/**
 * Webhooks Manager - Manage webhooks
 */
import { EventEmitter } from 'events';

export interface Webhook { id: string; name: string; url: string; events: string[]; secret?: string; enabled: boolean; createdAt: number; }

export class WebhooksManager extends EventEmitter {
    private static instance: WebhooksManager;
    private webhooks: Map<string, Webhook> = new Map();
    private constructor() { super(); }
    static getInstance(): WebhooksManager { if (!WebhooksManager.instance) WebhooksManager.instance = new WebhooksManager(); return WebhooksManager.instance; }

    create(name: string, url: string, events: string[]): Webhook {
        const webhook: Webhook = { id: `wh_${Date.now()}`, name, url, events, enabled: true, createdAt: Date.now() };
        this.webhooks.set(webhook.id, webhook);
        this.emit('created', webhook);
        return webhook;
    }

    async trigger(event: string, payload: any): Promise<void> {
        const matching = Array.from(this.webhooks.values()).filter(w => w.enabled && w.events.includes(event));
        for (const wh of matching) {
            try { await fetch(wh.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, payload, timestamp: Date.now() }) }); this.emit('triggered', { webhook: wh, event }); }
            catch (error) { this.emit('error', { webhook: wh, error }); }
        }
    }

    enable(id: string): boolean { const wh = this.webhooks.get(id); if (!wh) return false; wh.enabled = true; return true; }
    disable(id: string): boolean { const wh = this.webhooks.get(id); if (!wh) return false; wh.enabled = false; return true; }
    delete(id: string): boolean { return this.webhooks.delete(id); }
    getAll(): Webhook[] { return Array.from(this.webhooks.values()); }
}

export function getWebhooksManager(): WebhooksManager { return WebhooksManager.getInstance(); }
