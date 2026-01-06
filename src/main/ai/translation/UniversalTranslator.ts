/**
 * Universal Language Translator
 * 
 * Convert code between programming paradigms (e.g., imperative to functional)
 * and between languages using AST-like pattern matching.
 */

import { EventEmitter } from 'events';

export interface TranslationRequest {
    id: string;
    sourceCode: string;
    sourceLanguage: string;
    targetLanguage?: string;
    targetParadigm?: Paradigm;
    options: TranslationOptions;
}

export interface TranslationResult {
    id: string;
    success: boolean;
    translatedCode: string;
    sourceLanguage: string;
    targetLanguage: string;
    paradigmShift?: ParadigmShift;
    transformations: Transformation[];
    warnings: string[];
    metrics: TranslationMetrics;
}

export type Paradigm =
    | 'imperative'
    | 'functional'
    | 'object_oriented'
    | 'reactive'
    | 'declarative';

export interface ParadigmShift {
    from: Paradigm;
    to: Paradigm;
    major_changes: string[];
}

export interface Transformation {
    type: TransformationType;
    original: string;
    translated: string;
    explanation: string;
}

export type TransformationType =
    | 'syntax_adaptation'
    | 'loop_to_map'
    | 'callback_to_promise'
    | 'class_to_function'
    | 'mutation_to_immutable'
    | 'imperative_to_declarative'
    | 'type_system_adaptation'
    | 'pattern_matching';

export interface TranslationOptions {
    preserveComments: boolean;
    preserveFormatting: boolean;
    modernSyntax: boolean;
    addTypes: boolean;
    verboseOutput: boolean;
}

export interface TranslationMetrics {
    linesOriginal: number;
    linesTranslated: number;
    transformationsApplied: number;
    estimatedAccuracy: number;
}

// Language patterns
const LANGUAGE_PATTERNS: Record<string, { keywords: RegExp; style: Paradigm }> = {
    javascript: {
        keywords: /\b(const|let|var|function|class|async|await|import|export)\b/,
        style: 'imperative',
    },
    typescript: {
        keywords: /\b(const|let|var|function|class|interface|type|async|await)\b/,
        style: 'object_oriented',
    },
    python: {
        keywords: /\b(def|class|import|from|async|await|with|lambda)\b/,
        style: 'imperative',
    },
    rust: {
        keywords: /\b(fn|let|mut|impl|struct|enum|pub|use|mod)\b/,
        style: 'functional',
    },
    haskell: {
        keywords: /\b(module|import|data|type|where|let|in|case|of)\b/,
        style: 'functional',
    },
    go: {
        keywords: /\b(func|type|struct|interface|package|import|go|chan)\b/,
        style: 'imperative',
    },
};

// Transformation rules
const TRANSFORMATION_RULES: { from: Paradigm; to: Paradigm; patterns: { match: RegExp; replace: (m: string[]) => string; type: TransformationType }[] }[] = [
    {
        from: 'imperative',
        to: 'functional',
        patterns: [
            {
                match: /for\s*\(\s*(?:let|var|const)\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\.length\s*;\s*\1\+\+\s*\)\s*{\s*([^}]+)\s*}/g,
                replace: (m) => `${m[2]}.forEach((item, ${m[1]}) => {${m[3]}})`,
                type: 'loop_to_map',
            },
            {
                match: /let\s+(\w+)\s*=\s*\[\];\s*for[^{]+{\s*\1\.push\(([^)]+)\);\s*}/g,
                replace: (m) => `const ${m[1]} = /* source */.map((item) => ${m[2]})`,
                type: 'loop_to_map',
            },
        ],
    },
    {
        from: 'object_oriented',
        to: 'functional',
        patterns: [
            {
                match: /class\s+(\w+)\s*{([^}]+)}/g,
                replace: (m) => {
                    const name = m[1];
                    return `// Functional version of ${name}\nconst create${name} = (state) => ({\n  // methods as pure functions\n})`;
                },
                type: 'class_to_function',
            },
        ],
    },
];

