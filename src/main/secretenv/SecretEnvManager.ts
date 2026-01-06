/**
 * Secret Environment Manager - Secure env vars
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface SecretEnv { key: string; encryptedValue: string; createdAt: number; lastUsed?: number; }

export class SecretEnvManager extends EventEmitter {
    private static instance: SecretEnvManager;
    private secrets: Map<string, SecretEnv> = new Map();
    private encryptionKey = crypto.randomBytes(32);
    private constructor() { super(); }
    static getInstance(): SecretEnvManager { if (!SecretEnvManager.instance) SecretEnvManager.instance = new SecretEnvManager(); return SecretEnvManager.instance; }

    set(key: string, value: string): SecretEnv {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const secret: SecretEnv = { key, encryptedValue: iv.toString('hex') + ':' + encrypted, createdAt: Date.now() };
        this.secrets.set(key, secret);
        this.emit('set', key);
        return secret;
    }

    get(key: string): string | null {
        const secret = this.secrets.get(key); if (!secret) return null;
        const [ivHex, encrypted] = secret.encryptedValue.split(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, Buffer.from(ivHex, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        secret.lastUsed = Date.now();
        return decrypted;
    }

    delete(key: string): boolean { return this.secrets.delete(key); }
    list(): string[] { return Array.from(this.secrets.keys()); }
}
export function getSecretEnvManager(): SecretEnvManager { return SecretEnvManager.getInstance(); }
