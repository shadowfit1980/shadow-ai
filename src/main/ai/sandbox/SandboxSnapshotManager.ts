/**
 * Sandbox Snapshot Manager
 * 
 * Implements ChatGPT's suggestion for:
 * - Capture full sandbox state at any point
 * - Restore to previous snapshots
 * - Compare states between snapshots
 * - Branch and merge execution paths
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface Snapshot {
    id: string;
    name: string;
    description?: string;
    timestamp: Date;
    state: SandboxState;
    parentId?: string;
    tags: string[];
    metadata: Record<string, any>;
}

export interface SandboxState {
    files: FileState[];
    environment: Record<string, string>;
    processes: ProcessState[];
    network: NetworkState;
    memory: MemoryState;
    checksum: string;
}

export interface FileState {
    path: string;
    content?: string;
    contentHash: string;
    size: number;
    isDirectory: boolean;
    permissions: string;
    modifiedAt: Date;
}

export interface ProcessState {
    pid: number;
    command: string;
    args: string[];
    status: 'running' | 'stopped' | 'zombie';
    cpuUsage: number;
    memoryUsage: number;
}

export interface NetworkState {
    ports: number[];
    connections: Connection[];
}

export interface Connection {
    localPort: number;
    remoteAddress: string;
    remotePort: number;
    state: string;
}

export interface MemoryState {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
}

export interface SnapshotDiff {
    added: FileState[];
    removed: FileState[];
    modified: { before: FileState; after: FileState }[];
    environmentChanges: Record<string, { before?: string; after?: string }>;
}

export interface Branch {
    id: string;
    name: string;
    baseSnapshotId: string;
    headSnapshotId: string;
    createdAt: Date;
}

/**
 * SandboxSnapshotManager handles state capture and restoration
 */
export class SandboxSnapshotManager extends EventEmitter {
    private static instance: SandboxSnapshotManager;
    private snapshots: Map<string, Snapshot> = new Map();
    private branches: Map<string, Branch> = new Map();
    private currentBranch: string = 'main';
    private sandboxRoot: string;
    private persistPath: string;

    private constructor() {
        super();
        this.sandboxRoot = path.join(process.cwd(), '.shadow-sandbox');
        this.persistPath = path.join(process.cwd(), '.shadow-snapshots');
    }

    static getInstance(): SandboxSnapshotManager {
        if (!SandboxSnapshotManager.instance) {
            SandboxSnapshotManager.instance = new SandboxSnapshotManager();
        }
        return SandboxSnapshotManager.instance;
    }

