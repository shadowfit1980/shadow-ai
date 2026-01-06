/**
 * Commit Message Generator
 * 
 * Generates conventional commit messages from code changes.
 */

import { EventEmitter } from 'events';

interface CommitMessage {
    type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
    scope?: string;
    subject: string;
    body?: string;
    breaking?: boolean;
    formatted: string;
}

export class CommitMessageGenerator extends EventEmitter {
    private static instance: CommitMessageGenerator;

    private constructor() { super(); }

    static getInstance(): CommitMessageGenerator {
        if (!CommitMessageGenerator.instance) {
            CommitMessageGenerator.instance = new CommitMessageGenerator();
        }
        return CommitMessageGenerator.instance;
    }

    generateFromDiff(diff: string): CommitMessage {
        const type = this.detectType(diff);
        const scope = this.detectScope(diff);
        const subject = this.generateSubject(diff, type);
        const body = this.generateBody(diff);
        const breaking = diff.includes('BREAKING') || diff.includes('!:');

        const formatted = `${type}${scope ? `(${scope})` : ''}${breaking ? '!' : ''}: ${subject}${body ? `\n\n${body}` : ''}`;

        return { type, scope, subject, body, breaking, formatted };
    }

    private detectType(diff: string): CommitMessage['type'] {
        if (/\.test\.|\.spec\.|__tests__/.test(diff)) return 'test';
        if (/README|\.md|docs\//.test(diff)) return 'docs';
        if (/fix|bug|error|issue|crash/.test(diff.toLowerCase())) return 'fix';
        if (/refactor|rename|move|clean/.test(diff.toLowerCase())) return 'refactor';
        if (/style|css|scss|format/.test(diff.toLowerCase())) return 'style';
        if (/config|package\.json|\.rc/.test(diff)) return 'chore';
        return 'feat';
    }

    private detectScope(diff: string): string | undefined {
        const fileMatch = diff.match(/[+-]\s*(?:src\/)?(\w+)\//);
        return fileMatch?.[1];
    }

    private generateSubject(diff: string, type: string): string {
        const added = (diff.match(/^\+[^+]/gm) || []).length;
        const removed = (diff.match(/^-[^-]/gm) || []).length;

        if (type === 'feat') return `add new functionality (+${added} lines)`;
        if (type === 'fix') return `fix issue in affected code`;
        if (type === 'refactor') return `refactor code structure`;
        if (type === 'test') return `add/update tests`;
        if (type === 'docs') return `update documentation`;
        return `update codebase (+${added}/-${removed})`;
    }

    private generateBody(diff: string): string | undefined {
        const files = [...new Set((diff.match(/[+-]{3}\s+[ab]\/(.+)/g) || []).map(f => f.replace(/[+-]{3}\s+[ab]\//, '')))];
        if (files.length > 1) {
            return `Files changed:\n${files.map(f => `- ${f}`).join('\n')}`;
        }
        return undefined;
    }

    generateFromChanges(changes: { file: string; added: number; removed: number }[]): CommitMessage {
        const totalAdded = changes.reduce((s, c) => s + c.added, 0);
        const totalRemoved = changes.reduce((s, c) => s + c.removed, 0);
        const scope = changes[0]?.file.split('/')[0];

        let type: CommitMessage['type'] = 'feat';
        if (changes.some(c => c.file.includes('test'))) type = 'test';
        else if (totalRemoved > totalAdded * 2) type = 'refactor';

        const subject = `update ${changes.length} files (+${totalAdded}/-${totalRemoved})`;
        const formatted = `${type}${scope ? `(${scope})` : ''}: ${subject}`;

        return { type, scope, subject, formatted, breaking: false };
    }
}

export const commitMessageGenerator = CommitMessageGenerator.getInstance();
