/**
 * Cosmic Prototype
 */
import { EventEmitter } from 'events';
export interface Prototype<T> { clone(): T; }
export class CosmicPrototype<T extends object> extends EventEmitter {
    clone(source: T): T { return JSON.parse(JSON.stringify(source)); }
    deepClone<U extends object>(source: U): U { if (source === null || typeof source !== 'object') return source; const clone = Array.isArray(source) ? [] : {} as U; for (const key in source) if (Object.prototype.hasOwnProperty.call(source, key)) (clone as Record<string, unknown>)[key] = this.deepClone((source as Record<string, unknown>)[key] as object); return clone as U; }
}
export const cosmicPrototype = new CosmicPrototype();
