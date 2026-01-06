/**
 * Grammar Checker (Grazie equivalent)
 * AI-powered grammar, spelling, and style checking
 */

import { EventEmitter } from 'events';

export interface GrammarIssue {
    id: string;
    type: 'spelling' | 'grammar' | 'style' | 'punctuation' | 'clarity';
    severity: 'error' | 'warning' | 'suggestion';
    message: string;
    replacement?: string;
    offset: number;
    length: number;
    rule?: string;
}

export interface GrammarResult {
    text: string;
    language: string;
    issues: GrammarIssue[];
    score: number;
}

/**
 * GrammarChecker
 * Checks text for grammar, spelling, and style issues
 */
export class GrammarChecker extends EventEmitter {
    private static instance: GrammarChecker;
    private dictionaries: Map<string, Set<string>> = new Map();
    private styleRules: StyleRule[] = [];

    private constructor() {
        super();
        this.initializeDictionaries();
        this.initializeStyleRules();
    }

    static getInstance(): GrammarChecker {
        if (!GrammarChecker.instance) {
            GrammarChecker.instance = new GrammarChecker();
        }
        return GrammarChecker.instance;
    }

    /**
     * Check text for issues
     */
    async check(text: string, language = 'en'): Promise<GrammarResult> {
        const issues: GrammarIssue[] = [];

        // Spelling check
        const spellingIssues = this.checkSpelling(text, language);
        issues.push(...spellingIssues);

        // Grammar check
        const grammarIssues = this.checkGrammar(text);
        issues.push(...grammarIssues);

        // Style check
        const styleIssues = this.checkStyle(text);
        issues.push(...styleIssues);

        // Punctuation check
        const punctuationIssues = this.checkPunctuation(text);
        issues.push(...punctuationIssues);

        // Calculate score
        const score = this.calculateScore(text, issues);

        const result: GrammarResult = {
            text,
            language,
            issues,
            score,
        };

        this.emit('checked', result);
        return result;
    }

    /**
     * Check spelling
     */
    private checkSpelling(text: string, language: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];
        const dict = this.dictionaries.get(language) || this.dictionaries.get('en')!;
        const words = text.match(/\b[a-zA-Z]+\b/g) || [];

        let offset = 0;
        for (const word of words) {
            const wordLower = word.toLowerCase();
            const wordOffset = text.indexOf(word, offset);

            if (!dict.has(wordLower) && word.length > 2) {
                const suggestion = this.findSuggestion(wordLower, dict);
                issues.push({
                    id: `spell_${wordOffset}`,
                    type: 'spelling',
                    severity: 'error',
                    message: `"${word}" may be misspelled`,
                    replacement: suggestion,
                    offset: wordOffset,
                    length: word.length,
                    rule: 'SPELLING',
                });
            }

            offset = wordOffset + word.length;
        }

