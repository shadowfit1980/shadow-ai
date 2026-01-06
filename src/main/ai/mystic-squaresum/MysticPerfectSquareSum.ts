/**
 * Mystic Perfect Square Sum
 */
import { EventEmitter } from 'events';
export class MysticPerfectSquareSum extends EventEmitter {
    private static instance: MysticPerfectSquareSum;
    private constructor() { super(); }
    static getInstance(): MysticPerfectSquareSum { if (!MysticPerfectSquareSum.instance) { MysticPerfectSquareSum.instance = new MysticPerfectSquareSum(); } return MysticPerfectSquareSum.instance; }
    numSquares(n: number): number { const dp = new Array(n + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= n; i++) { for (let j = 1; j * j <= i; j++) { dp[i] = Math.min(dp[i], dp[i - j * j] + 1); } } return dp[n]; }
    numSquaresBFS(n: number): number { const squares = []; for (let i = 1; i * i <= n; i++) squares.push(i * i); const visited = new Set<number>([n]); const queue = [n]; let level = 0; while (queue.length) { level++; const size = queue.length; for (let i = 0; i < size; i++) { const num = queue.shift()!; for (const sq of squares) { const next = num - sq; if (next === 0) return level; if (next > 0 && !visited.has(next)) { visited.add(next); queue.push(next); } } } } return n; }
    isPerfectSquare(n: number): boolean { if (n < 0) return false; const sqrt = Math.floor(Math.sqrt(n)); return sqrt * sqrt === n; }
}
export const mysticPerfectSquareSum = MysticPerfectSquareSum.getInstance();
