/**
 * Git Rollback & Version Simulation
 * Time-travel through git with AI predictions of branch outcomes
 * Grok Recommendation: Rollback & Version Simulation
 */
import { EventEmitter } from 'events';
import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Snapshot {
    id: string;
    timestamp: Date;
    commitHash: string;
    branch: string;
    message: string;
    files: string[];
    metadata: Record<string, unknown>;
}

interface RollbackResult {
    success: boolean;
    snapshotId: string;
    restoredFiles: string[];
    errors: string[];
}

interface BranchSimulation {
    branchName: string;
    predictedOutcome: 'success' | 'conflict' | 'warning';
    conflictFiles: string[];
    riskScore: number;
    recommendation: string;
}

interface TimelineEntry {
    commitHash: string;
    timestamp: Date;
    author: string;
    message: string;
    filesChanged: number;
    insertions: number;
    deletions: number;
}

export class GitRollbackManager extends EventEmitter {
    private static instance: GitRollbackManager;
    private snapshots: Map<string, Snapshot> = new Map();
    private snapshotDir: string;
    private projectRoot: string;

    private constructor() {
        super();
        this.projectRoot = process.cwd();
        this.snapshotDir = path.join(this.projectRoot, '.shadow-snapshots');
        this.ensureSnapshotDir();
    }

    static getInstance(): GitRollbackManager {
        if (!GitRollbackManager.instance) {
            GitRollbackManager.instance = new GitRollbackManager();
        }
        return GitRollbackManager.instance;
    }

    private ensureSnapshotDir(): void {
        if (!fs.existsSync(this.snapshotDir)) {
            fs.mkdirSync(this.snapshotDir, { recursive: true });
        }
    }

    setProjectRoot(root: string): void {
        this.projectRoot = root;
        this.snapshotDir = path.join(root, '.shadow-snapshots');
        this.ensureSnapshotDir();
    }

    createSnapshot(message: string = 'Auto-snapshot'): Snapshot {
        const id = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let commitHash = '';
        let branch = '';

        try {
            commitHash = execSync('git rev-parse HEAD', { cwd: this.projectRoot, encoding: 'utf-8' }).trim();
            branch = execSync('git branch --show-current', { cwd: this.projectRoot, encoding: 'utf-8' }).trim();
        } catch {
            commitHash = 'no-git';
            branch = 'no-git';
        }

        // Get list of modified files
        let files: string[] = [];
        try {
            const status = execSync('git status --porcelain', { cwd: this.projectRoot, encoding: 'utf-8' });
            files = status.split('\n').filter(Boolean).map(line => line.substring(3));
        } catch {
            files = [];
        }

        // Create snapshot directory
        const snapshotPath = path.join(this.snapshotDir, id);
        fs.mkdirSync(snapshotPath, { recursive: true });

        // Copy modified files to snapshot
        for (const file of files) {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(snapshotPath, file);

            if (fs.existsSync(srcPath)) {
                const destDir = path.dirname(destPath);
                fs.mkdirSync(destDir, { recursive: true });
                fs.copyFileSync(srcPath, destPath);
            }
        }

        const snapshot: Snapshot = {
            id,
            timestamp: new Date(),
            commitHash,
            branch,
            message,
            files,
            metadata: {
                nodeVersion: process.version,
                platform: process.platform
            }
        };

        this.snapshots.set(id, snapshot);

        // Save snapshot metadata
        fs.writeFileSync(
            path.join(snapshotPath, 'metadata.json'),
            JSON.stringify(snapshot, null, 2)
        );

        this.emit('snapshotCreated', snapshot);
        return snapshot;
    }

    async rollback(snapshotId: string): Promise<RollbackResult> {
        const snapshot = this.snapshots.get(snapshotId);

        if (!snapshot) {
            return {
                success: false,
                snapshotId,
                restoredFiles: [],
                errors: ['Snapshot not found']
            };
        }

        const snapshotPath = path.join(this.snapshotDir, snapshotId);
        const restoredFiles: string[] = [];
        const errors: string[] = [];

        // Create a backup of current state before rollback
        this.createSnapshot('Auto-backup before rollback');

        for (const file of snapshot.files) {
            const srcPath = path.join(snapshotPath, file);
            const destPath = path.join(this.projectRoot, file);

            try {
                if (fs.existsSync(srcPath)) {
                    const destDir = path.dirname(destPath);
                    fs.mkdirSync(destDir, { recursive: true });
                    fs.copyFileSync(srcPath, destPath);
                    restoredFiles.push(file);
                }
            } catch (err) {
                errors.push(`Failed to restore ${file}: ${err}`);
            }
        }

        const result: RollbackResult = {
            success: errors.length === 0,
            snapshotId,
            restoredFiles,
            errors
        };

        this.emit('rollbackCompleted', result);
        return result;
    }

