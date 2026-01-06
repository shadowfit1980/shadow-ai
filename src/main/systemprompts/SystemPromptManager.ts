/**
 * System Prompts - Agent personas
 */
import { EventEmitter } from 'events';

export interface SystemPrompt { id: string; name: string; content: string; persona: string; capabilities: string[]; }

export class SystemPromptManager extends EventEmitter {
    private static instance: SystemPromptManager;
    private prompts: Map<string, SystemPrompt> = new Map();
    private activeId?: string;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): SystemPromptManager { if (!SystemPromptManager.instance) SystemPromptManager.instance = new SystemPromptManager(); return SystemPromptManager.instance; }

    private initDefaults(): void {
        const defaults: SystemPrompt[] = [
            { id: 'coder', name: 'Expert Coder', content: 'You are an expert software engineer.', persona: 'technical', capabilities: ['code', 'debug', 'refactor'] },
            { id: 'analyst', name: 'Data Analyst', content: 'You are a data analysis expert.', persona: 'analytical', capabilities: ['analyze', 'visualize', 'report'] },
            { id: 'writer', name: 'Technical Writer', content: 'You are a technical writing expert.', persona: 'creative', capabilities: ['document', 'explain', 'simplify'] }
        ];
        defaults.forEach(p => this.prompts.set(p.id, p)); this.activeId = 'coder';
    }

    create(name: string, content: string, persona: string, capabilities: string[]): SystemPrompt { const prompt: SystemPrompt = { id: `sys_${Date.now()}`, name, content, persona, capabilities }; this.prompts.set(prompt.id, prompt); return prompt; }
    setActive(id: string): boolean { if (!this.prompts.has(id)) return false; this.activeId = id; this.emit('changed', this.prompts.get(id)); return true; }
    getActive(): SystemPrompt | null { return this.activeId ? this.prompts.get(this.activeId) || null : null; }
    getAll(): SystemPrompt[] { return Array.from(this.prompts.values()); }
}
export function getSystemPromptManager(): SystemPromptManager { return SystemPromptManager.getInstance(); }
