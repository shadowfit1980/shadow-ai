/**
 * Ethereal Alien Dictionary
 */
import { EventEmitter } from 'events';
export class EtherealAlienDictionary extends EventEmitter {
    private static instance: EtherealAlienDictionary;
    private constructor() { super(); }
    static getInstance(): EtherealAlienDictionary { if (!EtherealAlienDictionary.instance) { EtherealAlienDictionary.instance = new EtherealAlienDictionary(); } return EtherealAlienDictionary.instance; }
    alienOrder(words: string[]): string { const graph = new Map<string, Set<string>>(); const inDegree = new Map<string, number>(); for (const w of words) for (const c of w) { graph.set(c, new Set()); inDegree.set(c, 0); } for (let i = 0; i < words.length - 1; i++) { const w1 = words[i], w2 = words[i + 1]; const minLen = Math.min(w1.length, w2.length); for (let j = 0; j < minLen; j++) if (w1[j] !== w2[j]) { if (!graph.get(w1[j])!.has(w2[j])) { graph.get(w1[j])!.add(w2[j]); inDegree.set(w2[j], inDegree.get(w2[j])! + 1); } break; } } const queue = [...inDegree.entries()].filter(([, v]) => v === 0).map(([k]) => k); let result = ''; while (queue.length) { const c = queue.shift()!; result += c; for (const next of graph.get(c)!) { inDegree.set(next, inDegree.get(next)! - 1); if (inDegree.get(next) === 0) queue.push(next); } } return result.length === inDegree.size ? result : ''; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const etherealAlienDictionary = EtherealAlienDictionary.getInstance();
