/**
 * Astral Permutations
 */
import { EventEmitter } from 'events';
export class AstralPermutations<T> extends EventEmitter {
    generate(arr: T[]): T[][] { const result: T[][] = []; const permute = (current: T[], remaining: T[]): void => { if (remaining.length === 0) { result.push([...current]); return; } for (let i = 0; i < remaining.length; i++) { current.push(remaining[i]); permute(current, [...remaining.slice(0, i), ...remaining.slice(i + 1)]); current.pop(); } }; permute([], arr); return result; }
    heapsAlgorithm(arr: T[]): T[][] { const result: T[][] = []; const a = [...arr]; const c = new Array(a.length).fill(0); result.push([...a]); let i = 0; while (i < a.length) { if (c[i] < i) { if (i % 2 === 0) [a[0], a[i]] = [a[i], a[0]]; else[a[c[i]], a[i]] = [a[i], a[c[i]]]; result.push([...a]); c[i]++; i = 0; } else { c[i] = 0; i++; } } return result; }
    nextPermutation(arr: T[], compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)): boolean { const a = arr; let i = a.length - 2; while (i >= 0 && compare(a[i], a[i + 1]) >= 0) i--; if (i < 0) return false; let j = a.length - 1; while (compare(a[j], a[i]) <= 0) j--;[a[i], a[j]] = [a[j], a[i]]; let left = i + 1, right = a.length - 1; while (left < right) { [a[left], a[right]] = [a[right], a[left]]; left++; right--; } return true; }
    kthPermutation(arr: T[], k: number): T[] { const n = arr.length; const fact = [1]; for (let i = 1; i <= n; i++) fact.push(fact[i - 1] * i); const result: T[] = []; const available = [...arr]; k--; for (let i = n; i > 0; i--) { const idx = Math.floor(k / fact[i - 1]); result.push(available[idx]); available.splice(idx, 1); k %= fact[i - 1]; } return result; }
}
export const createPermutations = <T>() => new AstralPermutations<T>();
