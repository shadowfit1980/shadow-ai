/**
 * Model Pair Selector - Smart matchmaking
 */
import { EventEmitter } from 'events';

export interface ModelPair { modelA: string; modelB: string; confidence: number; reason: string; }

export class ModelPairSelectorEngine extends EventEmitter {
    private static instance: ModelPairSelectorEngine;
    private models: { id: string; rating: number; gamesPlayed: number }[] = [];
    private recentPairs: Set<string> = new Set();
    private constructor() { super(); }
    static getInstance(): ModelPairSelectorEngine { if (!ModelPairSelectorEngine.instance) ModelPairSelectorEngine.instance = new ModelPairSelectorEngine(); return ModelPairSelectorEngine.instance; }

    setModels(models: { id: string; rating: number; gamesPlayed: number }[]): void { this.models = models; }

    selectPair(strategy: 'competitive' | 'exploratory' | 'random' = 'competitive'): ModelPair | null {
        if (this.models.length < 2) return null;
        let modelA: string, modelB: string, reason: string;
        if (strategy === 'competitive') {
            const sorted = [...this.models].sort((a, b) => b.rating - a.rating);
            const top = sorted.slice(0, 10);
            [modelA, modelB] = [top[Math.floor(Math.random() * Math.min(5, top.length))].id, top[Math.floor(Math.random() * Math.min(5, top.length))].id];
            if (modelA === modelB && top.length > 1) modelB = top.find(m => m.id !== modelA)!.id;
            reason = 'Top performers matchup';
        } else if (strategy === 'exploratory') {
            const underPlayed = this.models.filter(m => m.gamesPlayed < 10).sort((a, b) => a.gamesPlayed - b.gamesPlayed);
            modelA = underPlayed[0]?.id || this.models[0].id;
            modelB = this.models[Math.floor(Math.random() * this.models.length)].id;
            if (modelA === modelB) modelB = this.models.find(m => m.id !== modelA)!.id;
            reason = 'Exploring underplayed models';
        } else { const shuffled = [...this.models].sort(() => Math.random() - 0.5); modelA = shuffled[0].id; modelB = shuffled[1].id; reason = 'Random selection'; }
        const pairKey = [modelA, modelB].sort().join(':'); if (this.recentPairs.has(pairKey)) return this.selectPair(strategy);
        this.recentPairs.add(pairKey); if (this.recentPairs.size > 50) this.recentPairs.clear();
        return { modelA, modelB, confidence: 0.8, reason };
    }
}
export function getModelPairSelectorEngine(): ModelPairSelectorEngine { return ModelPairSelectorEngine.getInstance(); }
