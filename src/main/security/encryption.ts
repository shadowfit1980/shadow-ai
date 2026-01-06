import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Security utilities for Shadow AI
 * Handles encryption, decryption, and secure key management
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class EncryptionService {
    private static instance: EncryptionService;
    private encryptionKey: Buffer | null = null;

    private constructor() {
        this.initializeKey();
    }

    static getInstance(): EncryptionService {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }

    /**
     * Initialize or load encryption key
     */
    private initializeKey(): void {
        const keyFromEnv = process.env.ENCRYPTION_KEY;

        if (keyFromEnv) {
            this.encryptionKey = Buffer.from(keyFromEnv, 'hex');
        } else {
            // Try to load existing key from file
            const { app } = require('electron');
            const keyPath = require('path').join(app.getPath('userData'), '.encryption-key');

            if (require('fs').existsSync(keyPath)) {
                // Load existing key
                this.encryptionKey = require('fs').readFileSync(keyPath);
                console.log('✅ Loaded existing encryption key');
            } else {
                // Generate and persist new key
                this.encryptionKey = crypto.randomBytes(KEY_LENGTH);
                try {
                    require('fs').writeFileSync(keyPath, this.encryptionKey, { mode: 0o600 });
                    console.log('✅ Generated and saved new encryption key');
                } catch (error) {
                    console.error('⚠️  Failed to save encryption key:', error);
                }
            }
            console.warn('For production, set ENCRYPTION_KEY in .env file');
        }
    }

    /**
     * Encrypt sensitive data
     */
    encrypt(text: string): string {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }

        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);

        const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, KEY_LENGTH, 'sha512');
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final(),
        ]);

        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    }

    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedData: string): string {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }

        const buffer = Buffer.from(encryptedData, 'base64');

        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, KEY_LENGTH, 'sha512');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    }

    /**
     * Hash data (one-way)
     */
    hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate secure random token
     */
    generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
}

/**
 * Secure storage for API keys and sensitive data
 */
export class SecureStorage {
    private static instance: SecureStorage;
    private encryption: EncryptionService;
    private storagePath: string;

    private constructor() {
        this.encryption = EncryptionService.getInstance();
        this.storagePath = path.join(process.cwd(), 'user-data', 'secure-store.enc');
        this.ensureStorageDirectory();
    }

    static getInstance(): SecureStorage {
        if (!SecureStorage.instance) {
            SecureStorage.instance = new SecureStorage();
        }
        return SecureStorage.instance;
    }

    private ensureStorageDirectory(): void {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Store encrypted data
     */
    async set(key: string, value: string): Promise<void> {
        const store = await this.loadStore();
        store[key] = this.encryption.encrypt(value);
        await this.saveStore(store);
    }

    /**
     * Retrieve and decrypt data
     */
    async get(key: string): Promise<string | null> {
        const store = await this.loadStore();
        const encrypted = store[key];

        if (!encrypted) {
            return null;
        }

        try {
            return this.encryption.decrypt(encrypted);
        } catch (error) {
            console.error('Failed to decrypt data:', error);
            return null;
        }
    }

    /**
     * Delete data
     */
    async delete(key: string): Promise<void> {
        const store = await this.loadStore();
        delete store[key];
        await this.saveStore(store);
    }

    /**
     * Check if key exists
     */
    async has(key: string): Promise<boolean> {
        const store = await this.loadStore();
        return key in store;
    }

    private async loadStore(): Promise<Record<string, string>> {
        if (!fs.existsSync(this.storagePath)) {
            return {};
        }

        try {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load secure store:', error);
            return {};
        }
    }

    private async saveStore(store: Record<string, string>): Promise<void> {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(store, null, 2), 'utf8');
        } catch (error) {
            console.error('Failed to save secure store:', error);
            throw error;
        }
    }
}

/**
 * Validate and sanitize user input
 */
export class InputValidator {
    /**
     * Sanitize file path to prevent directory traversal
     */
    static sanitizePath(filePath: string): string {
        return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    }

    /**
     * Validate URL
     */
    static isValidUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Sanitize command input
     */
    static sanitizeCommand(command: string): string {
        // Remove potentially dangerous characters
        return command.replace(/[;&|`$()]/g, '');
    }

    /**
     * Validate API key format
     */
    static isValidApiKey(key: string): boolean {
        return /^[a-zA-Z0-9_-]{20,}$/.test(key);
    }
}

/**
 * Convenience functions for encryption/decryption
 */
export function encrypt(text: string): string {
    return EncryptionService.getInstance().encrypt(text);
}

export function decrypt(encryptedData: string): string {
    return EncryptionService.getInstance().decrypt(encryptedData);
}

