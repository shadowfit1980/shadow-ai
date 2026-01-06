/**
 * Cosmic Combination Sum
 */
import { EventEmitter } from 'events';
export class CosmicCombinationSum extends EventEmitter {
    private static instance: CosmicCombinationSum;
    private constructor() { super(); }
    static getInstance(): CosmicCombinationSum { if (!CosmicCombinationSum.instance) { CosmicCombinationSum.instance = new CosmicCombinationSum(); } return CosmicCombinationSum.instance; }
    combinationSum(candidates: number[], target: number): number[][] { const result: number[][] = []; const backtrack = (start: number, remaining: number, current: number[]): void => { if (remaining === 0) { result.push([...current]); return; } for (let i = start; i < candidates.length; i++) { if (candidates[i] <= remaining) { current.push(candidates[i]); backtrack(i, remaining - candidates[i], current); current.pop(); } } }; backtrack(0, target, []); return result; }
    combinationSum2(candidates: number[], target: number): number[][] { candidates.sort((a, b) => a - b); const result: number[][] = []; const backtrack = (start: number, remaining: number, current: number[]): void => { if (remaining === 0) { result.push([...current]); return; } for (let i = start; i < candidates.length; i++) { if (i > start && candidates[i] === candidates[i - 1]) continue; if (candidates[i] > remaining) break; current.push(candidates[i]); backtrack(i + 1, remaining - candidates[i], current); current.pop(); } }; backtrack(0, target, []); return result; }
    combine(n: number, k: number): number[][] { const result: number[][] = []; const backtrack = (start: number, current: number[]): void => { if (current.length === k) { result.push([...current]); return; } for (let i = start; i <= n; i++) { current.push(i); backtrack(i + 1, current); current.pop(); } }; backtrack(1, []); return result; }
}
export const cosmicCombinationSum = CosmicCombinationSum.getInstance();
