/**
 * PII Guardrails
 * Middleware for detecting and masking Personally Identifiable Information
 * Prevents sensitive data from reaching LLMs or being displayed
 */

import { EventEmitter } from 'events';

export interface PIIEntity {
    type: PIIType;
    value: string;
    masked: string;
    start: number;
    end: number;
    confidence: number;
}

export enum PIIType {
    SSN = 'ssn',
    CREDIT_CARD = 'credit_card',
    EMAIL = 'email',
    PHONE = 'phone',
    ADDRESS = 'address',
    NAME = 'name',
    DOB = 'date_of_birth',
    PASSPORT = 'passport',
    DRIVER_LICENSE = 'driver_license',
    BANK_ACCOUNT = 'bank_account',
    IP_ADDRESS = 'ip_address',
    API_KEY = 'api_key',
}

export interface GuardrailsConfig {
    enabledTypes: PIIType[];
    maskCharacter?: string;
    preserveLength?: boolean;
    logDetections?: boolean;
    blockOnDetection?: boolean;
}

export interface GuardrailsResult {
    original: string;
    masked: string;
    entities: PIIEntity[];
    blocked: boolean;
    processingTime: number;
}

/**
 * PIIGuardrails
 * Detects and masks sensitive information
 */
export class PIIGuardrails extends EventEmitter {
    private static instance: PIIGuardrails;
    private config: GuardrailsConfig;
    private patterns: Map<PIIType, RegExp[]> = new Map();
    private detectionCount: Map<PIIType, number> = new Map();

    private constructor() {
        super();
        this.config = {
            enabledTypes: Object.values(PIIType) as PIIType[],
            maskCharacter: '*',
            preserveLength: true,
            logDetections: true,
            blockOnDetection: false,
        };
        this.initializePatterns();
    }

    static getInstance(): PIIGuardrails {
        if (!PIIGuardrails.instance) {
            PIIGuardrails.instance = new PIIGuardrails();
        }
        return PIIGuardrails.instance;
    }

    /**
     * Configure guardrails settings
     */
    configure(config: Partial<GuardrailsConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configured', this.config);
    }

    /**
     * Process text and mask PII
     */
    mask(text: string): GuardrailsResult {
        const startTime = Date.now();
        const entities: PIIEntity[] = [];
        let masked = text;

        for (const type of this.config.enabledTypes) {
            const patterns = this.patterns.get(type) || [];

            for (const pattern of patterns) {
                let match;
                const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');

                while ((match = regex.exec(text)) !== null) {
                    const value = match[0];
                    const maskedValue = this.generateMask(value, type);

                    entities.push({
                        type,
                        value,
                        masked: maskedValue,
                        start: match.index,
                        end: match.index + value.length,
                        confidence: this.calculateConfidence(type, value),
                    });

                    // Track detection
                    this.detectionCount.set(type, (this.detectionCount.get(type) || 0) + 1);
                }
            }
        }

        // Sort entities by position (reverse to replace from end)
        entities.sort((a, b) => b.start - a.start);

        // Apply masks
        for (const entity of entities) {
            masked = masked.substring(0, entity.start) + entity.masked + masked.substring(entity.end);
        }

        const result: GuardrailsResult = {
            original: text,
            masked,
            entities: entities.sort((a, b) => a.start - b.start),
            blocked: this.config.blockOnDetection && entities.length > 0,
            processingTime: Date.now() - startTime,
        };

        if (this.config.logDetections && entities.length > 0) {
            console.log(`[PIIGuardrails] Detected ${entities.length} PII entities`);
            this.emit('detection', result);
        }

        return result;
    }

    /**
     * Check if text contains PII (without masking)
     */
    containsPII(text: string): boolean {
        for (const type of this.config.enabledTypes) {
            const patterns = this.patterns.get(type) || [];
            for (const pattern of patterns) {
                if (pattern.test(text)) return true;
            }
        }
        return false;
    }

    /**
     * Detect PII entities without masking
     */
    detect(text: string): PIIEntity[] {
        return this.mask(text).entities;
    }

    /**
     * Validate output is safe (no PII)
     */
    validateSafe(text: string): { safe: boolean; reason?: string } {
        const result = this.mask(text);

        if (result.entities.length === 0) {
            return { safe: true };
        }

        const types = [...new Set(result.entities.map(e => e.type))];
        return {
            safe: false,
            reason: `Contains ${types.join(', ')} data`,
        };
    }

