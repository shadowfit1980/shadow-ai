/**
 * 📁 MultiProjectWorkspace - True Multi-Project / Multi-Branch Workspace
 * 
 * Claude's Recommendation: Open 10 repos at once
 * AI knows which file belongs to which project, can diff between branches
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

// Types
export interface Project {
    id: string;
    name: string;
    path: string;
    type: ProjectType;
    language: string;
    framework?: string;
    gitInfo?: GitInfo;
    status: 'active' | 'inactive' | 'loading';
    lastAccessed: Date;
}

export type ProjectType =
    | 'web-app'
    | 'mobile-app'
    | 'backend'
    | 'library'
    | 'monorepo'
    | 'cli'
    | 'unknown';

export interface GitInfo {
    branch: string;
    remoteUrl?: string;
    hasUncommitted: boolean;
    aheadBehind: { ahead: number; behind: number };
    lastCommit: CommitInfo;
}

export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    date: Date;
}

export interface WorkspaceFile {
    path: string;
    projectId: string;
    language: string;
    isModified: boolean;
    lastModified: Date;
}

export interface BranchDiff {
    sourceBranch: string;
    targetBranch: string;
    files: DiffFile[];
    stats: { additions: number; deletions: number; files: number };
}

export interface DiffFile {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
    patch?: string;
}

export class MultiProjectWorkspace extends EventEmitter {
    private static instance: MultiProjectWorkspace;
    private projects: Map<string, Project> = new Map();
    private activeProjectId: string | null = null;
    private openFiles: Map<string, WorkspaceFile> = new Map();
    private maxProjects = 10;

    private constructor() {
        super();
    }

    static getInstance(): MultiProjectWorkspace {
        if (!MultiProjectWorkspace.instance) {
            MultiProjectWorkspace.instance = new MultiProjectWorkspace();
        }
        return MultiProjectWorkspace.instance;
    }

    /**
     * Add a project to the workspace
     */
    async addProject(projectPath: string): Promise<Project> {
        if (this.projects.size >= this.maxProjects) {
            // Remove least recently used project
            const lru = this.getLeastRecentProject();
            if (lru) {
                await this.removeProject(lru.id);
            }
        }

        const absolutePath = path.resolve(projectPath);
        const project = await this.analyzeProject(absolutePath);

        this.projects.set(project.id, project);
        this.emit('project:added', { project });

        return project;
    }

    /**
     * Analyze a project
     */
    private async analyzeProject(projectPath: string): Promise<Project> {
        const name = path.basename(projectPath);
        const id = `project_${Date.now()}_${name}`;

        // Detect project type and language
        const { type, language, framework } = await this.detectProjectType(projectPath);

        // Get git info
        const gitInfo = await this.getGitInfo(projectPath);

        return {
            id,
            name,
            path: projectPath,
            type,
            language,
            framework,
            gitInfo,
            status: 'active',
            lastAccessed: new Date()
        };
    }

    /**
     * Detect project type from files
     */
    private async detectProjectType(projectPath: string): Promise<{
        type: ProjectType;
        language: string;
        framework?: string;
    }> {
        const files: string[] = await fs.readdir(projectPath).catch(() => []);

        // Check for common files
        const hasPackageJson = files.includes('package.json');
        const hasRequirements = files.includes('requirements.txt');
        const hasCargoToml = files.includes('Cargo.toml');
        const hasGoMod = files.includes('go.mod');

        if (hasPackageJson) {
            try {
                const pkg = JSON.parse(
                    await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
                );

                const deps = { ...pkg.dependencies, ...pkg.devDependencies };

                if (deps['next']) return { type: 'web-app', language: 'typescript', framework: 'nextjs' };
                if (deps['react-native']) return { type: 'mobile-app', language: 'typescript', framework: 'react-native' };
                if (deps['vue']) return { type: 'web-app', language: 'typescript', framework: 'vue' };
                if (deps['react']) return { type: 'web-app', language: 'typescript', framework: 'react' };
                if (deps['express'] || deps['fastify']) return { type: 'backend', language: 'typescript', framework: 'node' };
                if (deps['electron']) return { type: 'web-app', language: 'typescript', framework: 'electron' };

                return { type: 'library', language: 'typescript' };
            } catch {
                return { type: 'web-app', language: 'javascript' };
            }
        }

        if (hasRequirements) return { type: 'backend', language: 'python' };
        if (hasCargoToml) return { type: 'library', language: 'rust' };
        if (hasGoMod) return { type: 'backend', language: 'go' };

        return { type: 'unknown', language: 'unknown' };
    }

    /**
     * Get git repository info
     */
    private async getGitInfo(projectPath: string): Promise<GitInfo | undefined> {
        try {
            // Check if it's a git repo
            await execAsync('git rev-parse --is-inside-work-tree', { cwd: projectPath });

            // Get current branch
            const { stdout: branch } = await execAsync('git branch --show-current', { cwd: projectPath });

            // Get remote URL
            const { stdout: remote } = await execAsync('git remote get-url origin 2>/dev/null || echo ""', { cwd: projectPath });

            // Check for uncommitted changes
            const { stdout: status } = await execAsync('git status --porcelain', { cwd: projectPath });
            const hasUncommitted = status.trim().length > 0;

            // Get ahead/behind
            let ahead = 0, behind = 0;
            try {
                const { stdout: abStatus } = await execAsync('git rev-list --count --left-right @{u}...HEAD 2>/dev/null || echo "0\t0"', { cwd: projectPath });
                const parts = abStatus.trim().split('\t');
                behind = parseInt(parts[0]) || 0;
                ahead = parseInt(parts[1]) || 0;
            } catch {
                // No upstream configured
            }

            // Get last commit
            const { stdout: logOutput } = await execAsync(
                'git log -1 --format="%H|%s|%an|%aI"',
                { cwd: projectPath }
            );
            const [hash, message, author, date] = logOutput.trim().split('|');

            return {
                branch: branch.trim(),
                remoteUrl: remote.trim() || undefined,
                hasUncommitted,
                aheadBehind: { ahead, behind },
                lastCommit: {
                    hash: hash?.slice(0, 8) || '',
                    message: message || '',
                    author: author || '',
                    date: new Date(date || Date.now())
                }
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Remove a project from workspace
     */
    async removeProject(projectId: string): Promise<void> {
        const project = this.projects.get(projectId);
        if (!project) return;

        // Close all files from this project
        for (const [filePath, file] of this.openFiles) {
            if (file.projectId === projectId) {
                this.openFiles.delete(filePath);
            }
        }

        this.projects.delete(projectId);

        if (this.activeProjectId === projectId) {
            this.activeProjectId = this.projects.keys().next().value || null;
        }

        this.emit('project:removed', { projectId });
    }

    /**
     * Set active project
     */
    setActiveProject(projectId: string): void {
        if (!this.projects.has(projectId)) return;

        this.activeProjectId = projectId;
        const project = this.projects.get(projectId)!;
        project.lastAccessed = new Date();

        this.emit('project:activated', { projectId });
    }

    /**
     * Get project for a file path
     */
    getProjectForFile(filePath: string): Project | undefined {
        const absolutePath = path.resolve(filePath);

        for (const project of this.projects.values()) {
            if (absolutePath.startsWith(project.path)) {
                return project;
            }
        }

        return undefined;
    }

    /**
     * Diff between branches in a project
     */
    async diffBranches(projectId: string, sourceBranch: string, targetBranch: string): Promise<BranchDiff> {
        const project = this.projects.get(projectId);
        if (!project) throw new Error('Project not found');

        const { stdout } = await execAsync(
            `git diff --stat --numstat ${sourceBranch}...${targetBranch}`,
            { cwd: project.path }
        );

        const files: DiffFile[] = [];
        let totalAdditions = 0;
        let totalDeletions = 0;

        const lines = stdout.trim().split('\n').filter(l => l);
        for (const line of lines) {
            const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
            if (match) {
                const additions = match[1] === '-' ? 0 : parseInt(match[1]);
                const deletions = match[2] === '-' ? 0 : parseInt(match[2]);

                files.push({
                    path: match[3],
                    status: 'modified',
                    additions,
                    deletions
                });

                totalAdditions += additions;
                totalDeletions += deletions;
            }
        }

        return {
            sourceBranch,
            targetBranch,
            files,
            stats: {
                additions: totalAdditions,
                deletions: totalDeletions,
                files: files.length
            }
        };
    }

    /**
     * Switch branch in a project
     */
    async switchBranch(projectId: string, branchName: string): Promise<void> {
        const project = this.projects.get(projectId);
        if (!project) throw new Error('Project not found');

        await execAsync(`git checkout ${branchName}`, { cwd: project.path });

        // Update git info
        project.gitInfo = await this.getGitInfo(project.path);

        this.emit('project:branch-switched', { projectId, branch: branchName });
    }

    /**
     * Get project branches
     */
    async getBranches(projectId: string): Promise<string[]> {
        const project = this.projects.get(projectId);
        if (!project) throw new Error('Project not found');

        const { stdout } = await execAsync('git branch -a', { cwd: project.path });

        return stdout
            .split('\n')
            .map(b => b.replace(/^\*?\s+/, '').trim())
            .filter(b => b && !b.includes('->'));
    }

    /**
     * Open a file in workspace
     */
    openFile(filePath: string): WorkspaceFile {
        const project = this.getProjectForFile(filePath);

        const file: WorkspaceFile = {
            path: filePath,
            projectId: project?.id || 'unknown',
            language: this.getFileLanguage(filePath),
            isModified: false,
            lastModified: new Date()
        };

        this.openFiles.set(filePath, file);
        this.emit('file:opened', { file });

        return file;
    }

    /**
     * Close a file
     */
    closeFile(filePath: string): void {
        this.openFiles.delete(filePath);
        this.emit('file:closed', { filePath });
    }

    // Helper methods
    private getLeastRecentProject(): Project | undefined {
        let oldest: Project | undefined;
        let oldestTime = Date.now();

        for (const project of this.projects.values()) {
            if (project.lastAccessed.getTime() < oldestTime) {
                oldestTime = project.lastAccessed.getTime();
                oldest = project;
            }
        }

        return oldest;
    }

    private getFileLanguage(filePath: string): string {
        const ext = path.extname(filePath);
        const langMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.h': 'c',
            '.md': 'markdown',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml'
        };
        return langMap[ext] || 'text';
    }

    /**
     * Get all projects
     */
    getProjects(): Project[] {
        return Array.from(this.projects.values());
    }

    /**
     * Get active project
     */
    getActiveProject(): Project | undefined {
        return this.activeProjectId ? this.projects.get(this.activeProjectId) : undefined;
    }

    /**
     * Get open files
     */
    getOpenFiles(): WorkspaceFile[] {
        return Array.from(this.openFiles.values());
    }

    /**
     * Get files for a project
     */
    getFilesForProject(projectId: string): WorkspaceFile[] {
        return Array.from(this.openFiles.values())
            .filter(f => f.projectId === projectId);
    }
}

export const multiProjectWorkspace = MultiProjectWorkspace.getInstance();
