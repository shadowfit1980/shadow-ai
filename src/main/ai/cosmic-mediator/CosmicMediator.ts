/**
 * Cosmic Mediator
 */
import { EventEmitter } from 'events';
export class CosmicMediator extends EventEmitter {
    private static instance: CosmicMediator;
    private handlers: Map<string, (data: unknown) => unknown> = new Map();
    private constructor() { super(); }
    static getInstance(): CosmicMediator { if (!CosmicMediator.instance) { CosmicMediator.instance = new CosmicMediator(); } return CosmicMediator.instance; }
    register(name: string, handler: (data: unknown) => unknown): void { this.handlers.set(name, handler); }
    send<T, R>(name: string, data: T): R | null { const handler = this.handlers.get(name); return handler ? handler(data) as R : null; }
    getStats(): { handlers: number } { return { handlers: this.handlers.size }; }
}
export const cosmicMediator = CosmicMediator.getInstance();
