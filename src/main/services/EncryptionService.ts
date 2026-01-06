/**
 * 🔒 Encryption Service
 * 
 * Save file security:
 * - XOR encryption
 * - Base64 encoding
 * - Hash verification
 */

import { EventEmitter } from 'events';

export class EncryptionService extends EventEmitter {
    private static instance: EncryptionService;

    private constructor() { super(); }

    static getInstance(): EncryptionService {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }

    generateEncryptionCode(): string {
        return `
class SaveEncryption {
    constructor(key = 'default_game_key') {
        this.key = key;
    }

    // Simple XOR encryption (for obfuscation, not security)
    xorEncrypt(data, key = this.key) {
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(
                data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }

    // Encrypt save data
    encrypt(data) {
        try {
            const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
            const checksum = this.hash(jsonStr);
            const payload = JSON.stringify({ data: jsonStr, checksum });
            const encrypted = this.xorEncrypt(payload);
            return btoa(encrypted); // Base64 encode
        } catch (e) {
            console.error('Encryption failed:', e);
            return null;
        }
    }

    // Decrypt save data
    decrypt(encryptedData) {
        try {
            const decoded = atob(encryptedData); // Base64 decode
            const decrypted = this.xorEncrypt(decoded); // XOR is symmetric
            const payload = JSON.parse(decrypted);
            
            // Verify checksum
            const checksum = this.hash(payload.data);
            if (checksum !== payload.checksum) {
                console.error('Checksum mismatch - save file may be corrupted or tampered');
                return null;
            }
            
            return JSON.parse(payload.data);
        } catch (e) {
            console.error('Decryption failed:', e);
            return null;
        }
    }

    // Simple hash function
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    // Save encrypted to localStorage
    saveSecure(key, data) {
        const encrypted = this.encrypt(data);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
            return true;
        }
        return false;
    }

    // Load encrypted from localStorage
    loadSecure(key) {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return this.decrypt(encrypted);
    }

    // Generate random key
    generateKey(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Obfuscate values (make cheating harder)
    obfuscateNumber(value, salt = 12345) {
        return (value * 17 + salt) ^ 0xABCD;
    }

    deobfuscateNumber(obfuscated, salt = 12345) {
        return ((obfuscated ^ 0xABCD) - salt) / 17;
    }
}

// Usage example:
// const encryption = new SaveEncryption('my_secret_key');
// 
// // Save
// const saveData = { level: 5, score: 1000 };
// encryption.saveSecure('savegame', saveData);
// 
// // Load
// const loaded = encryption.loadSecure('savegame');
`;
    }
}

export const encryptionService = EncryptionService.getInstance();
