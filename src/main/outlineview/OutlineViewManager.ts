/**
 * Outline View - Code structure outline
 */
import { EventEmitter } from 'events';

export interface OutlineSymbol { name: string; kind: 'function' | 'class' | 'variable' | 'interface' | 'method' | 'property'; line: number; children: OutlineSymbol[]; }
export interface FileOutline { file: string; symbols: OutlineSymbol[]; }

export class OutlineViewManager extends EventEmitter {
    private static instance: OutlineViewManager;
    private outlines: Map<string, FileOutline> = new Map();
    private constructor() { super(); }
    static getInstance(): OutlineViewManager { if (!OutlineViewManager.instance) OutlineViewManager.instance = new OutlineViewManager(); return OutlineViewManager.instance; }

    async parse(file: string, code: string): Promise<FileOutline> {
        const symbols: OutlineSymbol[] = [];
        const classMatches = code.matchAll(/class\s+(\w+)/g);
        for (const m of classMatches) symbols.push({ name: m[1], kind: 'class', line: code.slice(0, m.index).split('\n').length, children: [] });
        const fnMatches = code.matchAll(/function\s+(\w+)/g);
        for (const m of fnMatches) symbols.push({ name: m[1], kind: 'function', line: code.slice(0, m.index).split('\n').length, children: [] });
        const outline: FileOutline = { file, symbols };
        this.outlines.set(file, outline);
        this.emit('parsed', outline);
        return outline;
    }

    get(file: string): FileOutline | null { return this.outlines.get(file) || null; }
    findSymbol(file: string, name: string): OutlineSymbol | null { return this.outlines.get(file)?.symbols.find(s => s.name === name) || null; }
}
export function getOutlineViewManager(): OutlineViewManager { return OutlineViewManager.getInstance(); }
