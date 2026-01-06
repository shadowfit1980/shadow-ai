/**
 * Cosmic Time Based Store
 */
import { EventEmitter } from 'events';
export class CosmicTimeMap extends EventEmitter {
    private map: Map<string, [number, string][]> = new Map();
    constructor() { super(); }
    set(key: string, value: string, timestamp: number): void { if (!this.map.has(key)) this.map.set(key, []); this.map.get(key)!.push([timestamp, value]); }
    get(key: string, timestamp: number): string { if (!this.map.has(key)) return ''; const values = this.map.get(key)!; let left = 0, right = values.length - 1, result = ''; while (left <= right) { const mid = Math.floor((left + right) / 2); if (values[mid][0] <= timestamp) { result = values[mid][1]; left = mid + 1; } else { right = mid - 1; } } return result; }
}
export class SnapshotArray extends EventEmitter {
    private data: Map<number, [number, number][]>[] = [];
    private snapId: number = 0;
    constructor(length: number) { super(); for (let i = 0; i < length; i++) this.data.push(new Map([[0, [[0, 0]]]])); }
    set(index: number, val: number): void { const history = this.data[index].get(0)!; if (history[history.length - 1][0] === this.snapId) history[history.length - 1][1] = val; else history.push([this.snapId, val]); }
    snap(): number { return this.snapId++; }
    get(index: number, snap_id: number): number { const history = this.data[index].get(0)!; let left = 0, right = history.length - 1, result = 0; while (left <= right) { const mid = Math.floor((left + right) / 2); if (history[mid][0] <= snap_id) { result = history[mid][1]; left = mid + 1; } else { right = mid - 1; } } return result; }
}
export const createTimeMap = () => new CosmicTimeMap();
export const createSnapshotArray = (length: number) => new SnapshotArray(length);
