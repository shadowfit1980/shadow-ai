/**
 * Astral Path Finding
 */
import { EventEmitter } from 'events';
export class AstralPathFinding extends EventEmitter {
    private static instance: AstralPathFinding;
    private constructor() { super(); }
    static getInstance(): AstralPathFinding { if (!AstralPathFinding.instance) { AstralPathFinding.instance = new AstralPathFinding(); } return AstralPathFinding.instance; }
    manhattanDistance(x1: number, y1: number, x2: number, y2: number): number { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }
    chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number { return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)); }
    euclideanDistance(x1: number, y1: number, x2: number, y2: number): number { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2); }
    getStats(): { calculated: number } { return { calculated: 0 }; }
}
export const astralPathFinding = AstralPathFinding.getInstance();
