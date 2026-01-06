/**
 * Astral Deep Clone
 */
import { EventEmitter } from 'events';
export class AstralDeepClone extends EventEmitter {
    private static instance: AstralDeepClone;
    private constructor() { super(); }
    static getInstance(): AstralDeepClone { if (!AstralDeepClone.instance) { AstralDeepClone.instance = new AstralDeepClone(); } return AstralDeepClone.instance; }
    deepClone<T>(obj: T): T { if (obj === null || typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as T; const clone = {} as T; for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) clone[key] = this.deepClone(obj[key]); return clone; }
    getStats(): { cloned: number } { return { cloned: 0 }; }
}
export const astralDeepClone = AstralDeepClone.getInstance();
