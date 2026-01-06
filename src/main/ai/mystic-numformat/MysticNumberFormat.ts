/**
 * Mystic Number Format
 */
import { EventEmitter } from 'events';
export class MysticNumberFormat extends EventEmitter {
    private static instance: MysticNumberFormat;
    private constructor() { super(); }
    static getInstance(): MysticNumberFormat { if (!MysticNumberFormat.instance) { MysticNumberFormat.instance = new MysticNumberFormat(); } return MysticNumberFormat.instance; }
    formatNumber(num: number, locale: string = 'en-US'): string { return num.toLocaleString(locale); }
    formatCurrency(num: number, currency: string = 'USD', locale: string = 'en-US'): string { return num.toLocaleString(locale, { style: 'currency', currency }); }
    formatPercent(num: number, decimals: number = 0): string { return (num * 100).toFixed(decimals) + '%'; }
    getStats(): { formatted: number } { return { formatted: 0 }; }
}
export const mysticNumberFormat = MysticNumberFormat.getInstance();
