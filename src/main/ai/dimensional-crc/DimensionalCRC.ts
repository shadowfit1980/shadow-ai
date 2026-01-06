/**
 * Dimensional CRC
 */
import { EventEmitter } from 'events';
export class DimensionalCRC extends EventEmitter {
    private static instance: DimensionalCRC;
    private table32: number[] = [];
    private constructor() { super(); this.initTable32(); }
    static getInstance(): DimensionalCRC { if (!DimensionalCRC.instance) { DimensionalCRC.instance = new DimensionalCRC(); } return DimensionalCRC.instance; }
    private initTable32(): void { const polynomial = 0xEDB88320; this.table32 = new Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ polynomial : c >>> 1; this.table32[i] = c >>> 0; } }
    crc32(data: string | Uint8Array): number { let crc = 0xFFFFFFFF; const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data; for (const byte of bytes) crc = (crc >>> 8) ^ this.table32[(crc ^ byte) & 0xFF]; return (crc ^ 0xFFFFFFFF) >>> 0; }
    crc16(data: string | Uint8Array): number { const polynomial = 0x8005; let crc = 0; const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data; for (const byte of bytes) { crc ^= byte << 8; for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? (crc << 1) ^ polynomial : crc << 1; } return crc & 0xFFFF; }
    verify32(data: string | Uint8Array, expected: number): boolean { return this.crc32(data) === expected; }
}
export const dimensionalCRC = DimensionalCRC.getInstance();
