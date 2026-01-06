/**
 * Smart Git Assistant
 * 
 * Provides intelligent Git operations with smart commit messages,
 * branch management, and conflict resolution suggestions.
 */

import { EventEmitter } from 'events';

export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: FileChange[];
    unstaged: FileChange[];
    untracked: string[];
    conflicts: string[];
}

export interface FileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions?: number;
    deletions?: number;
}

export interface SmartCommit {
    message: string;
    type: CommitType;
    scope?: string;
    breaking?: boolean;
    issues?: string[];
    confidence: number;
}

export type CommitType =
    | 'feat'
    | 'fix'
    | 'docs'
    | 'style'
    | 'refactor'
    | 'test'
    | 'chore'
    | 'perf'
    | 'ci';

export interface BranchSuggestion {
    name: string;
    type: 'feature' | 'bugfix' | 'hotfix' | 'release' | 'chore';
    basedOn: string;
    confidence: number;
}

export interface ConflictResolution {
    file: string;
    suggestion: 'keep_ours' | 'keep_theirs' | 'merge' | 'manual';
    reason: string;
    mergedContent?: string;
}

export interface CommitHistory {
    hash: string;
    message: string;
    author: string;
    date: Date;
    files: string[];
}

export interface GitAnalysis {
    commitFrequency: Record<string, number>;
    topContributors: { name: string; commits: number }[];
    hotFiles: { path: string; changes: number }[];
    branchHealth: { name: string; aheadBehind: string; staleDays: number }[];
}

export class SmartGitAssistant extends EventEmitter {
    private static instance: SmartGitAssistant;
    private statusCache: GitStatus | null = null;
    private commitHistory: CommitHistory[] = [];

    private constructor() {
        super();
    }

    static getInstance(): SmartGitAssistant {
        if (!SmartGitAssistant.instance) {
            SmartGitAssistant.instance = new SmartGitAssistant();
        }
        return SmartGitAssistant.instance;
    }

    // ========================================================================
    // STATUS & INFO
    // ========================================================================

    async getStatus(): Promise<GitStatus> {
        // Simulated status (real implementation would use git commands)
        const status: GitStatus = {
            branch: 'main',
            ahead: 2,
            behind: 0,
            staged: [
                { path: 'src/index.ts', status: 'modified', additions: 15, deletions: 3 },
            ],
            unstaged: [
                { path: 'src/utils.ts', status: 'modified', additions: 5, deletions: 2 },
            ],
            untracked: ['src/new-file.ts'],
            conflicts: [],
        };

        this.statusCache = status;
        this.emit('status:updated', status);
        return status;
    }

    async getHistory(limit = 20): Promise<CommitHistory[]> {
        // Simulated history
        if (this.commitHistory.length === 0) {
            this.commitHistory = [
                { hash: 'abc123', message: 'feat: add user authentication', author: 'Developer', date: new Date(), files: ['src/auth.ts'] },
                { hash: 'def456', message: 'fix: resolve login issue', author: 'Developer', date: new Date(Date.now() - 86400000), files: ['src/login.ts'] },
                { hash: 'ghi789', message: 'docs: update README', author: 'Developer', date: new Date(Date.now() - 172800000), files: ['README.md'] },
            ];
        }
        return this.commitHistory.slice(0, limit);
    }

    // ========================================================================
    // SMART COMMIT MESSAGES
    // ========================================================================

    async generateCommitMessage(changes: FileChange[]): Promise<SmartCommit[]> {
        const suggestions: SmartCommit[] = [];

        // Analyze changes to determine commit type
        const analysis = this.analyzeChanges(changes);

        // Generate primary suggestion
        suggestions.push({
            message: this.buildCommitMessage(analysis),
            type: analysis.type,
            scope: analysis.scope,
            breaking: analysis.hasBreaking,
            confidence: 0.9,
        });

        // Generate alternative suggestions
        if (analysis.type === 'feat') {
            suggestions.push({
                message: `Add ${analysis.scope || 'new feature'}`,
                type: 'feat',
                scope: analysis.scope,
                confidence: 0.7,
            });
        }

        if (changes.some(c => c.path.includes('test'))) {
            suggestions.push({
                message: `test: add tests for ${analysis.scope || 'components'}`,
                type: 'test',
                scope: analysis.scope,
                confidence: 0.8,
            });
        }

        this.emit('commit:suggested', suggestions);
        return suggestions;
    }

    private analyzeChanges(changes: FileChange[]): {
        type: CommitType;
        scope: string | undefined;
        hasBreaking: boolean;
        description: string;
    } {
        let type: CommitType = 'chore';
        let scope: string | undefined;
        let hasBreaking = false;
        let description = '';

        // Determine type from file patterns
        const paths = changes.map(c => c.path.toLowerCase());

        if (paths.some(p => p.includes('test'))) {
            type = 'test';
            description = 'update tests';
        } else if (paths.some(p => p.includes('doc') || p.includes('readme'))) {
            type = 'docs';
            description = 'update documentation';
        } else if (paths.some(p => p.includes('.config') || p.includes('package.json'))) {
            type = 'chore';
            description = 'update configuration';
        } else if (changes.some(c => c.status === 'added')) {
            type = 'feat';
            description = 'add new functionality';
        } else if (paths.some(p => p.includes('fix') || p.includes('bug'))) {
            type = 'fix';
            description = 'resolve issue';
        } else {
            type = 'refactor';
            description = 'improve code';
        }

        // Determine scope from paths
        const commonPath = this.findCommonPath(paths);
        if (commonPath) {
            scope = commonPath.split('/').pop()?.replace(/\.\w+$/, '');
        }

        // Check for breaking changes (simplified)
        const totalDeletions = changes.reduce((sum, c) => sum + (c.deletions || 0), 0);
        if (totalDeletions > 50) {
            hasBreaking = true;
        }

        return { type, scope, hasBreaking, description };
    }

