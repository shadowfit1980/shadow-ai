/**
 * Quantum Container With Most Water
 */
import { EventEmitter } from 'events';
export class QuantumContainerMostWater extends EventEmitter {
    private static instance: QuantumContainerMostWater;
    private constructor() { super(); }
    static getInstance(): QuantumContainerMostWater { if (!QuantumContainerMostWater.instance) { QuantumContainerMostWater.instance = new QuantumContainerMostWater(); } return QuantumContainerMostWater.instance; }
    maxArea(height: number[]): number { let left = 0, right = height.length - 1, maxArea = 0; while (left < right) { const area = Math.min(height[left], height[right]) * (right - left); maxArea = Math.max(maxArea, area); if (height[left] < height[right]) left++; else right--; } return maxArea; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const quantumContainerMostWater = QuantumContainerMostWater.getInstance();
