/**
 * Dimensional Critical Connections
 */
import { EventEmitter } from 'events';
export class DimensionalCriticalConns extends EventEmitter {
    private static instance: DimensionalCriticalConns;
    private constructor() { super(); }
    static getInstance(): DimensionalCriticalConns { if (!DimensionalCriticalConns.instance) { DimensionalCriticalConns.instance = new DimensionalCriticalConns(); } return DimensionalCriticalConns.instance; }
    criticalConnections(n: number, connections: number[][]): number[][] { const graph: number[][] = Array.from({ length: n }, () => []); for (const [u, v] of connections) { graph[u].push(v); graph[v].push(u); } const disc = new Array(n).fill(-1); const low = new Array(n).fill(-1); const result: number[][] = []; let time = 0; const dfs = (u: number, parent: number): void => { disc[u] = low[u] = time++; for (const v of graph[u]) { if (v === parent) continue; if (disc[v] === -1) { dfs(v, u); low[u] = Math.min(low[u], low[v]); if (low[v] > disc[u]) result.push([u, v]); } else { low[u] = Math.min(low[u], disc[v]); } } }; for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1); return result; }
}
export const dimensionalCriticalConns = DimensionalCriticalConns.getInstance();
