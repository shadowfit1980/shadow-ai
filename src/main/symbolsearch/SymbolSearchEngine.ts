/**
 * Symbol Search - @symbols navigation
 */
import { EventEmitter } from 'events';

export interface Symbol { name: string; kind: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'const'; file: string; line: number; signature?: string; }

export class SymbolSearchEngine extends EventEmitter {
    private static instance: SymbolSearchEngine;
    private symbols: Symbol[] = [];
    private constructor() { super(); }
    static getInstance(): SymbolSearchEngine { if (!SymbolSearchEngine.instance) SymbolSearchEngine.instance = new SymbolSearchEngine(); return SymbolSearchEngine.instance; }

    index(file: string, code: string): Symbol[] {
        const found: Symbol[] = [];
        const classMatches = code.matchAll(/class\s+(\w+)/g);
        for (const m of classMatches) found.push({ name: m[1], kind: 'class', file, line: code.slice(0, m.index).split('\n').length });
        const fnMatches = code.matchAll(/(?:function|const|let)\s+(\w+)\s*(?:=\s*)?(?:async\s*)?\(/g);
        for (const m of fnMatches) found.push({ name: m[1], kind: 'function', file, line: code.slice(0, m.index).split('\n').length });
        const typeMatches = code.matchAll(/(?:type|interface)\s+(\w+)/g);
        for (const m of typeMatches) found.push({ name: m[1], kind: 'type', file, line: code.slice(0, m.index).split('\n').length });
        this.symbols.push(...found); return found;
    }

    search(query: string): Symbol[] { const q = query.toLowerCase(); return this.symbols.filter(s => s.name.toLowerCase().includes(q)); }
    getByKind(kind: Symbol['kind']): Symbol[] { return this.symbols.filter(s => s.kind === kind); }
    getAll(): Symbol[] { return [...this.symbols]; }
}
export function getSymbolSearchEngine(): SymbolSearchEngine { return SymbolSearchEngine.getInstance(); }
