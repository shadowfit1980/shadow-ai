/**
 * Cosmic Compose
 */
import { EventEmitter } from 'events';
export class CosmicCompose extends EventEmitter {
    private static instance: CosmicCompose;
    private constructor() { super(); }
    static getInstance(): CosmicCompose { if (!CosmicCompose.instance) { CosmicCompose.instance = new CosmicCompose(); } return CosmicCompose.instance; }
    compose<T>(...fns: ((arg: T) => T)[]): (arg: T) => T { return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg); }
    pipe<T>(...fns: ((arg: T) => T)[]): (arg: T) => T { return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg); }
    getStats(): { composed: number } { return { composed: 0 }; }
}
export const cosmicCompose = CosmicCompose.getInstance();
