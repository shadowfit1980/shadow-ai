/**
 * Quantum Time Needed to Inform
 */
import { EventEmitter } from 'events';
export class QuantumTimeNeededToInform extends EventEmitter {
    private static instance: QuantumTimeNeededToInform;
    private constructor() { super(); }
    static getInstance(): QuantumTimeNeededToInform { if (!QuantumTimeNeededToInform.instance) { QuantumTimeNeededToInform.instance = new QuantumTimeNeededToInform(); } return QuantumTimeNeededToInform.instance; }
    numOfMinutes(n: number, headID: number, manager: number[], informTime: number[]): number { const graph = new Map<number, number[]>(); for (let i = 0; i < n; i++) graph.set(i, []); for (let i = 0; i < n; i++) if (manager[i] !== -1) graph.get(manager[i])!.push(i); const dfs = (id: number): number => { let max = 0; for (const sub of graph.get(id)!) max = Math.max(max, dfs(sub)); return informTime[id] + max; }; return dfs(headID); }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const quantumTimeNeededToInform = QuantumTimeNeededToInform.getInstance();
