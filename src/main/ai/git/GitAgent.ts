/**
 * Git Agent
 * 
 * Full git operations automation including branch creation,
 * commits, PRs, and intelligent merge conflict resolution.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    unstaged: string[];
    untracked: string[];
    conflicted: string[];
    isClean: boolean;
}

export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    date: Date;
    files: string[];
}

export interface BranchInfo {
    name: string;
    isCurrent: boolean;
    isRemote: boolean;
    lastCommit?: string;
    aheadBehind?: { ahead: number; behind: number };
}

export interface MergeConflict {
    file: string;
    ours: string;
    theirs: string;
    base?: string;
}

export interface ConflictResolution {
    file: string;
    resolution: string;
    strategy: 'ours' | 'theirs' | 'merge' | 'custom';
    explanation: string;
}

export interface PRRequest {
    title: string;
    body: string;
    base: string;
    head: string;
    draft?: boolean;
}

// ============================================================================
// GIT AGENT
// ============================================================================

export class GitAgent extends EventEmitter {
    private static instance: GitAgent;
    private modelManager: ModelManager;
    private workingDir: string = process.cwd();

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): GitAgent {
        if (!GitAgent.instance) {
            GitAgent.instance = new GitAgent();
        }
        return GitAgent.instance;
    }

    setWorkingDir(dir: string): void {
        this.workingDir = dir;
    }

    // ========================================================================
    // GIT STATUS & INFO
    // ========================================================================

    /**
     * Get current git status
     */
    async getStatus(): Promise<GitStatus> {
        try {
            const [branchOutput, statusOutput, aheadBehind] = await Promise.all([
                this.git('branch --show-current'),
                this.git('status --porcelain'),
                this.git('rev-list --left-right --count HEAD...@{upstream}').catch(() => '0\t0')
            ]);

            const lines = statusOutput.split('\n').filter(l => l.trim());
            const [ahead, behind] = aheadBehind.trim().split('\t').map(Number);

            const staged: string[] = [];
            const unstaged: string[] = [];
            const untracked: string[] = [];
            const conflicted: string[] = [];

            for (const line of lines) {
                const status = line.substring(0, 2);
                const file = line.substring(3);

                if (status.includes('U') || status === 'AA' || status === 'DD') {
                    conflicted.push(file);
                } else if (status[0] !== ' ' && status[0] !== '?') {
                    staged.push(file);
                }

                if (status[1] !== ' ' && status[1] !== '?') {
                    unstaged.push(file);
                }

                if (status === '??') {
                    untracked.push(file);
                }
            }

            return {
                branch: branchOutput.trim(),
                ahead: ahead || 0,
                behind: behind || 0,
                staged,
                unstaged,
                untracked,
                conflicted,
                isClean: lines.length === 0
            };
        } catch (error) {
            console.error('Git status failed:', error);
            throw error;
        }
    }

    /**
     * Get list of branches
     */
    async getBranches(): Promise<BranchInfo[]> {
        const output = await this.git('branch -a --format="%(refname:short)|%(HEAD)|%(objectname:short)"');
        const currentBranch = await this.git('branch --show-current');

        return output.split('\n').filter(l => l.trim()).map(line => {
            const [name, head, commit] = line.split('|');
            return {
                name: name.trim(),
                isCurrent: name.trim() === currentBranch.trim(),
                isRemote: name.includes('remotes/'),
                lastCommit: commit
            };
        });
    }

    /**
     * Get commit history
     */
    async getLog(limit: number = 10): Promise<CommitInfo[]> {
        const output = await this.git(
            `log --pretty=format:"%H|%s|%an|%ai" -n ${limit}`
        );

        return output.split('\n').filter(l => l.trim()).map(line => {
            const [hash, message, author, date] = line.split('|');
            return {
                hash,
                message,
                author,
                date: new Date(date),
                files: []
            };
        });
    }

    // ========================================================================
    // BRANCH OPERATIONS
    // ========================================================================

    /**
     * Create a new branch
     */
    async createBranch(name: string, checkout: boolean = true): Promise<void> {
        console.log(`🌿 Creating branch: ${name}`);

        if (checkout) {
            await this.git(`checkout -b ${name}`);
        } else {
            await this.git(`branch ${name}`);
        }

        this.emit('branch:created', { name });
    }

    /**
     * Switch to a branch
     */
    async checkout(branch: string): Promise<void> {
        console.log(`🔀 Switching to branch: ${branch}`);
        await this.git(`checkout ${branch}`);
        this.emit('branch:checkout', { branch });
    }

    /**
     * Delete a branch
     */
    async deleteBranch(name: string, force: boolean = false): Promise<void> {
        const flag = force ? '-D' : '-d';
        await this.git(`branch ${flag} ${name}`);
        this.emit('branch:deleted', { name });
    }

    /**
     * Generate intelligent branch name from description
     */
    async generateBranchName(description: string): Promise<string> {
        const prompt = `Generate a git branch name for: "${description}"

Rules:
1. Use lowercase with hyphens
2. Start with feature/, fix/, or chore/
3. Keep it under 50 characters
4. Be descriptive but concise

Respond with just the branch name, no explanation.`;

        const response = await this.callModel(prompt);
        const branchName = response.trim().replace(/[^a-z0-9\/-]/gi, '-').toLowerCase();
        return branchName;
    }

    // ========================================================================
    // COMMIT OPERATIONS
    // ========================================================================

    /**
     * Stage files
     */
    async stage(files: string[] | 'all'): Promise<void> {
        if (files === 'all') {
            await this.git('add -A');
        } else {
            await this.git(`add ${files.join(' ')}`);
        }
        this.emit('files:staged', { files });
    }

    /**
     * Unstage files
     */
    async unstage(files: string[]): Promise<void> {
        await this.git(`reset HEAD ${files.join(' ')}`);
        this.emit('files:unstaged', { files });
    }

    /**
     * Create a commit
     */
    async commit(message: string): Promise<string> {
        console.log(`📝 Creating commit: ${message.substring(0, 50)}...`);

        const output = await this.git(`commit -m "${message.replace(/"/g, '\\"')}"`);
        const hashMatch = output.match(/\[[\w\-/]+\s+([a-f0-9]+)\]/);
        const hash = hashMatch ? hashMatch[1] : 'unknown';

        this.emit('commit:created', { hash, message });
        return hash;
    }

    /**
     * Generate intelligent commit message from changes
     */
    async generateCommitMessage(staged?: boolean): Promise<string> {
        const diff = await this.git(staged ? 'diff --cached' : 'diff');
        const status = await this.getStatus();

        const prompt = `Generate a conventional commit message for these changes.

Changed files:
${(staged ? status.staged : status.unstaged).join('\n')}

Diff (truncated):
\`\`\`
${diff.slice(0, 3000)}
\`\`\`

Rules:
1. Use conventional commits format: type(scope): description
2. Types: feat, fix, docs, style, refactor, test, chore
3. Keep the subject line under 72 characters
4. Be specific about what changed

Respond with just the commit message.`;

        const response = await this.callModel(prompt);
        return response.trim();
    }

    /**
     * Amend the last commit
     */
    async amendCommit(message?: string): Promise<void> {
        if (message) {
            await this.git(`commit --amend -m "${message.replace(/"/g, '\\"')}"`);
        } else {
            await this.git('commit --amend --no-edit');
        }
        this.emit('commit:amended');
    }

    // ========================================================================
    // PUSH/PULL OPERATIONS
    // ========================================================================

    /**
     * Push to remote
     */
    async push(remote: string = 'origin', branch?: string, force: boolean = false): Promise<void> {
        const currentBranch = branch || (await this.git('branch --show-current')).trim();
        const forceFlag = force ? '--force-with-lease' : '';

        console.log(`📤 Pushing to ${remote}/${currentBranch}`);
        await this.git(`push ${forceFlag} ${remote} ${currentBranch}`);

        this.emit('push:completed', { remote, branch: currentBranch });
    }

    /**
     * Push and set upstream
     */
    async pushSetUpstream(remote: string = 'origin'): Promise<void> {
        const branch = (await this.git('branch --show-current')).trim();
        await this.git(`push -u ${remote} ${branch}`);
        this.emit('push:completed', { remote, branch, setUpstream: true });
    }

    /**
     * Pull from remote
     */
    async pull(remote: string = 'origin', branch?: string): Promise<void> {
        const branchArg = branch ? `${remote} ${branch}` : '';
        console.log(`📥 Pulling from ${remote}`);
        await this.git(`pull ${branchArg}`);
        this.emit('pull:completed', { remote, branch });
    }

    /**
     * Fetch from remote
     */
    async fetch(remote: string = 'origin', prune: boolean = true): Promise<void> {
        const pruneFlag = prune ? '--prune' : '';
        await this.git(`fetch ${remote} ${pruneFlag}`);
        this.emit('fetch:completed', { remote });
    }

    // ========================================================================
    // MERGE & CONFLICT RESOLUTION
    // ========================================================================

    /**
     * Merge a branch
     */
    async merge(branch: string, noFastForward: boolean = false): Promise<{ success: boolean; conflicts?: string[] }> {
        const ffFlag = noFastForward ? '--no-ff' : '';

        try {
            await this.git(`merge ${ffFlag} ${branch}`);
            this.emit('merge:completed', { branch });
            return { success: true };
        } catch (error: any) {
            if (error.message.includes('CONFLICT')) {
                const status = await this.getStatus();
                return { success: false, conflicts: status.conflicted };
            }
            throw error;
        }
    }

    /**
     * Get merge conflicts
     */
    async getConflicts(): Promise<MergeConflict[]> {
        const status = await this.getStatus();
        const conflicts: MergeConflict[] = [];

        for (const file of status.conflicted) {
            try {
                const content = await this.git(`show :1:${file}`).catch(() => '');
                const ours = await this.git(`show :2:${file}`).catch(() => '');
                const theirs = await this.git(`show :3:${file}`).catch(() => '');

                conflicts.push({
                    file,
                    base: content,
                    ours,
                    theirs
                });
            } catch {
                conflicts.push({ file, ours: '', theirs: '' });
            }
        }

        return conflicts;
    }

    /**
     * AI-powered conflict resolution
     */
    async resolveConflict(conflict: MergeConflict): Promise<ConflictResolution> {
        const prompt = `Resolve this git merge conflict intelligently.

File: ${conflict.file}

Our version (current branch):
\`\`\`
${conflict.ours.slice(0, 2000)}
\`\`\`

Their version (incoming branch):
\`\`\`
${conflict.theirs.slice(0, 2000)}
\`\`\`

${conflict.base ? `Base version:\n\`\`\`\n${conflict.base.slice(0, 1000)}\n\`\`\`` : ''}

