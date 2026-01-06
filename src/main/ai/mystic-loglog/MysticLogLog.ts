/**
 * Mystic LogLog
 */
import { EventEmitter } from 'events';
export class MysticLogLog extends EventEmitter {
    private k: number;
    private m: number;
    private registers: Uint8Array;
    constructor(k: number = 10) { super(); this.k = k; this.m = 1 << k; this.registers = new Uint8Array(this.m); }
    private hash(item: string): number { let h = 0; for (let i = 0; i < item.length; i++) h = ((h << 5) - h + item.charCodeAt(i)) >>> 0; return h; }
    private rho(w: number): number { let r = 1; while (!(w & 1) && r <= 32 - this.k) { w >>>= 1; r++; } return r; }
    add(item: string): void { const h = this.hash(item); const j = h >>> (32 - this.k); const w = h << this.k; this.registers[j] = Math.max(this.registers[j], this.rho(w)); }
    count(): number { const alpha = 0.79402; let harmonic = 0; for (let i = 0; i < this.m; i++) harmonic += 1 / (1 << this.registers[i]); return alpha * this.m * this.m / harmonic; }
    merge(other: MysticLogLog): void { if (this.k !== other.k) throw new Error('LogLog instances must have same k'); for (let i = 0; i < this.m; i++) this.registers[i] = Math.max(this.registers[i], other.registers[i]); }
}
export const createLogLog = (k?: number) => new MysticLogLog(k);
