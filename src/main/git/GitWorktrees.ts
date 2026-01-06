/**
 * Git Worktrees
 * Manage Git worktrees for branch isolation
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import * as path from 'path';

export interface Worktree {
    id: string;
    path: string;
    branch: string;
    commit: string;
    bare: boolean;
    locked: boolean;
    prunable: boolean;
}

export interface WorktreeCreateOptions {
    branch: string;
    basePath: string;
    newBranch?: boolean;
    detach?: boolean;
}

/**
 * GitWorktrees
 * Manage multiple working directories for parallel development
 */
export class GitWorktrees extends EventEmitter {
    private static instance: GitWorktrees;
    private worktrees: Map<string, Worktree> = new Map();
    private repoPath: string = '';

    private constructor() {
        super();
    }

    static getInstance(): GitWorktrees {
        if (!GitWorktrees.instance) {
            GitWorktrees.instance = new GitWorktrees();
        }
        return GitWorktrees.instance;
    }

    /**
     * Set repository path
     */
    setRepoPath(repoPath: string): void {
        this.repoPath = repoPath;
        this.refresh();
    }

    /**
     * List worktrees
     */
    async list(): Promise<Worktree[]> {
        if (!this.repoPath) return [];

        const output = await this.runGit(['worktree', 'list', '--porcelain']);
        const worktrees = this.parseWorktreeList(output);

        this.worktrees.clear();
        for (const wt of worktrees) {
            this.worktrees.set(wt.id, wt);
        }

        return worktrees;
    }

    /**
     * Create a worktree
     */
    async create(options: WorktreeCreateOptions): Promise<Worktree> {
        const worktreePath = path.join(options.basePath, options.branch.replace(/\//g, '-'));
        const args = ['worktree', 'add'];

        if (options.newBranch) {
            args.push('-b', options.branch);
        }
        if (options.detach) {
            args.push('--detach');
        }

        args.push(worktreePath);
        if (!options.newBranch) {
            args.push(options.branch);
        }

        await this.runGit(args);

        const worktree: Worktree = {
            id: `worktree_${Date.now()}`,
            path: worktreePath,
            branch: options.branch,
            commit: 'HEAD',
            bare: false,
            locked: false,
            prunable: false,
        };

        this.worktrees.set(worktree.id, worktree);
        this.emit('worktreeCreated', worktree);

        return worktree;
    }

    /**
     * Remove a worktree
     */
    async remove(worktreePath: string, force = false): Promise<boolean> {
        const args = ['worktree', 'remove'];
        if (force) args.push('--force');
        args.push(worktreePath);

        try {
            await this.runGit(args);

            // Find and remove from cache
            for (const [id, wt] of this.worktrees) {
                if (wt.path === worktreePath) {
                    this.worktrees.delete(id);
                    break;
                }
            }

            this.emit('worktreeRemoved', { path: worktreePath });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Lock a worktree
     */
    async lock(worktreePath: string, reason?: string): Promise<boolean> {
        const args = ['worktree', 'lock'];
        if (reason) args.push('--reason', reason);
        args.push(worktreePath);

        try {
            await this.runGit(args);
            this.emit('worktreeLocked', { path: worktreePath });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Unlock a worktree
     */
    async unlock(worktreePath: string): Promise<boolean> {
        try {
            await this.runGit(['worktree', 'unlock', worktreePath]);
            this.emit('worktreeUnlocked', { path: worktreePath });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Prune stale worktrees
     */
    async prune(): Promise<void> {
        await this.runGit(['worktree', 'prune']);
        await this.refresh();
        this.emit('worktreesPruned');
    }

    /**
     * Refresh worktree list
     */
    async refresh(): Promise<void> {
        await this.list();
        this.emit('worktreesRefreshed');
    }

    /**
     * Get worktree by path
     */
    getByPath(worktreePath: string): Worktree | null {
        for (const wt of this.worktrees.values()) {
            if (wt.path === worktreePath) {
                return wt;
            }
        }
        return null;
    }

    /**
     * Get worktree by branch
     */
    getByBranch(branch: string): Worktree | null {
        for (const wt of this.worktrees.values()) {
            if (wt.branch === branch) {
                return wt;
            }
        }
        return null;
    }

    /**
     * Get all worktrees
     */
    getAll(): Worktree[] {
        return Array.from(this.worktrees.values());
    }

    // Private methods

    private async runGit(args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            let output = '';

            const proc = spawn('git', args, { cwd: this.repoPath });

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Git command failed: ${output}`));
                }
            });

            proc.on('error', reject);
        });
    }

    private parseWorktreeList(output: string): Worktree[] {
        const worktrees: Worktree[] = [];
        const entries = output.split('\n\n').filter(e => e.trim());

        for (const entry of entries) {
            const lines = entry.split('\n');
            const wt: Partial<Worktree> = {
                id: `worktree_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                bare: false,
                locked: false,
                prunable: false,
            };

            for (const line of lines) {
                if (line.startsWith('worktree ')) {
                    wt.path = line.slice(9);
                } else if (line.startsWith('HEAD ')) {
                    wt.commit = line.slice(5);
                } else if (line.startsWith('branch ')) {
                    wt.branch = line.slice(7).replace('refs/heads/', '');
                } else if (line === 'bare') {
                    wt.bare = true;
                } else if (line.startsWith('locked')) {
                    wt.locked = true;
                } else if (line.startsWith('prunable')) {
                    wt.prunable = true;
                }
            }

            if (wt.path) {
                worktrees.push(wt as Worktree);
            }
        }

        return worktrees;
    }
}

// Singleton getter
export function getGitWorktrees(): GitWorktrees {
    return GitWorktrees.getInstance();
}
