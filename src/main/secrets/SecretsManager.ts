/**
 * Secrets Manager - Secure secrets storage
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export class SecretsManager extends EventEmitter {
    private static instance: SecretsManager;
    private secrets: Map<string, string> = new Map();
    private key = crypto.randomBytes(32);
    private constructor() { super(); }
    static getInstance(): SecretsManager { if (!SecretsManager.instance) SecretsManager.instance = new SecretsManager(); return SecretsManager.instance; }

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
        return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    }

    private decrypt(text: string): string {
        const [ivHex, encrypted] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
        return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    }

    set(key: string, value: string): void { this.secrets.set(key, this.encrypt(value)); this.emit('set', key); }
    get(key: string): string | null { const enc = this.secrets.get(key); return enc ? this.decrypt(enc) : null; }
    has(key: string): boolean { return this.secrets.has(key); }
    delete(key: string): boolean { return this.secrets.delete(key); }
    list(): string[] { return Array.from(this.secrets.keys()); }
}

export function getSecretsManager(): SecretsManager { return SecretsManager.getInstance(); }
