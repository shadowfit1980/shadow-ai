/**
 * Diff Editor - Preview Changes Before Applying
 * Shows unified diffs and allows accept/reject
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';

export interface Diff {
    id: string;
    file: string;
    original: string;
    modified: string;
    hunks: DiffHunk[];
    timestamp: number;
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface DiffLine {
    type: 'context' | 'add' | 'remove';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface DiffResult {
    accepted: boolean;
    file: string;
    changesMade: number;
}

/**
 * DiffEditor
 * Creates and manages code change previews
 */
export class DiffEditor extends EventEmitter {
    private static instance: DiffEditor;
    private pendingDiffs: Map<string, Diff> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DiffEditor {
        if (!DiffEditor.instance) {
            DiffEditor.instance = new DiffEditor();
        }
        return DiffEditor.instance;
    }

    /**
     * Create a diff between original and modified content
     */
    createDiff(file: string, original: string, modified: string): Diff {
        const id = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const hunks = this.computeHunks(original, modified);

        const diff: Diff = {
            id,
            file,
            original,
            modified,
            hunks,
            timestamp: Date.now(),
        };

        this.pendingDiffs.set(id, diff);
        this.emit('diffCreated', diff);

        return diff;
    }

    /**
     * Compute diff hunks using simple line-by-line comparison
     */
    private computeHunks(original: string, modified: string): DiffHunk[] {
        const oldLines = original.split('\n');
        const newLines = modified.split('\n');
        const hunks: DiffHunk[] = [];

        // LCS-based diff algorithm (simplified)
        const lcs = this.longestCommonSubsequence(oldLines, newLines);
        const diffLines: DiffLine[] = [];

        let oldIdx = 0;
        let newIdx = 0;
        let lcsIdx = 0;

        while (oldIdx < oldLines.length || newIdx < newLines.length) {
            if (lcsIdx < lcs.length && oldLines[oldIdx] === lcs[lcsIdx] && newLines[newIdx] === lcs[lcsIdx]) {
                // Context line
                diffLines.push({
                    type: 'context',
                    content: oldLines[oldIdx],
                    oldLineNumber: oldIdx + 1,
                    newLineNumber: newIdx + 1,
                });
                oldIdx++;
                newIdx++;
                lcsIdx++;
            } else if (oldIdx < oldLines.length && (lcsIdx >= lcs.length || oldLines[oldIdx] !== lcs[lcsIdx])) {
                // Removed line
                diffLines.push({
                    type: 'remove',
                    content: oldLines[oldIdx],
                    oldLineNumber: oldIdx + 1,
                });
                oldIdx++;
            } else if (newIdx < newLines.length) {
                // Added line
                diffLines.push({
                    type: 'add',
                    content: newLines[newIdx],
                    newLineNumber: newIdx + 1,
                });
                newIdx++;
            }
        }

        // Group into hunks
        let currentHunk: DiffHunk | null = null;
        let contextBuffer: DiffLine[] = [];

        for (let i = 0; i < diffLines.length; i++) {
            const line = diffLines[i];

            if (line.type === 'context') {
                if (currentHunk) {
                    // Add context to current hunk (up to 3 lines)
                    contextBuffer.push(line);
                    if (contextBuffer.length > 6) {
                        // End current hunk
                        currentHunk.lines.push(...contextBuffer.slice(0, 3));
                        hunks.push(currentHunk);
                        currentHunk = null;
                        contextBuffer = contextBuffer.slice(-3);
                    }
                } else {
                    // Buffer context for next hunk
                    contextBuffer.push(line);
                    if (contextBuffer.length > 3) {
                        contextBuffer.shift();
                    }
                }
            } else {
                // Start or continue hunk
                if (!currentHunk) {
                    currentHunk = {
                        oldStart: line.oldLineNumber || 1,
                        oldLines: 0,
                        newStart: line.newLineNumber || 1,
                        newLines: 0,
                        lines: [...contextBuffer],
                    };
                    contextBuffer = [];
                }
                currentHunk.lines.push(line);

                if (line.type === 'remove') currentHunk.oldLines++;
                if (line.type === 'add') currentHunk.newLines++;
            }
        }

        // Add trailing context and last hunk
        if (currentHunk) {
            currentHunk.lines.push(...contextBuffer.slice(0, 3));
            hunks.push(currentHunk);
        }

        return hunks;
    }