    private buildCommitMessage(analysis: { type: CommitType; scope?: string; hasBreaking: boolean; description: string }): string {
        let message = analysis.type;
        if (analysis.scope) {
            message += `(${analysis.scope})`;
        }
        if (analysis.hasBreaking) {
            message += '!';
        }
        message += `: ${analysis.description}`;
        return message;
    }

    private findCommonPath(paths: string[]): string {
        if (paths.length === 0) return '';
        if (paths.length === 1) return paths[0];

        const parts = paths[0].split('/');
        let common = '';

        for (let i = 0; i < parts.length - 1; i++) {
            const prefix = parts.slice(0, i + 1).join('/');
            if (paths.every(p => p.startsWith(prefix))) {
                common = prefix;
            } else {
                break;
            }
        }

        return common;
    }

    // ========================================================================
    // BRANCH MANAGEMENT
    // ========================================================================

    async suggestBranchName(description: string): Promise<BranchSuggestion[]> {
        const suggestions: BranchSuggestion[] = [];
        const lower = description.toLowerCase();

        // Determine branch type
        let type: BranchSuggestion['type'] = 'feature';
        if (lower.includes('fix') || lower.includes('bug')) {
            type = 'bugfix';
        } else if (lower.includes('hot') || lower.includes('urgent')) {
            type = 'hotfix';
        } else if (lower.includes('release')) {
            type = 'release';
        }

        // Clean description for branch name
        const cleanName = description
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 50);

        suggestions.push({
            name: `${type}/${cleanName}`,
            type,
            basedOn: 'main',
            confidence: 0.9,
        });

        // Add alternative with ticket number format
        suggestions.push({
            name: `${type}/TICKET-123-${cleanName.slice(0, 20)}`,
            type,
            basedOn: 'main',
            confidence: 0.7,
        });

        return suggestions;
    }

    // ========================================================================
    // CONFLICT RESOLUTION
    // ========================================================================

    async analyzeConflict(_file: string, oursContent: string, theirsContent: string): Promise<ConflictResolution> {
        // Simple conflict analysis
        const oursLines = oursContent.split('\n').length;
        const theirsLines = theirsContent.split('\n').length;

        // If one side has significantly more content, suggest keeping that
        if (oursLines > theirsLines * 1.5) {
            return {
                file: _file,
                suggestion: 'keep_ours',
                reason: 'Our version has more substantial changes',
            };
        } else if (theirsLines > oursLines * 1.5) {
            return {
                file: _file,
                suggestion: 'keep_theirs',
                reason: 'Their version has more substantial changes',
            };
        }

        // Try to merge
        return {
            file: _file,
            suggestion: 'merge',
            reason: 'Both versions have similar changes that can be combined',
            mergedContent: `// Merged content\n${oursContent}\n\n// Additional from theirs\n${theirsContent}`,
        };
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    async analyzeRepository(): Promise<GitAnalysis> {
        // Simulated analysis
        return {
            commitFrequency: {
                Monday: 15,
                Tuesday: 22,
                Wednesday: 18,
                Thursday: 20,
                Friday: 12,
                Saturday: 3,
                Sunday: 2,
            },
            topContributors: [
                { name: 'developer1', commits: 145 },
                { name: 'developer2', commits: 89 },
                { name: 'developer3', commits: 56 },
            ],
            hotFiles: [
                { path: 'src/index.ts', changes: 45 },
                { path: 'src/utils.ts', changes: 38 },
                { path: 'package.json', changes: 22 },
            ],
            branchHealth: [
                { name: 'main', aheadBehind: '0/0', staleDays: 0 },
                { name: 'develop', aheadBehind: '5/2', staleDays: 1 },
                { name: 'feature/old', aheadBehind: '2/45', staleDays: 30 },
            ],
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    async getFileDiff(_file: string): Promise<string> {
        // Simulated diff
        return `diff --git a/${_file} b/${_file}
--- a/${_file}
+++ b/${_file}
@@ -1,5 +1,7 @@
 import React from 'react';
 
+import { newModule } from './new';
+
 export const Component = () => {
-  return <div>Old</div>;
+  return <div>New and improved!</div>;
 };`;
    }

    getCachedStatus(): GitStatus | null {
        return this.statusCache;
    }

    getStats(): {
        totalCommits: number;
        uncommittedChanges: number;
        branches: number;
    } {
        return {
            totalCommits: this.commitHistory.length,
            uncommittedChanges: (this.statusCache?.staged.length || 0) +
                (this.statusCache?.unstaged.length || 0) +
                (this.statusCache?.untracked.length || 0),
            branches: 5, // Simulated
        };
    }
}

export const smartGitAssistant = SmartGitAssistant.getInstance();
