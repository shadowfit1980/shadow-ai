/**
 * Astral Gnome Sort
 */
import { EventEmitter } from 'events';
export class AstralGnomeSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; let i = 0; while (i < result.length) { if (i === 0 || this.compare(result[i - 1], result[i]) <= 0) { i++; } else { [result[i - 1], result[i]] = [result[i], result[i - 1]]; i--; } } return result; }
    optimizedSort(arr: T[]): T[] { const result = [...arr]; let i = 1, j = 2; while (i < result.length) { if (this.compare(result[i - 1], result[i]) <= 0) { i = j; j++; } else { [result[i - 1], result[i]] = [result[i], result[i - 1]]; i--; if (i === 0) { i = j; j++; } } } return result; }
}
export const createGnomeSort = <T>(compare?: (a: T, b: T) => number) => new AstralGnomeSort<T>(compare);
