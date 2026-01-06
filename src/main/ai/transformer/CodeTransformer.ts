/**
 * Code Transformer
 * 
 * Transform, format, and auto-fix code.
 */

import { EventEmitter } from 'events';

interface TransformResult {
    original: string;
    transformed: string;
    changes: number;
    issues: string[];
}

export class CodeTransformer extends EventEmitter {
    private static instance: CodeTransformer;

    private constructor() { super(); }

    static getInstance(): CodeTransformer {
        if (!CodeTransformer.instance) {
            CodeTransformer.instance = new CodeTransformer();
        }
        return CodeTransformer.instance;
    }

    modernizeJS(code: string): TransformResult {
        let transformed = code;
        let changes = 0;

        // var → const/let
        transformed = transformed.replace(/\bvar\s+(\w+)\s*=/g, (_, name) => {
            changes++;
            return `const ${name} =`;
        });

        // function → arrow function
        transformed = transformed.replace(/function\s*\(([^)]*)\)\s*{/g, (_, params) => {
            changes++;
            return `(${params}) => {`;
        });

        // String concatenation → template literals
        transformed = transformed.replace(/"([^"]*)"(\s*\+\s*\w+\s*\+\s*)"([^"]*)"/g, (_, a, mid, b) => {
            changes++;
            const varName = mid.trim().replace(/\+/g, '').trim();
            return `\`${a}\${${varName}}${b}\``;
        });

        return { original: code, transformed, changes, issues: [] };
    }

    formatCode(code: string, options: { indent?: number; quotes?: 'single' | 'double'; semicolons?: boolean } = {}): TransformResult {
        let transformed = code;
        const indent = options.indent || 2;
        let changes = 0;

        // Normalize indentation
        const lines = transformed.split('\n');
        let depth = 0;
        transformed = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.endsWith('}') || trimmed.startsWith('}')) depth = Math.max(0, depth - 1);
            const indented = ' '.repeat(depth * indent) + trimmed;
            if (trimmed.endsWith('{')) depth++;
            changes++;
            return indented;
        }).join('\n');

        // Quote style
        if (options.quotes === 'single') {
            transformed = transformed.replace(/"/g, "'");
        } else if (options.quotes === 'double') {
            transformed = transformed.replace(/'/g, '"');
        }

        // Semicolons
        if (options.semicolons === false) {
            transformed = transformed.replace(/;$/gm, '');
        }

        return { original: code, transformed, changes, issues: [] };
    }

    removeUnused(code: string): TransformResult {
        let transformed = code;
        const lines = transformed.split('\n');
        const issues: string[] = [];

        // Find unused imports
        const imports = code.matchAll(/import\s+{?\s*([^}]+)}?\s+from/g);
        for (const match of imports) {
            const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
            for (const name of names) {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                const occurrences = (code.match(regex) || []).length;
                if (occurrences === 1) {
                    issues.push(`Unused import: ${name}`);
                }
            }
        }

        // Find unused variables
        const vars = code.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g);
        for (const match of vars) {
            const name = match[1];
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            const occurrences = (code.match(regex) || []).length;
            if (occurrences === 1) {
                issues.push(`Unused variable: ${name}`);
            }
        }

        return { original: code, transformed, changes: issues.length, issues };
    }

    sortImports(code: string): TransformResult {
        const lines = code.split('\n');
        const imports: string[] = [];
        const rest: string[] = [];

        for (const line of lines) {
            if (line.trim().startsWith('import ')) {
                imports.push(line);
            } else {
                rest.push(line);
            }
        }

        imports.sort((a, b) => {
            const aFrom = a.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '';
            const bFrom = b.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '';
            if (aFrom.startsWith('.') && !bFrom.startsWith('.')) return 1;
            if (!aFrom.startsWith('.') && bFrom.startsWith('.')) return -1;
            return aFrom.localeCompare(bFrom);
        });

        const transformed = [...imports, '', ...rest].join('\n');
        return { original: code, transformed, changes: imports.length, issues: [] };
    }
}

export const codeTransformer = CodeTransformer.getInstance();
