/**
 * Code Provenance
 * 
 * Track code origins, license compliance, and attribution.
 * Inspired by Tabnine's code provenance feature.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeOrigin {
    hash: string;
    source: 'ai_generated' | 'copied' | 'modified' | 'original';
    model?: string;
    timestamp: Date;
    similarity?: number;
    matchedRepo?: string;
    license?: string;
}

export interface LicenseInfo {
    spdx: string;
    name: string;
    permissive: boolean;
    copyleft: boolean;
    commercial: boolean;
    attribution: boolean;
}

export interface ProvenanceCheck {
    file: string;
    codeHash: string;
    matches: CodeMatch[];
    recommendation: 'safe' | 'review' | 'risky';
    issues: string[];
}

export interface CodeMatch {
    repo: string;
    file: string;
    similarity: number;
    license: string;
    url?: string;
}

// ============================================================================
// LICENSE DATABASE
// ============================================================================

const LICENSES: Record<string, LicenseInfo> = {
    'MIT': {
        spdx: 'MIT',
        name: 'MIT License',
        permissive: true,
        copyleft: false,
        commercial: true,
        attribution: true,
    },
    'Apache-2.0': {
        spdx: 'Apache-2.0',
        name: 'Apache License 2.0',
        permissive: true,
        copyleft: false,
        commercial: true,
        attribution: true,
    },
    'GPL-3.0': {
        spdx: 'GPL-3.0',
        name: 'GNU General Public License v3.0',
        permissive: false,
        copyleft: true,
        commercial: true,
        attribution: true,
    },
    'BSD-3-Clause': {
        spdx: 'BSD-3-Clause',
        name: 'BSD 3-Clause License',
        permissive: true,
        copyleft: false,
        commercial: true,
        attribution: true,
    },
    'AGPL-3.0': {
        spdx: 'AGPL-3.0',
        name: 'GNU Affero General Public License v3.0',
        permissive: false,
        copyleft: true,
        commercial: true,
        attribution: true,
    },
    'Unlicense': {
        spdx: 'Unlicense',
        name: 'The Unlicense',
        permissive: true,
        copyleft: false,
        commercial: true,
        attribution: false,
    },
};

// ============================================================================
// CODE PROVENANCE
// ============================================================================

export class CodeProvenance extends EventEmitter {
    private static instance: CodeProvenance;
    private origins: Map<string, CodeOrigin> = new Map();
    private allowedLicenses: Set<string> = new Set(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'Unlicense']);

    private constructor() {
        super();
    }

    static getInstance(): CodeProvenance {
        if (!CodeProvenance.instance) {
            CodeProvenance.instance = new CodeProvenance();
        }
        return CodeProvenance.instance;
    }

    // ========================================================================
    // ORIGIN TRACKING
    // ========================================================================

    /**
     * Track the origin of a code snippet
     */
    trackOrigin(code: string, origin: Omit<CodeOrigin, 'hash' | 'timestamp'>): string {
        const hash = this.hashCode(code);

        const fullOrigin: CodeOrigin = {
            ...origin,
            hash,
            timestamp: new Date(),
        };

        this.origins.set(hash, fullOrigin);
        this.emit('origin:tracked', fullOrigin);

        return hash;
    }

    /**
     * Get origin for a code snippet
     */
    getOrigin(code: string): CodeOrigin | undefined {
        const hash = this.hashCode(code);
        return this.origins.get(hash);
    }

    /**
     * Check if code is AI generated
     */
    isAIGenerated(code: string): boolean {
        const origin = this.getOrigin(code);
        return origin?.source === 'ai_generated';
    }

    // ========================================================================
    // LICENSE CHECKING
    // ========================================================================

    /**
     * Set allowed licenses for the project
     */
    setAllowedLicenses(licenses: string[]): void {
        this.allowedLicenses = new Set(licenses);
    }

    /**
     * Get license information
     */
    getLicenseInfo(spdx: string): LicenseInfo | undefined {
        return LICENSES[spdx];
    }

    /**
     * Check if a license is allowed
     */
    isLicenseAllowed(license: string): boolean {
        return this.allowedLicenses.has(license);
    }

    /**
     * Get license compatibility
     */
    checkLicenseCompatibility(sourceLicense: string, targetLicense: string): {
        compatible: boolean;
        issues: string[];
    } {
        const source = LICENSES[sourceLicense];
        const target = LICENSES[targetLicense];
        const issues: string[] = [];

        if (!source || !target) {
            return { compatible: false, issues: ['Unknown license'] };
        }

        // Copyleft licenses have restrictions
        if (source.copyleft && !target.copyleft) {
            issues.push(`${sourceLicense} is copyleft - derived work must also be ${sourceLicense}`);
        }

        // AGPL requires network distribution compliance
        if (sourceLicense === 'AGPL-3.0') {
            issues.push('AGPL requires source disclosure for network services');
        }

        return {
            compatible: issues.length === 0,
            issues,
        };
    }

    // ========================================================================
    // PROVENANCE CHECK
    // ========================================================================

    /**
     * Check code provenance (simulated - would query external service)
     */
    async checkProvenance(code: string): Promise<ProvenanceCheck> {
        const hash = this.hashCode(code);
        const matches: CodeMatch[] = [];
        const issues: string[] = [];

        // Check existing origins
        const origin = this.origins.get(hash);
        if (origin) {
            if (origin.matchedRepo) {
                matches.push({
                    repo: origin.matchedRepo,
                    file: 'unknown',
                    similarity: origin.similarity || 100,
                    license: origin.license || 'Unknown',
                });
            }
        }

        // Simulated: Check for common patterns that might indicate copied code
        const suspiciousPatterns = [
            { pattern: /Copyright \(c\) \d{4}/, weight: 0.5 },
            { pattern: /Licensed under the/, weight: 0.3 },
            { pattern: /@author/, weight: 0.2 },
        ];

        for (const { pattern } of suspiciousPatterns) {
            if (pattern.test(code)) {
                issues.push('Code contains copyright or license notices');
            }
        }

        // Determine recommendation
        let recommendation: 'safe' | 'review' | 'risky' = 'safe';

        if (matches.length > 0) {
            const hasRiskyLicense = matches.some(m => !this.isLicenseAllowed(m.license));
            const hasHighSimilarity = matches.some(m => m.similarity > 90);

            if (hasRiskyLicense) {
                recommendation = 'risky';
                issues.push('Code matches repository with incompatible license');
            } else if (hasHighSimilarity) {
                recommendation = 'review';
                issues.push('High similarity match found - review required');
            }
        }

        if (issues.length > 0 && recommendation === 'safe') {
            recommendation = 'review';
        }

        const result: ProvenanceCheck = {
            file: 'inline',
            codeHash: hash,
            matches,
            recommendation,
            issues,
        };

        this.emit('provenance:checked', result);
        return result;
    }

    /**
     * Generate attribution text for used code
     */
    generateAttribution(): string {
        const attributions: string[] = [];

        for (const [, origin] of this.origins) {
            if (origin.matchedRepo && origin.license) {
                const license = LICENSES[origin.license];
                if (license?.attribution) {
                    attributions.push(
                        `Code from ${origin.matchedRepo} - ${origin.license}`
                    );
                }
            }
            if (origin.source === 'ai_generated' && origin.model) {
                attributions.push(`AI-generated code by ${origin.model}`);
            }
        }

        return [...new Set(attributions)].join('\n');
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private hashCode(code: string): string {
        // Normalize code before hashing
        const normalized = code
            .replace(/\s+/g, ' ')
            .replace(/\/\/.*/g, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();

        return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
    }

    /**
     * Get all tracked origins
     */
    getAllOrigins(): CodeOrigin[] {
        return Array.from(this.origins.values());
    }

    /**
     * Clear origin tracking
     */
    clearOrigins(): void {
        this.origins.clear();
    }

    /**
     * Export provenance report
     */
    exportReport(): string {
        const origins = this.getAllOrigins();

        return JSON.stringify({
            generatedAt: new Date().toISOString(),
            totalTracked: origins.length,
            bySource: {
                ai_generated: origins.filter(o => o.source === 'ai_generated').length,
                copied: origins.filter(o => o.source === 'copied').length,
                modified: origins.filter(o => o.source === 'modified').length,
                original: origins.filter(o => o.source === 'original').length,
            },
            attributions: this.generateAttribution(),
        }, null, 2);
    }
}

// Export singleton
export const codeProvenance = CodeProvenance.getInstance();
