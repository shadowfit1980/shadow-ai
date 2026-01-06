/**
 * Mystic Power Set
 */
import { EventEmitter } from 'events';
export class MysticPowerSet<T> extends EventEmitter {
    generate(arr: T[]): T[][] { const result: T[][] = [[]]; for (const elem of arr) { const newSubsets = result.map(subset => [...subset, elem]); result.push(...newSubsets); } return result; }
    generateIterative(arr: T[]): T[][] { const n = arr.length; const result: T[][] = []; for (let mask = 0; mask < (1 << n); mask++) { const subset: T[] = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(arr[i]); result.push(subset); } return result; }
    generateRecursive(arr: T[]): T[][] { const result: T[][] = []; const generate = (index: number, current: T[]): void => { if (index === arr.length) { result.push([...current]); return; } generate(index + 1, current); current.push(arr[index]); generate(index + 1, current); current.pop(); }; generate(0, []); return result; }
    subsetsOfSizeK(arr: T[], k: number): T[][] { const result: T[][] = []; const generate = (start: number, current: T[]): void => { if (current.length === k) { result.push([...current]); return; } for (let i = start; i < arr.length; i++) { current.push(arr[i]); generate(i + 1, current); current.pop(); } }; generate(0, []); return result; }
}
export const createPowerSet = <T>() => new MysticPowerSet<T>();
