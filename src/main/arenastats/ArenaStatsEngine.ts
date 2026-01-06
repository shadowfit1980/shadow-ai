/**
 * Arena Stats - Aggregate statistics
 */
import { EventEmitter } from 'events';

export interface ArenaStatistics { totalBattles: number; totalVotes: number; uniqueModels: number; uniqueUsers: number; avgBattlesPerDay: number; topCategory: string; mostActiveModel: string; }

export class ArenaStatsEngine extends EventEmitter {
    private static instance: ArenaStatsEngine;
    private battles = 0;
    private votes = 0;
    private models: Set<string> = new Set();
    private users: Set<string> = new Set();
    private categoryBattles: Record<string, number> = {};
    private modelBattles: Record<string, number> = {};
    private startDate = Date.now();
    private constructor() { super(); }
    static getInstance(): ArenaStatsEngine { if (!ArenaStatsEngine.instance) ArenaStatsEngine.instance = new ArenaStatsEngine(); return ArenaStatsEngine.instance; }

    recordBattle(modelA: string, modelB: string, category: string): void { this.battles++; this.models.add(modelA); this.models.add(modelB); this.categoryBattles[category] = (this.categoryBattles[category] || 0) + 1; this.modelBattles[modelA] = (this.modelBattles[modelA] || 0) + 1; this.modelBattles[modelB] = (this.modelBattles[modelB] || 0) + 1; }
    recordVote(userId: string): void { this.votes++; this.users.add(userId); }

    getStats(): ArenaStatistics {
        const days = Math.max(1, (Date.now() - this.startDate) / 86400000);
        const topCategory = Object.entries(this.categoryBattles).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
        const mostActiveModel = Object.entries(this.modelBattles).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
        return { totalBattles: this.battles, totalVotes: this.votes, uniqueModels: this.models.size, uniqueUsers: this.users.size, avgBattlesPerDay: Math.round(this.battles / days * 100) / 100, topCategory, mostActiveModel };
    }

    getCategoryBreakdown(): Record<string, number> { return { ...this.categoryBattles }; }
    getModelActivity(): Record<string, number> { return { ...this.modelBattles }; }
}
export function getArenaStatsEngine(): ArenaStatsEngine { return ArenaStatsEngine.getInstance(); }
