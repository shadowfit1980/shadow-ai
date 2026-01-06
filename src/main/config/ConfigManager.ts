import Store from 'electron-store';
import { encrypt, decrypt } from '../security/encryption';
import { machineIdSync } from 'node-machine-id';
import crypto from 'crypto';

/**
 * Configuration Manager
 * Handles secure storage of API keys and other configuration
 */
export class ConfigManager {
    private static instance: ConfigManager;
    private store: Store;
    private encryptionKey: Buffer;

    private constructor() {
        // Derive encryption key from machine ID for hardware-linked security
        const machineId = machineIdSync();
        const salt = 'shadow-ai-config-salt-v1'; // Fixed salt for consistency
        this.encryptionKey = crypto.scryptSync(machineId, salt, 32);

        try {
            this.store = new Store({
                name: 'shadow-ai-config',
                // Remove hardcoded key - we handle encryption ourselves
            });
        } catch (error: any) {
            // Handle corrupted config file - reset and create fresh store
            console.warn('⚠️ Config file corrupted, resetting to defaults:', error.message);

            // Delete the corrupted config file
            const Store = require('electron-store');
            const path = require('path');
            const fs = require('fs');
            const { app } = require('electron');

            try {
                const configPath = path.join(app.getPath('userData'), 'shadow-ai-config.json');
                if (fs.existsSync(configPath)) {
                    fs.unlinkSync(configPath);
                    console.log('🗑️  Deleted corrupted config file');
                }
            } catch (e) {
                console.error('Failed to delete corrupted config:', e);
            }

            // Create fresh store
            this.store = new Store({
                name: 'shadow-ai-config',
            });
            console.log('✅ Created fresh configuration store');
        }
    }

    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /**
     * Encrypt data using machine-linked key
     */
    private encryptData(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // Prepend IV for decryption
        return iv.toString('base64') + ':' + encrypted;
    }

    /**
     * Decrypt data using machine-linked key
     */
    private decryptData(encryptedText: string): string {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'base64');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Set API key for a provider (with encryption)
     */
    setApiKey(provider: string, key: string): void {
        const apiKeys = this.store.get('apiKeys', {}) as { [key: string]: string };
        apiKeys[provider] = this.encryptData(key); // Store encrypted
        this.store.set('apiKeys', apiKeys);
        console.log(`✓ Saved ${provider} API key (encrypted)`);
    }

    /**
     * Get API key for a provider (with decryption)
     */
    getApiKey(provider: string): string | null {
        const apiKeys = this.store.get('apiKeys', {}) as { [key: string]: string };
        const encrypted = apiKeys[provider];

        if (!encrypted) {
            return null;
        }

        try {
            return this.decryptData(encrypted);
        } catch (error) {
            console.error(`Failed to decrypt ${provider} API key:`, error);
            return null;
        }
    }

    /**
     * Get all API keys (decrypted)
     */
    getAllApiKeys(): { [key: string]: string } {
        const apiKeys = this.store.get('apiKeys', {}) as { [key: string]: string };
        const decrypted: { [key: string]: string } = {};

        for (const [provider, encrypted] of Object.entries(apiKeys)) {
            try {
                decrypted[provider] = this.decryptData(encrypted);
            } catch (error) {
                console.error(`Failed to decrypt ${provider} key`);
            }
        }

        return decrypted;
    }

    /**
     * Update multiple API keys at once (with encryption)
     */
    updateApiKeys(keys: { [key: string]: string }): void {
        const currentKeys = this.store.get('apiKeys', {}) as { [key: string]: string };

        for (const [provider, key] of Object.entries(keys)) {
            if (key && key.trim() !== '') {
                currentKeys[provider] = this.encryptData(key); // Store encrypted
            }
        }

        this.store.set('apiKeys', currentKeys);
        console.log('✓ Updated API keys (encrypted):', Object.keys(currentKeys));
    }
    /**
     * Delete an API key
     */
    deleteApiKey(provider: string): void {
        this.store.delete(`apiKeys.${provider}`);
    }

    /**
     * Clear all API keys
     */
    clearAllApiKeys(): void {
        this.store.delete('apiKeys');
    }

    /**
     * Get a configuration value
     */
    get(key: string, defaultValue?: any): any {
        return this.store.get(key, defaultValue);
    }

    /**
     * Set a configuration value
     */
    set(key: string, value: any): void {
        this.store.set(key, value);
    }

    /**
     * Delete a configuration value
     */
    delete(key: string): void {
        this.store.delete(key);
    }

    /**
     * Check if configuration has a specific key
     */
    has(key: string): boolean {
        return this.store.has(key);
    }

    /**
     * Get all configuration
     */
    getAll(): any {
        return this.store.store;
    }

    /**
     * Clear all configuration
     */
    clear(): void {
        this.store.clear();
    }
}
