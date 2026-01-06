/**
 * Prompt Templates - Model-specific prompts
 */
import { EventEmitter } from 'events';

export interface PromptTemplate { id: string; name: string; architecture: string; systemPrefix: string; userPrefix: string; assistantPrefix: string; systemSuffix: string; stopTokens: string[]; }

export class PromptTemplatesEngine extends EventEmitter {
    private static instance: PromptTemplatesEngine;
    private templates: Map<string, PromptTemplate> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PromptTemplatesEngine { if (!PromptTemplatesEngine.instance) PromptTemplatesEngine.instance = new PromptTemplatesEngine(); return PromptTemplatesEngine.instance; }

    private initDefaults(): void {
        const defaults: PromptTemplate[] = [
            { id: 'llama3', name: 'Llama 3', architecture: 'llama', systemPrefix: '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n', userPrefix: '<|start_header_id|>user<|end_header_id|>\n\n', assistantPrefix: '<|start_header_id|>assistant<|end_header_id|>\n\n', systemSuffix: '<|eot_id|>', stopTokens: ['<|eot_id|>'] },
            { id: 'chatml', name: 'ChatML', architecture: 'generic', systemPrefix: '<|im_start|>system\n', userPrefix: '<|im_start|>user\n', assistantPrefix: '<|im_start|>assistant\n', systemSuffix: '<|im_end|>\n', stopTokens: ['<|im_end|>'] },
            { id: 'mistral', name: 'Mistral', architecture: 'mistral', systemPrefix: '[INST] ', userPrefix: '[INST] ', assistantPrefix: ' ', systemSuffix: ' [/INST]', stopTokens: ['</s>'] }
        ];
        defaults.forEach(t => this.templates.set(t.id, t));
    }

    add(template: PromptTemplate): void { this.templates.set(template.id, template); }
    format(templateId: string, messages: { role: string; content: string }[]): string { const t = this.templates.get(templateId); if (!t) return messages.map(m => m.content).join('\n'); return messages.map(m => m.role === 'system' ? `${t.systemPrefix}${m.content}${t.systemSuffix}` : m.role === 'user' ? `${t.userPrefix}${m.content}${t.systemSuffix}` : `${t.assistantPrefix}${m.content}${t.systemSuffix}`).join(''); }
    getAll(): PromptTemplate[] { return Array.from(this.templates.values()); }
    getByArchitecture(arch: string): PromptTemplate | null { return Array.from(this.templates.values()).find(t => t.architecture === arch) || null; }
}
export function getPromptTemplatesEngine(): PromptTemplatesEngine { return PromptTemplatesEngine.getInstance(); }
