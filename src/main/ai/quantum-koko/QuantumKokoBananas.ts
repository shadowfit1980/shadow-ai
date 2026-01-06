/**
 * Quantum Koko Eating Bananas
 */
import { EventEmitter } from 'events';
export class QuantumKokoBananas extends EventEmitter {
    private static instance: QuantumKokoBananas;
    private constructor() { super(); }
    static getInstance(): QuantumKokoBananas { if (!QuantumKokoBananas.instance) { QuantumKokoBananas.instance = new QuantumKokoBananas(); } return QuantumKokoBananas.instance; }
    minEatingSpeed(piles: number[], h: number): number { let lo = 1, hi = Math.max(...piles); while (lo < hi) { const mid = Math.floor((lo + hi) / 2); let hours = 0; for (const pile of piles) hours += Math.ceil(pile / mid); if (hours <= h) hi = mid; else lo = mid + 1; } return lo; }
    shipWithinDays(weights: number[], days: number): number { let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b, 0); while (lo < hi) { const mid = Math.floor((lo + hi) / 2); let daysNeeded = 1, currentLoad = 0; for (const w of weights) { if (currentLoad + w > mid) { daysNeeded++; currentLoad = w; } else { currentLoad += w; } } if (daysNeeded <= days) hi = mid; else lo = mid + 1; } return lo; }
    binarySearchBound(nums: number[], target: number): [number, number] { const findFirst = (): number => { let lo = 0, hi = nums.length; while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (nums[mid] < target) lo = mid + 1; else hi = mid; } return lo; }; const findLast = (): number => { let lo = 0, hi = nums.length; while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (nums[mid] <= target) lo = mid + 1; else hi = mid; } return lo - 1; }; const first = findFirst(); if (first === nums.length || nums[first] !== target) return [-1, -1]; return [first, findLast()]; }
}
export const quantumKokoBananas = QuantumKokoBananas.getInstance();
