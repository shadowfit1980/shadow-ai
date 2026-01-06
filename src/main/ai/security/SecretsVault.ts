/**
 * SecretsVault - Secure Secrets Management
 * 
 * Encrypted at-rest storage for API keys and sensitive data
 * Uses Electron's safeStorage for encryption when available
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { app, safeStorage } from 'electron';

// ============================================================================
// TYPES
// ============================================================================

export interface SecretEntry {
    key: string;
    encryptedValue: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    rotationDue?: Date;
    accessCount: number;
    lastAccessed?: Date;
    metadata?: Record<string, string>;
}

export interface AuditLogEntry {
    timestamp: Date;
    action: 'read' | 'write' | 'delete' | 'rotate';
    secretKey: string;
    source: string;
    success: boolean;
    error?: string;
}

export interface VaultConfig {
    vaultPath?: string;
    rotationInterval: number; // days
    auditRetentionDays: number;
    enableEncryption: boolean;
}

// ============================================================================
// SECRETS VAULT
// ============================================================================

export class SecretsVault extends EventEmitter {
    private static instance: SecretsVault;

    private config: VaultConfig = {
        rotationInterval: 90,
        auditRetentionDays: 365,
        enableEncryption: true
    };

    private secrets: Map<string, SecretEntry> = new Map();
    private auditLog: AuditLogEntry[] = [];
    private encryptionKey: Buffer | null = null;
    private initialized = false;

    private constructor() {
        super();
    }

    static getInstance(): SecretsVault {
        if (!SecretsVault.instance) {
            SecretsVault.instance = new SecretsVault();
        }
        return SecretsVault.instance;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async initialize(config?: Partial<VaultConfig>): Promise<void> {
        if (this.initialized) return;

        if (config) {
            this.config = { ...this.config, ...config };
        }

        // Set vault path
        if (!this.config.vaultPath) {
            const userDataPath = app?.getPath('userData') || '/tmp';
            this.config.vaultPath = path.join(userDataPath, '.vault');
        }

        // Ensure vault directory exists
        await fs.mkdir(this.config.vaultPath, { recursive: true });

        // Initialize encryption
        await this.initializeEncryption();

        // Load existing secrets
        await this.loadSecrets();

        // Import from environment variables (fallback)
        this.importFromEnv();

        this.initialized = true;
        console.log('🔐 [SecretsVault] Initialized');
    }

    private async initializeEncryption(): Promise<void> {
        // Check if Electron's safeStorage is available
        if (this.config.enableEncryption && safeStorage?.isEncryptionAvailable?.()) {
            console.log('🔐 [SecretsVault] Using Electron safeStorage');
        } else {
            // Fallback to file-based key
            const keyPath = path.join(this.config.vaultPath!, '.key');
            try {
                const keyData = await fs.readFile(keyPath);
                this.encryptionKey = keyData;
            } catch {
                // Generate new key
                this.encryptionKey = crypto.randomBytes(32);
                await fs.writeFile(keyPath, this.encryptionKey, { mode: 0o600 });
            }
        }
    }

    // ========================================================================
    // SECRET MANAGEMENT
    // ========================================================================

    /**
     * Store a secret securely
     */
    async setSecret(
        key: string,
        value: string,
        options?: {
            expiresIn?: number; // days
            metadata?: Record<string, string>;
        }
    ): Promise<void> {
        await this.ensureInitialized();

        const existing = this.secrets.get(key);
        const now = new Date();

        const entry: SecretEntry = {
            key,
            encryptedValue: await this.encrypt(value),
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            accessCount: existing?.accessCount || 0,
            metadata: options?.metadata
        };

        if (options?.expiresIn) {
            entry.expiresAt = new Date(now.getTime() + options.expiresIn * 24 * 60 * 60 * 1000);
        }

        // Set rotation due date
        entry.rotationDue = new Date(
            now.getTime() + this.config.rotationInterval * 24 * 60 * 60 * 1000
        );

        this.secrets.set(key, entry);
        await this.saveSecrets();

        this.logAudit('write', key, 'setSecret', true);
        this.emit('secret:set', { key });
    }

    /**
     * Retrieve a secret
     */
    async getSecret(key: string, source: string = 'unknown'): Promise<string | null> {
        await this.ensureInitialized();

        const entry = this.secrets.get(key);

        if (!entry) {
            // Fallback to environment variable
            const envValue = process.env[key];
            if (envValue) {
                this.logAudit('read', key, `${source}:env`, true);
                return envValue;
            }
            this.logAudit('read', key, source, false, 'Secret not found');
            return null;
        }

        // Check expiration
        if (entry.expiresAt && new Date() > entry.expiresAt) {
            this.logAudit('read', key, source, false, 'Secret expired');
            this.emit('secret:expired', { key });
            return null;
        }

        // Update access stats
        entry.accessCount++;
        entry.lastAccessed = new Date();

        this.logAudit('read', key, source, true);
        return await this.decrypt(entry.encryptedValue);
    }

    /**
     * Delete a secret
     */
    async deleteSecret(key: string): Promise<boolean> {
        await this.ensureInitialized();

        const deleted = this.secrets.delete(key);
        if (deleted) {
            await this.saveSecrets();
            this.logAudit('delete', key, 'deleteSecret', true);
            this.emit('secret:deleted', { key });
        }
        return deleted;
    }

    /**
     * Rotate a secret (update its value)
     */
    async rotateSecret(key: string, newValue: string): Promise<void> {
        await this.ensureInitialized();

        const entry = this.secrets.get(key);
        if (!entry) {
            throw new Error(`Secret '${key}' not found`);
        }

        entry.encryptedValue = await this.encrypt(newValue);
        entry.updatedAt = new Date();
        entry.rotationDue = new Date(
            Date.now() + this.config.rotationInterval * 24 * 60 * 60 * 1000
        );

        await this.saveSecrets();
        this.logAudit('rotate', key, 'rotateSecret', true);
        this.emit('secret:rotated', { key });
    }

    /**
     * Check which secrets need rotation
     */
    getSecretsNeedingRotation(): string[] {
        const now = new Date();
        return Array.from(this.secrets.values())
            .filter(s => s.rotationDue && s.rotationDue < now)
            .map(s => s.key);
    }

    /**
     * List all secret keys (not values)
     */
    listSecrets(): Array<{
        key: string;
        createdAt: Date;
        lastAccessed?: Date;
        accessCount: number;
        rotationDue?: Date;
        isExpired: boolean;
    }> {
        const now = new Date();
        return Array.from(this.secrets.values()).map(s => ({
            key: s.key,
            createdAt: s.createdAt,
            lastAccessed: s.lastAccessed,
            accessCount: s.accessCount,
            rotationDue: s.rotationDue,
            isExpired: s.expiresAt ? s.expiresAt < now : false
        }));
    }

    // ========================================================================
    // AUDIT LOGGING
    // ========================================================================

    private logAudit(
        action: AuditLogEntry['action'],
        secretKey: string,
        source: string,
        success: boolean,
        error?: string
    ): void {
        const entry: AuditLogEntry = {
            timestamp: new Date(),
            action,
            secretKey,
            source,
            success,
            error
        };

        this.auditLog.push(entry);
        this.emit('audit', entry);

        // Trim old entries
        const cutoff = new Date(
            Date.now() - this.config.auditRetentionDays * 24 * 60 * 60 * 1000
        );
        this.auditLog = this.auditLog.filter(e => e.timestamp > cutoff);
    }

    /**
     * Get audit log entries
     */
    getAuditLog(options?: {
        since?: Date;
        secretKey?: string;
        action?: AuditLogEntry['action'];
        limit?: number
    }): AuditLogEntry[] {
        let filtered = this.auditLog;

        if (options?.since) {
            filtered = filtered.filter(e => e.timestamp >= options.since!);
        }
        if (options?.secretKey) {
            filtered = filtered.filter(e => e.secretKey === options.secretKey);
        }
        if (options?.action) {
            filtered = filtered.filter(e => e.action === options.action);
        }

        return filtered.slice(-(options?.limit || 100));
    }

    // ========================================================================
    // ENCRYPTION
    // ========================================================================

    private async encrypt(value: string): Promise<string> {
        if (!this.config.enableEncryption) {
            return Buffer.from(value).toString('base64');
        }

        // Try Electron safeStorage first
        if (safeStorage?.isEncryptionAvailable?.()) {
            const encrypted = safeStorage.encryptString(value);
            return encrypted.toString('base64');
        }

        // Fallback to AES-256-GCM
        if (this.encryptionKey) {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

            let encrypted = cipher.update(value, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            const authTag = cipher.getAuthTag();

            return Buffer.concat([iv, authTag, encrypted]).toString('base64');
        }

        // No encryption available
        return Buffer.from(value).toString('base64');
    }

    private async decrypt(encrypted: string): Promise<string> {
        if (!this.config.enableEncryption) {
            return Buffer.from(encrypted, 'base64').toString('utf8');
        }

        // Try Electron safeStorage first
        if (safeStorage?.isEncryptionAvailable?.()) {
            try {
                const buffer = Buffer.from(encrypted, 'base64');
                return safeStorage.decryptString(buffer);
            } catch {
                // Fall through to other methods
            }
        }

        // Fallback to AES-256-GCM
        if (this.encryptionKey) {
            try {
                const data = Buffer.from(encrypted, 'base64');
                const iv = data.subarray(0, 16);
                const authTag = data.subarray(16, 32);
                const encryptedData = data.subarray(32);

                const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
                decipher.setAuthTag(authTag);

                let decrypted = decipher.update(encryptedData);
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                return decrypted.toString('utf8');
            } catch {
                // Try base64 fallback
            }
        }

        return Buffer.from(encrypted, 'base64').toString('utf8');
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    private async loadSecrets(): Promise<void> {
        const secretsPath = path.join(this.config.vaultPath!, 'secrets.json');

        try {
            const data = await fs.readFile(secretsPath, 'utf8');
            const parsed = JSON.parse(data);

            for (const entry of parsed.secrets) {
                entry.createdAt = new Date(entry.createdAt);
                entry.updatedAt = new Date(entry.updatedAt);
                if (entry.expiresAt) entry.expiresAt = new Date(entry.expiresAt);
                if (entry.rotationDue) entry.rotationDue = new Date(entry.rotationDue);
                if (entry.lastAccessed) entry.lastAccessed = new Date(entry.lastAccessed);

                this.secrets.set(entry.key, entry);
            }

            console.log(`🔐 [SecretsVault] Loaded ${this.secrets.size} secrets`);
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                console.error('🔐 [SecretsVault] Error loading secrets:', err.message);
            }
        }
    }

    private async saveSecrets(): Promise<void> {
        const secretsPath = path.join(this.config.vaultPath!, 'secrets.json');

        const data = {
            version: 1,
            updatedAt: new Date().toISOString(),
            secrets: Array.from(this.secrets.values())
        };

        await fs.writeFile(secretsPath, JSON.stringify(data, null, 2), { mode: 0o600 });
    }

    // ========================================================================
    // ENVIRONMENT IMPORT
    // ========================================================================

    private importFromEnv(): void {
        const apiKeyPatterns = [
            'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY',
            'GEMINI_API_KEY',
            'GROQ_API_KEY',
            'MISTRAL_API_KEY',
            'DEEPSEEK_API_KEY'
        ];

        for (const key of apiKeyPatterns) {
            const value = process.env[key];
            if (value && !this.secrets.has(key)) {
                // Don't await - just queue it
                this.setSecret(key, value, { metadata: { source: 'environment' } })
                    .catch(err => console.error(`Failed to import ${key}:`, err));
            }
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Get vault statistics
     */
    getStats(): {
        totalSecrets: number;
        expiredSecrets: number;
        secretsNeedingRotation: number;
        auditEntries: number;
    } {
        const now = new Date();
        const expiredCount = Array.from(this.secrets.values())
            .filter(s => s.expiresAt && s.expiresAt < now).length;

        return {
            totalSecrets: this.secrets.size,
            expiredSecrets: expiredCount,
            secretsNeedingRotation: this.getSecretsNeedingRotation().length,
            auditEntries: this.auditLog.length
        };
    }

    /**
     * Clear all secrets (for testing)
     */
    clear(): void {
        this.secrets.clear();
        this.auditLog = [];
    }
}

// Export singleton
export const secretsVault = SecretsVault.getInstance();
