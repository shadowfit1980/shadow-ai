/**
 * Cosmic Bin Packing
 */
import { EventEmitter } from 'events';
export class CosmicBinPacking extends EventEmitter {
    private static instance: CosmicBinPacking;
    private constructor() { super(); }
    static getInstance(): CosmicBinPacking { if (!CosmicBinPacking.instance) { CosmicBinPacking.instance = new CosmicBinPacking(); } return CosmicBinPacking.instance; }
    nextFit(items: number[], binCapacity: number): number[][] { const bins: number[][] = [[]]; let currentCapacity = binCapacity; for (const item of items) { if (item <= currentCapacity) { bins[bins.length - 1].push(item); currentCapacity -= item; } else { bins.push([item]); currentCapacity = binCapacity - item; } } return bins; }
    firstFit(items: number[], binCapacity: number): number[][] { const bins: number[][] = []; const remaining: number[] = []; for (const item of items) { let placed = false; for (let i = 0; i < bins.length; i++) { if (remaining[i] >= item) { bins[i].push(item); remaining[i] -= item; placed = true; break; } } if (!placed) { bins.push([item]); remaining.push(binCapacity - item); } } return bins; }
    firstFitDecreasing(items: number[], binCapacity: number): number[][] { const sorted = [...items].sort((a, b) => b - a); return this.firstFit(sorted, binCapacity); }
    bestFit(items: number[], binCapacity: number): number[][] { const bins: number[][] = []; const remaining: number[] = []; for (const item of items) { let bestIdx = -1, minSpace = Infinity; for (let i = 0; i < bins.length; i++) { if (remaining[i] >= item && remaining[i] - item < minSpace) { minSpace = remaining[i] - item; bestIdx = i; } } if (bestIdx !== -1) { bins[bestIdx].push(item); remaining[bestIdx] -= item; } else { bins.push([item]); remaining.push(binCapacity - item); } } return bins; }
}
export const cosmicBinPacking = CosmicBinPacking.getInstance();
