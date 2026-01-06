/**
 * Dimensional Byte Size
 */
import { EventEmitter } from 'events';
export class DimensionalByteSize extends EventEmitter {
    private static instance: DimensionalByteSize;
    private constructor() { super(); }
    static getInstance(): DimensionalByteSize { if (!DimensionalByteSize.instance) { DimensionalByteSize.instance = new DimensionalByteSize(); } return DimensionalByteSize.instance; }
    formatBytes(bytes: number, decimals: number = 2): string { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]; }
    parseBytes(str: string): number { const units: Record<string, number> = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }; const match = str.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i); if (!match) return 0; return parseFloat(match[1]) * (units[match[2].toUpperCase()] || 1); }
    getStats(): { formatted: number } { return { formatted: 0 }; }
}
export const dimensionalByteSize = DimensionalByteSize.getInstance();
