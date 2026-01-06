/**
 * Quantum KD Tree
 */
import { EventEmitter } from 'events';
export interface KDPoint { coords: number[]; data: unknown; }
export class QuantumKDTree extends EventEmitter {
    private static instance: QuantumKDTree;
    private points: KDPoint[] = [];
    private constructor() { super(); }
    static getInstance(): QuantumKDTree { if (!QuantumKDTree.instance) { QuantumKDTree.instance = new QuantumKDTree(); } return QuantumKDTree.instance; }
    insert(coords: number[], data: unknown): void { this.points.push({ coords, data }); }
    nearest(target: number[]): KDPoint | undefined { if (this.points.length === 0) return undefined; return this.points.reduce((best, p) => { const dBest = this.dist(best.coords, target); const dP = this.dist(p.coords, target); return dP < dBest ? p : best; }); }
    private dist(a: number[], b: number[]): number { return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)); }
    getStats(): { size: number } { return { size: this.points.length }; }
}
export const quantumKDTree = QuantumKDTree.getInstance();
