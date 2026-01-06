/**
 * Cosmic Ordered Map
 */
import { EventEmitter } from 'events';
export class CosmicOrderedMap<K, V> extends EventEmitter {
    private keys: K[] = [];
    private map: Map<K, V> = new Map();
    set(key: K, value: V): void { if (!this.map.has(key)) this.keys.push(key); this.map.set(key, value); }
    get(key: K): V | undefined { return this.map.get(key); }
    has(key: K): boolean { return this.map.has(key); }
    delete(key: K): boolean { if (!this.map.has(key)) return false; this.keys = this.keys.filter(k => k !== key); return this.map.delete(key); }
    entries(): [K, V][] { return this.keys.map(k => [k, this.map.get(k)!]); }
    keysOrdered(): K[] { return [...this.keys]; }
    valuesOrdered(): V[] { return this.keys.map(k => this.map.get(k)!); }
    size(): number { return this.keys.length; }
}
export const createOrderedMap = <K, V>() => new CosmicOrderedMap<K, V>();
