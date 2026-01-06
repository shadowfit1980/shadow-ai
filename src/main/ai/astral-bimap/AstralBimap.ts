/**
 * Astral Bimap
 */
import { EventEmitter } from 'events';
export class AstralBimap<K, V> extends EventEmitter {
    private forward: Map<K, V> = new Map();
    private reverse: Map<V, K> = new Map();
    set(key: K, value: V): void { if (this.forward.has(key)) this.reverse.delete(this.forward.get(key)!); if (this.reverse.has(value)) this.forward.delete(this.reverse.get(value)!); this.forward.set(key, value); this.reverse.set(value, key); }
    getByKey(key: K): V | undefined { return this.forward.get(key); }
    getByValue(value: V): K | undefined { return this.reverse.get(value); }
    hasKey(key: K): boolean { return this.forward.has(key); }
    hasValue(value: V): boolean { return this.reverse.has(value); }
    deleteByKey(key: K): boolean { if (!this.forward.has(key)) return false; this.reverse.delete(this.forward.get(key)!); return this.forward.delete(key); }
    deleteByValue(value: V): boolean { if (!this.reverse.has(value)) return false; this.forward.delete(this.reverse.get(value)!); return this.reverse.delete(value); }
    size(): number { return this.forward.size; }
}
export const createBimap = <K, V>() => new AstralBimap<K, V>();
