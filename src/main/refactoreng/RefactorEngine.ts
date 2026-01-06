/**
 * Refactor Engine - Code refactoring
 */
import { EventEmitter } from 'events';

export interface Refactoring { id: string; type: 'rename' | 'extract' | 'inline' | 'move' | 'safe-delete'; file: string; range: { start: number; end: number }; preview: string; }

export class RefactorEngine extends EventEmitter {
    private static instance: RefactorEngine;
    private history: Refactoring[] = [];
    private constructor() { super(); }
    static getInstance(): RefactorEngine { if (!RefactorEngine.instance) RefactorEngine.instance = new RefactorEngine(); return RefactorEngine.instance; }

    rename(file: string, oldName: string, newName: string, code: string): { newCode: string; occurrences: number } {
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        const occurrences = (code.match(regex) || []).length;
        const newCode = code.replace(regex, newName);
        this.history.push({ id: `ref_${Date.now()}`, type: 'rename', file, range: { start: 0, end: code.length }, preview: `Rename ${oldName} → ${newName}` });
        this.emit('renamed', { oldName, newName, occurrences }); return { newCode, occurrences };
    }

    extractMethod(file: string, code: string, start: number, end: number, methodName: string): string { const extracted = code.slice(start, end); const method = `function ${methodName}() {\n  ${extracted}\n}`; this.history.push({ id: `ref_${Date.now()}`, type: 'extract', file, range: { start, end }, preview: `Extract to ${methodName}` }); return code.slice(0, start) + `${methodName}()` + code.slice(end) + '\n\n' + method; }
    inline(file: string, code: string, varName: string, value: string): string { return code.replace(new RegExp(`\\b${varName}\\b`, 'g'), value).replace(new RegExp(`(const|let|var)\\s+${varName}\\s*=.+?;?\\n?`, 'g'), ''); }
    getHistory(): Refactoring[] { return [...this.history]; }
}
export function getRefactorEngine(): RefactorEngine { return RefactorEngine.getInstance(); }
