/**
 * Astral Tallest Billboard
 */
import { EventEmitter } from 'events';
export class AstralTallestBillboard extends EventEmitter {
    private static instance: AstralTallestBillboard;
    private constructor() { super(); }
    static getInstance(): AstralTallestBillboard { if (!AstralTallestBillboard.instance) { AstralTallestBillboard.instance = new AstralTallestBillboard(); } return AstralTallestBillboard.instance; }
    tallestBillboard(rods: number[]): number { const sum = rods.reduce((a, b) => a + b, 0); const dp: Map<number, number> = new Map([[0, 0]]); for (const rod of rods) { const newDp = new Map(dp); for (const [diff, taller] of dp) { const newDiff1 = diff + rod; const newDiff2 = Math.abs(diff - rod); const taller2 = diff > rod ? taller : taller + rod - diff; newDp.set(newDiff1, Math.max(newDp.get(newDiff1) || 0, taller + rod)); newDp.set(newDiff2, Math.max(newDp.get(newDiff2) || 0, taller2)); } for (const [k, v] of newDp) dp.set(k, Math.max(dp.get(k) || 0, v)); } return dp.get(0) || 0; }
}
export const astralTallestBillboard = AstralTallestBillboard.getInstance();
