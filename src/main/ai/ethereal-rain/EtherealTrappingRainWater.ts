/**
 * Ethereal Trapping Rain Water
 */
import { EventEmitter } from 'events';
export class EtherealTrappingRainWater extends EventEmitter {
    private static instance: EtherealTrappingRainWater;
    private constructor() { super(); }
    static getInstance(): EtherealTrappingRainWater { if (!EtherealTrappingRainWater.instance) { EtherealTrappingRainWater.instance = new EtherealTrappingRainWater(); } return EtherealTrappingRainWater.instance; }
    trap(height: number[]): number { if (height.length === 0) return 0; let left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, water = 0; while (left < right) { if (height[left] < height[right]) { if (height[left] >= leftMax) leftMax = height[left]; else water += leftMax - height[left]; left++; } else { if (height[right] >= rightMax) rightMax = height[right]; else water += rightMax - height[right]; right--; } } return water; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const etherealTrappingRainWater = EtherealTrappingRainWater.getInstance();
