/**
 * Multi-File Edit - Batch file editing
 */
import { EventEmitter } from 'events';

export interface MultiEdit { id: string; description: string; files: { path: string; original: string; modified: string; accepted: boolean }[]; status: 'pending' | 'applied' | 'rejected'; }

export class MultiFileEditEngine extends EventEmitter {
    private static instance: MultiFileEditEngine;
    private edits: Map<string, MultiEdit> = new Map();
    private constructor() { super(); }
    static getInstance(): MultiFileEditEngine { if (!MultiFileEditEngine.instance) MultiFileEditEngine.instance = new MultiFileEditEngine(); return MultiFileEditEngine.instance; }

    create(description: string): MultiEdit {
        const edit: MultiEdit = { id: `mfe_${Date.now()}`, description, files: [], status: 'pending' };
        this.edits.set(edit.id, edit); return edit;
    }

    addFile(editId: string, path: string, original: string, modified: string): boolean { const e = this.edits.get(editId); if (!e) return false; e.files.push({ path, original, modified, accepted: false }); return true; }
    acceptFile(editId: string, path: string): boolean { const e = this.edits.get(editId); if (!e) return false; const f = e.files.find(f => f.path === path); if (!f) return false; f.accepted = true; return true; }
    acceptAll(editId: string): boolean { const e = this.edits.get(editId); if (!e) return false; e.files.forEach(f => f.accepted = true); e.status = 'applied'; return true; }
    rejectAll(editId: string): boolean { const e = this.edits.get(editId); if (!e) return false; e.status = 'rejected'; return true; }
    get(editId: string): MultiEdit | null { return this.edits.get(editId) || null; }
}
export function getMultiFileEditEngine(): MultiFileEditEngine { return MultiFileEditEngine.getInstance(); }
