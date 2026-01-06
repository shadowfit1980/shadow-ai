/**
 * User Preference Learning
 * 
 * Learns and adapts to the user's coding style, preferences,
 * and patterns for personalized code generation.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface CodingPreferences {
    naming: {
        variables: 'camelCase' | 'snake_case' | 'PascalCase';
        functions: 'camelCase' | 'snake_case' | 'PascalCase';
        files: 'kebab-case' | 'camelCase' | 'snake_case' | 'PascalCase';
        components: 'PascalCase' | 'kebab-case';
    };
    formatting: {
        indentation: 'tabs' | 'spaces';
        indentSize: 2 | 4;
        quotes: 'single' | 'double';
        semicolons: boolean;
        trailingComma: 'none' | 'es5' | 'all';
        lineWidth: number;
    };
    structure: {
        fileOrganization: 'feature' | 'type' | 'flat';
        exportStyle: 'named' | 'default' | 'mixed';
        componentStyle: 'functional' | 'class';
        stateManagement: 'redux' | 'zustand' | 'mobx' | 'context' | 'none';
    };
    libraries: {
        preferred: string[];
        avoided: string[];
    };
    patterns: {
        errorHandling: 'try-catch' | 'result-type' | 'callback';
        asyncStyle: 'async-await' | 'promises' | 'callbacks';
        testingFramework: 'jest' | 'vitest' | 'mocha';
    };
}

interface LearningObservation {
    type: string;
    pattern: string;
    count: number;
    lastSeen: number;
}

// ============================================================================
// USER PREFERENCE LEARNING
// ============================================================================

export class UserPreferenceLearning extends EventEmitter {
    private static instance: UserPreferenceLearning;
    private preferences: CodingPreferences;
    private observations: Map<string, LearningObservation> = new Map();
    private storagePath: string;

    private constructor() {
        super();
        this.storagePath = path.join(process.env.HOME || '', '.shadow-ai', 'preferences');
        this.preferences = this.getDefaultPreferences();
        this.loadPreferences();
    }

    static getInstance(): UserPreferenceLearning {
        if (!UserPreferenceLearning.instance) {
            UserPreferenceLearning.instance = new UserPreferenceLearning();
        }
        return UserPreferenceLearning.instance;
    }

    private getDefaultPreferences(): CodingPreferences {
        return {
            naming: {
                variables: 'camelCase',
                functions: 'camelCase',
                files: 'kebab-case',
                components: 'PascalCase',
            },
            formatting: {
                indentation: 'spaces',
                indentSize: 2,
                quotes: 'single',
                semicolons: true,
                trailingComma: 'es5',
                lineWidth: 100,
            },
            structure: {
                fileOrganization: 'feature',
                exportStyle: 'named',
                componentStyle: 'functional',
                stateManagement: 'zustand',
            },
            libraries: {
                preferred: [],
                avoided: [],
            },
            patterns: {
                errorHandling: 'try-catch',
                asyncStyle: 'async-await',
                testingFramework: 'jest',
            },
        };
    }

    private loadPreferences(): void {
        try {
            const filePath = path.join(this.storagePath, 'preferences.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.preferences = { ...this.preferences, ...data };
            }

            const obsPath = path.join(this.storagePath, 'observations.json');
            if (fs.existsSync(obsPath)) {
                const data = JSON.parse(fs.readFileSync(obsPath, 'utf-8'));
                this.observations = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    private savePreferences(): void {
        try {
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }

            const filePath = path.join(this.storagePath, 'preferences.json');
            fs.writeFileSync(filePath, JSON.stringify(this.preferences, null, 2));

            const obsPath = path.join(this.storagePath, 'observations.json');
            fs.writeFileSync(obsPath, JSON.stringify(Object.fromEntries(this.observations), null, 2));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    // ========================================================================
    // LEARNING FROM CODE
    // ========================================================================

    async learnFromCode(code: string, filename: string): Promise<void> {
        // Analyze naming conventions
        this.analyzeNaming(code);

        // Analyze formatting
        this.analyzeFormatting(code);

        // Analyze patterns
        this.analyzePatterns(code);

        // Analyze imports/libraries
        this.analyzeLibraries(code);

        // Update preferences based on observations
        this.updatePreferences();

        this.emit('preferences:learned', { filename });
        this.savePreferences();
    }

    private analyzeNaming(code: string): void {
        // Variable naming
        const camelVars = (code.match(/(?:let|const|var)\s+([a-z][a-zA-Z0-9]*)/g) || []).length;
        const snakeVars = (code.match(/(?:let|const|var)\s+([a-z][a-z0-9_]*)/g) || []).length;

        this.observe('naming:variables:camelCase', camelVars);
        this.observe('naming:variables:snake_case', snakeVars);

        // Function naming
        const camelFuncs = (code.match(/function\s+([a-z][a-zA-Z0-9]*)/g) || []).length;
        const pascalComponents = (code.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g) || []).length;

        this.observe('naming:functions:camelCase', camelFuncs);
        this.observe('naming:components:PascalCase', pascalComponents);
    }

    private analyzeFormatting(code: string): void {
        // Indentation
        const tabs = (code.match(/^\t/gm) || []).length;
        const spaces2 = (code.match(/^  (?! )/gm) || []).length;
        const spaces4 = (code.match(/^    (?! )/gm) || []).length;

        this.observe('formatting:indentation:tabs', tabs);
        this.observe('formatting:indentSize:2', spaces2);
        this.observe('formatting:indentSize:4', spaces4);

        // Quotes
        const singleQuotes = (code.match(/'/g) || []).length;
        const doubleQuotes = (code.match(/"/g) || []).length;

        this.observe('formatting:quotes:single', singleQuotes);
        this.observe('formatting:quotes:double', doubleQuotes);

        // Semicolons
        const withSemi = (code.match(/;$/gm) || []).length;
        const lines = code.split('\n').length;

        if (withSemi / lines > 0.5) {
            this.observe('formatting:semicolons:true', 1);
        } else {
            this.observe('formatting:semicolons:false', 1);
        }
    }

    private analyzePatterns(code: string): void {
        // Async style
        const asyncAwait = (code.match(/async.*await/g) || []).length;
        const thenCatch = (code.match(/\.then\(/g) || []).length;

        this.observe('patterns:asyncStyle:async-await', asyncAwait);
        this.observe('patterns:asyncStyle:promises', thenCatch);

        // Error handling
        const tryCatch = (code.match(/try\s*{/g) || []).length;

        this.observe('patterns:errorHandling:try-catch', tryCatch);

        // Component style
        const functional = (code.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*return\s*\(/g) || []).length;
        const arrowComponents = (code.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{?/g) || []).length;

        this.observe('structure:componentStyle:functional', functional + arrowComponents);
    }

    private analyzeLibraries(code: string): void {
        const imports = code.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];

        for (const imp of imports) {
            const match = imp.match(/from\s+['"]([^'"]+)['"]/);
            if (match && !match[1].startsWith('.')) {
                this.observe(`library:${match[1]}`, 1);
            }
        }
    }

    private observe(key: string, count: number): void {
        const existing = this.observations.get(key);
        if (existing) {
            existing.count += count;
            existing.lastSeen = Date.now();
        } else {
            this.observations.set(key, {
                type: key.split(':')[0],
                pattern: key,
                count,
                lastSeen: Date.now(),
            });
        }
    }

    private updatePreferences(): void {
        // Update naming preferences
        const camelVars = this.observations.get('naming:variables:camelCase')?.count || 0;
        const snakeVars = this.observations.get('naming:variables:snake_case')?.count || 0;
        if (snakeVars > camelVars * 2) {
            this.preferences.naming.variables = 'snake_case';
        }

        // Update formatting preferences
        const spaces2 = this.observations.get('formatting:indentSize:2')?.count || 0;
        const spaces4 = this.observations.get('formatting:indentSize:4')?.count || 0;
        if (spaces4 > spaces2 * 2) {
            this.preferences.formatting.indentSize = 4;
        }

        const single = this.observations.get('formatting:quotes:single')?.count || 0;
        const double = this.observations.get('formatting:quotes:double')?.count || 0;
        if (double > single * 2) {
            this.preferences.formatting.quotes = 'double';
        }

        // Update library preferences
        const libraries: Array<{ name: string; count: number }> = [];
        for (const [key, obs] of this.observations) {
            if (key.startsWith('library:')) {
                libraries.push({ name: key.replace('library:', ''), count: obs.count });
            }
        }
        this.preferences.libraries.preferred = libraries
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(l => l.name);
    }

    // ========================================================================
    // PREFERENCES API
    // ========================================================================

    getPreferences(): CodingPreferences {
        return { ...this.preferences };
    }

    setPreference<K extends keyof CodingPreferences>(
        category: K,
        key: keyof CodingPreferences[K],
        value: any
    ): void {
        (this.preferences[category] as any)[key] = value;
        this.emit('preferences:updated', { category, key, value });
        this.savePreferences();
    }

    addPreferredLibrary(library: string): void {
        if (!this.preferences.libraries.preferred.includes(library)) {
            this.preferences.libraries.preferred.push(library);
            this.savePreferences();
        }
    }

    addAvoidedLibrary(library: string): void {
        if (!this.preferences.libraries.avoided.includes(library)) {
            this.preferences.libraries.avoided.push(library);
            // Remove from preferred if present
            this.preferences.libraries.preferred =
                this.preferences.libraries.preferred.filter(l => l !== library);
            this.savePreferences();
        }
    }

    // ========================================================================
    // CODE GENERATION HELPERS
    // ========================================================================

    formatVariableName(name: string): string {
        switch (this.preferences.naming.variables) {
            case 'camelCase':
                return name.charAt(0).toLowerCase() + name.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase());
            case 'snake_case':
                return name.replace(/[A-Z]/g, c => '_' + c.toLowerCase()).replace(/^_/, '');
            case 'PascalCase':
                return name.charAt(0).toUpperCase() + name.slice(1);
            default:
                return name;
        }
    }

    formatCode(code: string): string {
        let formatted = code;

        // Apply quote preference
        if (this.preferences.formatting.quotes === 'double') {
            formatted = formatted.replace(/'/g, '"');
        }

        // Apply semicolon preference
        if (!this.preferences.formatting.semicolons) {
            formatted = formatted.replace(/;$/gm, '');
        }

        return formatted;
    }

    shouldUseLibrary(library: string): boolean {
        if (this.preferences.libraries.avoided.includes(library)) return false;
        if (this.preferences.libraries.preferred.includes(library)) return true;
        return true; // Default to allow
    }

    getStats(): { observations: number; preferredLibraries: number } {
        return {
            observations: this.observations.size,
            preferredLibraries: this.preferences.libraries.preferred.length,
        };
    }
}

export const userPreferenceLearning = UserPreferenceLearning.getInstance();
