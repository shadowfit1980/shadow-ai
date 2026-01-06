/**
 * Smart Merge - AI-assisted merge resolution
 */
import { EventEmitter } from 'events';

export interface MergeConflict { file: string; startLine: number; endLine: number; ours: string; theirs: string; base?: string; resolved?: string; }
export interface MergeResult { conflicts: MergeConflict[]; resolved: number; remaining: number; success: boolean; }

export class SmartMergeEngine extends EventEmitter {
    private static instance: SmartMergeEngine;
    private conflicts: Map<string, MergeConflict[]> = new Map();
    private constructor() { super(); }
    static getInstance(): SmartMergeEngine { if (!SmartMergeEngine.instance) SmartMergeEngine.instance = new SmartMergeEngine(); return SmartMergeEngine.instance; }

    detectConflicts(file: string, content: string): MergeConflict[] {
        const conflicts: MergeConflict[] = [];
        const regex = /<<<<<<< (HEAD|OURS)\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> (\w+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            conflicts.push({ file, startLine: content.slice(0, match.index).split('\n').length, endLine: content.slice(0, match.index + match[0].length).split('\n').length, ours: match[2], theirs: match[3] });
        }
        this.conflicts.set(file, conflicts);
        return conflicts;
    }

    async autoResolve(file: string): Promise<MergeResult> {
        const conflicts = this.conflicts.get(file) || [];
        conflicts.forEach(c => { c.resolved = c.ours.length > c.theirs.length ? c.ours : c.theirs; });
        const resolved = conflicts.filter(c => c.resolved).length;
        return { conflicts, resolved, remaining: conflicts.length - resolved, success: resolved === conflicts.length };
    }

    manualResolve(file: string, conflictIndex: number, resolution: string): boolean { const c = this.conflicts.get(file)?.[conflictIndex]; if (c) { c.resolved = resolution; return true; } return false; }
}
export function getSmartMergeEngine(): SmartMergeEngine { return SmartMergeEngine.getInstance(); }