    /**
     * Simple LCS algorithm
     */
    private longestCommonSubsequence(a: string[], b: string[]): string[] {
        const m = a.length;
        const n = b.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // Backtrack to find LCS
        const lcs: string[] = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i - 1] === b[j - 1]) {
                lcs.unshift(a[i - 1]);
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }

        return lcs;
    }

    /**
     * Get unified diff format string
     */
    toUnifiedDiff(diff: Diff): string {
        const lines: string[] = [
            `--- a/${diff.file}`,
            `+++ b/${diff.file}`,
        ];

        for (const hunk of diff.hunks) {
            const contextLines = hunk.lines.filter(l => l.type === 'context').length;
            lines.push(`@@ -${hunk.oldStart},${hunk.oldLines + contextLines} +${hunk.newStart},${hunk.newLines + contextLines} @@`);

            for (const line of hunk.lines) {
                const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
                lines.push(`${prefix}${line.content}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Get side-by-side diff representation
     */
    toSideBySide(diff: Diff): Array<{ left: string | null; right: string | null; type: string }> {
        const result: Array<{ left: string | null; right: string | null; type: string }> = [];

        for (const hunk of diff.hunks) {
            for (const line of hunk.lines) {
                if (line.type === 'context') {
                    result.push({ left: line.content, right: line.content, type: 'context' });
                } else if (line.type === 'remove') {
                    result.push({ left: line.content, right: null, type: 'remove' });
                } else if (line.type === 'add') {
                    result.push({ left: null, right: line.content, type: 'add' });
                }
            }
        }

        return result;
    }

    /**
     * Accept and apply a diff
     */
    async acceptDiff(diffId: string): Promise<DiffResult> {
        const diff = this.pendingDiffs.get(diffId);
        if (!diff) {
            throw new Error(`Diff not found: ${diffId}`);
        }

        try {
            await fs.writeFile(diff.file, diff.modified, 'utf-8');

            this.pendingDiffs.delete(diffId);
            this.emit('diffAccepted', diff);

            return {
                accepted: true,
                file: diff.file,
                changesMade: diff.hunks.reduce((sum, h) => sum + h.oldLines + h.newLines, 0),
            };
        } catch (error: any) {
            throw new Error(`Failed to apply diff: ${error.message}`);
        }
    }

    /**
     * Reject a diff
     */
    rejectDiff(diffId: string): DiffResult {
        const diff = this.pendingDiffs.get(diffId);
        if (!diff) {
            throw new Error(`Diff not found: ${diffId}`);
        }

        this.pendingDiffs.delete(diffId);
        this.emit('diffRejected', diff);

        return {
            accepted: false,
            file: diff.file,
            changesMade: 0,
        };
    }

    /**
     * Get pending diff by ID
     */
    getDiff(diffId: string): Diff | null {
        return this.pendingDiffs.get(diffId) || null;
    }

    /**
     * Get all pending diffs
     */
    getPendingDiffs(): Diff[] {
        return Array.from(this.pendingDiffs.values());
    }

    /**
     * Clear all pending diffs
     */
    clearPendingDiffs(): void {
        this.pendingDiffs.clear();
    }

    /**
     * Create diff from file path and new content
     */
    async createDiffFromFile(filePath: string, newContent: string): Promise<Diff> {
        let originalContent = '';
        try {
            originalContent = await fs.readFile(filePath, 'utf-8');
        } catch {
            // File doesn't exist, it's a new file
        }

        return this.createDiff(filePath, originalContent, newContent);
    }
}

// Singleton getter
export function getDiffEditor(): DiffEditor {
    return DiffEditor.getInstance();
}
