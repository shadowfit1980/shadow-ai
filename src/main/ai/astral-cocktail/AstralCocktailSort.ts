/**
 * Astral Cocktail Shaker Sort
 */
import { EventEmitter } from 'events';
export class AstralCocktailSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; let start = 0; let end = result.length - 1; let swapped = true; while (swapped) { swapped = false; for (let i = start; i < end; i++) { if (this.compare(result[i], result[i + 1]) > 0) { [result[i], result[i + 1]] = [result[i + 1], result[i]]; swapped = true; } } if (!swapped) break; swapped = false; end--; for (let i = end - 1; i >= start; i--) { if (this.compare(result[i], result[i + 1]) > 0) { [result[i], result[i + 1]] = [result[i + 1], result[i]]; swapped = true; } } start++; } return result; }
}
export const createCocktailSort = <T>(compare?: (a: T, b: T) => number) => new AstralCocktailSort<T>(compare);
