/**
 * Context Ranking - Relevance scoring
 */
import { EventEmitter } from 'events';

export interface RankedContext { file: string; score: number; reason: string; snippet?: string; }

export class ContextRanking extends EventEmitter {
    private static instance: ContextRanking;
    private weights: Record<string, number> = { recency: 0.3, relevance: 0.4, importance: 0.2, proximity: 0.1 };
    private constructor() { super(); }
    static getInstance(): ContextRanking { if (!ContextRanking.instance) ContextRanking.instance = new ContextRanking(); return ContextRanking.instance; }

    rank(query: string, files: { path: string; content: string; lastAccessed?: number }[]): RankedContext[] {
        const q = query.toLowerCase();
        return files.map(f => {
            let score = 0;
            const content = f.content.toLowerCase();
            if (content.includes(q)) score += this.weights.relevance * 100;
            if (f.lastAccessed) score += this.weights.recency * (1 - (Date.now() - f.lastAccessed) / 86400000);
            if (f.path.includes('index') || f.path.includes('main')) score += this.weights.importance * 50;
            return { file: f.path, score: Math.min(score, 100), reason: score > 50 ? 'Highly relevant' : 'Potentially relevant' };
        }).sort((a, b) => b.score - a.score);
    }

    setWeight(factor: keyof typeof this.weights, weight: number): void { this.weights[factor] = weight; }
    getTopN(query: string, files: { path: string; content: string }[], n = 10): RankedContext[] { return this.rank(query, files).slice(0, n); }
}
export function getContextRanking(): ContextRanking { return ContextRanking.getInstance(); }
