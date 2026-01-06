/**
 * Prompt Library - Reusable prompts
 */
import { EventEmitter } from 'events';

export interface Prompt { id: string; name: string; content: string; variables: string[]; category: string; usageCount: number; }

export class PromptLibrary extends EventEmitter {
    private static instance: PromptLibrary;
    private prompts: Map<string, Prompt> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PromptLibrary { if (!PromptLibrary.instance) PromptLibrary.instance = new PromptLibrary(); return PromptLibrary.instance; }

    private initDefaults(): void {
        const defaults: Prompt[] = [
            { id: 'summarize', name: 'Summarize', content: 'Summarize the following: {{content}}', variables: ['content'], category: 'general', usageCount: 0 },
            { id: 'analyze', name: 'Analyze Code', content: 'Analyze this code and provide improvements: {{code}}', variables: ['code'], category: 'coding', usageCount: 0 },
            { id: 'explain', name: 'Explain', content: 'Explain {{topic}} in simple terms', variables: ['topic'], category: 'general', usageCount: 0 }
        ];
        defaults.forEach(p => this.prompts.set(p.id, p));
    }

    add(name: string, content: string, category = 'custom'): Prompt { const vars = (content.match(/\{\{(\w+)\}\}/g) || []).map(v => v.slice(2, -2)); const prompt: Prompt = { id: `prompt_${Date.now()}`, name, content, variables: vars, category, usageCount: 0 }; this.prompts.set(prompt.id, prompt); return prompt; }
    render(promptId: string, vars: Record<string, string>): string | null { const p = this.prompts.get(promptId); if (!p) return null; p.usageCount++; let result = p.content; Object.entries(vars).forEach(([k, v]) => { result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v); }); return result; }
    getByCategory(category: string): Prompt[] { return Array.from(this.prompts.values()).filter(p => p.category === category); }
    getAll(): Prompt[] { return Array.from(this.prompts.values()); }
}
export function getPromptLibrary(): PromptLibrary { return PromptLibrary.getInstance(); }