        return issues;
    }

    /**
     * Check grammar patterns
     */
    private checkGrammar(text: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];

        const grammarRules = [
            { pattern: /\bi\b(?!\s+[A-Z])/g, message: "Capitalize 'I'", replacement: 'I' },
            { pattern: /\byour\s+(?:a|an)\b/gi, message: "Possible confusion: 'you're' vs 'your'", replacement: "you're" },
            { pattern: /\bits\s+(?:a|an|the)\b/gi, message: "Check: 'its' vs 'it's'", replacement: null },
            { pattern: /\btheir\s+(?:is|are|was|were)\b/gi, message: "Check: 'their' vs 'there' or 'they're'", replacement: null },
            { pattern: /\bshould\s+of\b/gi, message: "'should of' → 'should have'", replacement: 'should have' },
            { pattern: /\bcould\s+of\b/gi, message: "'could of' → 'could have'", replacement: 'could have' },
            { pattern: /\bwould\s+of\b/gi, message: "'would of' → 'would have'", replacement: 'would have' },
            { pattern: /\balot\b/gi, message: "'alot' → 'a lot'", replacement: 'a lot' },
            { pattern: /\binfact\b/gi, message: "'infact' → 'in fact'", replacement: 'in fact' },
            { pattern: /\bdefinately\b/gi, message: "'definately' → 'definitely'", replacement: 'definitely' },
        ];

        for (const rule of grammarRules) {
            let match;
            while ((match = rule.pattern.exec(text)) !== null) {
                issues.push({
                    id: `grammar_${match.index}`,
                    type: 'grammar',
                    severity: 'error',
                    message: rule.message,
                    replacement: rule.replacement || undefined,
                    offset: match.index,
                    length: match[0].length,
                    rule: 'GRAMMAR',
                });
            }
        }

        return issues;
    }

    /**
     * Check style issues
     */
    private checkStyle(text: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];

        for (const rule of this.styleRules) {
            let match;
            while ((match = rule.pattern.exec(text)) !== null) {
                issues.push({
                    id: `style_${match.index}`,
                    type: 'style',
                    severity: 'suggestion',
                    message: rule.message,
                    replacement: rule.replacement,
                    offset: match.index,
                    length: match[0].length,
                    rule: rule.name,
                });
            }
        }

        return issues;
    }

    /**
     * Check punctuation
     */
    private checkPunctuation(text: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];

        // Double spaces
        let match;
        const doubleSpace = /  +/g;
        while ((match = doubleSpace.exec(text)) !== null) {
            issues.push({
                id: `punct_${match.index}`,
                type: 'punctuation',
                severity: 'warning',
                message: 'Multiple spaces',
                replacement: ' ',
                offset: match.index,
                length: match[0].length,
                rule: 'DOUBLE_SPACE',
            });
        }

        // Missing space after punctuation
        const missingSpace = /[.!?,;:](?=[A-Za-z])/g;
        while ((match = missingSpace.exec(text)) !== null) {
            issues.push({
                id: `punct_${match.index}`,
                type: 'punctuation',
                severity: 'warning',
                message: 'Missing space after punctuation',
                replacement: match[0] + ' ',
                offset: match.index,
                length: 1,
                rule: 'MISSING_SPACE',
            });
        }

        return issues;
    }

    /**
     * Find spelling suggestion
     */
    private findSuggestion(word: string, dict: Set<string>): string | undefined {
        // Simple Levenshtein distance check
        for (const dictWord of dict) {
            if (Math.abs(dictWord.length - word.length) <= 1) {
                const distance = this.levenshtein(word, dictWord);
                if (distance <= 2) {
                    return dictWord;
                }
            }
        }
        return undefined;
    }

    /**
     * Levenshtein distance
     */
    private levenshtein(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Calculate quality score (0-100)
     */
    private calculateScore(text: string, issues: GrammarIssue[]): number {
        const wordCount = (text.match(/\b\w+\b/g) || []).length;
        if (wordCount === 0) return 100;

        const errorWeight = issues.filter(i => i.severity === 'error').length * 3;
        const warningWeight = issues.filter(i => i.severity === 'warning').length * 1;
        const suggestionWeight = issues.filter(i => i.severity === 'suggestion').length * 0.5;

        const penalty = (errorWeight + warningWeight + suggestionWeight) / wordCount * 100;
        return Math.max(0, Math.round(100 - penalty));
    }

    /**
     * Apply fix
     */
    applyFix(text: string, issue: GrammarIssue): string {
        if (!issue.replacement) return text;

        return (
            text.slice(0, issue.offset) +
            issue.replacement +
            text.slice(issue.offset + issue.length)
        );
    }

    /**
     * Apply all fixes
     */
    applyAllFixes(text: string, issues: GrammarIssue[]): string {
        const sortedIssues = [...issues]
            .filter(i => i.replacement)
            .sort((a, b) => b.offset - a.offset);

        let result = text;
        for (const issue of sortedIssues) {
            result = this.applyFix(result, issue);
        }
        return result;
    }

    /**
     * Add word to dictionary
     */
    addToDictionary(word: string, language = 'en'): void {
        const dict = this.dictionaries.get(language);
        if (dict) {
            dict.add(word.toLowerCase());
        }
    }

    // Initialization

    private initializeDictionaries(): void {
        // Common English words
        const englishWords = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
            'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
            'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
            'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
            'code', 'function', 'class', 'method', 'variable', 'return', 'if', 'else', 'while',
            'for', 'loop', 'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined',
            'import', 'export', 'const', 'let', 'var', 'async', 'await', 'promise', 'try', 'catch',
            'error', 'throw', 'interface', 'type', 'enum', 'module', 'package', 'public', 'private',
        ]);

        this.dictionaries.set('en', englishWords);
    }

    private initializeStyleRules(): void {
        this.styleRules = [
            { name: 'PASSIVE_VOICE', pattern: /\b(is|was|were|been|being)\s+\w+ed\b/gi, message: 'Consider active voice', replacement: undefined },
            { name: 'VERY', pattern: /\bvery\s+\w+/gi, message: "Avoid 'very' - use stronger adjectives", replacement: undefined },
            { name: 'REALLY', pattern: /\breally\s+\w+/gi, message: "Avoid 'really' as intensifier", replacement: undefined },
            { name: 'BASICALLY', pattern: /\bbasically\b/gi, message: "Remove filler word 'basically'", replacement: '' },
            { name: 'LITERALLY', pattern: /\bliterally\b/gi, message: "Check if 'literally' is needed", replacement: undefined },
        ];
    }
}

interface StyleRule {
    name: string;
    pattern: RegExp;
    message: string;
    replacement?: string;
}

// Singleton getter
export function getGrammarChecker(): GrammarChecker {
    return GrammarChecker.getInstance();
}
