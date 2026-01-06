/**
 * 🔪 DiffEditEngine - Surgical Code Editing
 * 
 * Implements diff-based editing instead of whole-file replacement.
 * Uses unified diff format for precise, surgical code changes.
 * 
 * This addresses Grok's criticism: "No diff-based editing by default"
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface DiffHunk {
    /** Line number where the change starts (1-indexed) */
    startLine: number;
    /** Line number where the change ends (1-indexed, inclusive) */
    endLine: number;
    /** Original content to be replaced */
    originalContent: string;
    /** New content to insert */
    newContent: string;
    /** Context lines for validation */
    contextBefore: string[];
    contextAfter: string[];
}

export interface DiffEdit {
    /** Absolute file path */
    file: string;
    /** List of hunks to apply */
    hunks: DiffHunk[];
    /** Generated unique ID */
    id: string;
    /** Timestamp */
    timestamp: Date;
    /** Description of the change */
    description?: string;
}

export interface DiffValidationResult {
    valid: boolean;
    conflicts: DiffConflict[];
    warnings: string[];
}

export interface DiffConflict {
    hunk: DiffHunk;
    reason: string;
    suggestion?: string;
}

export interface ApplyResult {
    success: boolean;
    editId: string;
    backupPath?: string;
    error?: string;
    linesChanged: number;
}

export interface EditHistory {
    editId: string;
    file: string;
    timestamp: Date;
    backupPath: string;
    description?: string;
    hunksApplied: number;
}

// ============================================================================
// DIFF EDIT ENGINE
// ============================================================================

export class DiffEditEngine extends EventEmitter {
    private static instance: DiffEditEngine;
    private editHistory: Map<string, EditHistory> = new Map();
    private backupDir: string;

    private constructor() {
        super();
        this.backupDir = path.join(process.cwd(), '.shadow-ai', 'edit-backups');
    }

    public static getInstance(): DiffEditEngine {
        if (!DiffEditEngine.instance) {
            DiffEditEngine.instance = new DiffEditEngine();
        }
        return DiffEditEngine.instance;
    }

    /**
     * Apply a diff edit to a file
     */
    public async applyDiff(edit: DiffEdit): Promise<ApplyResult> {
        const startTime = Date.now();

        try {
            // Validate the diff first
            const validation = await this.validateDiff(edit);
            if (!validation.valid) {
                return {
                    success: false,
                    editId: edit.id,
                    error: `Validation failed: ${validation.conflicts.map(c => c.reason).join(', ')}`,
                    linesChanged: 0
                };
            }

            // Create backup
            const backupPath = await this.createBackup(edit.file, edit.id);

            // Read current file content
            const content = await fs.readFile(edit.file, 'utf-8');
            const lines = content.split('\n');

            // Sort hunks by line number (descending) to apply from bottom to top
            // This prevents line number shifts from affecting subsequent edits
            const sortedHunks = [...edit.hunks].sort((a, b) => b.startLine - a.startLine);

            let totalLinesChanged = 0;

            for (const hunk of sortedHunks) {
                const originalLines = hunk.originalContent.split('\n');
                const newLines = hunk.newContent.split('\n');

                // Verify original content matches
                const actualContent = lines.slice(hunk.startLine - 1, hunk.endLine).join('\n');
                if (actualContent.trim() !== hunk.originalContent.trim()) {
                    console.warn(`⚠️ Content mismatch at lines ${hunk.startLine}-${hunk.endLine}, applying anyway`);
                }

                // Apply the replacement
                lines.splice(hunk.startLine - 1, hunk.endLine - hunk.startLine + 1, ...newLines);
                totalLinesChanged += Math.abs(newLines.length - originalLines.length) + originalLines.length;
            }

            // Write the modified content
            await fs.writeFile(edit.file, lines.join('\n'), 'utf-8');

            // Record in history
            this.editHistory.set(edit.id, {
                editId: edit.id,
                file: edit.file,
                timestamp: new Date(),
                backupPath,
                description: edit.description,
                hunksApplied: edit.hunks.length
            });

            this.emit('edit:applied', { editId: edit.id, file: edit.file, linesChanged: totalLinesChanged });

            console.log(`✅ Applied ${edit.hunks.length} hunks to ${path.basename(edit.file)} (${totalLinesChanged} lines changed)`);

            return {
                success: true,
                editId: edit.id,
                backupPath,
                linesChanged: totalLinesChanged
            };

        } catch (error: any) {
            this.emit('edit:error', { editId: edit.id, error: error.message });
            return {
                success: false,
                editId: edit.id,
                error: error.message,
                linesChanged: 0
            };
        }
    }

