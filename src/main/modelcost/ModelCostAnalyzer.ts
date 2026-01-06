/**
 * Model Cost Analyzer - Compare model costs
 */
import { EventEmitter } from 'events';

export interface ModelCost { model: string; inputPer1k: number; outputPer1k: number; contextWindow: number; speed: 'fast' | 'medium' | 'slow'; quality: number; }

export class ModelCostAnalyzer extends EventEmitter {
    private static instance: ModelCostAnalyzer;
    private models: Map<string, ModelCost> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ModelCostAnalyzer { if (!ModelCostAnalyzer.instance) ModelCostAnalyzer.instance = new ModelCostAnalyzer(); return ModelCostAnalyzer.instance; }

    private initDefaults(): void {
        const defaults: ModelCost[] = [
            { model: 'gpt-4o', inputPer1k: 0.005, outputPer1k: 0.015, contextWindow: 128000, speed: 'fast', quality: 95 },
            { model: 'gpt-4', inputPer1k: 0.03, outputPer1k: 0.06, contextWindow: 8192, speed: 'medium', quality: 90 },
            { model: 'claude-3-opus', inputPer1k: 0.015, outputPer1k: 0.075, contextWindow: 200000, speed: 'slow', quality: 98 },
            { model: 'claude-3-sonnet', inputPer1k: 0.003, outputPer1k: 0.015, contextWindow: 200000, speed: 'fast', quality: 92 }
        ];
        defaults.forEach(m => this.models.set(m.model, m));
    }

    compare(inputTokens: number, outputTokens: number): { model: string; cost: number; quality: number }[] {
        return Array.from(this.models.values()).map(m => ({ model: m.model, cost: (inputTokens / 1000) * m.inputPer1k + (outputTokens / 1000) * m.outputPer1k, quality: m.quality })).sort((a, b) => a.cost - b.cost);
    }

    recommend(task: 'code' | 'chat' | 'analysis', budget: number): ModelCost | null { const sorted = Array.from(this.models.values()).filter(m => m.inputPer1k < budget / 10).sort((a, b) => b.quality - a.quality); return sorted[0] || null; }
    getAll(): ModelCost[] { return Array.from(this.models.values()); }
}
export function getModelCostAnalyzer(): ModelCostAnalyzer { return ModelCostAnalyzer.getInstance(); }
