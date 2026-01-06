/**
 * Quantum Registry
 */
import { EventEmitter } from 'events';
export class QuantumRegistry<T> extends EventEmitter {
    private static instance: QuantumRegistry<unknown>;
    private registry: Map<string, T> = new Map();
    private constructor() { super(); }
    static getInstance<T>(): QuantumRegistry<T> { if (!QuantumRegistry.instance) QuantumRegistry.instance = new QuantumRegistry<unknown>(); return QuantumRegistry.instance as QuantumRegistry<T>; }
    register(key: string, value: T): void { this.registry.set(key, value); }
    get(key: string): T | undefined { return this.registry.get(key); }
    has(key: string): boolean { return this.registry.has(key); }
    unregister(key: string): boolean { return this.registry.delete(key); }
    getAll(): Map<string, T> { return new Map(this.registry); }
    getStats(): { registered: number } { return { registered: this.registry.size }; }
}
export const quantumRegistry = QuantumRegistry.getInstance();
