/**
 * Mention System - @mentions for context
 */
import { EventEmitter } from 'events';

export interface MentionTarget { type: 'file' | 'folder' | 'symbol' | 'docs' | 'web' | 'codebase'; identifier: string; display: string; }
export interface ParsedMention { raw: string; target: MentionTarget; startIndex: number; endIndex: number; }

export class MentionSystemEngine extends EventEmitter {
    private static instance: MentionSystemEngine;
    private mentionPattern = /@(\w+):([^\s]+)/g;
    private availableTargets: Map<string, MentionTarget[]> = new Map();
    private constructor() { super(); }
    static getInstance(): MentionSystemEngine { if (!MentionSystemEngine.instance) MentionSystemEngine.instance = new MentionSystemEngine(); return MentionSystemEngine.instance; }

    parse(text: string): ParsedMention[] {
        const mentions: ParsedMention[] = []; let match;
        while ((match = this.mentionPattern.exec(text)) !== null) {
            const [raw, type, identifier] = match;
            mentions.push({ raw, target: { type: type as MentionTarget['type'], identifier, display: `@${type}:${identifier}` }, startIndex: match.index, endIndex: match.index + raw.length });
        }
        return mentions;
    }

    suggest(prefix: string, type?: MentionTarget['type']): MentionTarget[] {
        const all = this.availableTargets.get(type || 'file') || [];
        return all.filter(t => t.identifier.toLowerCase().startsWith(prefix.toLowerCase())).slice(0, 10);
    }

    registerTargets(type: MentionTarget['type'], targets: MentionTarget[]): void { this.availableTargets.set(type, targets); }
    resolve(mention: ParsedMention): string { return `Content for ${mention.target.type}:${mention.target.identifier}`; }
    getTypes(): MentionTarget['type'][] { return ['file', 'folder', 'symbol', 'docs', 'web', 'codebase']; }
}
export function getMentionSystemEngine(): MentionSystemEngine { return MentionSystemEngine.getInstance(); }