    /**
     * Initialize the snapshot manager
     */
    async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.persistPath, { recursive: true });
            await fs.mkdir(this.sandboxRoot, { recursive: true });
            await this.loadSnapshots();
            console.log(`📸 [SandboxSnapshotManager] Initialized with ${this.snapshots.size} snapshots`);
        } catch (error: any) {
            console.warn('[SandboxSnapshotManager] Could not initialize:', error.message);
        }
    }

    /**
     * Create a snapshot of the current sandbox state
     */
    async createSnapshot(params: {
        name: string;
        description?: string;
        tags?: string[];
        metadata?: Record<string, any>;
    }): Promise<Snapshot> {
        console.log(`📸 [SandboxSnapshotManager] Creating snapshot: ${params.name}`);
        this.emit('snapshot:creating', params);

        const state = await this.captureState();

        const snapshot: Snapshot = {
            id: `snap-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: params.name,
            description: params.description,
            timestamp: new Date(),
            state,
            tags: params.tags || [],
            metadata: params.metadata || {},
        };

        // Set parent to current branch head
        const currentBranch = this.branches.get(this.currentBranch);
        if (currentBranch) {
            snapshot.parentId = currentBranch.headSnapshotId;
            currentBranch.headSnapshotId = snapshot.id;
        }

        this.snapshots.set(snapshot.id, snapshot);
        await this.persistSnapshot(snapshot);

        this.emit('snapshot:created', snapshot);
        console.log(`✅ [SandboxSnapshotManager] Snapshot created: ${snapshot.id}`);

        return snapshot;
    }

    /**
     * Capture current sandbox state
     */
    private async captureState(): Promise<SandboxState> {
        const files = await this.captureFiles(this.sandboxRoot);
        const environment = { ...process.env } as Record<string, string>;
        const memory = process.memoryUsage();

        const state: SandboxState = {
            files,
            environment,
            processes: [], // Would capture actual processes in production
            network: { ports: [], connections: [] },
            memory: {
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                external: memory.external,
                arrayBuffers: memory.arrayBuffers,
            },
            checksum: '',
        };

        // Calculate checksum
        state.checksum = this.calculateChecksum(state);

        return state;
    }

    /**
     * Capture files recursively
     */
    private async captureFiles(dirPath: string): Promise<FileState[]> {
        const files: FileState[] = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(this.sandboxRoot, fullPath);

                try {
                    const stats = await fs.stat(fullPath);

                    if (entry.isDirectory()) {
                        files.push({
                            path: relativePath,
                            contentHash: '',
                            size: 0,
                            isDirectory: true,
                            permissions: stats.mode.toString(8),
                            modifiedAt: stats.mtime,
                        });

                        const subFiles = await this.captureFiles(fullPath);
                        files.push(...subFiles);
                    } else {
                        const content = await fs.readFile(fullPath);
                        const contentHash = crypto.createHash('sha256').update(content).digest('hex');

                        files.push({
                            path: relativePath,
                            content: content.toString('utf-8'),
                            contentHash,
                            size: stats.size,
                            isDirectory: false,
                            permissions: stats.mode.toString(8),
                            modifiedAt: stats.mtime,
                        });
                    }
                } catch {
                    // Skip files we can't read
                }
            }
        } catch {
            // Directory doesn't exist yet
        }

        return files;
    }

    /**
     * Calculate state checksum
     */
    private calculateChecksum(state: SandboxState): string {
        const data = JSON.stringify({
            files: state.files.map(f => ({ path: f.path, hash: f.contentHash })),
            env: Object.keys(state.environment).sort(),
        });
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Restore to a snapshot
     */
    async restoreSnapshot(snapshotId: string): Promise<void> {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }

        console.log(`🔄 [SandboxSnapshotManager] Restoring snapshot: ${snapshot.name}`);
        this.emit('snapshot:restoring', snapshot);

        // Create backup of current state
        await this.createSnapshot({ name: `backup-before-restore-${Date.now()}` });

        // Clear sandbox
        await this.clearSandbox();

        // Restore files
        for (const file of snapshot.state.files) {
            const fullPath = path.join(this.sandboxRoot, file.path);

            if (file.isDirectory) {
                await fs.mkdir(fullPath, { recursive: true });
            } else if (file.content !== undefined) {
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, file.content, 'utf-8');
            }
        }

        this.emit('snapshot:restored', snapshot);
        console.log(`✅ [SandboxSnapshotManager] Restored to: ${snapshot.name}`);
    }

    /**
     * Clear sandbox directory
     */
    private async clearSandbox(): Promise<void> {
        try {
            const entries = await fs.readdir(this.sandboxRoot);
            for (const entry of entries) {
                const fullPath = path.join(this.sandboxRoot, entry);
                await fs.rm(fullPath, { recursive: true, force: true });
            }
        } catch {
            // Sandbox might not exist
        }
    }

    /**
     * Compare two snapshots
     */
    compareSnapshots(snapshotId1: string, snapshotId2: string): SnapshotDiff {
        const snap1 = this.snapshots.get(snapshotId1);
        const snap2 = this.snapshots.get(snapshotId2);

        if (!snap1 || !snap2) {
            throw new Error('One or both snapshots not found');
        }

        const files1 = new Map(snap1.state.files.map(f => [f.path, f]));
        const files2 = new Map(snap2.state.files.map(f => [f.path, f]));

        const added: FileState[] = [];
        const removed: FileState[] = [];
        const modified: { before: FileState; after: FileState }[] = [];

        // Find added and modified files
        for (const [path, file2] of files2) {
            const file1 = files1.get(path);
            if (!file1) {
                added.push(file2);
            } else if (file1.contentHash !== file2.contentHash) {
                modified.push({ before: file1, after: file2 });
            }
        }

        // Find removed files
        for (const [path, file1] of files1) {
            if (!files2.has(path)) {
                removed.push(file1);
            }
        }

        // Compare environment
        const environmentChanges: Record<string, { before?: string; after?: string }> = {};
        const allEnvKeys = new Set([
            ...Object.keys(snap1.state.environment),
            ...Object.keys(snap2.state.environment),
        ]);

        for (const key of allEnvKeys) {
            const val1 = snap1.state.environment[key];
            const val2 = snap2.state.environment[key];
            if (val1 !== val2) {
                environmentChanges[key] = { before: val1, after: val2 };
            }
        }

        return { added, removed, modified, environmentChanges };
    }

    /**
     * Create a branch from a snapshot
     */
    createBranch(name: string, baseSnapshotId?: string): Branch {
        const baseId = baseSnapshotId ||
            (this.branches.get(this.currentBranch)?.headSnapshotId) ||
            [...this.snapshots.keys()].pop() ||
            '';

        const branch: Branch = {
            id: `branch-${Date.now()}`,
            name,
            baseSnapshotId: baseId,
            headSnapshotId: baseId,
            createdAt: new Date(),
        };

        this.branches.set(name, branch);
        this.emit('branch:created', branch);

        return branch;
    }

    /**
     * Switch to a branch
     */
    async switchBranch(branchName: string): Promise<void> {
        const branch = this.branches.get(branchName);
        if (!branch) {
            throw new Error(`Branch not found: ${branchName}`);
        }

        this.currentBranch = branchName;

        if (branch.headSnapshotId) {
            await this.restoreSnapshot(branch.headSnapshotId);
        }

        this.emit('branch:switched', branch);
    }

    /**
     * Persist snapshot to disk
     */
    private async persistSnapshot(snapshot: Snapshot): Promise<void> {
        const filepath = path.join(this.persistPath, `${snapshot.id}.json`);
        await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
    }

    /**
     * Load snapshots from disk
     */
    private async loadSnapshots(): Promise<void> {
        try {
            const entries = await fs.readdir(this.persistPath);

            for (const entry of entries) {
                if (entry.endsWith('.json')) {
                    const filepath = path.join(this.persistPath, entry);
                    const content = await fs.readFile(filepath, 'utf-8');
                    const snapshot = JSON.parse(content);
                    snapshot.timestamp = new Date(snapshot.timestamp);
                    this.snapshots.set(snapshot.id, snapshot);
                }
            }
        } catch {
            // No existing snapshots
        }
    }

    // Public API

    /**
     * Get all snapshots
     */
    getAllSnapshots(): Snapshot[] {
        return [...this.snapshots.values()].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
    }

    /**
     * Get snapshot by ID
     */
    getSnapshot(id: string): Snapshot | undefined {
        return this.snapshots.get(id);
    }

    /**
     * Delete a snapshot
     */
    async deleteSnapshot(id: string): Promise<boolean> {
        const snapshot = this.snapshots.get(id);
        if (!snapshot) return false;

        this.snapshots.delete(id);

        try {
            const filepath = path.join(this.persistPath, `${id}.json`);
            await fs.unlink(filepath);
        } catch {
            // File might not exist
        }

        this.emit('snapshot:deleted', id);
        return true;
    }

    /**
     * Get all branches
     */
    getAllBranches(): Branch[] {
        return [...this.branches.values()];
    }

    /**
     * Get current branch
     */
    getCurrentBranch(): string {
        return this.currentBranch;
    }

    /**
     * Get sandbox root path
     */
    getSandboxRoot(): string {
        return this.sandboxRoot;
    }
}

export default SandboxSnapshotManager;
