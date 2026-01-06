/**
 * Cosmic Hyperloglog
 */
import { EventEmitter } from 'events';
export class CosmicHyperLogLog extends EventEmitter {
    private m: number;
    private registers: Uint8Array;
    private alpha: number;
    constructor(precision: number = 14) { super(); this.m = 1 << precision; this.registers = new Uint8Array(this.m); this.alpha = 0.7213 / (1 + 1.079 / this.m); }
    private hash(item: string): number { let h = 0; for (let i = 0; i < item.length; i++) h = ((h << 5) - h + item.charCodeAt(i)) >>> 0; return h; }
    private rho(w: number): number { let rho = 1; while ((w & 1) === 0 && rho <= 32) { rho++; w >>>= 1; } return rho; }
    add(item: string): void { const h = this.hash(item); const j = h & (this.m - 1); const w = h >>> Math.log2(this.m); this.registers[j] = Math.max(this.registers[j], this.rho(w)); }
    count(): number { let z = 0; for (let i = 0; i < this.m; i++) z += 1 / (1 << this.registers[i]); const e = this.alpha * this.m * this.m / z; if (e <= 2.5 * this.m) { let v = 0; for (let i = 0; i < this.m; i++) if (this.registers[i] === 0) v++; if (v > 0) return this.m * Math.log(this.m / v); } return e; }
}
export const createHyperLogLog = (precision?: number) => new CosmicHyperLogLog(precision);
