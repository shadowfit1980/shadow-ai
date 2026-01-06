/**
 * DateTime Utilities
 */
import { EventEmitter } from 'events';

export class DateTimeUtils extends EventEmitter {
    private static instance: DateTimeUtils;
    private constructor() { super(); }
    static getInstance(): DateTimeUtils { if (!DateTimeUtils.instance) DateTimeUtils.instance = new DateTimeUtils(); return DateTimeUtils.instance; }

    now(): string { return new Date().toISOString(); }
    unix(): number { return Math.floor(Date.now() / 1000); }
    format(date: Date | string, fmt = 'YYYY-MM-DD HH:mm:ss'): string {
        const d = new Date(date);
        return fmt.replace('YYYY', d.getFullYear().toString()).replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
            .replace('DD', d.getDate().toString().padStart(2, '0')).replace('HH', d.getHours().toString().padStart(2, '0'))
            .replace('mm', d.getMinutes().toString().padStart(2, '0')).replace('ss', d.getSeconds().toString().padStart(2, '0'));
    }
    parse(str: string): Date { return new Date(str); }
    diff(a: Date | string, b: Date | string): number { return new Date(a).getTime() - new Date(b).getTime(); }
    addDays(date: Date | string, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
    isValid(date: string): boolean { return !isNaN(new Date(date).getTime()); }
}

export function getDateTimeUtils(): DateTimeUtils { return DateTimeUtils.getInstance(); }
