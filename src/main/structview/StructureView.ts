/**
 * Structure View - Code structure
 */
import { EventEmitter } from 'events';

export interface StructureNode { name: string; type: 'class' | 'function' | 'method' | 'property' | 'variable' | 'import'; line: number; children: StructureNode[]; visibility?: 'public' | 'private' | 'protected'; }

export class StructureView extends EventEmitter {
    private static instance: StructureView;
    private structures: Map<string, StructureNode[]> = new Map();
    private constructor() { super(); }
    static getInstance(): StructureView { if (!StructureView.instance) StructureView.instance = new StructureView(); return StructureView.instance; }

    analyze(file: string, code: string): StructureNode[] {
        const nodes: StructureNode[] = [];
        const importMatches = code.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
        for (const m of importMatches) nodes.push({ name: m[1], type: 'import', line: code.slice(0, m.index).split('\n').length, children: [] });
        const classMatches = code.matchAll(/class\s+(\w+)/g);
        for (const m of classMatches) nodes.push({ name: m[1], type: 'class', line: code.slice(0, m.index).split('\n').length, children: [] });
        const fnMatches = code.matchAll(/(?:function|const|let)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|\()/g);
        for (const m of fnMatches) nodes.push({ name: m[1], type: 'function', line: code.slice(0, m.index).split('\n').length, children: [] });
        this.structures.set(file, nodes); this.emit('analyzed', { file, count: nodes.length }); return nodes;
    }

    get(file: string): StructureNode[] { return this.structures.get(file) || []; }
    findByName(file: string, name: string): StructureNode | null { return this.structures.get(file)?.find(n => n.name === name) || null; }
}
export function getStructureView(): StructureView { return StructureView.getInstance(); }
