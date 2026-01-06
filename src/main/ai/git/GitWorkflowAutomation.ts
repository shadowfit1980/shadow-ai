/**
 * Git Workflow Automation
 * 
 * Automate Git operations, branching strategies,
 * commit message generation, and PR management.
 */

import { EventEmitter } from 'events';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type BranchingStrategy = 'gitflow' | 'github-flow' | 'trunk-based' | 'release-train';
export type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'perf' | 'ci' | 'build';

export interface CommitMessage {
    type: CommitType;
    scope?: string;
    description: string;
    body?: string;
    breaking?: string;
    issues?: string[];
}

export interface BranchConfig {
    name: string;
    type: 'feature' | 'bugfix' | 'hotfix' | 'release' | 'main' | 'develop';
    baseBranch: string;
    issueNumber?: string;
}

export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    unstaged: string[];
    untracked: string[];
    conflicts: string[];
}

export interface PRTemplate {
    title: string;
    body: string;
    labels: string[];
    reviewers: string[];
    assignees: string[];
}

export interface CommitInfo {
    hash: string;
    shortHash: string;
    author: string;
    email: string;
    date: Date;
    message: string;
    type?: CommitType;
    scope?: string;
}

// ============================================================================
// GIT WORKFLOW AUTOMATION
// ============================================================================

export class GitWorkflowAutomation extends EventEmitter {
    private static instance: GitWorkflowAutomation;
    private strategy: BranchingStrategy = 'github-flow';
    private workingDir: string = process.cwd();

    private constructor() {
        super();
    }

    static getInstance(): GitWorkflowAutomation {
        if (!GitWorkflowAutomation.instance) {
            GitWorkflowAutomation.instance = new GitWorkflowAutomation();
        }
        return GitWorkflowAutomation.instance;
    }

    setWorkingDirectory(dir: string): void {
        this.workingDir = dir;
    }

    setBranchingStrategy(strategy: BranchingStrategy): void {
        this.strategy = strategy;
    }

    // ========================================================================
    // STATUS & INFO
    // ========================================================================

    async getStatus(): Promise<GitStatus> {
        const branch = await this.getCurrentBranch();
        const { ahead, behind } = await this.getAheadBehind();
        const statusOutput = await this.exec('git status --porcelain');

        const staged: string[] = [];
        const unstaged: string[] = [];
        const untracked: string[] = [];
        const conflicts: string[] = [];

        for (const line of statusOutput.split('\n').filter(Boolean)) {
            const index = line[0];
            const working = line[1];
            const file = line.substring(3);

            if (line.startsWith('UU') || line.startsWith('AA')) {
                conflicts.push(file);
            } else if (index !== ' ' && index !== '?') {
                staged.push(file);
            }
            if (working !== ' ' && working !== '?') {
                unstaged.push(file);
            }
            if (line.startsWith('??')) {
                untracked.push(file);
            }
        }

        return { branch, ahead, behind, staged, unstaged, untracked, conflicts };
    }

    async getCurrentBranch(): Promise<string> {
        return (await this.exec('git rev-parse --abbrev-ref HEAD')).trim();
    }

