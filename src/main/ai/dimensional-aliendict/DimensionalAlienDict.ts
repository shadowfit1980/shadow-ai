/**
 * Dimensional Alien Dictionary
 */
import { EventEmitter } from 'events';
export class DimensionalAlienDict extends EventEmitter {
    private static instance: DimensionalAlienDict;
    private constructor() { super(); }
    static getInstance(): DimensionalAlienDict { if (!DimensionalAlienDict.instance) { DimensionalAlienDict.instance = new DimensionalAlienDict(); } return DimensionalAlienDict.instance; }
    alienOrder(words: string[]): string { const graph: Map<string, Set<string>> = new Map(); const inDegree: Map<string, number> = new Map(); for (const word of words) for (const c of word) { graph.set(c, new Set()); inDegree.set(c, 0); } for (let i = 0; i < words.length - 1; i++) { const w1 = words[i], w2 = words[i + 1]; if (w1.length > w2.length && w1.startsWith(w2)) return ''; for (let j = 0; j < Math.min(w1.length, w2.length); j++) { if (w1[j] !== w2[j]) { if (!graph.get(w1[j])!.has(w2[j])) { graph.get(w1[j])!.add(w2[j]); inDegree.set(w2[j], inDegree.get(w2[j])! + 1); } break; } } } const queue: string[] = []; for (const [c, deg] of inDegree) if (deg === 0) queue.push(c); let result = ''; while (queue.length) { const c = queue.shift()!; result += c; for (const next of graph.get(c)!) { inDegree.set(next, inDegree.get(next)! - 1); if (inDegree.get(next) === 0) queue.push(next); } } return result.length === inDegree.size ? result : ''; }
}
export const dimensionalAlienDict = DimensionalAlienDict.getInstance();
