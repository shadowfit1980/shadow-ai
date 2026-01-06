/**
 * Cosmic Cycle Sort
 */
import { EventEmitter } from 'events';
export class CosmicCycleSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): { sorted: T[]; writes: number } { const result = [...arr]; const n = result.length; let writes = 0; for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) { let item = result[cycleStart]; let pos = cycleStart; for (let i = cycleStart + 1; i < n; i++) if (this.compare(result[i], item) < 0) pos++; if (pos === cycleStart) continue; while (this.compare(item, result[pos]) === 0) pos++; if (pos !== cycleStart) { [result[pos], item] = [item, result[pos]]; writes++; } while (pos !== cycleStart) { pos = cycleStart; for (let i = cycleStart + 1; i < n; i++) if (this.compare(result[i], item) < 0) pos++; while (this.compare(item, result[pos]) === 0) pos++; if (this.compare(item, result[pos]) !== 0) { [result[pos], item] = [item, result[pos]]; writes++; } } } return { sorted: result, writes }; }
}
export const createCycleSort = <T>(compare?: (a: T, b: T) => number) => new CosmicCycleSort<T>(compare);
