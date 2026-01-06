/**
 * Intelligent Code Refactorer
 * 
 * Analyzes code for refactoring opportunities and applies
 * automated transformations with configurable strategies.
 */

import { EventEmitter } from 'events';

export interface RefactoringSuggestion {
    id: string;
    type: RefactoringType;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'improvement';
    location: CodeLocation;
    originalCode: string;
    refactoredCode: string;
    impact: RefactoringImpact;
    automated: boolean;
}

export interface CodeLocation {
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
}

export type RefactoringType =
    | 'extract_function'
    | 'extract_variable'
    | 'inline_function'
    | 'rename'
    | 'simplify_conditional'
    | 'remove_dead_code'
    | 'consolidate_duplicates'
    | 'parameterize_function'
    | 'introduce_constant'
    | 'replace_magic_number'
    | 'decompose_conditional'
    | 'replace_loop_with_pipeline'
    | 'introduce_parameter_object'
    | 'remove_unused_imports';

export interface RefactoringImpact {
    complexity: number; // Change in cyclomatic complexity
    readability: number; // -1 to 1 scale
    maintainability: number; // -1 to 1 scale
    linesChanged: number;
    filesAffected: number;
}

export interface RefactoringConfig {
    maxFunctionLength: number;
    maxParameterCount: number;
    maxNestingDepth: number;
    maxLineLength: number;
    autoApply: boolean;
    preserveComments: boolean;
}

export interface RefactoringSession {
    id: string;
    code: string;
    language: string;
    suggestions: RefactoringSuggestion[];
    appliedRefactorings: string[];
    startedAt: Date;
    config: RefactoringConfig;
}

const DEFAULT_CONFIG: RefactoringConfig = {
    maxFunctionLength: 30,
    maxParameterCount: 4,
    maxNestingDepth: 3,
    maxLineLength: 100,
    autoApply: false,
    preserveComments: true,
};

export class IntelligentRefactorer extends EventEmitter {
    private static instance: IntelligentRefactorer;
    private sessions: Map<string, RefactoringSession> = new Map();
    private config: RefactoringConfig = DEFAULT_CONFIG;

    private constructor() {
        super();
    }

