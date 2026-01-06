/**
 * Diff Engine - Text comparison
 */
import { EventEmitter } from 'events';

export interface DiffResult { added: string[]; removed: string[]; unchanged: string[]; }

export class DiffEngine extends EventEmitter {
    private static instance: DiffEngine;
    private constructor() { super(); }
    static getInstance(): DiffEngine { if (!DiffEngine.instance) DiffEngine.instance = new DiffEngine(); return DiffEngine.instance; }

    diffLines(a: string, b: string): DiffResult {
        const linesA = a.split('\n'), linesB = b.split('\n');
        const setA = new Set(linesA), setB = new Set(linesB);
        return {
            added: linesB.filter(l => !setA.has(l)),
            removed: linesA.filter(l => !setB.has(l)),
            unchanged: linesA.filter(l => setB.has(l))
        };
    }

    diffWords(a: string, b: string): DiffResult {
        const wordsA = a.split(/\s+/), wordsB = b.split(/\s+/);
        const setA = new Set(wordsA), setB = new Set(wordsB);
        return { added: wordsB.filter(w => !setA.has(w)), removed: wordsA.filter(w => !setB.has(w)), unchanged: wordsA.filter(w => setB.has(w)) };
    }
}

export function getDiffEngine(): DiffEngine { return DiffEngine.getInstance(); }
