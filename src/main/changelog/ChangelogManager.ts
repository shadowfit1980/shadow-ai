/**
 * Changelog System
 * Track version history and changes like Cursor
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ChangelogEntry {
    id: string;
    version: string;
    date: string;
    type: 'feature' | 'fix' | 'improvement' | 'breaking';
    title: string;
    description: string;
    files?: string[];
    author?: string;
}

export interface ChangelogVersion {
    version: string;
    date: string;
    entries: ChangelogEntry[];
}

/**
 * ChangelogManager
 * Manages project changelog and version history
 */
export class ChangelogManager extends EventEmitter {
    private static instance: ChangelogManager;
    private changelog: Map<string, ChangelogVersion[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): ChangelogManager {
        if (!ChangelogManager.instance) {
            ChangelogManager.instance = new ChangelogManager();
        }
        return ChangelogManager.instance;
    }

    /**
     * Load changelog from project
     */
    async loadChangelog(projectPath: string): Promise<ChangelogVersion[]> {
        const changelogPath = path.join(projectPath, 'CHANGELOG.md');

        try {
            const content = await fs.readFile(changelogPath, 'utf-8');
            const versions = this.parseChangelog(content);
            this.changelog.set(projectPath, versions);
            return versions;
        } catch {
            return [];
        }
    }

    /**
     * Parse markdown changelog
     */
    private parseChangelog(content: string): ChangelogVersion[] {
        const versions: ChangelogVersion[] = [];
        const versionRegex = /^##\s*\[?(\d+\.\d+\.\d+)\]?\s*-?\s*(\d{4}-\d{2}-\d{2})?/gm;

        let match;
        const matches: { version: string; date: string; start: number }[] = [];

        while ((match = versionRegex.exec(content)) !== null) {
            matches.push({
                version: match[1],
                date: match[2] || new Date().toISOString().split('T')[0],
                start: match.index,
            });
        }

        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const next = matches[i + 1];
            const section = content.slice(
                current.start,
                next ? next.start : undefined
            );

            const entries = this.parseVersionSection(section, current.version);

            versions.push({
                version: current.version,
                date: current.date,
                entries,
            });
        }

        return versions;
    }

    /**
     * Parse entries from a version section
     */
    private parseVersionSection(section: string, version: string): ChangelogEntry[] {
        const entries: ChangelogEntry[] = [];
        const lines = section.split('\n');

        let currentType: ChangelogEntry['type'] = 'improvement';

        for (const line of lines) {
            const trimmed = line.trim();

            // Detect type headers
            if (/^###\s*Added/i.test(trimmed)) currentType = 'feature';
            else if (/^###\s*Fixed/i.test(trimmed)) currentType = 'fix';
            else if (/^###\s*Changed|Improved/i.test(trimmed)) currentType = 'improvement';
            else if (/^###\s*Breaking|Removed/i.test(trimmed)) currentType = 'breaking';

            // Parse list items
            if (/^[-*]\s+/.test(trimmed)) {
                const title = trimmed.replace(/^[-*]\s+/, '');
                entries.push({
                    id: `${version}_${entries.length}`,
                    version,
                    date: new Date().toISOString().split('T')[0],
                    type: currentType,
                    title,
                    description: title,
                });
            }
        }

        return entries;
    }

    /**
     * Add a changelog entry
     */
    async addEntry(
        projectPath: string,
        entry: Omit<ChangelogEntry, 'id'>
    ): Promise<ChangelogEntry> {
        const newEntry: ChangelogEntry = {
            ...entry,
            id: `${entry.version}_${Date.now()}`,
        };

        // Get or create version
        let versions = this.changelog.get(projectPath) || [];
        let version = versions.find(v => v.version === entry.version);

        if (!version) {
            version = {
                version: entry.version,
                date: new Date().toISOString().split('T')[0],
                entries: [],
            };
            versions.unshift(version);
        }

        version.entries.push(newEntry);
        this.changelog.set(projectPath, versions);

        // Save to file
        await this.saveChangelog(projectPath);

        this.emit('entryAdded', newEntry);
        return newEntry;
    }

    /**
     * Generate changelog markdown
     */
    generateMarkdown(versions: ChangelogVersion[]): string {
        const lines: string[] = ['# Changelog', ''];

        for (const version of versions) {
            lines.push(`## [${version.version}] - ${version.date}`);
            lines.push('');

            const byType = this.groupByType(version.entries);

            if (byType.feature.length > 0) {
                lines.push('### Added');
                byType.feature.forEach(e => lines.push(`- ${e.title}`));
                lines.push('');
            }

            if (byType.fix.length > 0) {
                lines.push('### Fixed');
                byType.fix.forEach(e => lines.push(`- ${e.title}`));
                lines.push('');
            }

            if (byType.improvement.length > 0) {
                lines.push('### Changed');
                byType.improvement.forEach(e => lines.push(`- ${e.title}`));
                lines.push('');
            }

            if (byType.breaking.length > 0) {
                lines.push('### Breaking Changes');
                byType.breaking.forEach(e => lines.push(`- ${e.title}`));
                lines.push('');
            }
        }

        return lines.join('\n');
    }

    /**
     * Group entries by type
     */
    private groupByType(entries: ChangelogEntry[]): Record<ChangelogEntry['type'], ChangelogEntry[]> {
        return {
            feature: entries.filter(e => e.type === 'feature'),
            fix: entries.filter(e => e.type === 'fix'),
            improvement: entries.filter(e => e.type === 'improvement'),
            breaking: entries.filter(e => e.type === 'breaking'),
        };
    }

    /**
     * Save changelog to file
     */
    async saveChangelog(projectPath: string): Promise<void> {
        const versions = this.changelog.get(projectPath) || [];
        const markdown = this.generateMarkdown(versions);
        const changelogPath = path.join(projectPath, 'CHANGELOG.md');
        await fs.writeFile(changelogPath, markdown);
    }

    /**
     * Get latest version
     */
    getLatestVersion(projectPath: string): string | null {
        const versions = this.changelog.get(projectPath);
        return versions?.[0]?.version || null;
    }

    /**
     * Get all versions
     */
    getVersions(projectPath: string): ChangelogVersion[] {
        return this.changelog.get(projectPath) || [];
    }

    /**
     * Bump version
     */
    bumpVersion(current: string, type: 'major' | 'minor' | 'patch'): string {
        const [major, minor, patch] = current.split('.').map(n => parseInt(n, 10));

        switch (type) {
            case 'major':
                return `${major + 1}.0.0`;
            case 'minor':
                return `${major}.${minor + 1}.0`;
            case 'patch':
                return `${major}.${minor}.${patch + 1}`;
            default:
                return current;
        }
    }
}

// Singleton getter
export function getChangelogManager(): ChangelogManager {
    return ChangelogManager.getInstance();
}