    /**
     * Parse diff edits from AI response
     * Supports multiple formats: unified diff, code blocks with ranges, etc.
     */
    public parseDiffFromAI(response: string, targetFile: string): DiffEdit | null {
        const hunks: DiffHunk[] = [];

        // Pattern 1: Explicit line range markers
        // Format: ```typescript:123-145 or [LINES 123-145]
        const rangePattern = /```[\w]*:?(\d+)-(\d+)\n([\s\S]*?)```/g;
        let match;

        while ((match = rangePattern.exec(response)) !== null) {
            const startLine = parseInt(match[1]);
            const endLine = parseInt(match[2]);
            const newContent = match[3].trim();

            hunks.push({
                startLine,
                endLine,
                originalContent: '', // Will be filled during validation
                newContent,
                contextBefore: [],
                contextAfter: []
            });
        }

        // Pattern 2: Unified diff format
        const unifiedDiffPattern = /@@ -(\d+),(\d+) \+(\d+),(\d+) @@\n([\s\S]*?)(?=@@|$)/g;

        while ((match = unifiedDiffPattern.exec(response)) !== null) {
            const oldStart = parseInt(match[1]);
            const oldCount = parseInt(match[2]);
            const newStart = parseInt(match[3]);
            const newCount = parseInt(match[4]);
            const diffContent = match[5];

            const originalLines: string[] = [];
            const newLines: string[] = [];

            for (const line of diffContent.split('\n')) {
                if (line.startsWith('-') && !line.startsWith('---')) {
                    originalLines.push(line.substring(1));
                } else if (line.startsWith('+') && !line.startsWith('+++')) {
                    newLines.push(line.substring(1));
                } else if (line.startsWith(' ')) {
                    originalLines.push(line.substring(1));
                    newLines.push(line.substring(1));
                }
            }

            if (originalLines.length > 0 || newLines.length > 0) {
                hunks.push({
                    startLine: oldStart,
                    endLine: oldStart + oldCount - 1,
                    originalContent: originalLines.join('\n'),
                    newContent: newLines.join('\n'),
                    contextBefore: [],
                    contextAfter: []
                });
            }
        }

        // Pattern 3: REPLACE markers
        // Format: // REPLACE LINES 10-20:
        const replacePattern = /\/\/ REPLACE LINES (\d+)-(\d+):\n```[\w]*\n([\s\S]*?)```/g;

        while ((match = replacePattern.exec(response)) !== null) {
            const startLine = parseInt(match[1]);
            const endLine = parseInt(match[2]);
            const newContent = match[3].trim();

            hunks.push({
                startLine,
                endLine,
                originalContent: '',
                newContent,
                contextBefore: [],
                contextAfter: []
            });
        }

        if (hunks.length === 0) {
            return null;
        }

        return {
            file: targetFile,
            hunks,
            id: this.generateEditId(),
            timestamp: new Date(),
            description: 'AI-generated edit'
        };
    }

