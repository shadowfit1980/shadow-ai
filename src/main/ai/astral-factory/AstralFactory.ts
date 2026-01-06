/**
 * Astral Factory
 */
import { EventEmitter } from 'events';
export class AstralFactory<T> extends EventEmitter {
    private creators: Map<string, () => T> = new Map();
    register(type: string, creator: () => T): void { this.creators.set(type, creator); }
    create(type: string): T | null { const creator = this.creators.get(type); return creator ? creator() : null; }
    getTypes(): string[] { return [...this.creators.keys()]; }
}
export const createFactory = <T>() => new AstralFactory<T>();
