/**
 * Ethics Module
 * 
 * Internal "conscience" AI that flags biased code or unethical implications,
 * suggesting alternatives and ensuring responsible development.
 */

import { EventEmitter } from 'events';

export interface EthicsAnalysis {
    id: string;
    code: string;
    concerns: EthicalConcern[];
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    suggestions: string[];
    approved: boolean;
    timestamp: Date;
}

export interface EthicalConcern {
    type: EthicalConcernType;
    severity: 'info' | 'warning' | 'error' | 'critical';
    description: string;
    location?: { line: number; column: number };
    suggestedFix?: string;
    references?: string[];
}

export type EthicalConcernType =
    | 'bias'
    | 'privacy'
    | 'security'
    | 'accessibility'
    | 'environmental'
    | 'discrimination'
    | 'transparency'
    | 'consent'
    | 'data_retention'
    | 'manipulation';

// Detection patterns
const BIAS_PATTERNS: { pattern: RegExp; description: string; severity: EthicalConcern['severity'] }[] = [
    { pattern: /\b(male|female|man|woman|boy|girl)\b.*\b(default|primary)\b/gi, description: 'Gender-based defaults detected', severity: 'warning' },
    { pattern: /\bwhitelist\b/gi, description: 'Potentially exclusionary language (whitelist)', severity: 'info' },
    { pattern: /\bblacklist\b/gi, description: 'Potentially exclusionary language (blacklist)', severity: 'info' },
    { pattern: /\bmaster\b.*\bslave\b/gi, description: 'Problematic master/slave terminology', severity: 'warning' },
    { pattern: /\bage\s*[<>]=?\s*\d+/gi, description: 'Age-based filtering detected', severity: 'info' },
];

const PRIVACY_PATTERNS: { pattern: RegExp; description: string; severity: EthicalConcern['severity'] }[] = [
    { pattern: /\blocalstorage\s*\.\s*setItem\s*\([^)]*password/gi, description: 'Storing passwords in localStorage', severity: 'critical' },
    { pattern: /\bconsole\s*\.\s*log\s*\([^)]*(?:password|token|secret|key)/gi, description: 'Logging sensitive data', severity: 'error' },
    { pattern: /\btracking\b|\banalytics\b.*\bpersonal\b/gi, description: 'Tracking personal data without clear consent', severity: 'warning' },
    { pattern: /\bgeolocation\b|\blocation\b.*\bwatch\b/gi, description: 'Continuous location tracking', severity: 'warning' },
    { pattern: /\bdocument\.cookie\s*=/gi, description: 'Setting cookies - ensure consent', severity: 'info' },
];