    /**
     * Validate a diff before applying
     */
    public async validateDiff(edit: DiffEdit): Promise<DiffValidationResult> {
        const conflicts: DiffConflict[] = [];
        const warnings: string[] = [];

        try {
            // Check file exists
            await fs.access(edit.file);
        } catch {
            conflicts.push({
                hunk: edit.hunks[0],
                reason: `File does not exist: ${edit.file}`
            });
            return { valid: false, conflicts, warnings };
        }

        // Read file content
        const content = await fs.readFile(edit.file, 'utf-8');
        const lines = content.split('\n');
        const totalLines = lines.length;

        for (const hunk of edit.hunks) {
            // Check line range validity
            if (hunk.startLine < 1 || hunk.endLine > totalLines) {
                conflicts.push({
                    hunk,
                    reason: `Line range ${hunk.startLine}-${hunk.endLine} out of bounds (file has ${totalLines} lines)`,
                    suggestion: `Adjust range to be within 1-${totalLines}`
                });
                continue;
            }

            if (hunk.startLine > hunk.endLine) {
                conflicts.push({
                    hunk,
                    reason: `Invalid range: startLine (${hunk.startLine}) > endLine (${hunk.endLine})`
                });
                continue;
            }

            // Check for overlapping hunks
            for (const otherHunk of edit.hunks) {
                if (otherHunk === hunk) continue;

                const overlaps =
                    (hunk.startLine >= otherHunk.startLine && hunk.startLine <= otherHunk.endLine) ||
                    (hunk.endLine >= otherHunk.startLine && hunk.endLine <= otherHunk.endLine);

                if (overlaps) {
                    conflicts.push({
                        hunk,
                        reason: `Overlaps with another hunk at lines ${otherHunk.startLine}-${otherHunk.endLine}`
                    });
                }
            }

            // Validate original content matches (if provided)
            if (hunk.originalContent) {
                const actualContent = lines.slice(hunk.startLine - 1, hunk.endLine).join('\n');

                // Fuzzy match (ignore whitespace differences)
                const normalizedActual = actualContent.replace(/\s+/g, ' ').trim();
                const normalizedExpected = hunk.originalContent.replace(/\s+/g, ' ').trim();

                if (normalizedActual !== normalizedExpected) {
                    warnings.push(
                        `Content mismatch at lines ${hunk.startLine}-${hunk.endLine}: ` +
                        `expected "${hunk.originalContent.substring(0, 50)}..." but found "${actualContent.substring(0, 50)}..."`
                    );
                }
            }
        }

        return {
            valid: conflicts.length === 0,
            conflicts,
            warnings
        };
    }

    /**
     * Rollback an edit using the backup
     */
    public async rollbackEdit(editId: string): Promise<boolean> {
        const history = this.editHistory.get(editId);

        if (!history) {
            console.error(`❌ No edit history found for ID: ${editId}`);
            return false;
        }

        try {
            const backupContent = await fs.readFile(history.backupPath, 'utf-8');
            await fs.writeFile(history.file, backupContent, 'utf-8');

            this.editHistory.delete(editId);
            this.emit('edit:rolledback', { editId, file: history.file });

            console.log(`✅ Rolled back edit ${editId} for ${path.basename(history.file)}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Rollback failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get edit history
     */
    public getHistory(): EditHistory[] {
        return Array.from(this.editHistory.values());
    }

    /**
     * Clear old backups (older than specified days)
     */
    public async cleanupBackups(olderThanDays: number = 7): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        let cleaned = 0;

        for (const [editId, history] of this.editHistory.entries()) {
            if (history.timestamp < cutoffDate) {
                try {
                    await fs.unlink(history.backupPath);
                    this.editHistory.delete(editId);
                    cleaned++;
                } catch {
                    // Ignore cleanup errors
                }
            }
        }

        return cleaned;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async createBackup(file: string, editId: string): Promise<string> {
        await fs.mkdir(this.backupDir, { recursive: true });

        const timestamp = Date.now();
        const fileName = path.basename(file);
        const backupPath = path.join(this.backupDir, `${fileName}.${editId}.${timestamp}.backup`);

        await fs.copyFile(file, backupPath);
        return backupPath;
    }

    private generateEditId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const diffEditEngine = DiffEditEngine.getInstance();
