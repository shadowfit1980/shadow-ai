/**
 * Selection Manager - Text selection
 */
import { EventEmitter } from 'events';

export interface Selection { file: string; startLine: number; startColumn: number; endLine: number; endColumn: number; text: string; }

export class SelectionManager extends EventEmitter {
    private static instance: SelectionManager;
    private selections: Map<string, Selection> = new Map();
    private constructor() { super(); }
    static getInstance(): SelectionManager { if (!SelectionManager.instance) SelectionManager.instance = new SelectionManager(); return SelectionManager.instance; }

    setSelection(file: string, startLine: number, startColumn: number, endLine: number, endColumn: number, text: string): Selection {
        const sel: Selection = { file, startLine, startColumn, endLine, endColumn, text };
        this.selections.set(file, sel);
        this.emit('selected', sel);
        return sel;
    }

    getSelection(file: string): Selection | null { return this.selections.get(file) || null; }
    clearSelection(file: string): void { this.selections.delete(file); this.emit('cleared', file); }
    hasSelection(file: string): boolean { return this.selections.has(file); }
    getAll(): Selection[] { return Array.from(this.selections.values()); }
}

export function getSelectionManager(): SelectionManager { return SelectionManager.getInstance(); }
