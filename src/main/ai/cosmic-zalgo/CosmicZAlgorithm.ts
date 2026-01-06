/**
 * Cosmic Z Algorithm
 */
import { EventEmitter } from 'events';
export class CosmicZAlgorithm extends EventEmitter {
    private static instance: CosmicZAlgorithm;
    private constructor() { super(); }
    static getInstance(): CosmicZAlgorithm { if (!CosmicZAlgorithm.instance) { CosmicZAlgorithm.instance = new CosmicZAlgorithm(); } return CosmicZAlgorithm.instance; }
    private computeZ(str: string): number[] { const z = new Array(str.length).fill(0); let l = 0, r = 0; for (let i = 1; i < str.length; i++) { if (i < r) z[i] = Math.min(r - i, z[i - l]); while (i + z[i] < str.length && str[z[i]] === str[i + z[i]]) z[i]++; if (i + z[i] > r) { l = i; r = i + z[i]; } } return z; }
    search(text: string, pattern: string): number[] { const concat = pattern + '$' + text; const z = this.computeZ(concat); const indices: number[] = []; for (let i = pattern.length + 1; i < concat.length; i++) if (z[i] === pattern.length) indices.push(i - pattern.length - 1); return indices; }
    getStats(): { searched: number } { return { searched: 0 }; }
}
export const cosmicZAlgorithm = CosmicZAlgorithm.getInstance();
