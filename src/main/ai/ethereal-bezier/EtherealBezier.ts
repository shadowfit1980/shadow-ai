/**
 * Ethereal Bezier
 */
import { EventEmitter } from 'events';
export class EtherealBezier extends EventEmitter {
    private static instance: EtherealBezier;
    private constructor() { super(); }
    static getInstance(): EtherealBezier { if (!EtherealBezier.instance) { EtherealBezier.instance = new EtherealBezier(); } return EtherealBezier.instance; }
    quadratic(t: number, p0: number, p1: number, p2: number): number { const u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; }
    cubic(t: number, p0: number, p1: number, p2: number, p3: number): number { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; }
    getStats(): { calculated: number } { return { calculated: 0 }; }
}
export const etherealBezier = EtherealBezier.getInstance();
