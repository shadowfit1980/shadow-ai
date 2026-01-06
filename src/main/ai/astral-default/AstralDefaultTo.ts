/**
 * Astral Default To
 */
import { EventEmitter } from 'events';
export class AstralDefaultTo extends EventEmitter {
    private static instance: AstralDefaultTo;
    private constructor() { super(); }
    static getInstance(): AstralDefaultTo { if (!AstralDefaultTo.instance) { AstralDefaultTo.instance = new AstralDefaultTo(); } return AstralDefaultTo.instance; }
    defaultTo<T>(value: T | null | undefined, defaultValue: T): T { return value ?? defaultValue; }
    getStats(): { defaulted: number } { return { defaulted: 0 }; }
}
export const astralDefaultTo = AstralDefaultTo.getInstance();
