/**
 * DiffPreviewEngine - Code Change Preview and Approval System
 * 
 * Generates before/after diffs for AI-generated changes
 * Supports approval workflows and rollback capability
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface FileDiff {
    filePath: string;
    originalContent: string;
    newContent: string;
    changeType: 'create' | 'modify' | 'delete';
    additions: number;
    deletions: number;
    hunks: DiffHunk[];
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface ChangeSet {
    id: string;
    description: string;
    files: FileDiff[];
    createdAt: Date;
    status: 'pending' | 'approved' | 'rejected' | 'applied' | 'rolled_back';
    approvedBy?: string;
    approvedAt?: Date;
    appliedAt?: Date;
    impactAnalysis?: ImpactAnalysis;
}

export interface ImpactAnalysis {
    affectedFiles: number;
    totalAdditions: number;
    totalDeletions: number;
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
}

export interface Snapshot {
    id: string;
    changeSetId: string;
    files: Map<string, string>;
    createdAt: Date;
}

// ============================================================================
// DIFF PREVIEW ENGINE
// ============================================================================

export class DiffPreviewEngine extends EventEmitter {
    private static instance: DiffPreviewEngine;

    private changeSets: Map<string, ChangeSet> = new Map();
    private snapshots: Map<string, Snapshot> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DiffPreviewEngine {
        if (!DiffPreviewEngine.instance) {
            DiffPreviewEngine.instance = new DiffPreviewEngine();
        }
        return DiffPreviewEngine.instance;
    }

    // ========================================================================
    // CHANGE SET CREATION
    // ========================================================================

    /**
     * Create a change set from proposed changes
     */
    async createChangeSet(
        description: string,
        changes: Array<{
            filePath: string;
            newContent: string;
            changeType?: 'create' | 'modify' | 'delete';
        }>
    ): Promise<ChangeSet> {
        const files: FileDiff[] = [];

        for (const change of changes) {
            const diff = await this.generateFileDiff(
                change.filePath,
                change.newContent,
                change.changeType
            );
            files.push(diff);
        }

        const changeSet: ChangeSet = {
            id: this.generateId(),
            description,
            files,
            createdAt: new Date(),
            status: 'pending',
            impactAnalysis: this.analyzeImpact(files)
        };

        this.changeSets.set(changeSet.id, changeSet);
        this.emit('changeset:created', changeSet);

        console.log(`📝 [DiffPreview] Created change set: ${changeSet.id} (${files.length} files)`);
        return changeSet;
    }

    /**
     * Generate diff for a single file
     */
    private async generateFileDiff(
        filePath: string,
        newContent: string,
        changeType?: 'create' | 'modify' | 'delete'
    ): Promise<FileDiff> {
        let originalContent = '';
        let type = changeType || 'modify';

        try {
            originalContent = await fs.readFile(filePath, 'utf8');
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                type = 'create';
            } else {
                throw err;
            }
        }

        if (type === 'delete') {
            newContent = '';
        }

        const hunks = this.computeDiff(originalContent, newContent);
        const { additions, deletions } = this.countChanges(hunks);

        return {
            filePath,
            originalContent,
            newContent,
            changeType: type,
            additions,
            deletions,
            hunks
        };
    }

    /**
     * Compute unified diff
     */
    private computeDiff(original: string, modified: string): DiffHunk[] {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        const hunks: DiffHunk[] = [];

        // Simple LCS-based diff algorithm
        const lcs = this.computeLCS(originalLines, modifiedLines);

        let oi = 0, mi = 0, li = 0;
        let currentHunk: DiffHunk | null = null;

        while (oi < originalLines.length || mi < modifiedLines.length) {
            if (li < lcs.length && oi < originalLines.length && originalLines[oi] === lcs[li]) {
                // Common line
                if (currentHunk) {
                    currentHunk.lines.push({
                        type: 'context',
                        content: originalLines[oi],
                        oldLineNumber: oi + 1,
                        newLineNumber: mi + 1
                    });
                }
                oi++;
                mi++;
                li++;
            } else if (mi < modifiedLines.length && (li >= lcs.length || modifiedLines[mi] !== lcs[li])) {
                // Addition
                if (!currentHunk) {
                    currentHunk = {
                        oldStart: oi + 1,
                        oldLines: 0,
                        newStart: mi + 1,
                        newLines: 0,
                        lines: []
                    };
                }
                currentHunk.lines.push({
                    type: 'add',
                    content: modifiedLines[mi],
                    newLineNumber: mi + 1
                });
                currentHunk.newLines++;
                mi++;
            } else if (oi < originalLines.length) {
                // Deletion
                if (!currentHunk) {
                    currentHunk = {
                        oldStart: oi + 1,
                        oldLines: 0,
                        newStart: mi + 1,
                        newLines: 0,
                        lines: []
                    };
                }
                currentHunk.lines.push({
                    type: 'remove',
                    content: originalLines[oi],
                    oldLineNumber: oi + 1
                });
                currentHunk.oldLines++;
                oi++;
            }

            // Finalize hunk after 3 context lines without changes
            if (currentHunk && currentHunk.lines.length > 0) {
                const lastThree = currentHunk.lines.slice(-3);
                if (lastThree.every(l => l.type === 'context') && lastThree.length === 3) {
                    hunks.push(currentHunk);
                    currentHunk = null;
                }
            }
        }

        if (currentHunk && currentHunk.lines.some(l => l.type !== 'context')) {
            hunks.push(currentHunk);
        }

        return hunks;
    }

    /**
     * Compute Longest Common Subsequence
     */
    private computeLCS(a: string[], b: string[]): string[] {
        const m = a.length, n = b.length;
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

        // Backtrack
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

    private countChanges(hunks: DiffHunk[]): { additions: number; deletions: number } {
        let additions = 0, deletions = 0;
        for (const hunk of hunks) {
            for (const line of hunk.lines) {
                if (line.type === 'add') additions++;
                if (line.type === 'remove') deletions++;
            }
        }
        return { additions, deletions };
    }

    // ========================================================================
    // IMPACT ANALYSIS
    // ========================================================================

    private analyzeImpact(files: FileDiff[]): ImpactAnalysis {
        let totalAdditions = 0, totalDeletions = 0;
        const warnings: string[] = [];

        for (const file of files) {
            totalAdditions += file.additions;
            totalDeletions += file.deletions;

            // High-risk file patterns
            if (file.filePath.includes('config')) {
                warnings.push(`Configuration file modified: ${file.filePath}`);
            }
            if (file.filePath.includes('security') || file.filePath.includes('auth')) {
                warnings.push(`Security-related file modified: ${file.filePath}`);
            }
            if (file.changeType === 'delete') {
                warnings.push(`File will be deleted: ${file.filePath}`);
            }
        }

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (warnings.length > 0 || totalDeletions > 100) {
            riskLevel = 'medium';
        }
        if (warnings.length > 3 || totalDeletions > 500) {
            riskLevel = 'high';
        }

        return {
            affectedFiles: files.length,
            totalAdditions,
            totalDeletions,
            riskLevel,
            warnings
        };
    }

    // ========================================================================
    // APPROVAL WORKFLOW
    // ========================================================================

    /**
     * Approve a change set
     */
    approve(changeSetId: string, approver: string): boolean {
        const changeSet = this.changeSets.get(changeSetId);
        if (!changeSet || changeSet.status !== 'pending') {
            return false;
        }

        changeSet.status = 'approved';
        changeSet.approvedBy = approver;
        changeSet.approvedAt = new Date();

        this.emit('changeset:approved', { id: changeSetId, approver });
        return true;
    }

    /**
     * Reject a change set
     */
    reject(changeSetId: string, reason?: string): boolean {
        const changeSet = this.changeSets.get(changeSetId);
        if (!changeSet || changeSet.status !== 'pending') {
            return false;
        }

        changeSet.status = 'rejected';
        this.emit('changeset:rejected', { id: changeSetId, reason });
        return true;
    }

    // ========================================================================
    // APPLICATION & ROLLBACK
    // ========================================================================

    /**
     * Apply an approved change set
     */
    async apply(changeSetId: string): Promise<boolean> {
        const changeSet = this.changeSets.get(changeSetId);
        if (!changeSet || changeSet.status !== 'approved') {
            return false;
        }

        // Create snapshot before applying
        await this.createSnapshot(changeSetId, changeSet.files);

        try {
            for (const file of changeSet.files) {
                if (file.changeType === 'delete') {
                    await fs.unlink(file.filePath);
                } else {
                    await fs.mkdir(path.dirname(file.filePath), { recursive: true });
                    await fs.writeFile(file.filePath, file.newContent, 'utf8');
                }
            }

            changeSet.status = 'applied';
            changeSet.appliedAt = new Date();
            this.emit('changeset:applied', { id: changeSetId });

            console.log(`✅ [DiffPreview] Applied change set: ${changeSetId}`);
            return true;
        } catch (err) {
            console.error(`❌ [DiffPreview] Failed to apply:`, err);
            await this.rollback(changeSetId);
            return false;
        }
    }

    /**
     * Rollback a change set
     */
    async rollback(changeSetId: string): Promise<boolean> {
        const snapshot = this.snapshots.get(changeSetId);
        if (!snapshot) {
            console.error(`❌ [DiffPreview] No snapshot for rollback: ${changeSetId}`);
            return false;
        }

        try {
            for (const [filePath, content] of snapshot.files) {
                await fs.writeFile(filePath, content, 'utf8');
            }

            const changeSet = this.changeSets.get(changeSetId);
            if (changeSet) {
                changeSet.status = 'rolled_back';
            }

            this.emit('changeset:rolledback', { id: changeSetId });
            console.log(`⏪ [DiffPreview] Rolled back: ${changeSetId}`);
            return true;
        } catch (err) {
            console.error(`❌ [DiffPreview] Rollback failed:`, err);
            return false;
        }
    }

    private async createSnapshot(changeSetId: string, files: FileDiff[]): Promise<void> {
        const snapshot: Snapshot = {
            id: this.generateId(),
            changeSetId,
            files: new Map(),
            createdAt: new Date()
        };

        for (const file of files) {
            if (file.originalContent) {
                snapshot.files.set(file.filePath, file.originalContent);
            }
        }

        this.snapshots.set(changeSetId, snapshot);
    }

    // ========================================================================
    // FORMATTING
    // ========================================================================

    /**
     * Format diff as unified diff string
     */
    formatUnifiedDiff(changeSetId: string): string {
        const changeSet = this.changeSets.get(changeSetId);
        if (!changeSet) return '';

        let output = '';
        for (const file of changeSet.files) {
            output += `--- a/${file.filePath}\n`;
            output += `+++ b/${file.filePath}\n`;

            for (const hunk of file.hunks) {
                output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
                for (const line of hunk.lines) {
                    const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
                    output += `${prefix}${line.content}\n`;
                }
            }
            output += '\n';
        }

        return output;
    }

    // ========================================================================
    // QUERY
    // ========================================================================

    getChangeSet(id: string): ChangeSet | undefined {
        return this.changeSets.get(id);
    }

    getPendingChangeSets(): ChangeSet[] {
        return Array.from(this.changeSets.values())
            .filter(cs => cs.status === 'pending');
    }

    getStats(): {
        total: number;
        pending: number;
        approved: number;
        applied: number;
    } {
        const all = Array.from(this.changeSets.values());
        return {
            total: all.length,
            pending: all.filter(cs => cs.status === 'pending').length,
            approved: all.filter(cs => cs.status === 'approved').length,
            applied: all.filter(cs => cs.status === 'applied').length
        };
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }

    clear(): void {
        this.changeSets.clear();
        this.snapshots.clear();
    }
}

// Export singleton
export const diffPreviewEngine = DiffPreviewEngine.getInstance();
