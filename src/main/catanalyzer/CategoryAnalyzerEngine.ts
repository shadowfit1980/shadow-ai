/**
 * Category Analyzer - Performance by category
 */
import { EventEmitter } from 'events';

export interface CategoryStats { category: string; totalBattles: number; modelWins: Record<string, number>; avgScore: Record<string, number>; }

export class CategoryAnalyzerEngine extends EventEmitter {
    private static instance: CategoryAnalyzerEngine;
    private stats: Map<string, CategoryStats> = new Map();
    private categories = ['coding', 'math', 'creative', 'reasoning', 'general', 'multilingual'];
    private constructor() { super(); this.categories.forEach(c => this.stats.set(c, { category: c, totalBattles: 0, modelWins: {}, avgScore: {} })); }
    static getInstance(): CategoryAnalyzerEngine { if (!CategoryAnalyzerEngine.instance) CategoryAnalyzerEngine.instance = new CategoryAnalyzerEngine(); return CategoryAnalyzerEngine.instance; }

    recordResult(category: string, winnerId: string, loserId: string, winnerScore: number, loserScore: number): void {
        if (!this.stats.has(category)) this.stats.set(category, { category, totalBattles: 0, modelWins: {}, avgScore: {} });
        const s = this.stats.get(category)!;
        s.totalBattles++;
        s.modelWins[winnerId] = (s.modelWins[winnerId] || 0) + 1;
        s.avgScore[winnerId] = ((s.avgScore[winnerId] || 0) * (s.modelWins[winnerId] - 1) + winnerScore) / s.modelWins[winnerId];
        s.avgScore[loserId] = ((s.avgScore[loserId] || loserScore) + loserScore) / 2;
        this.emit('recorded', { category, winnerId });
    }

    getTopByCategory(category: string, limit = 5): { modelId: string; wins: number; avgScore: number }[] { const s = this.stats.get(category); if (!s) return []; return Object.entries(s.modelWins).map(([m, w]) => ({ modelId: m, wins: w, avgScore: s.avgScore[m] || 0 })).sort((a, b) => b.wins - a.wins).slice(0, limit); }
    getCategories(): string[] { return [...this.categories]; }
    getStats(category: string): CategoryStats | null { return this.stats.get(category) || null; }
}
export function getCategoryAnalyzerEngine(): CategoryAnalyzerEngine { return CategoryAnalyzerEngine.getInstance(); }