Analyze both versions and provide the best merged result.

Respond in JSON:
\`\`\`json
{
    "strategy": "ours|theirs|merge|custom",
    "resolution": "the merged code",
    "explanation": "why this resolution was chosen"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            file: conflict.file,
            resolution: parsed.resolution || conflict.ours,
            strategy: parsed.strategy || 'ours',
            explanation: parsed.explanation || 'Default resolution'
        };
    }

    /**
     * Apply conflict resolution
     */
    async applyResolution(resolution: ConflictResolution): Promise<void> {
        const { writeFile } = await import('fs/promises');
        const { join } = await import('path');

        const filePath = join(this.workingDir, resolution.file);
        await writeFile(filePath, resolution.resolution);
        await this.git(`add ${resolution.file}`);

        this.emit('conflict:resolved', { file: resolution.file, strategy: resolution.strategy });
    }

    /**
     * Abort merge
     */
    async abortMerge(): Promise<void> {
        await this.git('merge --abort');
        this.emit('merge:aborted');
    }

    // ========================================================================
    // UTILITY
    // ========================================================================

    /**
     * Execute git command
     */
    private async git(command: string): Promise<string> {
        try {
            const { stdout, stderr } = await execAsync(`git ${command}`, {
                cwd: this.workingDir,
                maxBuffer: 10 * 1024 * 1024
            });
            return stdout.trim();
        } catch (error: any) {
            throw new Error(`Git error: ${error.stderr || error.message}`);
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            return await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a git expert assistant. Provide precise, practical git-related responses.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
        } catch {
            return '';
        }
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    /**
     * Check if directory is a git repository
     */
    async isRepository(): Promise<boolean> {
        try {
            await this.git('rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Initialize a new repository
     */
    async init(): Promise<void> {
        await this.git('init');
        this.emit('repo:initialized');
    }
}

// Export singleton
export const gitAgent = GitAgent.getInstance();
