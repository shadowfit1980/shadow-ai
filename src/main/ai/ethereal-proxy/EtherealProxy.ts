/**
 * Ethereal Proxy
 */
import { EventEmitter } from 'events';
export class EtherealProxy<T extends object> extends EventEmitter {
    create(target: T, handlers: ProxyHandler<T>): T { return new Proxy(target, handlers); }
}
export const createProxy = <T extends object>(target: T, handlers: ProxyHandler<T>) => new Proxy(target, handlers);
