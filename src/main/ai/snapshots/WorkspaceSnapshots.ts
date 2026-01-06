/**
 * Workspace Snapshots & Time Travel
 * 
 * Save entire project states, rollback to any point,
 * and compare changes between snapshots.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface Snapshot {
    id: string;
    name: string;
    description: string;
    projectPath: string;
    timestamp: Date;
    files: SnapshotFile[];
    metadata: {
        totalFiles: number;
        totalSize: number;
        gitBranch?: string;
        gitCommit?: string;
    };
}

export interface SnapshotFile {
    path: string;
    hash: string;
    size: number;
    content?: string;
}

export interface SnapshotDiff {
    added: string[];
    modified: string[];
    deleted: string[];
    details: Array<{
        file: string;
        type: 'added' | 'modified' | 'deleted';
        diff?: string;
    }>;
}

// ============================================================================
// WORKSPACE SNAPSHOTS
// ============================================================================

export class WorkspaceSnapshots extends EventEmitter {
    private static instance: WorkspaceSnapshots;
    private snapshots: Map<string, Snapshot> = new Map();
    private snapshotDir: string = '';
    private maxSnapshots = 50;

    private constructor() {
        super();
    }

    static getInstance(): WorkspaceSnapshots {
        if (!WorkspaceSnapshots.instance) {
            WorkspaceSnapshots.instance = new WorkspaceSnapshots();
        }
        return WorkspaceSnapshots.instance;
    }

    /**
     * Set the directory for storing snapshots
     */
    setSnapshotDirectory(dir: string): void {
        this.snapshotDir = dir;
    }

    // ========================================================================
    // SNAPSHOT CREATION
    // ========================================================================

    /**
     * Create a snapshot of the current project state
     */
    async createSnapshot(projectPath: string, options: {
        name?: string;
        description?: string;
        includeContent?: boolean;
    } = {}): Promise<Snapshot> {
        const { name, description = '', includeContent = true } = options;

        const id = `snapshot_${Date.now()}`;
        const snapshotName = name || `Snapshot ${new Date().toLocaleString()}`;

        this.emit('snapshot:creating', { id, name: snapshotName });

        // Get git info if available
        let gitBranch: string | undefined;
        let gitCommit: string | undefined;
        try {
            const { stdout: branch } = await execAsync('git branch --show-current', { cwd: projectPath });
            const { stdout: commit } = await execAsync('git rev-parse --short HEAD', { cwd: projectPath });
            gitBranch = branch.trim();
            gitCommit = commit.trim();
        } catch {
            // Not a git repo
        }

        // Scan all files
        const files = await this.scanFiles(projectPath, includeContent);

        const snapshot: Snapshot = {
            id,
            name: snapshotName,
            description,
            projectPath,
            timestamp: new Date(),
            files,
            metadata: {
                totalFiles: files.length,
                totalSize: files.reduce((sum, f) => sum + f.size, 0),
                gitBranch,
                gitCommit,
            },
        };

        // Save snapshot
        this.snapshots.set(id, snapshot);
        await this.saveSnapshot(snapshot);

        // Prune old snapshots if needed
        await this.pruneSnapshots();

        this.emit('snapshot:created', snapshot);
        return snapshot;
    }

    /**
     * Scan files in a directory
     */
    private async scanFiles(dir: string, includeContent: boolean, basePath?: string): Promise<SnapshotFile[]> {
        const files: SnapshotFile[] = [];
        const base = basePath || dir;

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(base, fullPath);

                // Skip common exclude patterns
                if (this.shouldExclude(entry.name, relativePath)) continue;

                if (entry.isDirectory()) {
                    const subFiles = await this.scanFiles(fullPath, includeContent, base);
                    files.push(...subFiles);
                } else {
                    const stats = await fs.stat(fullPath);
                    let content: string | undefined;
                    let hash: string;

                    if (includeContent && stats.size < 1000000) { // < 1MB
                        content = await fs.readFile(fullPath, 'utf-8');
                        hash = crypto.createHash('md5').update(content).digest('hex');
                    } else {
                        const buffer = await fs.readFile(fullPath);
                        hash = crypto.createHash('md5').update(buffer).digest('hex');
                    }

                    files.push({
                        path: relativePath,
                        hash,
                        size: stats.size,
                        content,
                    });
                }
            }
        } catch {
            // Permission or access error
        }

        return files;
    }

    private shouldExclude(name: string, relativePath: string): boolean {
        const excludePatterns = [
            'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
            '.DS_Store', 'Thumbs.db', '.env.local', '.cache', 'coverage'
        ];
        return excludePatterns.some(p => name === p || relativePath.includes(p));
    }

    // ========================================================================
    // SNAPSHOT RESTORATION
    // ========================================================================

    /**
     * Restore project to a snapshot state
     */
    async restoreSnapshot(snapshotId: string, targetPath?: string): Promise<boolean> {
        const snapshot = this.snapshots.get(snapshotId) || await this.loadSnapshot(snapshotId);
        if (!snapshot) return false;

        const restorePath = targetPath || snapshot.projectPath;

        this.emit('snapshot:restoring', { id: snapshotId, path: restorePath });

        try {
            for (const file of snapshot.files) {
                if (file.content !== undefined) {
                    const fullPath = path.join(restorePath, file.path);
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });
                    await fs.writeFile(fullPath, file.content);
                }
            }

            this.emit('snapshot:restored', { id: snapshotId, path: restorePath });
            return true;
        } catch (error: any) {
            this.emit('snapshot:error', { id: snapshotId, error: error.message });
            return false;
        }
    }

    // ========================================================================
    // SNAPSHOT COMPARISON
    // ========================================================================

    /**
     * Compare two snapshots
     */
    compareSnapshots(snapshotId1: string, snapshotId2: string): SnapshotDiff | null {
        const snap1 = this.snapshots.get(snapshotId1);
        const snap2 = this.snapshots.get(snapshotId2);

        if (!snap1 || !snap2) return null;

        const files1 = new Map(snap1.files.map(f => [f.path, f]));
        const files2 = new Map(snap2.files.map(f => [f.path, f]));

        const added: string[] = [];
        const modified: string[] = [];
        const deleted: string[] = [];
        const details: SnapshotDiff['details'] = [];

        // Find added and modified files
        for (const [path, file2] of files2) {
            const file1 = files1.get(path);
            if (!file1) {
                added.push(path);
                details.push({ file: path, type: 'added' });
            } else if (file1.hash !== file2.hash) {
                modified.push(path);
                details.push({
                    file: path,
                    type: 'modified',
                    diff: this.generateDiff(file1.content || '', file2.content || ''),
                });
            }
        }

        // Find deleted files
        for (const path of files1.keys()) {
            if (!files2.has(path)) {
                deleted.push(path);
                details.push({ file: path, type: 'deleted' });
            }
        }

        return { added, modified, deleted, details };
    }

    /**
     * Compare current state to a snapshot
     */
    async compareToSnapshot(snapshotId: string, projectPath: string): Promise<SnapshotDiff | null> {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) return null;

        // Create a temporary snapshot of current state
        const currentFiles = await this.scanFiles(projectPath, true);

        const snapshotFiles = new Map(snapshot.files.map(f => [f.path, f]));
        const currentMap = new Map(currentFiles.map(f => [f.path, f]));

        const added: string[] = [];
        const modified: string[] = [];
        const deleted: string[] = [];
        const details: SnapshotDiff['details'] = [];

        for (const [filePath, current] of currentMap) {
            const original = snapshotFiles.get(filePath);
            if (!original) {
                added.push(filePath);
                details.push({ file: filePath, type: 'added' });
            } else if (original.hash !== current.hash) {
                modified.push(filePath);
                details.push({ file: filePath, type: 'modified' });
            }
        }

        for (const filePath of snapshotFiles.keys()) {
            if (!currentMap.has(filePath)) {
                deleted.push(filePath);
                details.push({ file: filePath, type: 'deleted' });
            }
        }

        return { added, modified, deleted, details };
    }

    private generateDiff(content1: string, content2: string): string {
        // Simple line-by-line diff
        const lines1 = content1.split('\n');
        const lines2 = content2.split('\n');
        const diff: string[] = [];

        const maxLines = Math.max(lines1.length, lines2.length);
        for (let i = 0; i < maxLines; i++) {
            if (lines1[i] !== lines2[i]) {
                if (lines1[i]) diff.push(`- ${lines1[i]}`);
                if (lines2[i]) diff.push(`+ ${lines2[i]}`);
            }
        }

        return diff.slice(0, 50).join('\n'); // Limit diff size
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    private async saveSnapshot(snapshot: Snapshot): Promise<void> {
        if (!this.snapshotDir) return;

        const snapshotPath = path.join(this.snapshotDir, `${snapshot.id}.json`);
        await fs.mkdir(this.snapshotDir, { recursive: true });
        await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
    }

    private async loadSnapshot(id: string): Promise<Snapshot | null> {
        if (!this.snapshotDir) return null;

        try {
            const snapshotPath = path.join(this.snapshotDir, `${id}.json`);
            const content = await fs.readFile(snapshotPath, 'utf-8');
            const snapshot = JSON.parse(content);
            snapshot.timestamp = new Date(snapshot.timestamp);
            this.snapshots.set(id, snapshot);
            return snapshot;
        } catch {
            return null;
        }
    }

    private async pruneSnapshots(): Promise<void> {
        if (this.snapshots.size <= this.maxSnapshots) return;

        const sorted = Array.from(this.snapshots.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        const toDelete = sorted.slice(this.maxSnapshots);
        for (const snap of toDelete) {
            this.snapshots.delete(snap.id);
            if (this.snapshotDir) {
                try {
                    await fs.unlink(path.join(this.snapshotDir, `${snap.id}.json`));
                } catch { }
            }
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    listSnapshots(): Snapshot[] {
        return Array.from(this.snapshots.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    getSnapshot(id: string): Snapshot | undefined {
        return this.snapshots.get(id);
    }

    async deleteSnapshot(id: string): Promise<boolean> {
        const deleted = this.snapshots.delete(id);
        if (deleted && this.snapshotDir) {
            try {
                await fs.unlink(path.join(this.snapshotDir, `${id}.json`));
            } catch { }
        }
        return deleted;
    }
}

// Export singleton
export const workspaceSnapshots = WorkspaceSnapshots.getInstance();
