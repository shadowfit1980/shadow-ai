/**
 * Mystic Is Equal Type
 */
import { EventEmitter } from 'events';
export class MysticIsEqualType extends EventEmitter {
    private static instance: MysticIsEqualType;
    private constructor() { super(); }
    static getInstance(): MysticIsEqualType { if (!MysticIsEqualType.instance) { MysticIsEqualType.instance = new MysticIsEqualType(); } return MysticIsEqualType.instance; }
    isDate(value: unknown): value is Date { return value instanceof Date; }
    isRegExp(value: unknown): value is RegExp { return value instanceof RegExp; }
    isError(value: unknown): value is Error { return value instanceof Error; }
    isPromise(value: unknown): value is Promise<unknown> { return value instanceof Promise; }
    isMap(value: unknown): value is Map<unknown, unknown> { return value instanceof Map; }
    isSet(value: unknown): value is Set<unknown> { return value instanceof Set; }
    getStats(): { checked: number } { return { checked: 0 }; }
}
export const mysticIsEqualType = MysticIsEqualType.getInstance();
