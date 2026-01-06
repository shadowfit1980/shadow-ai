/**
 * Dimensional Chain
 */
import { EventEmitter } from 'events';
export interface Handler<T> { handle(request: T): T | null; setNext(handler: Handler<T>): Handler<T>; }
export class DimensionalChainHandler<T> extends EventEmitter implements Handler<T> {
    private nextHandler: Handler<T> | null = null;
    setNext(handler: Handler<T>): Handler<T> { this.nextHandler = handler; return handler; }
    handle(request: T): T | null { if (this.nextHandler) return this.nextHandler.handle(request); return null; }
}
export const createChainHandler = <T>() => new DimensionalChainHandler<T>();
