/**
 * Duplication Scanner - Detect code duplication
 */
import { EventEmitter } from 'events';

export interface DuplicationBlock { id: string; files: { file: string; startLine: number; endLine: number }[]; lines: number; tokens: number; }

export class DuplicationScanner extends EventEmitter {
    private static instance: DuplicationScanner;
    private blocks: DuplicationBlock[] = [];
    private threshold = 10;
    private constructor() { super(); }
    static getInstance(): DuplicationScanner { if (!DuplicationScanner.instance) DuplicationScanner.instance = new DuplicationScanner(); return DuplicationScanner.instance; }

    scan(files: { path: string; content: string }[]): DuplicationBlock[] {
        const lineMap = new Map<string, { file: string; line: number }[]>();
        files.forEach(f => { f.content.split('\n').forEach((line, i) => { const trimmed = line.trim(); if (trimmed.length > 10) { const existing = lineMap.get(trimmed) || []; existing.push({ file: f.path, line: i + 1 }); lineMap.set(trimmed, existing); } }); });
        lineMap.forEach((locations, line) => { if (locations.length >= 2) { this.blocks.push({ id: `dup_${Date.now()}_${this.blocks.length}`, files: locations.map(l => ({ file: l.file, startLine: l.line, endLine: l.line })), lines: 1, tokens: line.length }); } });
        this.emit('scanned', { duplications: this.blocks.length }); return this.blocks;
    }

    setThreshold(lines: number): void { this.threshold = lines; }
    getDuplicationPercentage(files: { path: string; content: string }[]): number { const totalLines = files.reduce((s, f) => s + f.content.split('\n').length, 0); const dupLines = this.blocks.reduce((s, b) => s + b.lines * b.files.length, 0); return (dupLines / totalLines) * 100; }
    getAll(): DuplicationBlock[] { return [...this.blocks]; }
}
export function getDuplicationScanner(): DuplicationScanner { return DuplicationScanner.getInstance(); }
