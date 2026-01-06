/**
 * Edit Mode - Copilot Edit mode
 */
import { EventEmitter } from 'events';

export interface Edit { id: string; file: string; original: string; modified: string; accepted: boolean; }

export class EditModeManager extends EventEmitter {
    private static instance: EditModeManager;
    private edits: Map<string, Edit> = new Map();
    private active = false;
    private constructor() { super(); }
    static getInstance(): EditModeManager { if (!EditModeManager.instance) EditModeManager.instance = new EditModeManager(); return EditModeManager.instance; }

    async proposeEdit(file: string, original: string, instruction: string): Promise<Edit> {
        const edit: Edit = { id: `edit_${Date.now()}`, file, original, modified: `// AI-modified based on: ${instruction}\n${original}`, accepted: false };
        this.edits.set(edit.id, edit);
        this.emit('proposed', edit);
        return edit;
    }

    accept(id: string): boolean { const e = this.edits.get(id); if (!e) return false; e.accepted = true; this.emit('accepted', e); return true; }
    reject(id: string): boolean { return this.edits.delete(id); }
    startEditMode(): void { this.active = true; this.emit('started'); }
    stopEditMode(): void { this.active = false; this.emit('stopped'); }
    isActive(): boolean { return this.active; }
    getPending(): Edit[] { return Array.from(this.edits.values()).filter(e => !e.accepted); }
}
export function getEditModeManager(): EditModeManager { return EditModeManager.getInstance(); }
