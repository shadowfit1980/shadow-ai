/**
 * Quantum Container Water
 */
import { EventEmitter } from 'events';
export class QuantumContainerWater extends EventEmitter {
    private static instance: QuantumContainerWater;
    private constructor() { super(); }
    static getInstance(): QuantumContainerWater { if (!QuantumContainerWater.instance) { QuantumContainerWater.instance = new QuantumContainerWater(); } return QuantumContainerWater.instance; }
    maxArea(height: number[]): number { let left = 0, right = height.length - 1, maxArea = 0; while (left < right) { maxArea = Math.max(maxArea, Math.min(height[left], height[right]) * (right - left)); if (height[left] < height[right]) left++; else right--; } return maxArea; }
    trap(height: number[]): number { if (height.length === 0) return 0; let left = 0, right = height.length - 1; let leftMax = 0, rightMax = 0, water = 0; while (left < right) { if (height[left] < height[right]) { if (height[left] >= leftMax) leftMax = height[left]; else water += leftMax - height[left]; left++; } else { if (height[right] >= rightMax) rightMax = height[right]; else water += rightMax - height[right]; right--; } } return water; }
    trap2D(heightMap: number[][]): number { if (heightMap.length === 0 || heightMap[0].length === 0) return 0; const m = heightMap.length, n = heightMap[0].length; const visited = Array.from({ length: m }, () => new Array(n).fill(false)); const heap: [number, number, number][] = []; for (let i = 0; i < m; i++) { heap.push([heightMap[i][0], i, 0]); heap.push([heightMap[i][n - 1], i, n - 1]); visited[i][0] = visited[i][n - 1] = true; } for (let j = 1; j < n - 1; j++) { heap.push([heightMap[0][j], 0, j]); heap.push([heightMap[m - 1][j], m - 1, j]); visited[0][j] = visited[m - 1][j] = true; } heap.sort((a, b) => a[0] - b[0]); let water = 0; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; while (heap.length) { heap.sort((a, b) => a[0] - b[0]); const [h, r, c] = heap.shift()!; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) { visited[nr][nc] = true; water += Math.max(0, h - heightMap[nr][nc]); heap.push([Math.max(h, heightMap[nr][nc]), nr, nc]); } } } return water; }
}
export const quantumContainerWater = QuantumContainerWater.getInstance();
