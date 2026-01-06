/**
 * Diff Viewer - Code diff display
 */
import { EventEmitter } from 'events';

export interface DiffHunk { start: number; end: number; type: 'add' | 'remove' | 'modify'; lines: string[]; }
export interface DiffResult { file: string; original: string; modified: string; hunks: DiffHunk[]; stats: { added: number; removed: number; modified: number }; }

export class DiffViewer extends EventEmitter {
    private static instance: DiffViewer;
    private diffs: Map<string, DiffResult> = new Map();
    private constructor() { super(); }
    static getInstance(): DiffViewer { if (!DiffViewer.instance) DiffViewer.instance = new DiffViewer(); return DiffViewer.instance; }

    compute(file: string, original: string, modified: string): DiffResult {
        const origLines = original.split('\n');
        const modLines = modified.split('\n');
        const hunks: DiffHunk[] = [];
        let added = 0, removed = 0, modified_count = 0;
        for (let i = 0; i < Math.max(origLines.length, modLines.length); i++) {
            if (origLines[i] !== modLines[i]) {
                if (!origLines[i]) { hunks.push({ start: i, end: i, type: 'add', lines: [modLines[i]] }); added++; }
                else if (!modLines[i]) { hunks.push({ start: i, end: i, type: 'remove', lines: [origLines[i]] }); removed++; }
                else { hunks.push({ start: i, end: i, type: 'modify', lines: [modLines[i]] }); modified_count++; }
            }
        }
        const result: DiffResult = { file, original, modified, hunks, stats: { added, removed, modified: modified_count } };
        this.diffs.set(file, result); this.emit('computed', result); return result;
    }

    get(file: string): DiffResult | null { return this.diffs.get(file) || null; }
    getAll(): DiffResult[] { return Array.from(this.diffs.values()); }
}
export function getDiffViewer(): DiffViewer { return DiffViewer.getInstance(); }