// Syntax mappings between languages
const SYNTAX_MAPPINGS: Record<string, Record<string, string>> = {
    'javascript:python': {
        'const ': '',
        'let ': '',
        'function ': 'def ',
        '=>': ':',
        '===': '==',
        '!==': '!=',
        '&&': 'and',
        '||': 'or',
        '!': 'not ',
        'null': 'None',
        'undefined': 'None',
        'true': 'True',
        'false': 'False',
        '{': ':',
        '}': '',
        ';': '',
    },
    'python:javascript': {
        'def ': 'function ',
        ':': ' {',
        'True': 'true',
        'False': 'false',
        'None': 'null',
        'and': '&&',
        'or': '||',
        'not ': '!',
    },
    'javascript:typescript': {
        'function': 'function',
        // Mostly adding types
    },
};

export class UniversalTranslator extends EventEmitter {
    private static instance: UniversalTranslator;
    private translationHistory: TranslationResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): UniversalTranslator {
        if (!UniversalTranslator.instance) {
            UniversalTranslator.instance = new UniversalTranslator();
        }
        return UniversalTranslator.instance;
    }

    // ========================================================================
    // LANGUAGE DETECTION
    // ========================================================================

    detectLanguage(code: string): string {
        let bestMatch = 'javascript';
        let bestScore = 0;

        for (const [lang, { keywords }] of Object.entries(LANGUAGE_PATTERNS)) {
            const matches = (code.match(keywords) || []).length;
            if (matches > bestScore) {
                bestScore = matches;
                bestMatch = lang;
            }
        }

        return bestMatch;
    }

    detectParadigm(code: string): Paradigm {
        // Check for functional patterns
        const functionalScore = (
            (code.match(/\.map\(|\.filter\(|\.reduce\(/g) || []).length +
            (code.match(/=>\s*{?/g) || []).length +
            (code.match(/const\s+\w+\s*=/g) || []).length
        );

        // Check for OOP patterns
        const oopScore = (
            (code.match(/class\s+\w+/g) || []).length * 3 +
            (code.match(/this\./g) || []).length +
            (code.match(/new\s+\w+/g) || []).length
        );

        // Check for reactive patterns
        const reactiveScore = (
            (code.match(/Observable|subscribe|pipe\(/g) || []).length * 2 +
            (code.match(/\.on\(|addEventListener/g) || []).length
        );

        if (reactiveScore > functionalScore && reactiveScore > oopScore) {
            return 'reactive';
        }
        if (functionalScore > oopScore) {
            return 'functional';
        }
        if (oopScore > 3) {
            return 'object_oriented';
        }

        return 'imperative';
    }

    // ========================================================================
    // TRANSLATION
    // ========================================================================

    /**
     * Translate code between languages
     */
    translateLanguage(code: string, fromLang: string, toLang: string, options?: Partial<TranslationOptions>): TranslationResult {
        const id = `trans_${Date.now()}`;
        const opts: TranslationOptions = {
            preserveComments: true,
            preserveFormatting: true,
            modernSyntax: true,
            addTypes: toLang === 'typescript',
            verboseOutput: false,
            ...options,
        };

        const transformations: Transformation[] = [];
        const warnings: string[] = [];
        let translatedCode = code;

        // Get syntax mappings
        const mappingKey = `${fromLang}:${toLang}`;
        const mappings = SYNTAX_MAPPINGS[mappingKey] || {};

        // Apply mappings
        for (const [from, to] of Object.entries(mappings)) {
            const before = translatedCode;
            translatedCode = translatedCode.split(from).join(to);

            if (before !== translatedCode) {
                transformations.push({
                    type: 'syntax_adaptation',
                    original: from,
                    translated: to,
                    explanation: `Converted ${fromLang} syntax to ${toLang}`,
                });
            }
        }

        // Language-specific adaptations
        if (toLang === 'python') {
            translatedCode = this.adaptToPython(translatedCode, transformations);
        } else if (toLang === 'typescript' && fromLang === 'javascript') {
            translatedCode = this.addTypeAnnotations(translatedCode, transformations);
        }

        // Handle unsupported translations
        if (Object.keys(mappings).length === 0 && fromLang !== toLang) {
            warnings.push(`Direct translation from ${fromLang} to ${toLang} has limited support`);
        }

        const result: TranslationResult = {
            id,
            success: true,
            translatedCode,
            sourceLanguage: fromLang,
            targetLanguage: toLang,
            transformations,
            warnings,
            metrics: {
                linesOriginal: code.split('\n').length,
                linesTranslated: translatedCode.split('\n').length,
                transformationsApplied: transformations.length,
                estimatedAccuracy: transformations.length > 0 ? 0.8 : 0.5,
            },
        };

        this.translationHistory.push(result);
        this.emit('translation:completed', result);
        return result;
    }

    /**
     * Transform paradigm (e.g., imperative to functional)
     */
    transformParadigm(code: string, targetParadigm: Paradigm): TranslationResult {
        const id = `paradigm_${Date.now()}`;
        const sourceParadigm = this.detectParadigm(code);
        const transformations: Transformation[] = [];
        let translatedCode = code;

        // Find applicable transformation rules
        const rules = TRANSFORMATION_RULES.filter(
            r => r.from === sourceParadigm && r.to === targetParadigm
        );

        for (const ruleSet of rules) {
            for (const { match, replace, type } of ruleSet.patterns) {
                translatedCode = translatedCode.replace(match, (...args) => {
                    const transformed = replace(args);
                    transformations.push({
                        type,
                        original: args[0],
                        translated: transformed,
                        explanation: `Converted ${sourceParadigm} pattern to ${targetParadigm}`,
                    });
                    return transformed;
                });
            }
        }

        const result: TranslationResult = {
            id,
            success: true,
            translatedCode,
            sourceLanguage: this.detectLanguage(code),
            targetLanguage: this.detectLanguage(code), // Same language
            paradigmShift: {
                from: sourceParadigm,
                to: targetParadigm,
                major_changes: transformations.map(t => t.explanation),
            },
            transformations,
            warnings: [],
            metrics: {
                linesOriginal: code.split('\n').length,
                linesTranslated: translatedCode.split('\n').length,
                transformationsApplied: transformations.length,
                estimatedAccuracy: transformations.length > 0 ? 0.75 : 0.5,
            },
        };

        this.translationHistory.push(result);
        this.emit('paradigm:transformed', result);
        return result;
    }

    // ========================================================================
    // LANGUAGE-SPECIFIC ADAPTATIONS
    // ========================================================================

    private adaptToPython(code: string, transformations: Transformation[]): string {
        let adapted = code;

        // Fix indentation (braces to colons already done)
        const lines = adapted.split('\n');
        let indentLevel = 0;
        const pythonLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.endsWith(':')) {
                pythonLines.push('    '.repeat(indentLevel) + trimmed);
                indentLevel++;
            } else if (trimmed === '' || trimmed.startsWith('#')) {
                pythonLines.push(trimmed);
            } else {
                pythonLines.push('    '.repeat(Math.max(0, indentLevel)) + trimmed);
            }

            // Decrease indent after certain patterns
            if (trimmed.startsWith('return') || trimmed.startsWith('pass')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
        }

        adapted = pythonLines.join('\n');

        transformations.push({
            type: 'syntax_adaptation',
            original: 'JavaScript structure',
            translated: 'Python indentation',
            explanation: 'Adapted code structure to Python style',
        });

        return adapted;
    }

    private addTypeAnnotations(code: string, transformations: Transformation[]): string {
        let typed = code;

        // Add basic type annotations to functions
        typed = typed.replace(
            /function\s+(\w+)\s*\(([^)]*)\)/g,
            (match, name, params) => {
                const typedParams = params
                    .split(',')
                    .map((p: string) => p.trim())
                    .filter((p: string) => p)
                    .map((p: string) => `${p}: any`)
                    .join(', ');

                transformations.push({
                    type: 'type_system_adaptation',
                    original: match,
                    translated: `function ${name}(${typedParams}): void`,
                    explanation: 'Added TypeScript type annotations',
                });

                return `function ${name}(${typedParams}): void`;
            }
        );

        return typed;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getHistory(): TranslationResult[] {
        return [...this.translationHistory];
    }

    getSupportedLanguages(): string[] {
        return Object.keys(LANGUAGE_PATTERNS);
    }

    getSupportedParadigms(): Paradigm[] {
        return ['imperative', 'functional', 'object_oriented', 'reactive', 'declarative'];
    }
}

export const universalTranslator = UniversalTranslator.getInstance();
