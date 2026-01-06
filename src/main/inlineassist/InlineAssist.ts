/**
 * Inline Assist - Cmd+K editing
 */
import { EventEmitter } from 'events';

export interface InlineEdit { id: string; file: string; startLine: number; endLine: number; original: string; modified: string; instruction: string; status: 'pending' | 'accepted' | 'rejected'; }

export class InlineAssist extends EventEmitter {
    private static instance: InlineAssist;
    private edits: Map<string, InlineEdit> = new Map();
    private constructor() { super(); }
    static getInstance(): InlineAssist { if (!InlineAssist.instance) InlineAssist.instance = new InlineAssist(); return InlineAssist.instance; }

    create(file: string, startLine: number, endLine: number, original: string, instruction: string): InlineEdit {
        const edit: InlineEdit = { id: `ie_${Date.now()}`, file, startLine, endLine, original, modified: '', instruction, status: 'pending' };
        this.edits.set(edit.id, edit); this.emit('created', edit); return edit;
    }

    setModified(editId: string, modified: string): boolean { const e = this.edits.get(editId); if (!e) return false; e.modified = modified; return true; }
    accept(editId: string): boolean { const e = this.edits.get(editId); if (!e) return false; e.status = 'accepted'; this.emit('accepted', e); return true; }
    reject(editId: string): boolean { const e = this.edits.get(editId); if (!e) return false; e.status = 'rejected'; return true; }
    get(editId: string): InlineEdit | null { return this.edits.get(editId) || null; }
    getPending(): InlineEdit[] { return Array.from(this.edits.values()).filter(e => e.status === 'pending'); }
}
export function getInlineAssist(): InlineAssist { return InlineAssist.getInstance(); }
