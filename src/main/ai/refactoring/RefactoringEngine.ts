/**
 * Intelligent Refactoring Engine
 * 
 * Detect code smells, suggest design pattern improvements,
 * and provide before/after impact analysis.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type CodeSmell =
    | 'long-method'
    | 'god-class'
    | 'feature-envy'
    | 'data-clump'
    | 'primitive-obsession'
    | 'duplicate-code'
    | 'dead-code'
    | 'magic-numbers'
    | 'deep-nesting'
    | 'long-parameter-list';

export interface SmellDetection {
    type: CodeSmell;
    file: string;
    line: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
    codeSnippet: string;
}

export interface RefactoringSuggestion {
    id: string;
    smell: CodeSmell;
    pattern?: string;
    description: string;
    before: string;
    after: string;
    impact: {
        readability: 'improved' | 'same' | 'reduced';
        performance: 'improved' | 'same' | 'reduced';
        maintainability: 'improved' | 'same' | 'reduced';
        testability: 'improved' | 'same' | 'reduced';
    };
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
}

export interface RefactoringReport {
    file: string;
    smells: SmellDetection[];
    suggestions: RefactoringSuggestion[];
    overallScore: number; // 0-100
    timestamp: Date;
}

// ============================================================================
// REFACTORING ENGINE
// ============================================================================

export class RefactoringEngine extends EventEmitter {
    private static instance: RefactoringEngine;
    private modelManager: ModelManager;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): RefactoringEngine {
        if (!RefactoringEngine.instance) {
            RefactoringEngine.instance = new RefactoringEngine();
        }
        return RefactoringEngine.instance;
    }

    // ========================================================================
    // SMELL DETECTION
    // ========================================================================

    /**
     * Analyze code for smells
     */
    async detectSmells(code: string, file: string): Promise<SmellDetection[]> {
        const smells: SmellDetection[] = [];

        // Heuristic detection
        smells.push(...this.detectLongMethods(code, file));
        smells.push(...this.detectDeepNesting(code, file));
        smells.push(...this.detectMagicNumbers(code, file));
        smells.push(...this.detectLongParameterLists(code, file));
        smells.push(...this.detectDuplicateCode(code, file));

        this.emit('smells:detected', { file, smells });
        return smells;
    }

    private detectLongMethods(code: string, file: string): SmellDetection[] {
        const smells: SmellDetection[] = [];
        const funcRegex = /(?:function\s+\w+|(?:async\s+)?(?:\w+\s*[=:]\s*)?(?:async\s+)?\([^)]*\)\s*(?:=>|{))/g;

        let match;
        let lastIndex = 0;
        while ((match = funcRegex.exec(code)) !== null) {
            const start = match.index;
            const lineStart = code.substring(0, start).split('\n').length;

            // Find function end (simplified)
            let depth = 0;
            let end = start;
            for (let i = start; i < code.length; i++) {
                if (code[i] === '{') depth++;
                if (code[i] === '}') depth--;
                if (depth === 0 && code[i] === '}') {
                    end = i;
                    break;
                }
            }

            const lines = code.substring(start, end).split('\n').length;
            if (lines > 30) {
                smells.push({
                    type: 'long-method',
                    file,
                    line: lineStart,
                    severity: lines > 50 ? 'high' : 'medium',
                    description: `Method has ${lines} lines (recommended < 30)`,
                    codeSnippet: code.substring(start, start + 100) + '...',
                });
            }
            lastIndex = end;
        }
        return smells;
    }

    private detectDeepNesting(code: string, file: string): SmellDetection[] {
        const smells: SmellDetection[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const leadingSpaces = lines[i].match(/^(\s*)/)?.[1].length || 0;
            const depth = Math.floor(leadingSpaces / 2);

            if (depth > 4) {
                smells.push({
                    type: 'deep-nesting',
                    file,
                    line: i + 1,
                    severity: depth > 6 ? 'high' : 'medium',
                    description: `Nesting depth of ${depth} (recommended < 4)`,
                    codeSnippet: lines[i].trim().slice(0, 80),
                });
            }
        }
        return smells;
    }

    private detectMagicNumbers(code: string, file: string): SmellDetection[] {
        const smells: SmellDetection[] = [];
        const magicRegex = /(?<![.\d])\b\d{2,}\b(?!\s*[;,\])}]|\.\d)/g;

        let match;
        while ((match = magicRegex.exec(code)) !== null) {
            const num = parseInt(match[0]);
            if (num !== 100 && num !== 1000) { // Common acceptable numbers
                const line = code.substring(0, match.index).split('\n').length;
                smells.push({
                    type: 'magic-numbers',
                    file,
                    line,
                    severity: 'low',
                    description: `Magic number ${num} should be a named constant`,
                    codeSnippet: code.split('\n')[line - 1]?.trim() || '',
                });
            }
        }
        return smells;
    }

    private detectLongParameterLists(code: string, file: string): SmellDetection[] {
        const smells: SmellDetection[] = [];
        const funcRegex = /\(([^)]{50,})\)/g;

        let match;
        while ((match = funcRegex.exec(code)) !== null) {
            const params = match[1].split(',').length;
            if (params > 4) {
                const line = code.substring(0, match.index).split('\n').length;
                smells.push({
                    type: 'long-parameter-list',
                    file,
                    line,
                    severity: params > 6 ? 'high' : 'medium',
                    description: `Function has ${params} parameters (recommended < 4)`,
                    codeSnippet: match[0].slice(0, 100),
                });
            }
        }
        return smells;
    }

    private detectDuplicateCode(code: string, file: string): SmellDetection[] {
        const smells: SmellDetection[] = [];
        const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 20);
        const seen = new Map<string, number>();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (seen.has(line)) {
                smells.push({
                    type: 'duplicate-code',
                    file,
                    line: i + 1,
                    severity: 'medium',
                    description: 'Duplicate code detected',
                    codeSnippet: line.slice(0, 80),
                });
            }
            seen.set(line, i);
        }
        return smells;
    }

    // ========================================================================
    // REFACTORING SUGGESTIONS
    // ========================================================================

    /**
     * Generate refactoring suggestions using AI
     */
    async suggestRefactoring(code: string, smells: SmellDetection[]): Promise<RefactoringSuggestion[]> {
        if (smells.length === 0) return [];

        const prompt = `Analyze this code and suggest refactorings for the detected smells.

Code:
\`\`\`
${code.slice(0, 3000)}
\`\`\`

Detected smells:
${smells.slice(0, 5).map(s => `- ${s.type} at line ${s.line}: ${s.description}`).join('\n')}

Provide refactoring suggestions in JSON:
\`\`\`json
{
    "suggestions": [
        {
            "smell": "smell-type",
            "pattern": "design pattern if applicable",
            "description": "what to do",
            "before": "problematic code",
            "after": "refactored code",
            "impact": {
                "readability": "improved|same|reduced",
                "performance": "improved|same|reduced",
                "maintainability": "improved|same|reduced",
                "testability": "improved|same|reduced"
            },
            "effort": "low|medium|high",
            "risk": "low|medium|high"
        }
    ]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);
        return (parsed.suggestions || []).map((s: any, i: number) => ({
            id: `refactor_${Date.now()}_${i}`,
            ...s,
        }));
    }

    /**
     * Generate full refactoring report
     */
    async analyzeCode(code: string, file: string): Promise<RefactoringReport> {
        const smells = await this.detectSmells(code, file);
        const suggestions = await this.suggestRefactoring(code, smells);

        // Calculate score
        let score = 100;
        for (const smell of smells) {
            if (smell.severity === 'high') score -= 10;
            else if (smell.severity === 'medium') score -= 5;
            else score -= 2;
        }

        return {
            file,
            smells,
            suggestions,
            overallScore: Math.max(0, score),
            timestamp: new Date(),
        };
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
export const refactoringEngine = RefactoringEngine.getInstance();
