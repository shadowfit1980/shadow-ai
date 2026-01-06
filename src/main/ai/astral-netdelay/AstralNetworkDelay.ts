/**
 * Astral Network Delay
 */
import { EventEmitter } from 'events';
export class AstralNetworkDelay extends EventEmitter {
    private static instance: AstralNetworkDelay;
    private constructor() { super(); }
    static getInstance(): AstralNetworkDelay { if (!AstralNetworkDelay.instance) { AstralNetworkDelay.instance = new AstralNetworkDelay(); } return AstralNetworkDelay.instance; }
    networkDelayTime(times: number[][], n: number, k: number): number { const graph: Map<number, [number, number][]> = new Map(); for (const [u, v, w] of times) { if (!graph.has(u)) graph.set(u, []); graph.get(u)!.push([v, w]); } const dist = new Array(n + 1).fill(Infinity); dist[k] = 0; const heap: [number, number][] = [[0, k]]; while (heap.length) { heap.sort((a, b) => a[0] - b[0]); const [d, u] = heap.shift()!; if (d > dist[u]) continue; for (const [v, w] of graph.get(u) || []) { if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; heap.push([dist[v], v]); } } } const maxTime = Math.max(...dist.slice(1)); return maxTime === Infinity ? -1 : maxTime; }
    cheapestFlights(n: number, flights: number[][], src: number, dst: number, k: number): number { const prices = new Array(n).fill(Infinity); prices[src] = 0; for (let i = 0; i <= k; i++) { const temp = [...prices]; for (const [from, to, price] of flights) { if (prices[from] !== Infinity) temp[to] = Math.min(temp[to], prices[from] + price); } for (let j = 0; j < n; j++) prices[j] = temp[j]; } return prices[dst] === Infinity ? -1 : prices[dst]; }
}
export const astralNetworkDelay = AstralNetworkDelay.getInstance();