const ACCESSIBILITY_PATTERNS: { pattern: RegExp; description: string; severity: EthicalConcern['severity'] }[] = [
    { pattern: /<img[^>]+(?!alt=)/gi, description: 'Image without alt attribute', severity: 'warning' },
    { pattern: /color:\s*#[0-9a-f]{3,6}/gi, description: 'Hardcoded colors - check contrast ratios', severity: 'info' },
    { pattern: /onclick\s*=(?![^>]*onkeypress)/gi, description: 'Click handler without keyboard alternative', severity: 'warning' },
    { pattern: /font-size:\s*\d+px/gi, description: 'Fixed font sizes may impact accessibility', severity: 'info' },
];

const MANIPULATION_PATTERNS: { pattern: RegExp; description: string; severity: EthicalConcern['severity'] }[] = [
    { pattern: /\bdark\s*pattern\b/gi, description: 'Dark pattern reference detected', severity: 'warning' },
    { pattern: /\bforced\b.*\b(action|click|subscribe)\b/gi, description: 'Potentially manipulative UX pattern', severity: 'warning' },
    { pattern: /\baddictive\b|\bengagement\s*hack\b/gi, description: 'Addictive design pattern reference', severity: 'warning' },
    { pattern: /\bfomo\b|\burgent\b.*\bcountdown\b/gi, description: 'FOMO/urgency manipulation', severity: 'info' },
];

export class EthicsModule extends EventEmitter {
    private static instance: EthicsModule;
    private analysisHistory: EthicsAnalysis[] = [];
    private flaggedPatterns: Map<string, number> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): EthicsModule {
        if (!EthicsModule.instance) {
            EthicsModule.instance = new EthicsModule();
        }
        return EthicsModule.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    /**
     * Analyze code for ethical concerns
     */
    analyze(code: string): EthicsAnalysis {
        const id = `ethics_${Date.now()}`;
        const concerns: EthicalConcern[] = [];

        // Check all pattern categories
        this.checkPatterns(code, BIAS_PATTERNS, 'bias', concerns);
        this.checkPatterns(code, PRIVACY_PATTERNS, 'privacy', concerns);
        this.checkPatterns(code, ACCESSIBILITY_PATTERNS, 'accessibility', concerns);
        this.checkPatterns(code, MANIPULATION_PATTERNS, 'manipulation', concerns);

        // Additional checks
        this.checkDataRetention(code, concerns);
        this.checkTransparency(code, concerns);
        this.checkEnvironmental(code, concerns);

        // Calculate overall risk
        const overallRisk = this.calculateRisk(concerns);

        // Generate suggestions
        const suggestions = this.generateSuggestions(concerns);

        const analysis: EthicsAnalysis = {
            id,
            code: code.substring(0, 200) + '...', // Store truncated for privacy
            concerns,
            overallRisk,
            suggestions,
            approved: overallRisk !== 'critical',
            timestamp: new Date(),
        };

        this.analysisHistory.push(analysis);

        if (concerns.length > 0) {
            this.emit('ethics:concerns', analysis);
        }

        return analysis;
    }

    private checkPatterns(
        code: string,
        patterns: { pattern: RegExp; description: string; severity: EthicalConcern['severity'] }[],
        type: EthicalConcernType,
        concerns: EthicalConcern[]
    ): void {
        const lines = code.split('\n');

        for (const { pattern, description, severity } of patterns) {
            const matches = code.match(pattern);
            if (matches) {
                // Find line number
                let lineNumber = 1;
                for (let i = 0; i < lines.length; i++) {
                    if (pattern.test(lines[i])) {
                        lineNumber = i + 1;
                        break;
                    }
                }

                concerns.push({
                    type,
                    severity,
                    description,
                    location: { line: lineNumber, column: 0 },
                    suggestedFix: this.getSuggestedFix(type, description),
                });

                // Track frequency
                const key = `${type}:${description}`;
                this.flaggedPatterns.set(key, (this.flaggedPatterns.get(key) || 0) + 1);
            }
        }
    }

    private checkDataRetention(code: string, concerns: EthicalConcern[]): void {
        // Check for data storage without expiration
        if (/localStorage\.setItem|sessionStorage\.setItem/.test(code)) {
            if (!/expire|ttl|maxAge|retention/i.test(code)) {
                concerns.push({
                    type: 'data_retention',
                    severity: 'warning',
                    description: 'Data storage without clear retention policy',
                    suggestedFix: 'Implement data expiration or document retention period',
                });
            }
        }

        // Check for permanent data storage
        if (/IndexedDB|openDatabase/.test(code)) {
            concerns.push({
                type: 'data_retention',
                severity: 'info',
                description: 'Persistent database storage - ensure GDPR compliance',
                suggestedFix: 'Add data deletion functionality for user requests',
            });
        }
    }

    private checkTransparency(code: string, concerns: EthicalConcern[]): void {
        // Check for hidden operations
        if (/display:\s*none.*submit|hidden.*form/gi.test(code)) {
            concerns.push({
                type: 'transparency',
                severity: 'error',
                description: 'Hidden form elements may indicate deceptive practices',
                suggestedFix: 'Ensure all user actions are visible and understood',
            });
        }

        // Check for algorithmic decision-making
        if (/decision|score|ranking|recommendation/gi.test(code)) {
            if (!/explain|reason|why|transparent/gi.test(code)) {
                concerns.push({
                    type: 'transparency',
                    severity: 'info',
                    description: 'Algorithmic decisions should be explainable',
                    suggestedFix: 'Add explainability for automated decisions',
                });
            }
        }
    }

    private checkEnvironmental(code: string, concerns: EthicalConcern[]): void {
        // Check for resource-intensive patterns
        if (/setInterval\s*\([^)]+,\s*\d{1,3}\)/.test(code)) {
            concerns.push({
                type: 'environmental',
                severity: 'info',
                description: 'Very short intervals increase energy consumption',
                suggestedFix: 'Consider longer polling intervals or event-driven approaches',
            });
        }

        // Check for large data operations
        if (/\.forEach.*\.forEach|while\s*\(true\)/.test(code)) {
            concerns.push({
                type: 'environmental',
                severity: 'info',
                description: 'Intensive loops may impact energy efficiency',
                suggestedFix: 'Optimize algorithms to reduce computational overhead',
            });
        }
    }

    private calculateRisk(concerns: EthicalConcern[]): EthicsAnalysis['overallRisk'] {
        const severityScores = { info: 1, warning: 3, error: 7, critical: 15 };
        const totalScore = concerns.reduce((sum, c) => sum + severityScores[c.severity], 0);

        if (concerns.some(c => c.severity === 'critical') || totalScore >= 20) {
            return 'critical';
        }
        if (totalScore >= 10) {
            return 'high';
        }
        if (totalScore >= 4) {
            return 'medium';
        }
        return 'low';
    }

    private getSuggestedFix(type: EthicalConcernType, description: string): string {
        const fixes: Partial<Record<EthicalConcernType, string>> = {
            bias: 'Use inclusive language and gender-neutral defaults',
            privacy: 'Implement proper data handling and user consent',
            accessibility: 'Follow WCAG guidelines for accessible design',
            manipulation: 'Design for informed user consent, not exploitation',
            data_retention: 'Implement clear data lifecycle policies',
            transparency: 'Make algorithmic decisions explainable',
            environmental: 'Optimize for reduced resource consumption',
        };

        return fixes[type] || 'Review and address the identified concern';
    }

    private generateSuggestions(concerns: EthicalConcern[]): string[] {
        const suggestions = new Set<string>();

        for (const concern of concerns) {
            if (concern.suggestedFix) {
                suggestions.add(concern.suggestedFix);
            }
        }

        // Add general suggestions based on concern types
        const concernTypes = new Set(concerns.map(c => c.type));

        if (concernTypes.has('privacy')) {
            suggestions.add('Consider conducting a Privacy Impact Assessment');
        }

        if (concernTypes.has('accessibility')) {
            suggestions.add('Run accessibility audit tools like axe or Lighthouse');
        }

        if (concernTypes.has('bias')) {
            suggestions.add('Have diverse team members review for unintentional bias');
        }

        return Array.from(suggestions);
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getRecentAnalyses(limit: number = 10): EthicsAnalysis[] {
        return this.analysisHistory.slice(-limit);
    }

    getMostCommonConcerns(): { type: string; count: number }[] {
        return Array.from(this.flaggedPatterns.entries())
            .map(([key, count]) => ({ type: key, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    getApprovalRate(): number {
        if (this.analysisHistory.length === 0) return 1;
        const approved = this.analysisHistory.filter(a => a.approved).length;
        return approved / this.analysisHistory.length;
    }
}

export const ethicsModule = EthicsModule.getInstance();
