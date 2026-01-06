/**
 * Cosmic Excel Column
 */
import { EventEmitter } from 'events';
export class CosmicExcelColumn extends EventEmitter {
    private static instance: CosmicExcelColumn;
    private constructor() { super(); }
    static getInstance(): CosmicExcelColumn { if (!CosmicExcelColumn.instance) { CosmicExcelColumn.instance = new CosmicExcelColumn(); } return CosmicExcelColumn.instance; }
    titleToNumber(columnTitle: string): number { let result = 0; for (const c of columnTitle) result = result * 26 + (c.charCodeAt(0) - 64); return result; }
    convertToTitle(columnNumber: number): string { let result = ''; while (columnNumber > 0) { columnNumber--; result = String.fromCharCode(65 + columnNumber % 26) + result; columnNumber = Math.floor(columnNumber / 26); } return result; }
    baseConvert(num: string, fromBase: number, toBase: number): string { let decimal = 0; for (const c of num) { const digit = c >= '0' && c <= '9' ? parseInt(c) : c.toLowerCase().charCodeAt(0) - 87; decimal = decimal * fromBase + digit; } if (decimal === 0) return '0'; let result = ''; while (decimal > 0) { const remainder = decimal % toBase; result = (remainder < 10 ? remainder.toString() : String.fromCharCode(87 + remainder)) + result; decimal = Math.floor(decimal / toBase); } return result; }
}
export const cosmicExcelColumn = CosmicExcelColumn.getInstance();
