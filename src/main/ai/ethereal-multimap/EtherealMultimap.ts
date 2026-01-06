/**
 * Ethereal Multimap
 */
import { EventEmitter } from 'events';
export class EtherealMultimap<K, V> extends EventEmitter {
    private map: Map<K, V[]> = new Map();
    set(key: K, value: V): void { if (!this.map.has(key)) this.map.set(key, []); this.map.get(key)!.push(value); }
    get(key: K): V[] { return this.map.get(key) || []; }
    has(key: K): boolean { return this.map.has(key); }
    delete(key: K, value?: V): boolean { if (!this.map.has(key)) return false; if (value === undefined) return this.map.delete(key); const values = this.map.get(key)!; const idx = values.indexOf(value); if (idx === -1) return false; values.splice(idx, 1); if (values.length === 0) this.map.delete(key); return true; }
    keys(): K[] { return [...this.map.keys()]; }
    values(): V[] { return [...this.map.values()].flat(); }
    size(): number { return [...this.map.values()].reduce((sum, v) => sum + v.length, 0); }
}
export const createMultimap = <K, V>() => new EtherealMultimap<K, V>();
