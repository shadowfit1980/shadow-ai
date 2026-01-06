/**
 * Cosmic Coordinate Compression
 */
import { EventEmitter } from 'events';
export class CosmicCoordCompress extends EventEmitter {
    private static instance: CosmicCoordCompress;
    private constructor() { super(); }
    static getInstance(): CosmicCoordCompress { if (!CosmicCoordCompress.instance) { CosmicCoordCompress.instance = new CosmicCoordCompress(); } return CosmicCoordCompress.instance; }
    compress(arr: number[]): { compressed: number[]; map: Map<number, number>; inverse: number[] } { const sorted = [...new Set(arr)].sort((a, b) => a - b); const map = new Map<number, number>(); sorted.forEach((v, i) => map.set(v, i)); const compressed = arr.map(v => map.get(v)!); return { compressed, map, inverse: sorted }; }
    compress2D(points: [number, number][]): { compressed: [number, number][]; xMap: Map<number, number>; yMap: Map<number, number> } { const xs = [...new Set(points.map(p => p[0]))].sort((a, b) => a - b); const ys = [...new Set(points.map(p => p[1]))].sort((a, b) => a - b); const xMap = new Map<number, number>(); xs.forEach((v, i) => xMap.set(v, i)); const yMap = new Map<number, number>(); ys.forEach((v, i) => yMap.set(v, i)); const compressed = points.map(p => [xMap.get(p[0])!, yMap.get(p[1])!] as [number, number]); return { compressed, xMap, yMap }; }
}
export const cosmicCoordCompress = CosmicCoordCompress.getInstance();
