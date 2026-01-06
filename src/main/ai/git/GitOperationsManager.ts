/**
 * Git Operations Manager
 * 
 * Automate common Git operations.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    modified: string[];
    untracked: string[];
}

interface GitLog {
    hash: string;
    message: string;
    author: string;
    date: string;
}

export class GitOperationsManager extends EventEmitter {
    private static instance: GitOperationsManager;

    private constructor() { super(); }

    static getInstance(): GitOperationsManager {
        if (!GitOperationsManager.instance) {
            GitOperationsManager.instance = new GitOperationsManager();
        }
        return GitOperationsManager.instance;
    }

    private async run(cwd: string, cmd: string): Promise<string> {
        try {
            const { stdout } = await execAsync(cmd, { cwd });
            return stdout.trim();
        } catch (e: any) {
            throw new Error(e.stderr || e.message);
        }
    }

    async getStatus(cwd: string): Promise<GitStatus> {
        const branch = await this.run(cwd, 'git rev-parse --abbrev-ref HEAD');
        const statusOutput = await this.run(cwd, 'git status --porcelain');

        const staged: string[] = [], modified: string[] = [], untracked: string[] = [];
        for (const line of statusOutput.split('\n').filter(Boolean)) {
            const status = line.slice(0, 2);
            const file = line.slice(3);
            if (status.includes('?')) untracked.push(file);
            else if (status[0] !== ' ') staged.push(file);
            else if (status[1] !== ' ') modified.push(file);
        }

        let ahead = 0, behind = 0;
        try {
            const ab = await this.run(cwd, 'git rev-list --left-right --count HEAD...@{u}');
            [ahead, behind] = ab.split('\t').map(Number);
        } catch (e) { /* no upstream */ }

        return { branch, ahead, behind, staged, modified, untracked };
    }

    async getLog(cwd: string, limit = 10): Promise<GitLog[]> {
        const output = await this.run(cwd, `git log -n ${limit} --pretty=format:"%H|%s|%an|%ad" --date=short`);
        return output.split('\n').filter(Boolean).map(line => {
            const [hash, message, author, date] = line.split('|');
            return { hash, message, author, date };
        });
    }

    async stage(cwd: string, files: string[]): Promise<void> {
        await this.run(cwd, `git add ${files.join(' ')}`);
        this.emit('git:staged', files);
    }

    async commit(cwd: string, message: string): Promise<string> {
        const result = await this.run(cwd, `git commit -m "${message.replace(/"/g, '\\"')}"`);
        this.emit('git:committed', message);
        return result;
    }

    async push(cwd: string, branch?: string): Promise<void> {
        const cmd = branch ? `git push origin ${branch}` : 'git push';
        await this.run(cwd, cmd);
        this.emit('git:pushed');
    }

    async pull(cwd: string): Promise<string> {
        const result = await this.run(cwd, 'git pull');
        this.emit('git:pulled');
        return result;
    }

    async getBranches(cwd: string): Promise<{ current: string; all: string[] }> {
        const output = await this.run(cwd, 'git branch -a');
        const all = output.split('\n').map(b => b.replace(/^\*?\s+/, '').trim()).filter(Boolean);
        const current = output.split('\n').find(b => b.startsWith('*'))?.slice(2).trim() || 'main';
        return { current, all };
    }

    async createBranch(cwd: string, name: string): Promise<void> {
        await this.run(cwd, `git checkout -b ${name}`);
        this.emit('git:branch-created', name);
    }

    async getDiff(cwd: string, file?: string): Promise<string> {
        return this.run(cwd, file ? `git diff ${file}` : 'git diff');
    }
}

export const gitOperationsManager = GitOperationsManager.getInstance();
