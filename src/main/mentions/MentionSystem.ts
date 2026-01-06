/**
 * Mention System - @mentions in chat
 */
import { EventEmitter } from 'events';

export interface Mention { id: string; type: 'file' | 'folder' | 'symbol' | 'url' | 'codebase' | 'terminal' | 'git'; reference: string; resolved?: string; }

export class MentionSystem extends EventEmitter {
    private static instance: MentionSystem;
    private prefixes: Record<string, Mention['type']> = { '@file:': 'file', '@folder:': 'folder', '@symbol:': 'symbol', '@url:': 'url', '@codebase': 'codebase', '@terminal': 'terminal', '@git': 'git' };
    private constructor() { super(); }
    static getInstance(): MentionSystem { if (!MentionSystem.instance) MentionSystem.instance = new MentionSystem(); return MentionSystem.instance; }

    parse(text: string): Mention[] {
        const mentions: Mention[] = [];
        Object.entries(this.prefixes).forEach(([prefix, type]) => { const regex = new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\w./\\-]+)`, 'g'); let match; while ((match = regex.exec(text)) !== null) { mentions.push({ id: `men_${Date.now()}_${mentions.length}`, type, reference: match[1] || prefix.replace(':', '') }); } });
        this.emit('parsed', mentions); return mentions;
    }

    resolve(mention: Mention): string { return mention.resolved || `[${mention.type}] ${mention.reference}`; }
    getSuggestions(partial: string, type?: Mention['type']): string[] { const suggestions = ['@file:', '@folder:', '@symbol:', '@codebase', '@terminal', '@git']; return suggestions.filter(s => s.startsWith(partial)); }
}
export function getMentionSystem(): MentionSystem { return MentionSystem.getInstance(); }
