/**
 * Cosmic Deferred
 */
import { EventEmitter } from 'events';
export class CosmicDeferred<T> extends EventEmitter {
    private promiseInternal: Promise<T>;
    private resolveInternal!: (value: T) => void;
    private rejectInternal!: (reason?: unknown) => void;
    private resolved = false;
    private rejected = false;
    constructor() { super(); this.promiseInternal = new Promise((resolve, reject) => { this.resolveInternal = resolve; this.rejectInternal = reject; }); }
    get promise(): Promise<T> { return this.promiseInternal; }
    resolve(value: T): void { if (!this.resolved && !this.rejected) { this.resolved = true; this.resolveInternal(value); this.emit('resolved', value); } }
    reject(reason?: unknown): void { if (!this.resolved && !this.rejected) { this.rejected = true; this.rejectInternal(reason); this.emit('rejected', reason); } }
    isPending(): boolean { return !this.resolved && !this.rejected; }
    isResolved(): boolean { return this.resolved; }
    isRejected(): boolean { return this.rejected; }
}
export const createDeferred = <T>() => new CosmicDeferred<T>();
