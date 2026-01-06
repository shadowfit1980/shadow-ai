/**
 * UUID Generator
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export class UUIDGenerator extends EventEmitter {
    private static instance: UUIDGenerator;
    private constructor() { super(); }
    static getInstance(): UUIDGenerator { if (!UUIDGenerator.instance) UUIDGenerator.instance = new UUIDGenerator(); return UUIDGenerator.instance; }

    v4(): string { return crypto.randomUUID(); }
    generate(count = 1): string[] { return Array.from({ length: count }, () => this.v4()); }
    isValid(uuid: string): boolean { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid); }
    short(): string { return crypto.randomBytes(8).toString('hex'); }
    nano(): string { return `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`; }
}

export function getUUIDGenerator(): UUIDGenerator { return UUIDGenerator.getInstance(); }
