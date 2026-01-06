/**
 * Dimensional Color
 */
import { EventEmitter } from 'events';
export class DimensionalColor extends EventEmitter {
    private static instance: DimensionalColor;
    private constructor() { super(); }
    static getInstance(): DimensionalColor { if (!DimensionalColor.instance) { DimensionalColor.instance = new DimensionalColor(); } return DimensionalColor.instance; }
    hexToRgb(hex: string): { r: number; g: number; b: number } | null { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }
    rgbToHex(r: number, g: number, b: number): string { return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }
    randomColor(): string { return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'); }
    getStats(): { converted: number } { return { converted: 0 }; }
}
export const dimensionalColor = DimensionalColor.getInstance();
