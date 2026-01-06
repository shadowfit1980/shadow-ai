/**
 * Command Safety Net
 * 
 * "Time-rewind" feature that snapshots system state before commands,
 * allowing instant rollback even for destructive operations.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export interface SystemSnapshot {
    id: string;
    timestamp: Date;
    command: string;
    workingDirectory: string;
    fileSnapshots: FileSnapshot[];
    environmentSnapshot: Record<string, string>;
    processInfo: ProcessInfo;
    status: 'pending' | 'captured' | 'rolled_back' | 'expired';
}

export interface FileSnapshot {
    path: string;
    originalContent: string | null; // null if file didn't exist
    permissions: number;
    isDirectory: boolean;
}

export interface ProcessInfo {
    pid: number;
    memory: number;
    uptime: number;
}

export interface RollbackResult {
    success: boolean;
    restoredFiles: number;
    errors: string[];
    duration: number;
}

export class CommandSafetyNet extends EventEmitter {
    private static instance: CommandSafetyNet;
    private snapshots: Map<string, SystemSnapshot> = new Map();
    private snapshotDir: string;
    private maxSnapshots: number = 50;
    private snapshotRetentionMs: number = 24 * 60 * 60 * 1000; // 24 hours

    private constructor() {
        super();
        this.snapshotDir = path.join(app.getPath('userData'), 'snapshots');
        this.initSnapshotDir();
    }

    static getInstance(): CommandSafetyNet {
        if (!CommandSafetyNet.instance) {
            CommandSafetyNet.instance = new CommandSafetyNet();
        }
        return CommandSafetyNet.instance;
    }

    private async initSnapshotDir(): Promise<void> {
        try {
            await fs.mkdir(this.snapshotDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create snapshot directory:', error);
        }
    }

    // ========================================================================
    // SNAPSHOT CREATION
    // ========================================================================

    /**
     * Create a snapshot before executing a command
     */
    async createSnapshot(command: string, cwd: string, affectedPaths: string[] = []): Promise<SystemSnapshot> {
        const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.emit('snapshot:creating', { snapshotId, command });

        // Identify potentially affected files
        const pathsToSnapshot = await this.identifyAffectedPaths(command, cwd, affectedPaths);

        // Capture file snapshots
        const fileSnapshots: FileSnapshot[] = [];
        for (const filePath of pathsToSnapshot) {
            try {
                const snapshot = await this.captureFileSnapshot(filePath);
                fileSnapshots.push(snapshot);
            } catch (error) {
                // File might not exist yet, which is fine
                fileSnapshots.push({
                    path: filePath,
                    originalContent: null,
                    permissions: 0,
                    isDirectory: false,
                });
            }
        }

        const snapshot: SystemSnapshot = {
            id: snapshotId,
            timestamp: new Date(),
            command,
            workingDirectory: cwd,
            fileSnapshots,
            environmentSnapshot: { ...process.env } as Record<string, string>,
            processInfo: {
                pid: process.pid,
                memory: process.memoryUsage().heapUsed,
                uptime: process.uptime(),
            },
            status: 'captured',
        };

        this.snapshots.set(snapshotId, snapshot);

        // Persist to disk for crash recovery
        await this.persistSnapshot(snapshot);

        // Cleanup old snapshots
        await this.cleanupOldSnapshots();

        this.emit('snapshot:created', snapshot);
        return snapshot;
    }

    /**
     * Identify files that might be affected by a command
     */
    private async identifyAffectedPaths(command: string, cwd: string, explicit: string[]): Promise<string[]> {
        const paths = new Set<string>(explicit);

        // Parse command for file references
        const tokens = command.split(/\s+/);
        for (const token of tokens) {
            // Skip command keywords
            if (['rm', 'mv', 'cp', 'cat', 'echo', 'mkdir', 'rmdir', '>', '>>', '|'].includes(token)) {
                continue;
            }

            // Check if token looks like a path
            if (token.startsWith('/') || token.startsWith('./') || token.startsWith('../')) {
                paths.add(path.resolve(cwd, token));
            } else if (token.includes('.')) {
                // Might be a filename
                paths.add(path.resolve(cwd, token));
            }
        }

        // Special handling for destructive commands
        if (command.includes('rm -rf')) {
            // Try to capture the directory being deleted
            const rmMatch = command.match(/rm\s+-rf\s+(\S+)/);
            if (rmMatch) {
                const targetPath = path.resolve(cwd, rmMatch[1]);
                paths.add(targetPath);

                // If it's a directory, try to capture its contents
                try {
                    const stats = await fs.stat(targetPath);
                    if (stats.isDirectory()) {
                        const files = await this.recursiveReadDir(targetPath, 5); // Max depth 5
                        files.forEach(f => paths.add(f));
                    }
                } catch { /* ignore */ }
            }
        }

        return Array.from(paths);
    }

    /**
     * Recursively read directory contents
     */
    private async recursiveReadDir(dir: string, maxDepth: number, currentDepth: number = 0): Promise<string[]> {
        if (currentDepth >= maxDepth) return [];

        const files: string[] = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                files.push(fullPath);
                if (entry.isDirectory()) {
                    const subFiles = await this.recursiveReadDir(fullPath, maxDepth, currentDepth + 1);
                    files.push(...subFiles);
                }
            }
        } catch { /* ignore */ }
        return files;
    }

    /**
     * Capture a single file's snapshot
     */
    private async captureFileSnapshot(filePath: string): Promise<FileSnapshot> {
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            return {
                path: filePath,
                originalContent: null,
                permissions: stats.mode,
                isDirectory: true,
            };
        }

        const content = await fs.readFile(filePath, 'utf-8');
        return {
            path: filePath,
            originalContent: content,
            permissions: stats.mode,
            isDirectory: false,
        };
    }

    // ========================================================================
    // ROLLBACK
    // ========================================================================

    /**
     * Rollback to a previous snapshot
     */
    async rollback(snapshotId: string): Promise<RollbackResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        let restoredFiles = 0;

        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) {
            // Try to load from disk
            const loaded = await this.loadSnapshot(snapshotId);
            if (!loaded) {
                return {
                    success: false,
                    restoredFiles: 0,
                    errors: [`Snapshot ${snapshotId} not found`],
                    duration: Date.now() - startTime,
                };
            }
        }

        const snap = snapshot || (await this.loadSnapshot(snapshotId))!;
        this.emit('snapshot:rolling_back', snapshotId);

        for (const fileSnapshot of snap.fileSnapshots) {
            try {
                if (fileSnapshot.originalContent === null) {
                    // File didn't exist, delete it
                    try {
                        await fs.unlink(fileSnapshot.path);
                        restoredFiles++;
                    } catch {
                        // File might not exist anymore, which is fine
                    }
                } else if (fileSnapshot.isDirectory) {
                    // Recreate directory
                    await fs.mkdir(fileSnapshot.path, { recursive: true, mode: fileSnapshot.permissions });
                    restoredFiles++;
                } else {
                    // Restore file content
                    await fs.mkdir(path.dirname(fileSnapshot.path), { recursive: true });
                    await fs.writeFile(fileSnapshot.path, fileSnapshot.originalContent, { mode: fileSnapshot.permissions });
                    restoredFiles++;
                }
            } catch (error: any) {
                errors.push(`Failed to restore ${fileSnapshot.path}: ${error.message}`);
            }
        }

        snap.status = 'rolled_back';
        this.emit('snapshot:rolled_back', { snapshotId, restoredFiles, errors });

        return {
            success: errors.length === 0,
            restoredFiles,
            errors,
            duration: Date.now() - startTime,
        };
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    private async persistSnapshot(snapshot: SystemSnapshot): Promise<void> {
        const filePath = path.join(this.snapshotDir, `${snapshot.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2));
    }

    private async loadSnapshot(snapshotId: string): Promise<SystemSnapshot | null> {
        try {
            const filePath = path.join(this.snapshotDir, `${snapshotId}.json`);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    private async cleanupOldSnapshots(): Promise<void> {
        const now = Date.now();
        const expired: string[] = [];

        for (const [id, snapshot] of this.snapshots) {
            if (now - snapshot.timestamp.getTime() > this.snapshotRetentionMs) {
                expired.push(id);
            }
        }

        // Keep max snapshots
        const allSnapshots = Array.from(this.snapshots.entries())
            .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());

        if (allSnapshots.length > this.maxSnapshots) {
            const toRemove = allSnapshots.slice(this.maxSnapshots);
            toRemove.forEach(([id]) => expired.push(id));
        }

        for (const id of expired) {
            this.snapshots.delete(id);
            try {
                await fs.unlink(path.join(this.snapshotDir, `${id}.json`));
            } catch { /* ignore */ }
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSnapshot(snapshotId: string): SystemSnapshot | undefined {
        return this.snapshots.get(snapshotId);
    }

    getRecentSnapshots(limit: number = 10): SystemSnapshot[] {
        return Array.from(this.snapshots.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    async getSnapshotSize(): Promise<number> {
        try {
            const files = await fs.readdir(this.snapshotDir);
            let totalSize = 0;
            for (const file of files) {
                const stats = await fs.stat(path.join(this.snapshotDir, file));
                totalSize += stats.size;
            }
            return totalSize;
        } catch {
            return 0;
        }
    }
}

export const commandSafetyNet = CommandSafetyNet.getInstance();
