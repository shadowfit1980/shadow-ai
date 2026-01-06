/**
 * Mystic Adapter
 */
import { EventEmitter } from 'events';
export class MysticAdapter<TSource, TTarget> extends EventEmitter {
    private adapter: (source: TSource) => TTarget;
    constructor(adapter: (source: TSource) => TTarget) { super(); this.adapter = adapter; }
    adapt(source: TSource): TTarget { return this.adapter(source); }
    adaptMany(sources: TSource[]): TTarget[] { return sources.map(s => this.adapter(s)); }
}
export const createAdapter = <S, T>(adapter: (source: S) => T) => new MysticAdapter<S, T>(adapter);
