/**
 * Cosmic Actor
 */
import { EventEmitter } from 'events';
export class CosmicActor<T, R> extends EventEmitter {
    private mailbox: { message: T; respond: (result: R) => void }[] = [];
    private handler: (message: T) => R | Promise<R>;
    private processing = false;
    constructor(handler: (message: T) => R | Promise<R>) { super(); this.handler = handler; }
    async send(message: T): Promise<R> { return new Promise<R>(resolve => { this.mailbox.push({ message, respond: resolve }); this.processNext(); }); }
    private async processNext(): Promise<void> { if (this.processing || this.mailbox.length === 0) return; this.processing = true; const { message, respond } = this.mailbox.shift()!; const result = await this.handler(message); respond(result); this.processing = false; this.processNext(); }
}
export const createActor = <T, R>(handler: (message: T) => R | Promise<R>) => new CosmicActor<T, R>(handler);
