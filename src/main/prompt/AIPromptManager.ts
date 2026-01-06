/**
 * AI Prompt Manager - Manage prompts
 */
import { EventEmitter } from 'events';

export interface Prompt { id: string; name: string; template: string; variables: string[]; category: string; }

export class AIPromptManager extends EventEmitter {
    private static instance: AIPromptManager;
    private prompts: Map<string, Prompt> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): AIPromptManager { if (!AIPromptManager.instance) AIPromptManager.instance = new AIPromptManager(); return AIPromptManager.instance; }

    private initDefaults(): void {
        this.add({ id: 'code-review', name: 'Code Review', template: 'Review this code for bugs and improvements:\n\n{{CODE}}', variables: ['CODE'], category: 'review' });
        this.add({ id: 'explain', name: 'Explain Code', template: 'Explain what this code does:\n\n{{CODE}}', variables: ['CODE'], category: 'explain' });
        this.add({ id: 'refactor', name: 'Refactor', template: 'Refactor this code for better {{GOAL}}:\n\n{{CODE}}', variables: ['CODE', 'GOAL'], category: 'refactor' });
        this.add({ id: 'test', name: 'Generate Tests', template: 'Generate unit tests for:\n\n{{CODE}}', variables: ['CODE'], category: 'test' });
    }

    add(prompt: Prompt): void { this.prompts.set(prompt.id, prompt); this.emit('added', prompt); }
    get(id: string): Prompt | null { return this.prompts.get(id) || null; }
    getAll(): Prompt[] { return Array.from(this.prompts.values()); }
    getByCategory(cat: string): Prompt[] { return this.getAll().filter(p => p.category === cat); }
    render(id: string, vars: Record<string, string>): string { const p = this.get(id); if (!p) return ''; return p.template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || ''); }
    delete(id: string): boolean { return this.prompts.delete(id); }
}

export function getAIPromptManager(): AIPromptManager { return AIPromptManager.getInstance(); }
