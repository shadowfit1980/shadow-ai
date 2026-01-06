/**
 * Ethereal Bridge
 */
import { EventEmitter } from 'events';
export interface Implementation { operationImpl(): string; }
export class EtherealBridge extends EventEmitter {
    private implementation: Implementation;
    constructor(implementation: Implementation) { super(); this.implementation = implementation; }
    setImplementation(implementation: Implementation): void { this.implementation = implementation; }
    operation(): string { return this.implementation.operationImpl(); }
}
export const createBridge = (impl: Implementation) => new EtherealBridge(impl);