    static getInstance(): IntelligentRefactorer {
        if (!IntelligentRefactorer.instance) {
            IntelligentRefactorer.instance = new IntelligentRefactorer();
        }
        return IntelligentRefactorer.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    analyze(code: string, language: string = 'typescript'): RefactoringSession {
        const session: RefactoringSession = {
            id: `refactor_${Date.now()}`,
            code,
            language,
            suggestions: [],
            appliedRefactorings: [],
            startedAt: new Date(),
            config: { ...this.config },
        };

        // Run all analyzers
        session.suggestions.push(...this.findLongFunctions(code));
        session.suggestions.push(...this.findDuplicateCode(code));
        session.suggestions.push(...this.findMagicNumbers(code));
        session.suggestions.push(...this.findDeadCode(code));
        session.suggestions.push(...this.findComplexConditionals(code));
        session.suggestions.push(...this.findLoopsToConvert(code));
        session.suggestions.push(...this.findUnusedImports(code));

        this.sessions.set(session.id, session);
        this.emit('session:created', session);
        return session;
    }

    private findLongFunctions(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        // Simple function detection
        const functionPattern = /^(\s*)((?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/;

        let functionStart = -1;
        let functionName = '';
        let braceCount = 0;
        let functionIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(functionPattern);

            if (match && functionStart === -1) {
                functionStart = i;
                functionName = match[3] || match[4] || 'anonymous';
                functionIndent = match[1].length;
                braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            } else if (functionStart !== -1) {
                braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

                if (braceCount <= 0) {
                    const length = i - functionStart + 1;

                    if (length > this.config.maxFunctionLength) {
                        const originalCode = lines.slice(functionStart, i + 1).join('\n');

                        suggestions.push({
                            id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            type: 'extract_function',
                            title: `Function "${functionName}" is too long`,
                            description: `This function has ${length} lines, which exceeds the recommended maximum of ${this.config.maxFunctionLength}. Consider extracting helper functions.`,
                            severity: 'warning',
                            location: { startLine: functionStart + 1, endLine: i + 1 },
                            originalCode,
                            refactoredCode: this.suggestFunctionExtraction(originalCode, functionName),
                            impact: {
                                complexity: -2,
                                readability: 0.3,
                                maintainability: 0.4,
                                linesChanged: length,
                                filesAffected: 1,
                            },
                            automated: false,
                        });
                    }

                    functionStart = -1;
                    functionName = '';
                }
            }
        }

        return suggestions;
    }

    private suggestFunctionExtraction(code: string, functionName: string): string {
        // Suggest breaking into smaller functions
        return `// Consider extracting helper functions:\n// - ${functionName}Core: Main logic\n// - ${functionName}Validation: Input validation\n// - ${functionName}Transform: Data transformation\n\n${code.slice(0, 200)}...\n// ... refactored with smaller helper functions`;
    }

    private findDuplicateCode(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');
        const lineHashes = new Map<string, number[]>();

        // Simple line-based duplicate detection
        for (let i = 0; i < lines.length; i++) {
            const normalized = lines[i].trim();
            if (normalized.length > 20 && !normalized.startsWith('//') && !normalized.startsWith('import')) {
                if (!lineHashes.has(normalized)) {
                    lineHashes.set(normalized, []);
                }
                lineHashes.get(normalized)!.push(i);
            }
        }

        // Find duplicates
        for (const [line, occurrences] of lineHashes) {
            if (occurrences.length >= 3) {
                suggestions.push({
                    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'consolidate_duplicates',
                    title: 'Duplicate code detected',
                    description: `This line appears ${occurrences.length} times. Consider extracting to a reusable function or constant.`,
                    severity: 'improvement',
                    location: { startLine: occurrences[0] + 1, endLine: occurrences[0] + 1 },
                    originalCode: line,
                    refactoredCode: `const extracted = ${line}; // Use this constant instead`,
                    impact: {
                        complexity: 0,
                        readability: 0.2,
                        maintainability: 0.5,
                        linesChanged: occurrences.length,
                        filesAffected: 1,
                    },
                    automated: true,
                });
            }
        }

        return suggestions.slice(0, 5); // Limit to top 5
    }

    private findMagicNumbers(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        const magicNumberPattern = /[^a-zA-Z0-9_](\d{3,})[^a-zA-Z0-9_:]/g;

        for (let i = 0; i < lines.length; i++) {
            let match;
            while ((match = magicNumberPattern.exec(lines[i])) !== null) {
                const number = match[1];

                // Skip common values
                if (['1000', '1024', '60000', '3600'].includes(number)) continue;

                suggestions.push({
                    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'replace_magic_number',
                    title: `Magic number detected: ${number}`,
                    description: 'Consider replacing this magic number with a named constant for clarity.',
                    severity: 'info',
                    location: { startLine: i + 1, endLine: i + 1 },
                    originalCode: lines[i],
                    refactoredCode: `const MEANINGFUL_NAME = ${number};\n${lines[i].replace(number, 'MEANINGFUL_NAME')}`,
                    impact: {
                        complexity: 0,
                        readability: 0.3,
                        maintainability: 0.2,
                        linesChanged: 2,
                        filesAffected: 1,
                    },
                    automated: true,
                });
            }
        }

        return suggestions.slice(0, 5);
    }

    private findDeadCode(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        // Find commented-out code blocks
        let inCommentBlock = false;
        let commentStart = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!inCommentBlock && line.startsWith('/*')) {
                inCommentBlock = true;
                commentStart = i;
            } else if (inCommentBlock && line.includes('*/')) {
                const length = i - commentStart + 1;
                if (length > 5) {
                    suggestions.push({
                        id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        type: 'remove_dead_code',
                        title: 'Large commented block',
                        description: `Consider removing this ${length}-line commented block or converting it to documentation.`,
                        severity: 'info',
                        location: { startLine: commentStart + 1, endLine: i + 1 },
                        originalCode: lines.slice(commentStart, i + 1).join('\n'),
                        refactoredCode: '// Removed commented code block',
                        impact: {
                            complexity: 0,
                            readability: 0.1,
                            maintainability: 0.1,
                            linesChanged: length,
                            filesAffected: 1,
                        },
                        automated: true,
                    });
                }
                inCommentBlock = false;
            }
        }

        return suggestions;
    }

    private findComplexConditionals(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        const complexConditionPattern = /if\s*\([^)]{50,}\)/;

