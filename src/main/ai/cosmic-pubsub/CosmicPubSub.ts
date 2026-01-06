/**
 * Cosmic Pub Sub
 */
import { EventEmitter } from 'events';
export class CosmicPubSub extends EventEmitter {
    private static instance: CosmicPubSub;
    private topics: Map<string, ((...args: unknown[]) => void)[]> = new Map();
    private constructor() { super(); }
    static getInstance(): CosmicPubSub { if (!CosmicPubSub.instance) { CosmicPubSub.instance = new CosmicPubSub(); } return CosmicPubSub.instance; }
    subscribe(topic: string, fn: (...args: unknown[]) => void): () => void { if (!this.topics.has(topic)) this.topics.set(topic, []); this.topics.get(topic)!.push(fn); return () => { const subs = this.topics.get(topic); if (subs) this.topics.set(topic, subs.filter(s => s !== fn)); }; }
    publish(topic: string, ...args: unknown[]): void { for (const fn of this.topics.get(topic) || []) fn(...args); }
    getStats(): { topics: number } { return { topics: this.topics.size }; }
}
export const cosmicPubSub = CosmicPubSub.getInstance();
