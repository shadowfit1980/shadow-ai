/**
 * Code Lens - Inline actions
 */
import { EventEmitter } from 'events';

export interface Lens { id: string; file: string; line: number; type: 'run' | 'test' | 'debug' | 'reference' | 'aiAction'; label: string; command: string; }

export class CodeLensManager extends EventEmitter {
    private static instance: CodeLensManager;
    private lenses: Map<string, Lens[]> = new Map();
    private constructor() { super(); }
    static getInstance(): CodeLensManager { if (!CodeLensManager.instance) CodeLensManager.instance = new CodeLensManager(); return CodeLensManager.instance; }

    add(file: string, line: number, type: Lens['type'], label: string, command: string): Lens { const lens: Lens = { id: `lens_${Date.now()}_${line}`, file, line, type, label, command }; const existing = this.lenses.get(file) || []; existing.push(lens); this.lenses.set(file, existing); return lens; }

    generate(file: string, content: string): Lens[] {
        const lenses: Lens[] = [];
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('function') || line.includes('const')) lenses.push({ id: `lens_${Date.now()}_${i}`, file, line: i + 1, type: 'reference', label: 'refs', command: 'findReferences' });
            if (line.includes('test(') || line.includes('it(')) lenses.push({ id: `lens_${Date.now()}_${i}_test`, file, line: i + 1, type: 'test', label: '▶ Run Test', command: 'runTest' });
        });
        this.lenses.set(file, lenses); return lenses;
    }

    getForFile(file: string): Lens[] { return this.lenses.get(file) || []; }
    clear(file: string): void { this.lenses.delete(file); }
}
export function getCodeLensManager(): CodeLensManager { return CodeLensManager.getInstance(); }
