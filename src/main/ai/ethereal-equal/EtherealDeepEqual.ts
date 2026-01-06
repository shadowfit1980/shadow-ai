/**
 * Ethereal Deep Equal
 */
import { EventEmitter } from 'events';
export class EtherealDeepEqual extends EventEmitter {
    private static instance: EtherealDeepEqual;
    private constructor() { super(); }
    static getInstance(): EtherealDeepEqual { if (!EtherealDeepEqual.instance) { EtherealDeepEqual.instance = new EtherealDeepEqual(); } return EtherealDeepEqual.instance; }
    deepEqual(a: unknown, b: unknown): boolean { if (a === b) return true; if (typeof a !== typeof b) return false; if (a === null || b === null) return a === b; if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => this.deepEqual(v, b[i])); if (typeof a === 'object' && typeof b === 'object') { const keysA = Object.keys(a as object), keysB = Object.keys(b as object); return keysA.length === keysB.length && keysA.every(k => this.deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])); } return false; }
    getStats(): { compared: number } { return { compared: 0 }; }
}
export const etherealDeepEqual = EtherealDeepEqual.getInstance();
