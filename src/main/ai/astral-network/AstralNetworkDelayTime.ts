/**
 * Astral Network Delay Time
 */
import { EventEmitter } from 'events';
export class AstralNetworkDelayTime extends EventEmitter {
    private static instance: AstralNetworkDelayTime;
    private constructor() { super(); }
    static getInstance(): AstralNetworkDelayTime { if (!AstralNetworkDelayTime.instance) { AstralNetworkDelayTime.instance = new AstralNetworkDelayTime(); } return AstralNetworkDelayTime.instance; }
    networkDelayTime(times: number[][], n: number, k: number): number { const graph = new Map<number, [number, number][]>(); for (const [u, v, w] of times) { if (!graph.has(u)) graph.set(u, []); graph.get(u)!.push([v, w]); } const dist = new Array(n + 1).fill(Infinity); dist[k] = 0; const pq: [number, number][] = [[0, k]]; while (pq.length) { pq.sort((a, b) => a[0] - b[0]); const [d, u] = pq.shift()!; if (d > dist[u]) continue; for (const [v, w] of graph.get(u) || []) if (d + w < dist[v]) { dist[v] = d + w; pq.push([dist[v], v]); } } const ans = Math.max(...dist.slice(1)); return ans === Infinity ? -1 : ans; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const astralNetworkDelayTime = AstralNetworkDelayTime.getInstance();
