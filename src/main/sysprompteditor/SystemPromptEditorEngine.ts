/**
 * System Prompt Editor - Manage system prompts
 */
import { EventEmitter } from 'events';

export interface SystemPrompt { id: string; name: string; content: string; category: string; isDefault: boolean; createdAt: number; usageCount: number; }

export class SystemPromptEditorEngine extends EventEmitter {
    private static instance: SystemPromptEditorEngine;
    private prompts: Map<string, SystemPrompt> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): SystemPromptEditorEngine { if (!SystemPromptEditorEngine.instance) SystemPromptEditorEngine.instance = new SystemPromptEditorEngine(); return SystemPromptEditorEngine.instance; }

    private initDefaults(): void {
        const defaults: Omit<SystemPrompt, 'id' | 'createdAt' | 'usageCount'>[] = [
            { name: 'Default Assistant', content: 'You are a helpful AI assistant.', category: 'general', isDefault: true },
            { name: 'Code Expert', content: 'You are an expert programmer. Provide clean, efficient code with explanations.', category: 'coding', isDefault: false },
            { name: 'Creative Writer', content: 'You are a creative writer with excellent storytelling skills.', category: 'creative', isDefault: false }
        ];
        defaults.forEach((p, i) => { const sp: SystemPrompt = { id: `sp_${i}`, ...p, createdAt: Date.now(), usageCount: 0 }; this.prompts.set(sp.id, sp); });
    }

    create(name: string, content: string, category = 'custom'): SystemPrompt { const sp: SystemPrompt = { id: `sp_${Date.now()}`, name, content, category, isDefault: false, createdAt: Date.now(), usageCount: 0 }; this.prompts.set(sp.id, sp); return sp; }
    update(promptId: string, updates: Partial<Pick<SystemPrompt, 'name' | 'content' | 'category'>>): boolean { const p = this.prompts.get(promptId); if (!p || p.isDefault) return false; Object.assign(p, updates); return true; }
    delete(promptId: string): boolean { const p = this.prompts.get(promptId); if (!p || p.isDefault) return false; return this.prompts.delete(promptId); }
    use(promptId: string): SystemPrompt | null { const p = this.prompts.get(promptId); if (p) p.usageCount++; return p || null; }
    getByCategory(category: string): SystemPrompt[] { return Array.from(this.prompts.values()).filter(p => p.category === category); }
    getAll(): SystemPrompt[] { return Array.from(this.prompts.values()); }
}
export function getSystemPromptEditorEngine(): SystemPromptEditorEngine { return SystemPromptEditorEngine.getInstance(); }
