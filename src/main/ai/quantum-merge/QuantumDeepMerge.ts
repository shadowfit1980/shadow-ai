/**
 * Quantum Deep Merge
 */
import { EventEmitter } from 'events';
export class QuantumDeepMerge extends EventEmitter {
    private static instance: QuantumDeepMerge;
    private constructor() { super(); }
    static getInstance(): QuantumDeepMerge { if (!QuantumDeepMerge.instance) { QuantumDeepMerge.instance = new QuantumDeepMerge(); } return QuantumDeepMerge.instance; }
    deepMerge(...objects: Record<string, unknown>[]): Record<string, unknown> {
        return objects.reduce((acc, obj) => {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const val = obj[key];
                    if (val && typeof val === 'object' && !Array.isArray(val)) {
                        acc[key] = this.deepMerge(acc[key] as Record<string, unknown> || {}, val as Record<string, unknown>);
                    } else {
                        acc[key] = val;
                    }
                }
            }
            return acc;
        }, {} as Record<string, unknown>);
    }
    getStats(): { merged: number } { return { merged: 0 }; }
}
export const quantumDeepMerge = QuantumDeepMerge.getInstance();
