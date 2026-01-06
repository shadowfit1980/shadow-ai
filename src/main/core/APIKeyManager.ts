/**
 * API Key Manager
 * Secure storage and management of API keys for multiple providers
 * Enables Cursor-like BYOK (Bring Your Own Key) functionality
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export interface APIProvider {
    id: string;
    name: string;
    baseUrl: string;
    models: string[];
    requiresKey: boolean;
    keyFormat?: RegExp;
    keyPrefix?: string;
}

export interface StoredKey {
    provider: string;
    encryptedKey: string;
    iv: string;
    addedAt: number;
    lastUsed?: number;
    isValid?: boolean;
}

export interface KeyValidationResult {
    valid: boolean;
    message: string;
    models?: string[];
}

// Supported providers
export const SUPPORTED_PROVIDERS: APIProvider[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
        requiresKey: true,
        keyPrefix: 'sk-',
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3.5-sonnet'],
        requiresKey: true,
        keyPrefix: 'sk-ant-',
    },
    {
        id: 'google',
        name: 'Google AI',
        baseUrl: 'https://generativelanguage.googleapis.com',
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-2.0-flash'],
        requiresKey: true,
    },
    {
        id: 'mistral',
        name: 'Mistral AI',
        baseUrl: 'https://api.mistral.ai/v1',
        models: ['mistral-large', 'mistral-medium', 'mistral-small', 'mixtral-8x7b'],
        requiresKey: true,
    },
    {
        id: 'groq',
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        models: ['llama3-70b', 'llama3-8b', 'mixtral-8x7b', 'gemma-7b'],
        requiresKey: true,
        keyPrefix: 'gsk_',
    },
    {
        id: 'cohere',
        name: 'Cohere',
        baseUrl: 'https://api.cohere.ai',
        models: ['command', 'command-light', 'command-r', 'command-r-plus'],
        requiresKey: true,
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        baseUrl: 'http://localhost:11434',
        models: ['llama3', 'mistral', 'codellama', 'mixtral'],
        requiresKey: false,
    },
    {
        id: 'custom',
        name: 'Custom Provider',
        baseUrl: '',
        models: [],
        requiresKey: true,
    },
];

/**
 * APIKeyManager
 * Securely stores and manages API keys for multiple AI providers
 */
export class APIKeyManager extends EventEmitter {
    private static instance: APIKeyManager;
    private store: Store;
    private encryptionKey: Buffer;
    private memoryCache: Map<string, string> = new Map();

    private constructor() {
        super();

        // Initialize encrypted store
        this.store = new Store({
            name: 'shadow-ai-keys',
            encryptionKey: 'shadow-ai-secure-key-storage',
        });

        // Derive encryption key from machine-specific data
        const machineId = this.getMachineId();
        this.encryptionKey = scryptSync(machineId, 'shadow-ai-salt', 32);
    }

    static getInstance(): APIKeyManager {
        if (!APIKeyManager.instance) {
            APIKeyManager.instance = new APIKeyManager();
        }
        return APIKeyManager.instance;
    }

    /**
     * Store an API key
     */
    async setKey(providerId: string, key: string): Promise<void> {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        // Encrypt the key
        const { encrypted, iv } = this.encrypt(key);

        // Store encrypted key
        const storedKey: StoredKey = {
            provider: providerId,
            encryptedKey: encrypted,
            iv,
            addedAt: Date.now(),
        };

        const keys = this.getAllStoredKeys();
        keys[providerId] = storedKey;
        this.store.set('apiKeys', keys);

        // Update memory cache
        this.memoryCache.set(providerId, key);

        this.emit('keyAdded', { provider: providerId });
    }

    /**
     * Retrieve an API key
     */
    async getKey(providerId: string): Promise<string | null> {
        // Check memory cache first
        if (this.memoryCache.has(providerId)) {
            return this.memoryCache.get(providerId)!;
        }

        // Get from storage
        const keys = this.getAllStoredKeys();
        const storedKey = keys[providerId];

        if (!storedKey) {
            return null;
        }

        // Decrypt
        try {
            const decrypted = this.decrypt(storedKey.encryptedKey, storedKey.iv);
            this.memoryCache.set(providerId, decrypted);

            // Update last used
            storedKey.lastUsed = Date.now();
            this.store.set('apiKeys', keys);

            return decrypted;
        } catch (error) {
            console.error('Failed to decrypt key:', error);
            return null;
        }
    }

    /**
     * Delete an API key
     */
    async deleteKey(providerId: string): Promise<void> {
        const keys = this.getAllStoredKeys();
        delete keys[providerId];
        this.store.set('apiKeys', keys);

        this.memoryCache.delete(providerId);

        this.emit('keyDeleted', { provider: providerId });
    }