        for (let i = 0; i < lines.length; i++) {
            if (complexConditionPattern.test(lines[i])) {
                suggestions.push({
                    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'decompose_conditional',
                    title: 'Complex conditional expression',
                    description: 'This condition is complex. Consider extracting into a well-named boolean variable or function.',
                    severity: 'warning',
                    location: { startLine: i + 1, endLine: i + 1 },
                    originalCode: lines[i],
                    refactoredCode: `const isValidCondition = /* extracted condition */;\nif (isValidCondition) {`,
                    impact: {
                        complexity: -1,
                        readability: 0.4,
                        maintainability: 0.3,
                        linesChanged: 2,
                        filesAffected: 1,
                    },
                    automated: false,
                });
            }
        }

        return suggestions;
    }

    private findLoopsToConvert(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        // Find for loops that could be map/filter/reduce
        const forLoopPattern = /for\s*\(\s*(?:let|var|const)\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\.length\s*;/;

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(forLoopPattern);
            if (match) {
                suggestions.push({
                    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'replace_loop_with_pipeline',
                    title: 'Loop can be replaced with array method',
                    description: `Consider using array methods like map(), filter(), or reduce() instead of a for loop.`,
                    severity: 'improvement',
                    location: { startLine: i + 1, endLine: i + 1 },
                    originalCode: lines[i],
                    refactoredCode: `${match[2]}.map(item => {\n  // transformed item\n});`,
                    impact: {
                        complexity: -1,
                        readability: 0.3,
                        maintainability: 0.2,
                        linesChanged: 3,
                        filesAffected: 1,
                    },
                    automated: false,
                });
            }
        }

        return suggestions;
    }

    private findUnusedImports(code: string): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = code.split('\n');

        // Extract imports
        const imports: { name: string; line: number; full: string }[] = [];
        const importPattern = /import\s+(?:{([^}]+)}|(\w+))\s+from/;

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(importPattern);
            if (match) {
                const names = (match[1] || match[2]).split(',').map(n => n.trim().split(' as ')[0]);
                for (const name of names) {
                    if (name) {
                        imports.push({ name, line: i, full: lines[i] });
                    }
                }
            }
        }

        // Check if imports are used
        const codeWithoutImports = lines.slice(imports.length > 0 ? imports[imports.length - 1].line + 1 : 0).join('\n');

        for (const imp of imports) {
            const usagePattern = new RegExp(`\\b${imp.name}\\b`);
            if (!usagePattern.test(codeWithoutImports)) {
                suggestions.push({
                    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'remove_unused_imports',
                    title: `Unused import: ${imp.name}`,
                    description: 'This import appears to be unused and can be removed.',
                    severity: 'info',
                    location: { startLine: imp.line + 1, endLine: imp.line + 1 },
                    originalCode: imp.full,
                    refactoredCode: `// Removed: ${imp.full}`,
                    impact: {
                        complexity: 0,
                        readability: 0.1,
                        maintainability: 0.1,
                        linesChanged: 1,
                        filesAffected: 1,
                    },
                    automated: true,
                });
            }
        }

        return suggestions;
    }

    // ========================================================================
    // APPLICATION
    // ========================================================================

    applyRefactoring(sessionId: string, suggestionId: string): { success: boolean; newCode?: string } {
        const session = this.sessions.get(sessionId);
        if (!session) return { success: false };

        const suggestion = session.suggestions.find(s => s.id === suggestionId);
        if (!suggestion || !suggestion.automated) return { success: false };

        // Apply the refactoring
        const newCode = session.code.replace(suggestion.originalCode, suggestion.refactoredCode);
        session.code = newCode;
        session.appliedRefactorings.push(suggestionId);

        this.emit('refactoring:applied', { sessionId, suggestionId });
        return { success: true, newCode };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSession(id: string): RefactoringSession | undefined {
        return this.sessions.get(id);
    }

    getAllSessions(): RefactoringSession[] {
        return Array.from(this.sessions.values());
    }

    getConfig(): RefactoringConfig {
        return { ...this.config };
    }

    setConfig(config: Partial<RefactoringConfig>): void {
        Object.assign(this.config, config);
    }
}

export const intelligentRefactorer = IntelligentRefactorer.getInstance();
