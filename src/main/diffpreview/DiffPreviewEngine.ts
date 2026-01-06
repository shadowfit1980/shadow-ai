/**
 * Diff Preview - Code change visualization
 */
import { EventEmitter } from 'events';

export interface DiffHunk { startLine: number; endLine: number; oldContent: string; newContent: string; type: 'add' | 'remove' | 'modify'; }
export interface DiffPreviewData { id: string; filePath: string; hunks: DiffHunk[]; totalAdditions: number; totalDeletions: number; accepted: boolean; }

export class DiffPreviewEngine extends EventEmitter {
    private static instance: DiffPreviewEngine;
    private previews: Map<string, DiffPreviewData> = new Map();
    private constructor() { super(); }
    static getInstance(): DiffPreviewEngine { if (!DiffPreviewEngine.instance) DiffPreviewEngine.instance = new DiffPreviewEngine(); return DiffPreviewEngine.instance; }

    createPreview(filePath: string, oldContent: string, newContent: string): DiffPreviewData {
        const oldLines = oldContent.split('\n'); const newLines = newContent.split('\n');
        const hunks: DiffHunk[] = [];
        let additions = 0, deletions = 0;
        for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
            if (oldLines[i] !== newLines[i]) {
                if (!oldLines[i]) { hunks.push({ startLine: i + 1, endLine: i + 1, oldContent: '', newContent: newLines[i], type: 'add' }); additions++; }
                else if (!newLines[i]) { hunks.push({ startLine: i + 1, endLine: i + 1, oldContent: oldLines[i], newContent: '', type: 'remove' }); deletions++; }
                else { hunks.push({ startLine: i + 1, endLine: i + 1, oldContent: oldLines[i], newContent: newLines[i], type: 'modify' }); additions++; deletions++; }
            }
        }
        const preview: DiffPreviewData = { id: `diff_${Date.now()}`, filePath, hunks, totalAdditions: additions, totalDeletions: deletions, accepted: false };
        this.previews.set(preview.id, preview); this.emit('created', preview); return preview;
    }

    accept(previewId: string): boolean { const p = this.previews.get(previewId); if (!p) return false; p.accepted = true; this.emit('accepted', p); return true; }
    reject(previewId: string): boolean { return this.previews.delete(previewId); }
    get(previewId: string): DiffPreviewData | null { return this.previews.get(previewId) || null; }
}
export function getDiffPreviewEngine(): DiffPreviewEngine { return DiffPreviewEngine.getInstance(); }