    /**
     * Validate an API key
     */
    async validateKey(providerId: string, key: string): Promise<KeyValidationResult> {
        const provider = this.getProvider(providerId);
        if (!provider) {
            return { valid: false, message: 'Unknown provider' };
        }

        // Check format if specified
        if (provider.keyPrefix && !key.startsWith(provider.keyPrefix)) {
            return {
                valid: false,
                message: `Key should start with ${provider.keyPrefix}`
            };
        }

        // Provider-specific validation
        try {
            switch (providerId) {
                case 'openai':
                    return await this.validateOpenAI(key);
                case 'anthropic':
                    return await this.validateAnthropic(key);
                case 'google':
                    return await this.validateGoogle(key);
                case 'ollama':
                    return await this.validateOllama();
                default:
                    // Generic validation - assume valid if format is ok
                    return { valid: true, message: 'Key format is valid' };
            }
        } catch (error: any) {
            return { valid: false, message: error.message };
        }
    }

    /**
     * Check if a provider has a stored key
     */
    hasKey(providerId: string): boolean {
        const keys = this.getAllStoredKeys();
        return providerId in keys;
    }

    /**
     * List configured providers
     */
    listConfiguredProviders(): string[] {
        const keys = this.getAllStoredKeys();
        return Object.keys(keys);
    }

    /**
     * List all supported providers
     */
    listProviders(): APIProvider[] {
        return [...SUPPORTED_PROVIDERS];
    }

    /**
     * Get provider by ID
     */
    getProvider(providerId: string): APIProvider | undefined {
        return SUPPORTED_PROVIDERS.find(p => p.id === providerId);
    }

    /**
     * Get key info (without revealing the actual key)
     */
    getKeyInfo(providerId: string): { addedAt?: number; lastUsed?: number; isValid?: boolean } | null {
        const keys = this.getAllStoredKeys();
        const stored = keys[providerId];

        if (!stored) return null;

        return {
            addedAt: stored.addedAt,
            lastUsed: stored.lastUsed,
            isValid: stored.isValid,
        };
    }

    /**
     * Clear all stored keys
     */
    async clearAllKeys(): Promise<void> {
        this.store.set('apiKeys', {});
        this.memoryCache.clear();
        this.emit('keysCleared');
    }

    /**
     * Export keys (encrypted for backup)
     */
    exportKeys(): string {
        const keys = this.getAllStoredKeys();
        return Buffer.from(JSON.stringify(keys)).toString('base64');
    }

    /**
     * Import keys (from backup)
     */
    importKeys(exportedData: string): void {
        try {
            const keys = JSON.parse(Buffer.from(exportedData, 'base64').toString());
            this.store.set('apiKeys', keys);
            this.memoryCache.clear();
            this.emit('keysImported');
        } catch (error) {
            throw new Error('Invalid export data');
        }
    }

    // Private methods

    private getAllStoredKeys(): Record<string, StoredKey> {
        return this.store.get('apiKeys', {}) as Record<string, StoredKey>;
    }

    private encrypt(text: string): { encrypted: string; iv: string } {
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { encrypted, iv: iv.toString('hex') };
    }

    private decrypt(encryptedText: string, ivHex: string): string {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    private getMachineId(): string {
        // In a real implementation, this would use node-machine-id
        // For now, use a combination of platform-specific info
        return `shadow-ai-${process.platform}-${process.arch}`;
    }

    private async validateOpenAI(key: string): Promise<KeyValidationResult> {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${key}` },
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    valid: true,
                    message: 'Key is valid',
                    models: data.data?.map((m: any) => m.id) || [],
                };
            } else {
                const error = await response.json();
                return { valid: false, message: error.error?.message || 'Invalid key' };
            }
        } catch (error: any) {
            return { valid: false, message: `Validation failed: ${error.message}` };
        }
    }

    private async validateAnthropic(key: string): Promise<KeyValidationResult> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            // Even an error response means the key format is valid
            if (response.ok || response.status === 400) {
                return { valid: true, message: 'Key is valid' };
            } else if (response.status === 401) {
                return { valid: false, message: 'Invalid API key' };
            } else {
                return { valid: true, message: 'Key format is valid' };
            }
        } catch (error: any) {
            return { valid: false, message: `Validation failed: ${error.message}` };
        }
    }

    private async validateGoogle(key: string): Promise<KeyValidationResult> {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models?key=${key}`
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    valid: true,
                    message: 'Key is valid',
                    models: data.models?.map((m: any) => m.name) || [],
                };
            } else {
                return { valid: false, message: 'Invalid API key' };
            }
        } catch (error: any) {
            return { valid: false, message: `Validation failed: ${error.message}` };
        }
    }

    private async validateOllama(): Promise<KeyValidationResult> {
        try {
            const response = await fetch('http://localhost:11434/api/tags');

            if (response.ok) {
                const data = await response.json();
                return {
                    valid: true,
                    message: 'Ollama is running',
                    models: data.models?.map((m: any) => m.name) || [],
                };
            } else {
                return { valid: false, message: 'Ollama not responding' };
            }
        } catch (error: any) {
            return { valid: false, message: 'Ollama not running on localhost:11434' };
        }
    }
}

// Singleton getter
export function getAPIKeyManager(): APIKeyManager {
    return APIKeyManager.getInstance();
}