    /**
     * Detect potential jailbreak attempts
     */
    detectJailbreak(prompt: string): { detected: boolean; patterns: string[] } {
        const jailbreakPatterns = [
            /ignore (all |previous |your )?instructions/i,
            /you are now/i,
            /pretend (to be|you're|you are)/i,
            /forget (everything|all|your)/i,
            /disable (safety|content|filter)/i,
            /bypass (restrictions|rules|guidelines)/i,
            /roleplay as/i,
            /act as (if|though)/i,
            /do anything now/i,
            /DAN|STAN|DUDE/i,
            /\[jailbreak\]/i,
            /system prompt/i,
            /reveal (your|the) (prompt|instructions)/i,
        ];

        const detected: string[] = [];

        for (const pattern of jailbreakPatterns) {
            if (pattern.test(prompt)) {
                detected.push(pattern.source);
            }
        }

        return {
            detected: detected.length > 0,
            patterns: detected,
        };
    }

    /**
     * Get detection statistics
     */
    getStats(): Record<string, number> {
        const stats: Record<string, number> = {};
        for (const [type, count] of this.detectionCount) {
            stats[type] = count;
        }
        return stats;
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.detectionCount.clear();
    }

    // Private methods

    private initializePatterns(): void {
        // Social Security Number
        this.patterns.set(PIIType.SSN, [
            /\b\d{3}-\d{2}-\d{4}\b/,
            /\b\d{9}\b(?=\D|$)/,
        ]);

        // Credit Card Numbers
        this.patterns.set(PIIType.CREDIT_CARD, [
            /\b4[0-9]{12}(?:[0-9]{3})?\b/, // Visa
            /\b5[1-5][0-9]{14}\b/, // Mastercard
            /\b3[47][0-9]{13}\b/, // Amex
            /\b6(?:011|5[0-9]{2})[0-9]{12}\b/, // Discover
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Generic with separators
        ]);

        // Email Addresses
        this.patterns.set(PIIType.EMAIL, [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
        ]);

        // Phone Numbers
        this.patterns.set(PIIType.PHONE, [
            /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/,
            /\b\+?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}\b/,
        ]);

        // IP Addresses
        this.patterns.set(PIIType.IP_ADDRESS, [
            /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
        ]);

        // API Keys (common patterns)
        this.patterns.set(PIIType.API_KEY, [
            /\b(sk-[a-zA-Z0-9]{32,})\b/, // OpenAI
            /\b(xoxb-[a-zA-Z0-9-]+)\b/, // Slack
            /\b(ghp_[a-zA-Z0-9]{36})\b/, // GitHub
            /\b(AKIA[0-9A-Z]{16})\b/, // AWS Access Key
        ]);

        // Bank Account (simplified)
        this.patterns.set(PIIType.BANK_ACCOUNT, [
            /\b[0-9]{8,17}\b/, // Account number pattern
        ]);

        // Date of Birth
        this.patterns.set(PIIType.DOB, [
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](19|20)\d{2}\b/,
            /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/,
        ]);
    }

    private generateMask(value: string, type: PIIType): string {
        const char = this.config.maskCharacter || '*';

        if (this.config.preserveLength) {
            // Preserve some characters based on type
            switch (type) {
                case PIIType.CREDIT_CARD:
                    // Show last 4 digits
                    return char.repeat(value.length - 4) + value.slice(-4);
                case PIIType.SSN:
                    // Show last 4 digits
                    return char.repeat(value.length - 4) + value.slice(-4);
                case PIIType.EMAIL:
                    // Show first char and domain
                    const [local, domain] = value.split('@');
                    return local[0] + char.repeat(local.length - 1) + '@' + domain;
                case PIIType.PHONE:
                    // Show area code
                    return value.slice(0, 4) + char.repeat(value.length - 4);
                default:
                    return char.repeat(value.length);
            }
        }

        return `[${type.toUpperCase()}]`;
    }

    private calculateConfidence(type: PIIType, value: string): number {
        // Higher confidence for well-formed patterns
        switch (type) {
            case PIIType.SSN:
                return value.includes('-') ? 0.95 : 0.7;
            case PIIType.CREDIT_CARD:
                return this.luhnCheck(value.replace(/\D/g, '')) ? 0.98 : 0.6;
            case PIIType.EMAIL:
                return 0.95;
            case PIIType.PHONE:
                return value.length >= 10 ? 0.85 : 0.6;
            default:
                return 0.75;
        }
    }

    private luhnCheck(num: string): boolean {
        let sum = 0;
        let isEven = false;

        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num[i], 10);

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }
}

// Singleton getter
export function getPIIGuardrails(): PIIGuardrails {
    return PIIGuardrails.getInstance();
}