    private async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
        try {
            const output = await this.exec('git rev-list --left-right --count @{u}...HEAD');
            const [behind, ahead] = output.trim().split(/\s+/).map(Number);
            return { ahead: ahead || 0, behind: behind || 0 };
        } catch {
            return { ahead: 0, behind: 0 };
        }
    }

    async getLog(count = 20): Promise<CommitInfo[]> {
        const format = '%H|%h|%an|%ae|%aI|%s';
        const output = await this.exec(`git log -${count} --format="${format}"`);

        return output.split('\n').filter(Boolean).map(line => {
            const [hash, shortHash, author, email, date, message] = line.split('|');
            const parsed = this.parseConventionalCommit(message);
            return {
                hash,
                shortHash,
                author,
                email,
                date: new Date(date),
                message,
                type: parsed.type,
                scope: parsed.scope,
            };
        });
    }

    // ========================================================================
    // COMMIT MESSAGE GENERATION
    // ========================================================================

    generateCommitMessage(config: CommitMessage): string {
        let message = `${config.type}`;

        if (config.scope) {
            message += `(${config.scope})`;
        }

        if (config.breaking) {
            message += '!';
        }

        message += `: ${config.description}`;

        if (config.body) {
            message += `\n\n${config.body}`;
        }

        if (config.breaking) {
            message += `\n\nBREAKING CHANGE: ${config.breaking}`;
        }

        if (config.issues && config.issues.length > 0) {
            message += `\n\n${config.issues.map(i => `Closes #${i}`).join('\n')}`;
        }

        return message;
    }

    parseConventionalCommit(message: string): { type?: CommitType; scope?: string; description: string } {
        const regex = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)/;
        const match = message.match(regex);

        if (match) {
            return {
                type: match[1] as CommitType,
                scope: match[2],
                description: match[3],
            };
        }

        return { description: message };
    }

    async suggestCommitMessage(diff?: string): Promise<CommitMessage> {
        // Analyze staged changes
        const stagedDiff = diff || await this.exec('git diff --cached --stat');
        const files = stagedDiff.split('\n').filter(l => l.includes('|'));

        // Infer type from file paths
        let type: CommitType = 'chore';
        let scope: string | undefined;

        const fileNames = files.map(f => f.split('|')[0].trim());

        if (fileNames.some(f => f.includes('test'))) type = 'test';
        else if (fileNames.some(f => f.includes('.md') || f.includes('docs'))) type = 'docs';
        else if (fileNames.some(f => f.includes('.css') || f.includes('.scss'))) type = 'style';
        else if (fileNames.every(f => f.includes('package') || f.includes('config'))) type = 'chore';
        else if (fileNames.some(f => f.includes('ci') || f.includes('.github'))) type = 'ci';
        else type = 'feat';

        // Infer scope from common path
        if (fileNames.length > 0) {
            const parts = fileNames[0].split('/');
            if (parts.length > 1) {
                scope = parts[parts.length - 2];
            }
        }

        return {
            type,
            scope,
            description: 'update ' + (scope || 'code'),
        };
    }

    // ========================================================================
    // BRANCH OPERATIONS
    // ========================================================================

    createBranch(config: BranchConfig): string {
        let prefix = '';

        switch (this.strategy) {
            case 'gitflow':
                prefix = config.type + '/';
                break;
            case 'github-flow':
                if (config.type === 'feature') prefix = 'feature/';
                else if (config.type === 'bugfix') prefix = 'fix/';
                break;
            case 'trunk-based':
                prefix = '';
                break;
        }

        const safeName = config.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const branchName = config.issueNumber
            ? `${prefix}${config.issueNumber}-${safeName}`
            : `${prefix}${safeName}`;

        return branchName;
    }

    async createAndCheckout(config: BranchConfig): Promise<string> {
        const branchName = this.createBranch(config);
        await this.exec(`git checkout -b ${branchName} ${config.baseBranch}`);
        this.emit('branchCreated', branchName);
        return branchName;
    }

    async deleteBranch(name: string, remote = false): Promise<void> {
        await this.exec(`git branch -d ${name}`);
        if (remote) {
            await this.exec(`git push origin --delete ${name}`);
        }
        this.emit('branchDeleted', name);
    }

    async listBranches(): Promise<{ local: string[]; remote: string[] }> {
        const local = (await this.exec('git branch --format="%(refname:short)"')).split('\n').filter(Boolean);
        const remote = (await this.exec('git branch -r --format="%(refname:short)"')).split('\n').filter(Boolean);
        return { local, remote };
    }

    // ========================================================================
    // STAGING & COMMITTING
    // ========================================================================

    async stage(files: string | string[]): Promise<void> {
        const fileList = Array.isArray(files) ? files.join(' ') : files;
        await this.exec(`git add ${fileList}`);
        this.emit('staged', files);
    }

    async stageAll(): Promise<void> {
        await this.exec('git add -A');
        this.emit('stagedAll');
    }

    async unstage(files: string | string[]): Promise<void> {
        const fileList = Array.isArray(files) ? files.join(' ') : files;
        await this.exec(`git reset HEAD ${fileList}`);
        this.emit('unstaged', files);
    }

    async commit(message: string | CommitMessage): Promise<string> {
        const msg = typeof message === 'string' ? message : this.generateCommitMessage(message);
        const output = await this.exec(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
        const match = output.match(/\[[\w-]+ ([a-f0-9]+)\]/);
        const hash = match ? match[1] : '';
        this.emit('committed', hash);
        return hash;
    }

    async amend(message?: string): Promise<void> {
        if (message) {
            await this.exec(`git commit --amend -m "${message.replace(/"/g, '\\"')}"`);
        } else {
            await this.exec('git commit --amend --no-edit');
        }
        this.emit('amended');
    }

    // ========================================================================
    // PUSH & PULL
    // ========================================================================

    async push(options?: { force?: boolean; setUpstream?: boolean }): Promise<void> {
        let cmd = 'git push';
        if (options?.force) cmd += ' --force-with-lease';
        if (options?.setUpstream) {
            const branch = await this.getCurrentBranch();
            cmd += ` -u origin ${branch}`;
        }
        await this.exec(cmd);
        this.emit('pushed');
    }

    async pull(options?: { rebase?: boolean }): Promise<void> {
        let cmd = 'git pull';
        if (options?.rebase) cmd += ' --rebase';
        await this.exec(cmd);
        this.emit('pulled');
    }

    async fetch(prune = true): Promise<void> {
        await this.exec(`git fetch${prune ? ' --prune' : ''}`);
        this.emit('fetched');
    }

    // ========================================================================
    // STASH
    // ========================================================================

    async stash(message?: string): Promise<void> {
        const cmd = message ? `git stash push -m "${message}"` : 'git stash';
        await this.exec(cmd);
        this.emit('stashed');
    }

    async stashPop(): Promise<void> {
        await this.exec('git stash pop');
        this.emit('stashPopped');
    }

    async stashList(): Promise<Array<{ index: number; branch: string; message: string }>> {
        const output = await this.exec('git stash list');
        return output.split('\n').filter(Boolean).map((line, index) => {
            const match = line.match(/stash@\{(\d+)\}: On (\w+): (.+)/);
            return {
                index: match ? parseInt(match[1]) : index,
                branch: match ? match[2] : 'unknown',
                message: match ? match[3] : line,
            };
        });
    }

    // ========================================================================
    // PR TEMPLATES
    // ========================================================================

    generatePRTemplate(config: {
        type: 'feature' | 'bugfix' | 'hotfix' | 'release';
        title: string;
        description: string;
        changes: string[];
        testing?: string;
        screenshots?: boolean;
        breaking?: boolean;
        issues?: string[];
    }): PRTemplate {
        const body = `## Description
${config.description}

## Type of Change
- [${config.type === 'feature' ? 'x' : ' '}] Feature (new functionality)
- [${config.type === 'bugfix' ? 'x' : ' '}] Bug fix (fixes an issue)
- [${config.type === 'hotfix' ? 'x' : ' '}] Hotfix (critical fix)
- [${config.type === 'release' ? 'x' : ' '}] Release

## Changes
${config.changes.map(c => `- ${c}`).join('\n')}

${config.testing ? `## Testing
${config.testing}` : ''}

${config.screenshots ? `## Screenshots
<!-- Add screenshots here -->` : ''}

${config.breaking ? `## ⚠️ Breaking Changes
<!-- Describe breaking changes -->` : ''}

${config.issues && config.issues.length > 0 ? `## Related Issues
${config.issues.map(i => `Closes #${i}`).join('\n')}` : ''}

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
`;

        return {
            title: config.title,
            body,
            labels: [config.type],
            reviewers: [],
            assignees: [],
        };
    }

    // ========================================================================
    // CHANGELOG GENERATION
    // ========================================================================

    async generateChangelog(since?: string): Promise<string> {
        const fromRef = since || (await this.exec('git describe --tags --abbrev=0 2>/dev/null || echo ""')).trim();
        const commits = await this.getLog(100);

        const grouped: Record<CommitType, CommitInfo[]> = {
            feat: [], fix: [], docs: [], style: [], refactor: [],
            test: [], chore: [], perf: [], ci: [], build: [],
        };

        for (const commit of commits) {
            if (commit.type && grouped[commit.type]) {
                grouped[commit.type].push(commit);
            }
        }

        const typeLabels: Record<CommitType, string> = {
            feat: '✨ Features',
            fix: '🐛 Bug Fixes',
            docs: '📚 Documentation',
            style: '💄 Styles',
            refactor: '♻️ Refactoring',
            test: '✅ Tests',
            chore: '🔧 Chores',
            perf: '⚡ Performance',
            ci: '👷 CI/CD',
            build: '📦 Build',
        };

        let changelog = `# Changelog\n\n`;

        for (const [type, commits] of Object.entries(grouped)) {
            if (commits.length === 0) continue;

            changelog += `## ${typeLabels[type as CommitType]}\n\n`;
            for (const commit of commits) {
                const scope = commit.scope ? `**${commit.scope}:** ` : '';
                changelog += `- ${scope}${commit.message.split(':').slice(1).join(':').trim()} (${commit.shortHash})\n`;
            }
            changelog += '\n';
        }

        return changelog;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async exec(command: string): Promise<string> {
        try {
            const { stdout } = await execAsync(command, { cwd: this.workingDir });
            return stdout;
        } catch (error: any) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }
}

export const gitWorkflowAutomation = GitWorkflowAutomation.getInstance();
