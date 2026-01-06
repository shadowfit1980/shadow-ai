/**
 * Mystic Candy Distribution
 */
import { EventEmitter } from 'events';
export class MysticCandyDistribution extends EventEmitter {
    private static instance: MysticCandyDistribution;
    private constructor() { super(); }
    static getInstance(): MysticCandyDistribution { if (!MysticCandyDistribution.instance) { MysticCandyDistribution.instance = new MysticCandyDistribution(); } return MysticCandyDistribution.instance; }
    candy(ratings: number[]): number { const n = ratings.length; const candies = new Array(n).fill(1); for (let i = 1; i < n; i++) if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1; for (let i = n - 2; i >= 0; i--) if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1); return candies.reduce((a, b) => a + b, 0); }
    distributeCandies(candyType: number[]): number { const unique = new Set(candyType).size; return Math.min(unique, candyType.length / 2); }
    distributeCookies(cookies: number[], k: number): number { const dist = new Array(k).fill(0); let minUnfairness = Infinity; const backtrack = (idx: number): void => { if (idx === cookies.length) { minUnfairness = Math.min(minUnfairness, Math.max(...dist)); return; } for (let i = 0; i < k; i++) { dist[i] += cookies[idx]; if (dist[i] < minUnfairness) backtrack(idx + 1); dist[i] -= cookies[idx]; if (dist[i] === 0) break; } }; backtrack(0); return minUnfairness; }
}
export const mysticCandyDistribution = MysticCandyDistribution.getInstance();
