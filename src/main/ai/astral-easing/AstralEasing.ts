/**
 * Astral Easing
 */
import { EventEmitter } from 'events';
export class AstralEasing extends EventEmitter {
    private static instance: AstralEasing;
    private constructor() { super(); }
    static getInstance(): AstralEasing { if (!AstralEasing.instance) { AstralEasing.instance = new AstralEasing(); } return AstralEasing.instance; }
    easeInQuad(t: number): number { return t * t; }
    easeOutQuad(t: number): number { return t * (2 - t); }
    easeInOutQuad(t: number): number { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    easeInCubic(t: number): number { return t * t * t; }
    easeOutCubic(t: number): number { return (--t) * t * t + 1; }
    easeInOutCubic(t: number): number { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; }
    getStats(): { eased: number } { return { eased: 0 }; }
}
export const astralEasing = AstralEasing.getInstance();
