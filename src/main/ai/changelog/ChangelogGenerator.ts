/**
 * Changelog Generator
 * AI-powered automatic changelog generation from commits
 * Grok Recommendation: Changelog & Release Notes Generator
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface Commit {
    hash: string;
    author: string;
    date: Date;
    message: string;
    type?: CommitType;
    scope?: string;
    breaking?: boolean;
    body?: string;
    files: string[];
}

type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore' | 'revert';

interface ParsedCommit extends Commit {
    type: CommitType;
    description: string;
    isBreaking: boolean;
    issues?: string[];
    pullRequest?: string;
}

interface Version {
    version: string;
    date: Date;
    commits: ParsedCommit[];
    breaking: ParsedCommit[];
    features: ParsedCommit[];
    fixes: ParsedCommit[];
    other: ParsedCommit[];
    summary?: string;
}

interface ChangelogConfig {
    types: { [key in CommitType]: { title: string; emoji: string; show: boolean } };
    groupByScope: boolean;
    includeBody: boolean;
    includeBreakingSection: boolean;
    includeUnreleasedSection: boolean;
    linkifyIssues: boolean;
    linkifyCommits: boolean;
    repoUrl?: string;
}

interface ReleaseNotes {
    version: string;
    date: string;
    highlights: string[];
    features: string[];
    bugFixes: string[];
    improvements: string[];
    breakingChanges: string[];
    contributors: string[];
    fullChangelog: string;
}

const DEFAULT_CONFIG: ChangelogConfig = {
    types: {
        feat: { title: 'Features', emoji: '✨', show: true },
        fix: { title: 'Bug Fixes', emoji: '🐛', show: true },
        docs: { title: 'Documentation', emoji: '📚', show: true },
        style: { title: 'Styles', emoji: '💅', show: false },
        refactor: { title: 'Code Refactoring', emoji: '♻️', show: true },
        perf: { title: 'Performance', emoji: '⚡', show: true },
        test: { title: 'Tests', emoji: '✅', show: false },
        build: { title: 'Build System', emoji: '📦', show: false },
        ci: { title: 'CI', emoji: '🔧', show: false },
        chore: { title: 'Chores', emoji: '🔨', show: false },
        revert: { title: 'Reverts', emoji: '⏪', show: true }
    },
    groupByScope: true,
    includeBody: false,
    includeBreakingSection: true,
    includeUnreleasedSection: true,
    linkifyIssues: true,
    linkifyCommits: true
};

export class ChangelogGenerator extends EventEmitter {
    private static instance: ChangelogGenerator;
    private config: ChangelogConfig;
    private versions: Map<string, Version> = new Map();
    private commits: ParsedCommit[] = [];

    private constructor() {
        super();
        this.config = { ...DEFAULT_CONFIG };
    }

    static getInstance(): ChangelogGenerator {
        if (!ChangelogGenerator.instance) {
            ChangelogGenerator.instance = new ChangelogGenerator();
        }
        return ChangelogGenerator.instance;
    }

    parseCommit(commit: Commit): ParsedCommit {
        const conventionalPattern = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
        const match = commit.message.match(conventionalPattern);

        let type: CommitType = 'chore';
        let scope: string | undefined;
        let description = commit.message;
        let isBreaking = commit.breaking || false;
        const issues: string[] = [];

        if (match) {
            type = match[1] as CommitType;
            scope = match[2];
            isBreaking = isBreaking || !!match[3];
            description = match[4];
        }

        // Extract issue references
        const issuePattern = /#(\d+)/g;
        let issueMatch;
        while ((issueMatch = issuePattern.exec(commit.message + ' ' + (commit.body || ''))) !== null) {
            issues.push(issueMatch[1]);
        }

        // Check for breaking changes in body
        if (commit.body && /BREAKING\s*CHANGE/i.test(commit.body)) {
            isBreaking = true;
        }

        return {
            ...commit,
            type,
            scope,
            description,
            isBreaking,
            issues: issues.length > 0 ? issues : undefined
        };
    }

    parseCommits(commits: Commit[]): ParsedCommit[] {
        this.commits = commits.map(c => this.parseCommit(c));
        return this.commits;
    }

    createVersion(version: string, commits: ParsedCommit[], date: Date = new Date()): Version {
        const breaking = commits.filter(c => c.isBreaking);
        const features = commits.filter(c => c.type === 'feat');
        const fixes = commits.filter(c => c.type === 'fix');
        const other = commits.filter(c => !['feat', 'fix'].includes(c.type) && !c.isBreaking);

        const ver: Version = {
            version,
            date,
            commits,
            breaking,
            features,
            fixes,
            other,
            summary: this.generateSummary(commits)
        };

        this.versions.set(version, ver);
        return ver;
    }

    private generateSummary(commits: ParsedCommit[]): string {
        const features = commits.filter(c => c.type === 'feat').length;
        const fixes = commits.filter(c => c.type === 'fix').length;
        const breaking = commits.filter(c => c.isBreaking).length;

        const parts: string[] = [];
        if (features > 0) parts.push(`${features} new feature${features > 1 ? 's' : ''}`);
        if (fixes > 0) parts.push(`${fixes} bug fix${fixes > 1 ? 'es' : ''}`);
        if (breaking > 0) parts.push(`${breaking} breaking change${breaking > 1 ? 's' : ''}`);

        return parts.length > 0 ? `This release includes ${parts.join(', ')}.` : 'Maintenance release.';
    }

    generateChangelog(versions?: string[]): string {
        const lines: string[] = ['# Changelog', '', 'All notable changes to this project will be documented in this file.', ''];

        const versionsToInclude = versions
            ? versions.map(v => this.versions.get(v)).filter(Boolean) as Version[]
            : Array.from(this.versions.values()).sort((a, b) => b.date.getTime() - a.date.getTime());

        for (const version of versionsToInclude) {
            lines.push(...this.formatVersion(version));
        }

        return lines.join('\n');
    }

    private formatVersion(version: Version): string[] {
        const lines: string[] = [];
        const dateStr = version.date.toISOString().split('T')[0];

        lines.push(`## [${version.version}] - ${dateStr}`, '');

        if (version.summary) {
            lines.push(version.summary, '');
        }

        // Breaking changes
        if (this.config.includeBreakingSection && version.breaking.length > 0) {
            lines.push('### ⚠️ BREAKING CHANGES', '');
            for (const commit of version.breaking) {
                lines.push(this.formatCommit(commit));
            }
            lines.push('');
        }

        // Group by type
        const typeGroups = new Map<CommitType, ParsedCommit[]>();
        for (const commit of version.commits.filter(c => !c.isBreaking)) {
            const group = typeGroups.get(commit.type) || [];
            group.push(commit);
            typeGroups.set(commit.type, group);
        }

        for (const [type, commits] of typeGroups) {
            const typeConfig = this.config.types[type];
            if (!typeConfig.show) continue;

            lines.push(`### ${typeConfig.emoji} ${typeConfig.title}`, '');

            if (this.config.groupByScope) {
                const scopeGroups = this.groupByScope(commits);
                for (const [scope, scopedCommits] of scopeGroups) {
                    if (scope) {
                        lines.push(`**${scope}:**`);
                    }
                    for (const commit of scopedCommits) {
                        lines.push(this.formatCommit(commit));
                    }
                }
            } else {
                for (const commit of commits) {
                    lines.push(this.formatCommit(commit));
                }
            }
            lines.push('');
        }

        return lines;
    }

    private groupByScope(commits: ParsedCommit[]): Map<string | undefined, ParsedCommit[]> {
        const groups = new Map<string | undefined, ParsedCommit[]>();

        for (const commit of commits) {
            const group = groups.get(commit.scope) || [];
            group.push(commit);
            groups.set(commit.scope, group);
        }

        return groups;
    }

    private formatCommit(commit: ParsedCommit): string {
        let line = `- ${commit.description}`;

        if (commit.issues && commit.issues.length > 0 && this.config.linkifyIssues && this.config.repoUrl) {
            const issueLinks = commit.issues.map(i => `[#${i}](${this.config.repoUrl}/issues/${i})`);
            line += ` (${issueLinks.join(', ')})`;
        } else if (commit.issues && commit.issues.length > 0) {
            line += ` (#${commit.issues.join(', #')})`;
        }

        if (this.config.linkifyCommits && this.config.repoUrl) {
            line += ` ([${commit.hash.substring(0, 7)}](${this.config.repoUrl}/commit/${commit.hash}))`;
        }

        return line;
    }

    generateReleaseNotes(version: string): ReleaseNotes | null {
        const ver = this.versions.get(version);
        if (!ver) return null;

        const contributors = [...new Set(ver.commits.map(c => c.author))];

        return {
            version: ver.version,
            date: ver.date.toISOString().split('T')[0],
            highlights: this.extractHighlights(ver),
            features: ver.features.map(c => c.description),
            bugFixes: ver.fixes.map(c => c.description),
            improvements: ver.other.filter(c => ['refactor', 'perf'].includes(c.type)).map(c => c.description),
            breakingChanges: ver.breaking.map(c => c.description),
            contributors,
            fullChangelog: this.generateChangelog([version])
        };
    }

    private extractHighlights(version: Version): string[] {
        const highlights: string[] = [];

        // Add breaking changes as highlights
        for (const commit of version.breaking) {
            highlights.push(`⚠️ Breaking: ${commit.description}`);
        }

        // Add major features (commits with longer descriptions or multiple issues)
        for (const commit of version.features.slice(0, 3)) {
            highlights.push(`✨ ${commit.description}`);
        }

        return highlights.slice(0, 5);
    }

    generateMarkdown(versions?: string[]): string {
        return this.generateChangelog(versions);
    }

    generateJSON(versions?: string[]): string {
        const data = versions
            ? versions.map(v => this.versions.get(v)).filter(Boolean)
            : Array.from(this.versions.values());

        return JSON.stringify(data, null, 2);
    }

    generateHTML(versions?: string[]): string {
        const markdown = this.generateChangelog(versions);

        // Basic markdown to HTML conversion
        let html = markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

        // Wrap lists
        html = html.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');

        return `<!DOCTYPE html>
<html>
<head>
  <title>Changelog</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h3 { color: #888; }
    li { margin: 8px 0; }
    a { color: #0066cc; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    }

    setConfig(config: Partial<ChangelogConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configUpdated', this.config);
    }

    getConfig(): ChangelogConfig {
        return { ...this.config };
    }

    setRepoUrl(url: string): void {
        this.config.repoUrl = url;
    }

    getVersions(): Version[] {
        return Array.from(this.versions.values());
    }

    getVersion(version: string): Version | undefined {
        return this.versions.get(version);
    }

    getCommitStats(): { total: number; byType: Record<string, number>; breaking: number } {
        const byType: Record<string, number> = {};
        let breaking = 0;

        for (const commit of this.commits) {
            byType[commit.type] = (byType[commit.type] || 0) + 1;
            if (commit.isBreaking) breaking++;
        }

        return { total: this.commits.length, byType, breaking };
    }

    suggestVersion(currentVersion: string): { suggested: string; reason: string } {
        const [major, minor, patch] = currentVersion.split('.').map(Number);

        const hasBreaking = this.commits.some(c => c.isBreaking);
        const hasFeatures = this.commits.some(c => c.type === 'feat');

        if (hasBreaking) {
            return { suggested: `${major + 1}.0.0`, reason: 'Breaking changes detected' };
        } else if (hasFeatures) {
            return { suggested: `${major}.${minor + 1}.0`, reason: 'New features added' };
        } else {
            return { suggested: `${major}.${minor}.${patch + 1}`, reason: 'Bug fixes and improvements' };
        }
    }

    clear(): void {
        this.versions.clear();
        this.commits = [];
    }
}

export const changelogGenerator = ChangelogGenerator.getInstance();
