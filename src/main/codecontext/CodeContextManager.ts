/**
 * Code Context Manager - Rich code context
 */
import { EventEmitter } from 'events';

export interface CodeContext { file: string; language: string; imports: string[]; exports: string[]; functions: string[]; classes: string[]; dependencies: string[]; }

export class CodeContextManager extends EventEmitter {
    private static instance: CodeContextManager;
    private contexts: Map<string, CodeContext> = new Map();
    private constructor() { super(); }
    static getInstance(): CodeContextManager { if (!CodeContextManager.instance) CodeContextManager.instance = new CodeContextManager(); return CodeContextManager.instance; }

    async analyze(file: string, code: string, language: string): Promise<CodeContext> {
        const imports = (code.match(/import .+ from ['"](.+)['"]/g) || []).map(m => m.replace(/import .+ from ['"]|['"]/g, ''));
        const exports = (code.match(/export (const|function|class|default) (\w+)/g) || []).map(m => m.split(' ').pop()!);
        const functions = (code.match(/function (\w+)/g) || []).map(m => m.replace('function ', ''));
        const classes = (code.match(/class (\w+)/g) || []).map(m => m.replace('class ', ''));
        const ctx: CodeContext = { file, language, imports, exports, functions, classes, dependencies: imports };
        this.contexts.set(file, ctx);
        this.emit('analyzed', ctx);
        return ctx;
    }

    get(file: string): CodeContext | null { return this.contexts.get(file) || null; }
    getRelated(file: string): string[] { const ctx = this.contexts.get(file); return ctx ? ctx.imports : []; }
    getAll(): CodeContext[] { return Array.from(this.contexts.values()); }
}
export function getCodeContextManager(): CodeContextManager { return CodeContextManager.getInstance(); }
