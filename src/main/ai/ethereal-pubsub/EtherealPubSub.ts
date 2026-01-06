/**
 * Ethereal Pub/Sub
 * 
 * A publish/subscribe system that operates
 * through ethereal channels across dimensions.
 */

import { EventEmitter } from 'events';

export interface EtherealChannel { id: string; topic: string; subscribers: number; messages: number; }

export class EtherealPubSub extends EventEmitter {
    private static instance: EtherealPubSub;
    private channels: Map<string, EtherealChannel> = new Map();

    private constructor() { super(); }
    static getInstance(): EtherealPubSub {
        if (!EtherealPubSub.instance) { EtherealPubSub.instance = new EtherealPubSub(); }
        return EtherealPubSub.instance;
    }

    subscribe(topic: string): EtherealChannel {
        let channel = this.channels.get(topic);
        if (!channel) { channel = { id: `channel_${Date.now()}`, topic, subscribers: 0, messages: 0 }; this.channels.set(topic, channel); }
        channel.subscribers++;
        return channel;
    }

    publish(topic: string, message: unknown): boolean {
        const channel = this.channels.get(topic);
        if (channel) { channel.messages++; this.emit('message', { topic, message }); return true; }
        return false;
    }

    getStats(): { total: number; totalSubscribers: number } {
        const channels = Array.from(this.channels.values());
        return { total: channels.length, totalSubscribers: channels.reduce((s, c) => s + c.subscribers, 0) };
    }
}

export const etherealPubSub = EtherealPubSub.getInstance();
