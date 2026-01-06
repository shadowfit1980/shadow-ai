/**
 * API Key Rotation - Secure key management
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface ApiKey { id: string; name: string; key: string; createdAt: number; expiresAt: number; rotationDays: number; usageCount: number; }

export class ApiKeyRotation extends EventEmitter {
    private static instance: ApiKeyRotation;
    private keys: Map<string, ApiKey> = new Map();
    private constructor() { super(); }
    static getInstance(): ApiKeyRotation { if (!ApiKeyRotation.instance) ApiKeyRotation.instance = new ApiKeyRotation(); return ApiKeyRotation.instance; }

    create(name: string, rotationDays = 30): ApiKey {
        const key: ApiKey = { id: `key_${Date.now()}`, name, key: `sk-${crypto.randomBytes(32).toString('hex')}`, createdAt: Date.now(), expiresAt: Date.now() + rotationDays * 86400000, rotationDays, usageCount: 0 };
        this.keys.set(key.id, key);
        return key;
    }

    rotate(id: string): ApiKey | null { const k = this.keys.get(id); if (!k) return null; k.key = `sk-${crypto.randomBytes(32).toString('hex')}`; k.createdAt = Date.now(); k.expiresAt = Date.now() + k.rotationDays * 86400000; k.usageCount = 0; this.emit('rotated', k); return k; }
    use(id: string): boolean { const k = this.keys.get(id); if (!k || Date.now() > k.expiresAt) return false; k.usageCount++; return true; }
    revoke(id: string): boolean { return this.keys.delete(id); }
    getExpiring(daysAhead = 7): ApiKey[] { const threshold = Date.now() + daysAhead * 86400000; return Array.from(this.keys.values()).filter(k => k.expiresAt <= threshold); }
    getAll(): ApiKey[] { return Array.from(this.keys.values()); }
}
export function getApiKeyRotation(): ApiKeyRotation { return ApiKeyRotation.getInstance(); }
