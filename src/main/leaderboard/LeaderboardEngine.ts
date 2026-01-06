/**
 * Leaderboard - Public rankings
 */
import { EventEmitter } from 'events';

export interface LeaderboardEntry { rank: number; modelId: string; displayName: string; rating: number; wins: number; gamesPlayed: number; winRate: number; trend: 'up' | 'down' | 'stable'; }

export class LeaderboardEngine extends EventEmitter {
    private static instance: LeaderboardEngine;
    private entries: LeaderboardEntry[] = [];
    private previousRatings: Map<string, number> = new Map();
    private constructor() { super(); }
    static getInstance(): LeaderboardEngine { if (!LeaderboardEngine.instance) LeaderboardEngine.instance = new LeaderboardEngine(); return LeaderboardEngine.instance; }

    update(ratings: { modelId: string; displayName: string; rating: number; wins: number; gamesPlayed: number }[]): void {
        this.entries = ratings.sort((a, b) => b.rating - a.rating).map((r, i) => {
            const prev = this.previousRatings.get(r.modelId) || r.rating;
            const trend: 'up' | 'down' | 'stable' = r.rating > prev ? 'up' : r.rating < prev ? 'down' : 'stable';
            this.previousRatings.set(r.modelId, r.rating);
            return { rank: i + 1, modelId: r.modelId, displayName: r.displayName, rating: r.rating, wins: r.wins, gamesPlayed: r.gamesPlayed, winRate: r.gamesPlayed > 0 ? r.wins / r.gamesPlayed : 0, trend };
        });
        this.emit('updated', this.entries);
    }

    getTop(limit = 10): LeaderboardEntry[] { return this.entries.slice(0, limit); }
    getByModel(modelId: string): LeaderboardEntry | null { return this.entries.find(e => e.modelId === modelId) || null; }
    getAll(): LeaderboardEntry[] { return [...this.entries]; }
    getRankRange(start: number, end: number): LeaderboardEntry[] { return this.entries.filter(e => e.rank >= start && e.rank <= end); }
}
export function getLeaderboardEngine(): LeaderboardEngine { return LeaderboardEngine.getInstance(); }
