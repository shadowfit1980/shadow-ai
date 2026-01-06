/**
 * Text Expansion - Snippet library
 */
import { EventEmitter } from 'events';

export interface TextSnippet { id: string; trigger: string; expansion: string; category: string; usageCount: number; }

export class TextExpansionEngine extends EventEmitter {
    private static instance: TextExpansionEngine;
    private snippets: Map<string, TextSnippet> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): TextExpansionEngine { if (!TextExpansionEngine.instance) TextExpansionEngine.instance = new TextExpansionEngine(); return TextExpansionEngine.instance; }

    private initDefaults(): void {
        const defaults: TextSnippet[] = [
            { id: 'email', trigger: '@@', expansion: 'user@example.com', category: 'personal', usageCount: 0 },
            { id: 'date', trigger: '//date', expansion: new Date().toISOString().split('T')[0], category: 'utility', usageCount: 0 },
            { id: 'sig', trigger: '//sig', expansion: 'Best regards,\n[Name]', category: 'signature', usageCount: 0 }
        ];
        defaults.forEach(s => this.snippets.set(s.id, s));
    }

    add(trigger: string, expansion: string, category = 'custom'): TextSnippet { const snippet: TextSnippet = { id: `snip_${Date.now()}`, trigger, expansion, category, usageCount: 0 }; this.snippets.set(snippet.id, snippet); return snippet; }
    expand(text: string): string { let result = text; this.snippets.forEach(s => { if (result.includes(s.trigger)) { result = result.replace(s.trigger, s.expansion); s.usageCount++; } }); return result; }
    getByCategory(category: string): TextSnippet[] { return Array.from(this.snippets.values()).filter(s => s.category === category); }
    getAll(): TextSnippet[] { return Array.from(this.snippets.values()); }
}
export function getTextExpansionEngine(): TextExpansionEngine { return TextExpansionEngine.getInstance(); }
