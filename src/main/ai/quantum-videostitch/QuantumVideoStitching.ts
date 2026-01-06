/**
 * Quantum Video Stitching
 */
import { EventEmitter } from 'events';
export class QuantumVideoStitching extends EventEmitter {
    private static instance: QuantumVideoStitching;
    private constructor() { super(); }
    static getInstance(): QuantumVideoStitching { if (!QuantumVideoStitching.instance) { QuantumVideoStitching.instance = new QuantumVideoStitching(); } return QuantumVideoStitching.instance; }
    videoStitching(clips: number[][], time: number): number { clips.sort((a, b) => a[0] - b[0] || b[1] - a[1]); let count = 0, end = 0, farthest = 0, i = 0; while (end < time) { while (i < clips.length && clips[i][0] <= end) { farthest = Math.max(farthest, clips[i][1]); i++; } if (farthest <= end) return -1; count++; end = farthest; } return count; }
    minTaps(n: number, ranges: number[]): number { const clips: number[][] = []; for (let i = 0; i <= n; i++) if (ranges[i] > 0) clips.push([Math.max(0, i - ranges[i]), Math.min(n, i + ranges[i])]); return this.videoStitching(clips, n); }
}
export const quantumVideoStitching = QuantumVideoStitching.getInstance();
