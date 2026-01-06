/**
 * Model Orchestrator - Multi-model coordination
 */
import { EventEmitter } from 'events';

export interface ModelConfig { id: string; name: string; provider: string; capabilities: string[]; costPer1k: number; latency: 'fast' | 'medium' | 'slow'; quality: number; }
export interface OrchestrationPlan { taskId: string; models: { modelId: string; role: string; order: number }[]; fallbacks: string[]; }

export class ModelOrchestrator extends EventEmitter {
    private static instance: ModelOrchestrator;
    private models: Map<string, ModelConfig> = new Map();
    private plans: Map<string, OrchestrationPlan> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ModelOrchestrator { if (!ModelOrchestrator.instance) ModelOrchestrator.instance = new ModelOrchestrator(); return ModelOrchestrator.instance; }

    private initDefaults(): void {
        const defaults: ModelConfig[] = [
            { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', capabilities: ['code', 'chat', 'vision'], costPer1k: 0.005, latency: 'fast', quality: 95 },
            { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', capabilities: ['code', 'chat', 'analysis'], costPer1k: 0.015, latency: 'medium', quality: 98 },
            { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', capabilities: ['code', 'chat', 'vision', 'multimodal'], costPer1k: 0.001, latency: 'fast', quality: 92 }
        ];
        defaults.forEach(m => this.models.set(m.id, m));
    }

    selectBest(capability: string, preference: 'quality' | 'cost' | 'speed' = 'quality'): ModelConfig | null { const matching = Array.from(this.models.values()).filter(m => m.capabilities.includes(capability)); if (!matching.length) return null; return matching.sort((a, b) => preference === 'quality' ? b.quality - a.quality : preference === 'cost' ? a.costPer1k - b.costPer1k : a.latency === 'fast' ? -1 : 1)[0]; }
    createPlan(taskId: string, roles: { role: string; capability: string }[]): OrchestrationPlan { const plan: OrchestrationPlan = { taskId, models: roles.map((r, i) => ({ modelId: this.selectBest(r.capability)?.id || 'gpt-4o', role: r.role, order: i })), fallbacks: ['gpt-4o'] }; this.plans.set(taskId, plan); return plan; }
    getModels(): ModelConfig[] { return Array.from(this.models.values()); }
}
export function getModelOrchestrator(): ModelOrchestrator { return ModelOrchestrator.getInstance(); }
