/**
 * Ethereal Detonate Maximum Bombs
 */
import { EventEmitter } from 'events';
export class EtherealDetonateMaximumBombs extends EventEmitter {
    private static instance: EtherealDetonateMaximumBombs;
    private constructor() { super(); }
    static getInstance(): EtherealDetonateMaximumBombs { if (!EtherealDetonateMaximumBombs.instance) { EtherealDetonateMaximumBombs.instance = new EtherealDetonateMaximumBombs(); } return EtherealDetonateMaximumBombs.instance; }
    maximumDetonation(bombs: number[][]): number { const n = bombs.length; const graph = new Map<number, number[]>(); for (let i = 0; i < n; i++) graph.set(i, []); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) { const dx = bombs[i][0] - bombs[j][0], dy = bombs[i][1] - bombs[j][1]; if (dx * dx + dy * dy <= bombs[i][2] * bombs[i][2]) graph.get(i)!.push(j); } let max = 0; for (let i = 0; i < n; i++) { const visited = new Set([i]); const stack = [i]; while (stack.length) { const curr = stack.pop()!; for (const next of graph.get(curr)!) if (!visited.has(next)) { visited.add(next); stack.push(next); } } max = Math.max(max, visited.size); } return max; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const etherealDetonateMaximumBombs = EtherealDetonateMaximumBombs.getInstance();
