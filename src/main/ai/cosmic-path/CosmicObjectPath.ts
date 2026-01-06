/**
 * Cosmic Object Path
 */
import { EventEmitter } from 'events';
export class CosmicObjectPath extends EventEmitter {
    private static instance: CosmicObjectPath;
    private constructor() { super(); }
    static getInstance(): CosmicObjectPath { if (!CosmicObjectPath.instance) { CosmicObjectPath.instance = new CosmicObjectPath(); } return CosmicObjectPath.instance; }
    get(obj: unknown, path: string, defaultValue?: unknown): unknown { const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.'); let result = obj; for (const key of keys) { if (result == null) return defaultValue; result = (result as Record<string, unknown>)[key]; } return result === undefined ? defaultValue : result; }
    set(obj: object, path: string, value: unknown): void { const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.'); let current: Record<string, unknown> = obj as Record<string, unknown>; for (let i = 0; i < keys.length - 1; i++) { if (!current[keys[i]]) current[keys[i]] = {}; current = current[keys[i]] as Record<string, unknown>; } current[keys[keys.length - 1]] = value; }
    getStats(): { accessed: number } { return { accessed: 0 }; }
}
export const cosmicObjectPath = CosmicObjectPath.getInstance();
