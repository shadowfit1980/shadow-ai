/**
 * Mystic Pancake Sort
 */
import { EventEmitter } from 'events';
export class MysticPancakeSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    private flip(arr: T[], k: number): void { let left = 0; while (left < k) { [arr[left], arr[k]] = [arr[k], arr[left]]; left++; k--; } }
    private findMax(arr: T[], n: number): number { let maxIdx = 0; for (let i = 1; i < n; i++) if (this.compare(arr[i], arr[maxIdx]) > 0) maxIdx = i; return maxIdx; }
    sort(arr: T[]): { sorted: T[]; flips: number[] } { const result = [...arr]; const flips: number[] = []; for (let currSize = result.length; currSize > 1; currSize--) { const maxIdx = this.findMax(result, currSize); if (maxIdx !== currSize - 1) { if (maxIdx !== 0) { this.flip(result, maxIdx); flips.push(maxIdx); } this.flip(result, currSize - 1); flips.push(currSize - 1); } } return { sorted: result, flips }; }
}
export const createPancakeSort = <T>(compare?: (a: T, b: T) => number) => new MysticPancakeSort<T>(compare);
