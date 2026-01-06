/**
 * Void Code Crusher
 * 
 * Crushes and compacts code into its most dense form,
 * eliminating all unnecessary void and whitespace.
 */

import { EventEmitter } from 'events';

export interface CrushResult {
    id: string;
    originalCode: string;
    crushedCode: string;
    originalSize: number;
    crushedSize: number;
    compressionRatio: number;
    voidRemoved: number;
    createdAt: Date;
}

export class VoidCodeCrusher extends EventEmitter {
    private static instance: VoidCodeCrusher;
    private results: Map<string, CrushResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): VoidCodeCrusher {
        if (!VoidCodeCrusher.instance) {
            VoidCodeCrusher.instance = new VoidCodeCrusher();
        }
        return VoidCodeCrusher.instance;
    }

    crush(code: string): CrushResult {
        const originalSize = code.length;

        let crushed = code;

        // Remove comments
        crushed = crushed.replace(/\/\/[^\n]*/g, '');
        crushed = crushed.replace(/\/\*[\s\S]*?\*\//g, '');

        // Remove empty lines
        crushed = crushed.replace(/\n\s*\n/g, '\n');

        // Remove leading/trailing whitespace per line
        crushed = crushed.split('\n').map(l => l.trim()).join('\n');

        // Compact multiple spaces
        crushed = crushed.replace(/\s+/g, ' ');

        const crushedSize = crushed.length;
        const voidRemoved = originalSize - crushedSize;

        const result: CrushResult = {
            id: `crush_${Date.now()}`,
            originalCode: code,
            crushedCode: crushed,
            originalSize,
            crushedSize,
            compressionRatio: crushedSize / originalSize,
            voidRemoved,
            createdAt: new Date(),
        };

        this.results.set(result.id, result);
        this.emit('code:crushed', result);
        return result;
    }

    getResult(id: string): CrushResult | undefined {
        return this.results.get(id);
    }

    getStats(): { total: number; avgCompression: number; totalVoidRemoved: number } {
        const results = Array.from(this.results.values());
        const totalVoid = results.reduce((s, r) => s + r.voidRemoved, 0);

        return {
            total: results.length,
            avgCompression: results.length > 0
                ? results.reduce((s, r) => s + r.compressionRatio, 0) / results.length
                : 0,
            totalVoidRemoved: totalVoid,
        };
    }
}

export const voidCodeCrusher = VoidCodeCrusher.getInstance();
