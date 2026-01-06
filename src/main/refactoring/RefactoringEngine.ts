/**
 * Refactoring Engine
 * Automated code refactoring operations
 */

import { EventEmitter } from 'events';

export interface RefactorOperation {
    type: RefactorType;
    file: string;
    line: number;
    oldCode: string;
    newCode: string;
    description: string;
}

export type RefactorType =
    | 'rename'
    | 'extract_function'
    | 'extract_variable'
    | 'inline'
    | 'move'
    | 'convert_arrow'
    | 'convert_async'
    | 'add_type'
    | 'simplify';

export interface RefactorResult {
    success: boolean;
    operations: RefactorOperation[];
    affectedFiles: string[];
    error?: string;
}

/**
 * RefactoringEngine
 * Perform automated refactoring operations
 */
export class RefactoringEngine extends EventEmitter {
    private static instance: RefactoringEngine;
    private history: RefactorResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): RefactoringEngine {
        if (!RefactoringEngine.instance) {
            RefactoringEngine.instance = new RefactoringEngine();
        }
        return RefactoringEngine.instance;
    }

    /**
     * Rename symbol
     */
    rename(code: string, oldName: string, newName: string): RefactorResult {
        const operations: RefactorOperation[] = [];

        // Find and replace all occurrences
        const regex = new RegExp(`\\b${this.escapeRegex(oldName)}\\b`, 'g');
        const matches = code.matchAll(regex);

        let newCode = code;
        let offset = 0;

        for (const match of matches) {
            if (match.index !== undefined) {
                operations.push({
                    type: 'rename',
                    file: 'current',
                    line: this.getLineNumber(code, match.index),
                    oldCode: oldName,
                    newCode: newName,
                    description: `Rename '${oldName}' to '${newName}'`,
                });
            }
        }

        newCode = code.replace(regex, newName);

        const result: RefactorResult = {
            success: true,
            operations,
            affectedFiles: ['current'],
        };

        this.history.push(result);
        this.emit('refactored', result);
        return result;
    }

    /**
     * Extract function
     */
    extractFunction(code: string, startLine: number, endLine: number, functionName: string): RefactorResult {
        const lines = code.split('\n');
        const selectedLines = lines.slice(startLine - 1, endLine);
        const selectedCode = selectedLines.join('\n');

        // Detect parameters (simple heuristic)
        const usedVariables = this.detectUsedVariables(selectedCode);
        const params = usedVariables.slice(0, 3); // Limit to 3 params

        const newFunction = `function ${functionName}(${params.join(', ')}) {\n  ${selectedCode.replace(/\n/g, '\n  ')}\n}`;
        const functionCall = `${functionName}(${params.join(', ')})`;

        // Replace selected code with function call
        const newLines = [
            ...lines.slice(0, startLine - 1),
            `  ${functionCall};`,
            ...lines.slice(endLine),
        ];

        // Add function at the end
        newLines.push('');
        newLines.push(newFunction);

        const result: RefactorResult = {
            success: true,
            operations: [{
                type: 'extract_function',
                file: 'current',
                line: startLine,
                oldCode: selectedCode,
                newCode: functionCall,
                description: `Extract to function '${functionName}'`,
            }],
            affectedFiles: ['current'],
        };

        this.history.push(result);
        this.emit('refactored', result);
        return result;
    }

    /**
     * Extract variable
     */
    extractVariable(code: string, expression: string, variableName: string): RefactorResult {
        const regex = new RegExp(this.escapeRegex(expression), 'g');
        const match = regex.exec(code);

        if (!match) {
            return {
                success: false,
                operations: [],
                affectedFiles: [],
                error: 'Expression not found',
            };
        }

        const line = this.getLineNumber(code, match.index);
        const declaration = `const ${variableName} = ${expression};`;

        // Insert declaration before the line and replace expression
        const lines = code.split('\n');
        const indent = lines[line - 1].match(/^(\s*)/)?.[1] || '';

        const result: RefactorResult = {
            success: true,
            operations: [{
                type: 'extract_variable',
                file: 'current',
                line,
                oldCode: expression,
                newCode: variableName,
                description: `Extract to variable '${variableName}'`,
            }],
            affectedFiles: ['current'],
        };

        this.history.push(result);
        this.emit('refactored', result);
        return result;
    }

    /**
     * Convert to arrow function
     */
    convertToArrow(code: string, functionName: string): RefactorResult {
        const regex = new RegExp(`function\\s+${functionName}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\}`, 'g');
        const match = regex.exec(code);

        if (!match) {
            return {
                success: false,
                operations: [],
                affectedFiles: [],
                error: 'Function not found',
            };
        }

        const params = match[1];
        const body = match[2].trim();

        // Simple body -> implicit return
        const isSimple = !body.includes('\n') && body.startsWith('return ');
        const arrowBody = isSimple
            ? body.replace(/^return\s+/, '').replace(/;$/, '')
            : `{\n${match[2]}\n}`;

        const arrowFunc = `const ${functionName} = (${params}) => ${arrowBody};`;

        const result: RefactorResult = {
            success: true,
            operations: [{
                type: 'convert_arrow',
                file: 'current',
                line: this.getLineNumber(code, match.index),
                oldCode: match[0],
                newCode: arrowFunc,
                description: `Convert '${functionName}' to arrow function`,
            }],
            affectedFiles: ['current'],
        };

        this.history.push(result);
        this.emit('refactored', result);
        return result;
    }

    /**
     * Convert to async/await
     */
    convertToAsync(code: string, functionName: string): RefactorResult {
        // Find .then() chains
        const thenRegex = /\.then\(\s*(?:\(([^)]*)\)|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*=>\s*\{?([\s\S]*?)\}?\)/g;

        let match;
        const operations: RefactorOperation[] = [];

        while ((match = thenRegex.exec(code)) !== null) {
            const param = match[1] || match[2] || 'result';
            const body = match[3];

            operations.push({
                type: 'convert_async',
                file: 'current',
                line: this.getLineNumber(code, match.index),
                oldCode: match[0],
                newCode: `\nconst ${param} = await ...;\n${body}`,
                description: 'Convert .then() to await',
            });
        }

        const result: RefactorResult = {
            success: operations.length > 0,
            operations,
            affectedFiles: operations.length > 0 ? ['current'] : [],
        };

        if (operations.length > 0) {
            this.history.push(result);
            this.emit('refactored', result);
        }

        return result;
    }

    /**
     * Simplify code
     */
    simplify(code: string): RefactorResult {
        const operations: RefactorOperation[] = [];
        let simplified = code;

        // Simplify if (x === true) to if (x)
        simplified = simplified.replace(/if\s*\(\s*(\w+)\s*===?\s*true\s*\)/g, (match, p1) => {
            operations.push({
                type: 'simplify',
                file: 'current',
                line: 0,
                oldCode: match,
                newCode: `if (${p1})`,
                description: 'Simplify boolean comparison',
            });
            return `if (${p1})`;
        });

        // Simplify x === false to !x
        simplified = simplified.replace(/(\w+)\s*===?\s*false/g, (match, p1) => {
            operations.push({
                type: 'simplify',
                file: 'current',
                line: 0,
                oldCode: match,
                newCode: `!${p1}`,
                description: 'Simplify false comparison',
            });
            return `!${p1}`;
        });

        // Remove unnecessary else after return
        // ... additional simplifications

        const result: RefactorResult = {
            success: true,
            operations,
            affectedFiles: operations.length > 0 ? ['current'] : [],
        };

        if (operations.length > 0) {
            this.history.push(result);
            this.emit('refactored', result);
        }

        return result;
    }

    /**
     * Get refactoring history
     */
    getHistory(): RefactorResult[] {
        return this.history;
    }

    /**
     * Undo last refactoring
     */
    undo(): RefactorResult | null {
        return this.history.pop() || null;
    }

    // Helper methods

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private getLineNumber(code: string, index: number): number {
        return code.slice(0, index).split('\n').length;
    }

    private detectUsedVariables(code: string): string[] {
        const matches = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
        const keywords = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while']);
        return [...new Set(matches.filter(m => !keywords.has(m)))];
    }
}

// Singleton getter
export function getRefactoringEngine(): RefactoringEngine {
    return RefactoringEngine.getInstance();
}
