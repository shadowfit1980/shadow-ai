/**
 * Astral Facade
 */
import { EventEmitter } from 'events';
export class AstralFacade extends EventEmitter {
    private subsystems: Map<string, object> = new Map();
    register(name: string, subsystem: object): void { this.subsystems.set(name, subsystem); }
    get<T extends object>(name: string): T | undefined { return this.subsystems.get(name) as T | undefined; }
    execute<T>(name: string, method: string, ...args: unknown[]): T | null { const subsystem = this.subsystems.get(name) as Record<string, (...args: unknown[]) => T>; return subsystem?.[method]?.(...args) ?? null; }
}
export const createFacade = () => new AstralFacade();
