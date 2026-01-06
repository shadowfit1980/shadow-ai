/**
 * Developer DNA Profiling Service
 * 
 * Deep personalization:
 * - Coding style fingerprint
 * - Preferred patterns
 * - Error-proneness tracking
 * - Productivity curve
 * - Adaptive behavior
 */

import { EventEmitter } from 'events';

export interface DeveloperProfile {
    id: string;
    codingStyle: StyleProfile;
    preferredPatterns: Pattern[];
    errorProneness: Map<string, number>;
    productivityCurve: ProductivityData[];
    lastUpdated: number;
}

export interface StyleProfile {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    quotes: 'single' | 'double';
    semicolons: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    bracketSpacing: boolean;
    arrowParens: 'avoid' | 'always';
    namingConvention: 'camelCase' | 'snake_case' | 'PascalCase';
    commentDensity: 'low' | 'medium' | 'high';
}

export interface Pattern {
    name: string;
    frequency: number;
    examples: string[];
    category: 'architecture' | 'testing' | 'error-handling' | 'async' | 'state-management';
}

export interface ProductivityData {
    hour: number;
    dayOfWeek: number;
    productivity: number; // 0-100
}

export class DeveloperDNAService extends EventEmitter {
    private static instance: DeveloperDNAService;
    private profiles: Map<string, DeveloperProfile> = new Map();
    private currentDeveloper: string = 'default';

    private constructor() { super(); }

    static getInstance(): DeveloperDNAService {
        if (!DeveloperDNAService.instance) {
            DeveloperDNAService.instance = new DeveloperDNAService();
        }
        return DeveloperDNAService.instance;
    }

    setCurrentDeveloper(id: string): void {
        this.currentDeveloper = id;
        if (!this.profiles.has(id)) {
            this.profiles.set(id, this.createDefaultProfile(id));
        }
    }

    private createDefaultProfile(id: string): DeveloperProfile {
        return {
            id,
            codingStyle: {
                indentation: 'spaces',
                indentSize: 2,
                quotes: 'single',
                semicolons: true,
                trailingComma: 'es5',
                bracketSpacing: true,
                arrowParens: 'avoid',
                namingConvention: 'camelCase',
                commentDensity: 'medium',
            },
            preferredPatterns: [],
            errorProneness: new Map(),
            productivityCurve: [],
            lastUpdated: Date.now(),
        };
    }

