/**
 * Code Refactoring Engine
 * 
 * Automated refactoring suggestions and transformations.
 */

import { EventEmitter } from 'events';

interface RefactoringSuggestion {
    id: string;
    type: 'extract-function' | 'inline' | 'rename' | 'move' | 'simplify' | 'modernize';
    description: string;
    file: string;
    line: number;
    original: string;
    refactored: string;
    impact: 'low' | 'medium' | 'high';
}

export class CodeRefactoringEngine extends EventEmitter {
    private static instance: CodeRefactoringEngine;

    private constructor() { super(); }

    static getInstance(): CodeRefactoringEngine {
        if (!CodeRefactoringEngine.instance) {
            CodeRefactoringEngine.instance = new CodeRefactoringEngine();
        }
        return CodeRefactoringEngine.instance;
    }

    analyze(file: string, code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        // Detect long functions
        let funcStart = -1, braceCount = 0;
        lines.forEach((line, i) => {
            if (/function\s+\w+|=>\s*{/.test(line)) { funcStart = i; braceCount = 0; }
            braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            if (funcStart >= 0 && braceCount === 0 && i - funcStart > 30) {
                suggestions.push({
                    id: `extract-${i}`, type: 'extract-function', description: 'Long function - extract parts',
                    file, line: funcStart + 1, original: '', refactored: '', impact: 'medium'
                });
                funcStart = -1;
            }
        });

        // Detect var usage
        lines.forEach((line, i) => {
            if (/\bvar\s+/.test(line)) {
                suggestions.push({
                    id: `modernize-${i}`, type: 'modernize', description: 'Replace var with const/let',
                    file, line: i + 1, original: line, refactored: line.replace(/\bvar\s+/, 'const '), impact: 'low'
                });
            }
        });

        // Detect callback hell
        const nestedCallbacks = (code.match(/\)\s*=>\s*{[\s\S]*?\)\s*=>\s*{/g) || []).length;
        if (nestedCallbacks > 2) {
            suggestions.push({
                id: 'simplify-callbacks', type: 'simplify', description: 'Convert nested callbacks to async/await',
                file, line: 1, original: '', refactored: '', impact: 'high'
            });
        }

        // Detect duplicate code blocks
        const lineOccurrences = new Map<string, number[]>();
        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed.length > 30) {
                const existing = lineOccurrences.get(trimmed) || [];
                existing.push(i);
                lineOccurrences.set(trimmed, existing);
            }
        });
        for (const [, indices] of lineOccurrences) {
            if (indices.length > 2) {
                suggestions.push({
                    id: `extract-dup-${indices[0]}`, type: 'extract-function',
                    description: `Duplicate code found ${indices.length} times - extract to function`,
                    file, line: indices[0] + 1, original: '', refactored: '', impact: 'medium'
                });
            }
        }

        this.emit('analysis:complete', { file, suggestions: suggestions.length });
        return suggestions;
    }

    applyRefactoring(suggestion: RefactoringSuggestion, code: string): string {
        if (suggestion.type === 'modernize' && suggestion.original && suggestion.refactored) {
            return code.replace(suggestion.original, suggestion.refactored);
        }
        return code; // Other refactorings would need more context
    }

    extractFunction(code: string, startLine: number, endLine: number, funcName: string): { updated: string; extracted: string } {
        const lines = code.split('\n');
        const extracted = lines.slice(startLine - 1, endLine).join('\n');
        const funcCode = `function ${funcName}() {\n${extracted}\n}`;
        const updated = [...lines.slice(0, startLine - 1), `${funcName}();`, ...lines.slice(endLine)].join('\n');
        return { updated, extracted: funcCode };
    }

    renameSymbol(code: string, oldName: string, newName: string): string {
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        return code.replace(regex, newName);
    }
}

export const codeRefactoringEngine = CodeRefactoringEngine.getInstance();