    getTimeline(limit: number = 50): TimelineEntry[] {
        const timeline: TimelineEntry[] = [];

        try {
            const log = execSync(
                `git log --format="%H|%aI|%an|%s" -n ${limit}`,
                { cwd: this.projectRoot, encoding: 'utf-8' }
            );

            for (const line of log.split('\n').filter(Boolean)) {
                const [hash, timestamp, author, message] = line.split('|');

                // Get stats for this commit
                let insertions = 0, deletions = 0, filesChanged = 0;
                try {
                    const stats = execSync(
                        `git show --stat --format="" ${hash}`,
                        { cwd: this.projectRoot, encoding: 'utf-8' }
                    );
                    const match = stats.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
                    if (match) {
                        filesChanged = parseInt(match[1]) || 0;
                        insertions = parseInt(match[2]) || 0;
                        deletions = parseInt(match[3]) || 0;
                    }
                } catch { }

                timeline.push({
                    commitHash: hash,
                    timestamp: new Date(timestamp),
                    author,
                    message,
                    filesChanged,
                    insertions,
                    deletions
                });
            }
        } catch (err) {
            console.error('Failed to get git timeline:', err);
        }

        return timeline;
    }

    simulateBranchMerge(targetBranch: string): BranchSimulation {
        let conflictFiles: string[] = [];
        let predictedOutcome: 'success' | 'conflict' | 'warning' = 'success';
        let riskScore = 0;
        let recommendation = '';

        try {
            // Try a dry-run merge to detect conflicts
            try {
                execSync(`git merge --no-commit --no-ff ${targetBranch}`, {
                    cwd: this.projectRoot,
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });

                // Abort the merge
                execSync('git merge --abort', { cwd: this.projectRoot, stdio: 'pipe' });
                predictedOutcome = 'success';
                recommendation = 'Merge is safe to proceed. No conflicts detected.';
            } catch (mergeError) {
                // Check for conflicts
                const status = execSync('git status --porcelain', {
                    cwd: this.projectRoot,
                    encoding: 'utf-8'
                });

                conflictFiles = status.split('\n')
                    .filter(line => line.startsWith('UU') || line.startsWith('AA'))
                    .map(line => line.substring(3));

                if (conflictFiles.length > 0) {
                    predictedOutcome = 'conflict';
                    riskScore = Math.min(conflictFiles.length * 15, 100);
                    recommendation = `Merge will have ${conflictFiles.length} conflict(s). Manual resolution required.`;
                } else {
                    predictedOutcome = 'warning';
                    riskScore = 30;
                    recommendation = 'Merge may have issues. Review changes carefully.';
                }

                // Abort the merge
                try {
                    execSync('git merge --abort', { cwd: this.projectRoot, stdio: 'pipe' });
                } catch { }
            }
        } catch (err) {
            predictedOutcome = 'warning';
            riskScore = 50;
            recommendation = 'Unable to simulate merge. Ensure git is properly configured.';
        }

        return {
            branchName: targetBranch,
            predictedOutcome,
            conflictFiles,
            riskScore,
            recommendation
        };
    }

    async checkoutToTime(timestamp: Date): Promise<{ success: boolean; commitHash: string; message: string }> {
        try {
            const isoDate = timestamp.toISOString();
            const commitHash = execSync(
                `git rev-list -1 --before="${isoDate}" HEAD`,
                { cwd: this.projectRoot, encoding: 'utf-8' }
            ).trim();

            if (!commitHash) {
                return { success: false, commitHash: '', message: 'No commits found before specified time' };
            }

            // Create a snapshot before time-traveling
            this.createSnapshot('Auto-snapshot before time-travel');

            // Create a temporary branch and checkout
            const tempBranch = `time-travel-${Date.now()}`;
            execSync(`git checkout -b ${tempBranch} ${commitHash}`, { cwd: this.projectRoot });

            return {
                success: true,
                commitHash,
                message: `Checked out to ${commitHash} (state at ${isoDate})`
            };
        } catch (err) {
            return { success: false, commitHash: '', message: `Failed: ${err}` };
        }
    }

    getSnapshots(): Snapshot[] {
        return Array.from(this.snapshots.values()).sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
        );
    }

    deleteSnapshot(snapshotId: string): boolean {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) return false;

        const snapshotPath = path.join(this.snapshotDir, snapshotId);

        try {
            fs.rmSync(snapshotPath, { recursive: true, force: true });
            this.snapshots.delete(snapshotId);
            this.emit('snapshotDeleted', snapshotId);
            return true;
        } catch {
            return false;
        }
    }

    loadSnapshots(): void {
        if (!fs.existsSync(this.snapshotDir)) return;

        const dirs = fs.readdirSync(this.snapshotDir);
        for (const dir of dirs) {
            const metadataPath = path.join(this.snapshotDir, dir, 'metadata.json');
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
                    metadata.timestamp = new Date(metadata.timestamp);
                    this.snapshots.set(dir, metadata);
                } catch { }
            }
        }
    }
}

export const gitRollbackManager = GitRollbackManager.getInstance();
