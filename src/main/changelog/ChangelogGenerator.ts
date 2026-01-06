/**
 * Changelog Generator - Generate CHANGELOG files
 */
import { EventEmitter } from 'events';

export interface ChangelogEntry { version: string; date: string; added?: string[]; changed?: string[]; fixed?: string[]; removed?: string[]; }

export class ChangelogGenerator extends EventEmitter {
    private static instance: ChangelogGenerator;
    private entries: ChangelogEntry[] = [];
    private constructor() { super(); }
    static getInstance(): ChangelogGenerator { if (!ChangelogGenerator.instance) ChangelogGenerator.instance = new ChangelogGenerator(); return ChangelogGenerator.instance; }

    addEntry(entry: ChangelogEntry): void { this.entries.unshift(entry); this.emit('entryAdded', entry); }

    generate(): string {
        let changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
        for (const e of this.entries) {
            changelog += `## [${e.version}] - ${e.date}\n\n`;
            if (e.added?.length) changelog += `### Added\n${e.added.map(a => `- ${a}`).join('\n')}\n\n`;
            if (e.changed?.length) changelog += `### Changed\n${e.changed.map(c => `- ${c}`).join('\n')}\n\n`;
            if (e.fixed?.length) changelog += `### Fixed\n${e.fixed.map(f => `- ${f}`).join('\n')}\n\n`;
            if (e.removed?.length) changelog += `### Removed\n${e.removed.map(r => `- ${r}`).join('\n')}\n\n`;
        }
        return changelog;
    }

    getEntries(): ChangelogEntry[] { return [...this.entries]; }
}

export function getChangelogGenerator(): ChangelogGenerator { return ChangelogGenerator.getInstance(); }
