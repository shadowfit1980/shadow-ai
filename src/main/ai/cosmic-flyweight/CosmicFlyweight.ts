/**
 * Cosmic Flyweight
 */
import { EventEmitter } from 'events';
export class CosmicFlyweight<T> extends EventEmitter {
    private cache: Map<string, T> = new Map();
    private creator: (key: string) => T;
    constructor(creator: (key: string) => T) { super(); this.creator = creator; }
    get(key: string): T { if (!this.cache.has(key)) this.cache.set(key, this.creator(key)); return this.cache.get(key)!; }
    getStats(): { cached: number } { return { cached: this.cache.size }; }
}
export const createFlyweight = <T>(creator: (key: string) => T) => new CosmicFlyweight<T>(creator);
