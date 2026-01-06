/**
 * Ethereal Identity
 */
import { EventEmitter } from 'events';
export class EtherealIdentity extends EventEmitter {
    private static instance: EtherealIdentity;
    private constructor() { super(); }
    static getInstance(): EtherealIdentity { if (!EtherealIdentity.instance) { EtherealIdentity.instance = new EtherealIdentity(); } return EtherealIdentity.instance; }
    identity<T>(value: T): T { return value; }
    constant<T>(value: T): () => T { return () => value; }
    noop(): void { /* do nothing */ }
    getStats(): { called: number } { return { called: 0 }; }
}
export const etherealIdentity = EtherealIdentity.getInstance();
