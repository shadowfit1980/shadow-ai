/**
 * Astral External Sort
 */
import { EventEmitter } from 'events';
export class AstralExternalSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    private chunkSize: number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number), chunkSize: number = 1000) { super(); this.compare = compare; this.chunkSize = chunkSize; }
    sort(arr: T[]): T[] { const chunks: T[][] = []; for (let i = 0; i < arr.length; i += this.chunkSize) { const chunk = arr.slice(i, i + this.chunkSize).sort(this.compare); chunks.push(chunk); } return this.kWayMerge(chunks); }
    private kWayMerge(chunks: T[][]): T[] { const result: T[] = []; const indices = new Array(chunks.length).fill(0); while (true) { let minIdx = -1; let minVal: T | null = null; for (let i = 0; i < chunks.length; i++) { if (indices[i] < chunks[i].length) { if (minVal === null || this.compare(chunks[i][indices[i]], minVal) < 0) { minVal = chunks[i][indices[i]]; minIdx = i; } } } if (minIdx === -1) break; result.push(minVal!); indices[minIdx]++; } return result; }
    setChunkSize(size: number): void { this.chunkSize = size; }
}
export const createExternalSort = <T>(compare?: (a: T, b: T) => number, chunkSize?: number) => new AstralExternalSort<T>(compare, chunkSize);
