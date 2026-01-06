/**
 * Git Tools
 * 
 * Tools for Git operations including status, diff,
 * commit management, and branch operations.
 */

import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// GIT STATUS
// ============================================================================

export class GitStatusTool extends BaseTool {
    constructor() {
        super({
            name: 'git_status',
            description: 'Get the current git status of the repository',
            category: 'git',
            parameters: [
                defineParameter('path', 'string', 'Repository path', false, {
                    default: '.',
                }),
                defineParameter('porcelain', 'boolean', 'Use porcelain output for parsing', false, {
                    default: true,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Git status with staged, unstaged, and untracked files',
            },
            tags: ['git', 'status', 'vcs'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const repoPath = params.path || context?.workingDirectory || '.';
            const porcelain = params.porcelain !== false;

            const statusCmd = porcelain ? 'git status --porcelain' : 'git status';
            const { stdout: statusOutput } = await execAsync(statusCmd, { cwd: repoPath });
            const { stdout: branchOutput } = await execAsync('git branch --show-current', { cwd: repoPath });

            const status = this.parseStatus(statusOutput);

            return this.createSuccessResult(
                {
                    branch: branchOutput.trim(),
                    ...status,
                    raw: porcelain ? undefined : statusOutput,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseStatus(output: string): {
        staged: string[];
        unstaged: string[];
        untracked: string[];
        conflicted: string[];
    } {
        const lines = output.trim().split('\n').filter(l => l);
        const staged: string[] = [];
        const unstaged: string[] = [];
        const untracked: string[] = [];
        const conflicted: string[] = [];

        for (const line of lines) {
            const index = line[0];
            const worktree = line[1];
            const file = line.slice(3);

            if (line.startsWith('??')) {
                untracked.push(file);
            } else if (index === 'U' || worktree === 'U') {
                conflicted.push(file);
            } else {
                if (index !== ' ' && index !== '?') {
                    staged.push(file);
                }
                if (worktree !== ' ' && worktree !== '?') {
                    unstaged.push(file);
                }
            }
        }

        return { staged, unstaged, untracked, conflicted };
    }
}

// ============================================================================
// GIT DIFF
// ============================================================================

export class GitDiffTool extends BaseTool {
    constructor() {
        super({
            name: 'git_diff',
            description: 'Get the diff of changes in the repository',
            category: 'git',
            parameters: [
                defineParameter('path', 'string', 'Repository path', false),
                defineParameter('file', 'string', 'Specific file to diff', false),
                defineParameter('staged', 'boolean', 'Show staged changes only', false, {
                    default: false,
                }),
                defineParameter('commit', 'string', 'Compare against specific commit', false),
            ],
            returns: {
                type: 'object',
                description: 'Diff output with file changes',
            },
            tags: ['git', 'diff', 'changes'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const repoPath = params.path || context?.workingDirectory || '.';
            const file = params.file as string | undefined;
            const staged = params.staged === true;
            const commit = params.commit as string | undefined;

            let cmd = 'git diff';
            if (staged) cmd += ' --staged';
            if (commit) cmd += ` ${commit}`;
            if (file) cmd += ` -- "${file}"`;

            const { stdout } = await execAsync(cmd, { cwd: repoPath });

            const changes = this.parseDiff(stdout);

            return this.createSuccessResult(
                {
                    changes,
                    totalAdditions: changes.reduce((sum, c) => sum + c.additions, 0),
                    totalDeletions: changes.reduce((sum, c) => sum + c.deletions, 0),
                    raw: stdout,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseDiff(output: string): Array<{
        file: string;
        additions: number;
        deletions: number;
    }> {
        const changes: Array<{ file: string; additions: number; deletions: number }> = [];
        const fileBlocks = output.split(/^diff --git/m).slice(1);

        for (const block of fileBlocks) {
            const fileMatch = block.match(/a\/(.+?) b\//);
            if (!fileMatch) continue;

            const file = fileMatch[1];
            const additions = (block.match(/^\+[^+]/gm) || []).length;
            const deletions = (block.match(/^-[^-]/gm) || []).length;

            changes.push({ file, additions, deletions });
        }

        return changes;
    }
}

// ============================================================================
// GIT LOG
// ============================================================================

export class GitLogTool extends BaseTool {
    constructor() {
        super({
            name: 'git_log',
            description: 'Get the commit history',
            category: 'git',
            parameters: [
                defineParameter('path', 'string', 'Repository path', false),
                defineParameter('count', 'number', 'Number of commits to show', false, {
                    default: 10,
                }),
                defineParameter('file', 'string', 'Show history for specific file', false),
                defineParameter('author', 'string', 'Filter by author', false),
                defineParameter('since', 'string', 'Show commits after date', false),
            ],
            returns: {
                type: 'array',
                description: 'Array of commit objects',
            },
            tags: ['git', 'log', 'history'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const repoPath = params.path || context?.workingDirectory || '.';
            const count = (params.count as number) || 10;
            const file = params.file as string | undefined;
            const author = params.author as string | undefined;
            const since = params.since as string | undefined;

            // Use a format that's easy to parse
            let cmd = `git log -n ${count} --format="%H|%h|%an|%ae|%ai|%s"`;
            if (author) cmd += ` --author="${author}"`;
            if (since) cmd += ` --since="${since}"`;
            if (file) cmd += ` -- "${file}"`;

            const { stdout } = await execAsync(cmd, { cwd: repoPath });

            const commits = stdout.trim().split('\n').filter(l => l).map(line => {
                const [hash, shortHash, author, email, date, ...messageParts] = line.split('|');
                return {
                    hash,
                    shortHash,
                    author,
                    email,
                    date,
                    message: messageParts.join('|'),
                };
            });

            return this.createSuccessResult(commits, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

// ============================================================================
// GIT BRANCH
// ============================================================================

export class GitBranchTool extends BaseTool {
    constructor() {
        super({
            name: 'git_branch',
            description: 'List, create, or switch branches',
            category: 'git',
            parameters: [
                defineParameter('path', 'string', 'Repository path', false),
                defineParameter('action', 'string', 'Action to perform', false, {
                    default: 'list',
                    enum: ['list', 'create', 'switch', 'delete'],
                }),
                defineParameter('name', 'string', 'Branch name for create/switch/delete', false),
            ],
            returns: {
                type: 'object',
                description: 'Branch operation result',
            },
            tags: ['git', 'branch', 'vcs'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const repoPath = params.path || context?.workingDirectory || '.';
            const action = (params.action as string) || 'list';
            const name = params.name as string | undefined;

            let result: any;

            switch (action) {
                case 'list': {
                    const { stdout } = await execAsync('git branch -a', { cwd: repoPath });
                    const branches = stdout.trim().split('\n').map(b => {
                        const isCurrent = b.startsWith('*');
                        return {
                            name: b.replace(/^\*?\s*/, '').trim(),
                            current: isCurrent,
                            remote: b.includes('remotes/'),
                        };
                    });
                    result = { branches, current: branches.find(b => b.current)?.name };
                    break;
                }
                case 'create': {
                    if (!name) throw new Error('Branch name required');
                    await execAsync(`git branch "${name}"`, { cwd: repoPath });
                    result = { created: name, message: `Branch "${name}" created` };
                    break;
                }
                case 'switch': {
                    if (!name) throw new Error('Branch name required');
                    await execAsync(`git checkout "${name}"`, { cwd: repoPath });
                    result = { switched: name, message: `Switched to branch "${name}"` };
                    break;
                }
                case 'delete': {
                    if (!name) throw new Error('Branch name required');
                    await execAsync(`git branch -d "${name}"`, { cwd: repoPath });
                    result = { deleted: name, message: `Branch "${name}" deleted` };
                    break;
                }
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            return this.createSuccessResult(result, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

// ============================================================================
// GIT COMMIT
// ============================================================================

export class GitCommitTool extends BaseTool {
    constructor() {
        super({
            name: 'git_commit',
            description: 'Create a commit with staged changes',
            category: 'git',
            parameters: [
                defineParameter('path', 'string', 'Repository path', false),
                defineParameter('message', 'string', 'Commit message'),
                defineParameter('addAll', 'boolean', 'Stage all changes before committing', false, {
                    default: false,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Commit result with hash',
            },
            tags: ['git', 'commit', 'vcs'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const repoPath = params.path || context?.workingDirectory || '.';
            const message = params.message as string;
            const addAll = params.addAll === true;

            if (!message) {
                throw new Error('Commit message is required');
            }

            // Stage all if requested
            if (addAll) {
                await execAsync('git add -A', { cwd: repoPath });
            }

            // Create commit
            const { stdout } = await execAsync(
                `git commit -m "${message.replace(/"/g, '\\"')}"`,
                { cwd: repoPath }
            );

            // Get the commit hash
            const { stdout: hashOutput } = await execAsync('git rev-parse HEAD', { cwd: repoPath });

            return this.createSuccessResult(
                {
                    hash: hashOutput.trim(),
                    message,
                    output: stdout.trim(),
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

// ============================================================================
// GIT BLAME
// ============================================================================

export class GitBlameTool extends BaseTool {
    constructor() {
        super({
            name: 'git_blame',
            description: 'Show who last modified each line of a file',
            category: 'git',
            parameters: [
                defineParameter('path', 'string', 'Repository path', false),
                defineParameter('file', 'string', 'File to blame'),
                defineParameter('startLine', 'number', 'Start line number', false),
                defineParameter('endLine', 'number', 'End line number', false),
            ],
            returns: {
                type: 'array',
                description: 'Array of blame entries per line',
            },
            tags: ['git', 'blame', 'history'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const repoPath = params.path || context?.workingDirectory || '.';
            const file = params.file as string;
            const startLine = params.startLine as number | undefined;
            const endLine = params.endLine as number | undefined;

            if (!file) {
                throw new Error('File path is required');
            }

            let cmd = `git blame --line-porcelain "${file}"`;
            if (startLine && endLine) {
                cmd = `git blame --line-porcelain -L ${startLine},${endLine} "${file}"`;
            }

            const { stdout } = await execAsync(cmd, { cwd: repoPath });

            const entries = this.parseBlame(stdout);

            return this.createSuccessResult(entries, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseBlame(output: string): Array<{
        line: number;
        hash: string;
        author: string;
        date: string;
        content: string;
    }> {
        const entries: Array<{
            line: number;
            hash: string;
            author: string;
            date: string;
            content: string;
        }> = [];

        const blocks = output.split(/^[a-f0-9]{40}/m).slice(1);
        let lineNum = 1;

        for (const block of blocks) {
            const lines = block.split('\n');
            const authorMatch = block.match(/^author (.+)$/m);
            const timeMatch = block.match(/^author-time (\d+)$/m);
            const contentMatch = block.match(/^\t(.*)$/m);
            const hashMatch = block.match(/^([a-f0-9]{40})/m) || output.match(/^([a-f0-9]{40})/m);

            entries.push({
                line: lineNum++,
                hash: hashMatch?.[1]?.slice(0, 8) || 'unknown',
                author: authorMatch?.[1] || 'unknown',
                date: timeMatch ? new Date(parseInt(timeMatch[1]) * 1000).toISOString() : 'unknown',
                content: contentMatch?.[1] || '',
            });
        }

        return entries;
    }
}

// Export all tools
export const gitTools = [
    new GitStatusTool(),
    new GitDiffTool(),
    new GitLogTool(),
    new GitBranchTool(),
    new GitCommitTool(),
    new GitBlameTool(),
];
