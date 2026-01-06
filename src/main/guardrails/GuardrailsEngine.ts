/**
 * Guardrails Engine - Safety filters
 */
import { EventEmitter } from 'events';

export interface GuardrailConfig { id: string; name: string; contentFilters: { category: string; inputStrength: 'none' | 'low' | 'medium' | 'high'; outputStrength: 'none' | 'low' | 'medium' | 'high' }[]; deniedTopics: string[]; wordFilters: string[]; sensitiveInfoFilters: string[]; }
export interface GuardrailResult { passed: boolean; blockedCategories: string[]; action: 'allow' | 'block' | 'anonymize'; }

export class GuardrailsEngine extends EventEmitter {
    private static instance: GuardrailsEngine;
    private guardrails: Map<string, GuardrailConfig> = new Map();
    private constructor() { super(); }
    static getInstance(): GuardrailsEngine { if (!GuardrailsEngine.instance) GuardrailsEngine.instance = new GuardrailsEngine(); return GuardrailsEngine.instance; }

    create(name: string, config: Partial<GuardrailConfig>): GuardrailConfig { const gr: GuardrailConfig = { id: `gr_${Date.now()}`, name, contentFilters: config.contentFilters || [{ category: 'hate', inputStrength: 'high', outputStrength: 'high' }], deniedTopics: config.deniedTopics || [], wordFilters: config.wordFilters || [], sensitiveInfoFilters: config.sensitiveInfoFilters || ['pii', 'credentials'] }; this.guardrails.set(gr.id, gr); return gr; }

    evaluate(guardrailId: string, text: string, direction: 'input' | 'output'): GuardrailResult {
        const gr = this.guardrails.get(guardrailId); if (!gr) return { passed: true, blockedCategories: [], action: 'allow' };
        const blocked: string[] = []; const t = text.toLowerCase();
        if (gr.wordFilters.some(w => t.includes(w.toLowerCase()))) blocked.push('word_filter');
        if (gr.deniedTopics.some(topic => t.includes(topic.toLowerCase()))) blocked.push('denied_topic');
        if (blocked.length > 0) { this.emit('blocked', { guardrailId, blocked, direction }); return { passed: false, blockedCategories: blocked, action: 'block' }; }
        return { passed: true, blockedCategories: [], action: 'allow' };
    }

    getAll(): GuardrailConfig[] { return Array.from(this.guardrails.values()); }
}
export function getGuardrailsEngine(): GuardrailsEngine { return GuardrailsEngine.getInstance(); }
