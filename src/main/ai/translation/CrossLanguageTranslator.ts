/**
 * Cross-Language Translator
 * 
 * Convert code between languages (Python ↔ TypeScript, React ↔ Vue)
 * while maintaining logic and style.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type SourceLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'rust' | 'c' | 'cpp';
export type TargetFramework = 'react' | 'vue' | 'angular' | 'svelte' | 'express' | 'fastapi' | 'flask';

export interface TranslationResult {
    source: string;
    sourceLanguage: SourceLanguage;
    targetLanguage: SourceLanguage;
    translated: string;
    warnings: string[];
    notes: string[];
    confidence: number;
}

export interface FrameworkMigration {
    source: string;
    sourceFramework: TargetFramework;
    targetFramework: TargetFramework;
    migrated: string;
    dependencies: string[];
    breakingChanges: string[];
}

// ============================================================================
// CROSS-LANGUAGE TRANSLATOR
// ============================================================================

export class CrossLanguageTranslator extends EventEmitter {
    private static instance: CrossLanguageTranslator;
    private modelManager: ModelManager;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): CrossLanguageTranslator {
        if (!CrossLanguageTranslator.instance) {
            CrossLanguageTranslator.instance = new CrossLanguageTranslator();
        }
        return CrossLanguageTranslator.instance;
    }

    // ========================================================================
    // LANGUAGE TRANSLATION
    // ========================================================================

    /**
     * Translate code between languages
     */
    async translate(
        code: string,
        from: SourceLanguage,
        to: SourceLanguage
    ): Promise<TranslationResult> {
        this.emit('translation:started', { from, to });

        const prompt = `Translate this ${from} code to ${to}.

Source (${from}):
\`\`\`${from}
${code}
\`\`\`

Requirements:
1. Maintain the same logic and functionality
2. Use idiomatic ${to} patterns
3. Include type annotations if applicable
4. Note any features that don't translate directly

Respond in JSON:
\`\`\`json
{
    "translated": "the translated code",
    "warnings": ["any potential issues"],
    "notes": ["translation notes"],
    "confidence": 0.95
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        const result: TranslationResult = {
            source: code,
            sourceLanguage: from,
            targetLanguage: to,
            translated: parsed.translated || '',
            warnings: parsed.warnings || [],
            notes: parsed.notes || [],
            confidence: parsed.confidence || 0.8,
        };

        this.emit('translation:completed', result);
        return result;
    }

    /**
     * Quick translations with common pairs
     */
    async pythonToTypescript(code: string): Promise<string> {
        const result = await this.translate(code, 'python', 'typescript');
        return result.translated;
    }

    async typescriptToPython(code: string): Promise<string> {
        const result = await this.translate(code, 'typescript', 'python');
        return result.translated;
    }

    async javaToTypescript(code: string): Promise<string> {
        const result = await this.translate(code, 'java', 'typescript');
        return result.translated;
    }

    // ========================================================================
    // FRAMEWORK MIGRATION
    // ========================================================================

    /**
     * Migrate between frameworks
     */
    async migrateFramework(
        code: string,
        from: TargetFramework,
        to: TargetFramework
    ): Promise<FrameworkMigration> {
        this.emit('migration:started', { from, to });

        const prompt = `Migrate this ${from} code to ${to}.

Source (${from}):
\`\`\`
${code}
\`\`\`

Requirements:
1. Maintain the same UI structure and behavior
2. Use idiomatic ${to} patterns
3. List required dependencies
4. Note any breaking changes

Respond in JSON:
\`\`\`json
{
    "migrated": "the migrated code",
    "dependencies": ["required packages"],
    "breakingChanges": ["things that changed significantly"]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        const result: FrameworkMigration = {
            source: code,
            sourceFramework: from,
            targetFramework: to,
            migrated: parsed.migrated || '',
            dependencies: parsed.dependencies || [],
            breakingChanges: parsed.breakingChanges || [],
        };

        this.emit('migration:completed', result);
        return result;
    }

    /**
     * React to Vue migration
     */
    async reactToVue(code: string): Promise<string> {
        const result = await this.migrateFramework(code, 'react', 'vue');
        return result.migrated;
    }

    /**
     * Vue to React migration
     */
    async vueToReact(code: string): Promise<string> {
        const result = await this.migrateFramework(code, 'vue', 'react');
        return result.migrated;
    }

    /**
     * Express to FastAPI migration
     */
    async expressToFastAPI(code: string): Promise<string> {
        const result = await this.migrateFramework(code, 'express', 'fastapi');
        return result.migrated;
    }

    // ========================================================================
    // BATCH TRANSLATION
    // ========================================================================

    /**
     * Translate multiple files
     */
    async translateBatch(
        files: Array<{ name: string; code: string }>,
        from: SourceLanguage,
        to: SourceLanguage
    ): Promise<Array<{ name: string; result: TranslationResult }>> {
        const results: Array<{ name: string; result: TranslationResult }> = [];

        for (const file of files) {
            const result = await this.translate(file.code, from, to);
            results.push({
                name: this.changeExtension(file.name, to),
                result,
            });
            this.emit('batch:progress', { completed: results.length, total: files.length });
        }

        return results;
    }

    private changeExtension(filename: string, lang: SourceLanguage): string {
        const extensions: Record<SourceLanguage, string> = {
            python: '.py',
            javascript: '.js',
            typescript: '.ts',
            java: '.java',
            go: '.go',
            rust: '.rs',
            c: '.c',
            cpp: '.cpp',
        };

        const base = filename.replace(/\.[^.]+$/, '');
        return base + extensions[lang];
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const crossLanguageTranslator = CrossLanguageTranslator.getInstance();