    analyzeCodeSample(code: string): Partial<StyleProfile> {
        const style: Partial<StyleProfile> = {};

        // Detect indentation
        const tabMatch = code.match(/^\t+/m);
        const spaceMatch = code.match(/^[ ]+/m);
        style.indentation = tabMatch ? 'tabs' : 'spaces';
        style.indentSize = spaceMatch ? spaceMatch[0].length : 2;

        // Detect quotes
        const singleQuotes = (code.match(/'/g) || []).length;
        const doubleQuotes = (code.match(/"/g) || []).length;
        style.quotes = singleQuotes > doubleQuotes ? 'single' : 'double';

        // Detect semicolons
        style.semicolons = code.includes(';');

        // Detect arrow parens
        style.arrowParens = code.includes('(x) =>') ? 'always' : 'avoid';

        return style;
    }

    learnFromCode(developerId: string, code: string): void {
        const profile = this.profiles.get(developerId);
        if (!profile) return;

        const detectedStyle = this.analyzeCodeSample(code);
        Object.assign(profile.codingStyle, detectedStyle);

        // Detect patterns
        this.detectPatterns(code, profile);

        profile.lastUpdated = Date.now();
        this.emit('profileUpdated', profile);
    }

    private detectPatterns(code: string, profile: DeveloperProfile): void {
        const patterns = [
            { regex: /try\s*{[\s\S]*?}\s*catch/g, name: 'try-catch', category: 'error-handling' as const },
            { regex: /async\s+\w+\s*\([^)]*\)/g, name: 'async-await', category: 'async' as const },
            { regex: /useState|useReducer/g, name: 'react-hooks', category: 'state-management' as const },
            { regex: /describe\s*\(['"]/g, name: 'jest-tests', category: 'testing' as const },
        ];

        for (const p of patterns) {
            const matches = code.match(p.regex);
            if (matches && matches.length > 0) {
                const existing = profile.preferredPatterns.find(pp => pp.name === p.name);
                if (existing) {
                    existing.frequency += matches.length;
                } else {
                    profile.preferredPatterns.push({
                        name: p.name,
                        frequency: matches.length,
                        examples: matches.slice(0, 3),
                        category: p.category,
                    });
                }
            }
        }
    }

    recordError(developerId: string, errorType: string): void {
        const profile = this.profiles.get(developerId);
        if (!profile) return;

        const current = profile.errorProneness.get(errorType) || 0;
        profile.errorProneness.set(errorType, current + 1);
    }

    recordProductivity(developerId: string, productivity: number): void {
        const profile = this.profiles.get(developerId);
        if (!profile) return;

        const now = new Date();
        profile.productivityCurve.push({
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            productivity,
        });

        // Keep last 100 data points
        if (profile.productivityCurve.length > 100) {
            profile.productivityCurve = profile.productivityCurve.slice(-100);
        }
    }

    getPeakHours(developerId: string): number[] {
        const profile = this.profiles.get(developerId);
        if (!profile || profile.productivityCurve.length === 0) {
            return [9, 10, 11, 14, 15]; // Default productive hours
        }

        // Average productivity by hour
        const hourlyProductivity: Map<number, number[]> = new Map();
        for (const data of profile.productivityCurve) {
            const arr = hourlyProductivity.get(data.hour) || [];
            arr.push(data.productivity);
            hourlyProductivity.set(data.hour, arr);
        }

        const averages: Array<[number, number]> = [];
        for (const [hour, values] of hourlyProductivity) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            averages.push([hour, avg]);
        }

        averages.sort((a, b) => b[1] - a[1]);
        return averages.slice(0, 5).map(([hour]) => hour);
    }

    adjustSuggestionComplexity(developerId: string): 'simple' | 'standard' | 'advanced' {
        const profile = this.profiles.get(developerId);
        if (!profile) return 'standard';

        // Based on pattern usage and error rate
        const patternCount = profile.preferredPatterns.reduce((sum, p) => sum + p.frequency, 0);
        const errorCount = Array.from(profile.errorProneness.values()).reduce((sum, v) => sum + v, 0);

        if (patternCount > 50 && errorCount < 10) {
            return 'advanced';
        } else if (errorCount > 30) {
            return 'simple';
        }
        return 'standard';
    }

    predictFrustrationPoint(developerId: string): {
        likelihood: 'low' | 'medium' | 'high';
        reasons: string[];
    } {
        const profile = this.profiles.get(developerId);
        const reasons: string[] = [];
        let score = 0;

        if (profile) {
            // Check recent productivity
            const recent = profile.productivityCurve.slice(-5);
            if (recent.length > 0) {
                const avgRecent = recent.reduce((sum, d) => sum + d.productivity, 0) / recent.length;
                if (avgRecent < 30) {
                    score += 2;
                    reasons.push('Recent productivity is low');
                }
            }

            // Check error patterns
            const recentErrors = Array.from(profile.errorProneness.values()).reduce((sum, v) => sum + v, 0);
            if (recentErrors > 10) {
                score += 1;
                reasons.push('Frequent errors encountered');
            }
        }

        return {
            likelihood: score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low',
            reasons,
        };
    }

    getProfile(developerId: string): DeveloperProfile | undefined {
        return this.profiles.get(developerId);
    }

    getCurrentProfile(): DeveloperProfile | undefined {
        return this.profiles.get(this.currentDeveloper);
    }
}

export const developerDNAService = DeveloperDNAService.getInstance();
