/**
 * Quantum Set Cover
 */
import { EventEmitter } from 'events';
export class QuantumSetCover extends EventEmitter {
    private universe: Set<number>;
    private sets: Map<number, Set<number>> = new Map();
    constructor(universeSize: number) { super(); this.universe = new Set(Array.from({ length: universeSize }, (_, i) => i)); }
    addSet(id: number, elements: number[]): void { this.sets.set(id, new Set(elements)); }
    greedyCover(): number[] { const uncovered = new Set(this.universe); const cover: number[] = []; while (uncovered.size > 0) { let bestSet = -1, bestCover = 0; for (const [id, set] of this.sets) { let count = 0; for (const e of set) if (uncovered.has(e)) count++; if (count > bestCover) { bestCover = count; bestSet = id; } } if (bestSet === -1) break; cover.push(bestSet); const set = this.sets.get(bestSet)!; for (const e of set) uncovered.delete(e); } return cover; }
    isCover(setIds: number[]): boolean { const covered = new Set<number>(); for (const id of setIds) { const set = this.sets.get(id); if (set) for (const e of set) covered.add(e); } return covered.size === this.universe.size; }
    weightedCover(weights: Map<number, number>): number[] { const uncovered = new Set(this.universe); const cover: number[] = []; while (uncovered.size > 0) { let bestSet = -1, bestRatio = Infinity; for (const [id, set] of this.sets) { let count = 0; for (const e of set) if (uncovered.has(e)) count++; if (count > 0) { const ratio = (weights.get(id) || 1) / count; if (ratio < bestRatio) { bestRatio = ratio; bestSet = id; } } } if (bestSet === -1) break; cover.push(bestSet); const set = this.sets.get(bestSet)!; for (const e of set) uncovered.delete(e); } return cover; }
}
export const createSetCover = (universeSize: number) => new QuantumSetCover(universeSize);
