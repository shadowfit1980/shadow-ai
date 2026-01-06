/**
 * Mystic Null Object
 */
import { EventEmitter } from 'events';
export interface NullableObject { isNull(): boolean; doSomething(): void; }
export class MysticNullObject extends EventEmitter implements NullableObject {
    isNull(): boolean { return true; }
    doSomething(): void { /* do nothing */ }
}
export class MysticRealObject extends EventEmitter implements NullableObject {
    isNull(): boolean { return false; }
    doSomething(): void { this.emit('action'); }
}
export const createNullObject = () => new MysticNullObject();
export const createRealObject = () => new MysticRealObject();
