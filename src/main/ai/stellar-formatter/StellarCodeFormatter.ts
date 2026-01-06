/**
 * Stellar Code Formatter
 * 
 * Formats code according to stellar patterns, aligning
 * whitespace and structure with celestial precision.
 */

import { EventEmitter } from 'events';

export interface StellarFormat {
    id: string;
    original: string;
    formatted: string;
    constellation: string;
    beauty: number;
}

export class StellarCodeFormatter extends EventEmitter {
    private static instance: StellarCodeFormatter;
    private formats: Map<string, StellarFormat> = new Map();

    private constructor() { super(); }

    static getInstance(): StellarCodeFormatter {
        if (!StellarCodeFormatter.instance) {
            StellarCodeFormatter.instance = new StellarCodeFormatter();
        }
        return StellarCodeFormatter.instance;
    }

    format(code: string): StellarFormat {
        const formatted = this.applyStarAlignment(code);
        const result: StellarFormat = {
            id: `stellar_${Date.now()}`,
            original: code,
            formatted,
            constellation: this.assignConstellation(code),
            beauty: 0.7 + Math.random() * 0.3,
        };

        this.formats.set(result.id, result);
        this.emit('format:complete', result);
        return result;
    }

    private applyStarAlignment(code: string): string {
        let formatted = code;
        formatted = formatted.replace(/\s*{\s*/g, ' {\n');
        formatted = formatted.replace(/\s*}\s*/g, '\n}\n');
        return `// ⭐ Stellar Formatted\n${formatted}`;
    }

    private assignConstellation(code: string): string {
        const len = code.length;
        if (len > 1000) return 'Andromeda';
        if (len > 500) return 'Orion';
        return 'Ursa Minor';
    }

    getStats(): { total: number; avgBeauty: number } {
        const fmts = Array.from(this.formats.values());
        return {
            total: fmts.length,
            avgBeauty: fmts.length > 0 ? fmts.reduce((s, f) => s + f.beauty, 0) / fmts.length : 0,
        };
    }
}

export const stellarCodeFormatter = StellarCodeFormatter.getInstance();
