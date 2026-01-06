/**
 * Ethereal Lazy
 */
import { EventEmitter } from 'events';
export class EtherealLazy<T> extends EventEmitter {
    private value: T | undefined;
    private factory: () => T;
    private initialized = false;
    constructor(factory: () => T) { super(); this.factory = factory; }
    get(): T { if (!this.initialized) { this.value = this.factory(); this.initialized = true; this.emit('initialized'); } return this.value!; }
    isInitialized(): boolean { return this.initialized; }
    reset(): void { this.initialized = false; this.value = undefined; }
}
export const createLazy = <T>(factory: () => T) => new EtherealLazy<T>(factory);
