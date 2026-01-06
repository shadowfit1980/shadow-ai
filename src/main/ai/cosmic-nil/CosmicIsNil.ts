/**
 * Cosmic Is Nil
 */
import { EventEmitter } from 'events';
export class CosmicIsNil extends EventEmitter {
    private static instance: CosmicIsNil;
    private constructor() { super(); }
    static getInstance(): CosmicIsNil { if (!CosmicIsNil.instance) { CosmicIsNil.instance = new CosmicIsNil(); } return CosmicIsNil.instance; }
    isNull(value: unknown): value is null { return value === null; }
    isUndefined(value: unknown): value is undefined { return value === undefined; }
    isNil(value: unknown): value is null | undefined { return value == null; }
    getStats(): { checked: number } { return { checked: 0 }; }
}
export const cosmicIsNil = CosmicIsNil.getInstance();
