/**
 * Elo Rating - Chess-style rating system
 */
import { EventEmitter } from 'events';

export interface ModelRating { modelId: string; rating: number; gamesPlayed: number; wins: number; losses: number; ties: number; lastUpdated: number; }

export class EloRatingEngine extends EventEmitter {
    private static instance: EloRatingEngine;
    private ratings: Map<string, ModelRating> = new Map();
    private kFactor = 32;
    private defaultRating = 1500;
    private constructor() { super(); }
    static getInstance(): EloRatingEngine { if (!EloRatingEngine.instance) EloRatingEngine.instance = new EloRatingEngine(); return EloRatingEngine.instance; }

    getOrCreate(modelId: string): ModelRating { if (!this.ratings.has(modelId)) { this.ratings.set(modelId, { modelId, rating: this.defaultRating, gamesPlayed: 0, wins: 0, losses: 0, ties: 0, lastUpdated: Date.now() }); } return this.ratings.get(modelId)!; }

    recordMatch(winnerId: string, loserId: string, tie = false): { winnerNew: number; loserNew: number } {
        const winner = this.getOrCreate(winnerId); const loser = this.getOrCreate(loserId);
        const expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
        const expectedLoser = 1 - expectedWinner;
        const actualWinner = tie ? 0.5 : 1; const actualLoser = tie ? 0.5 : 0;
        const winnerNew = Math.round(winner.rating + this.kFactor * (actualWinner - expectedWinner));
        const loserNew = Math.round(loser.rating + this.kFactor * (actualLoser - expectedLoser));
        winner.rating = winnerNew; loser.rating = loserNew;
        winner.gamesPlayed++; loser.gamesPlayed++;
        if (tie) { winner.ties++; loser.ties++; } else { winner.wins++; loser.losses++; }
        winner.lastUpdated = loser.lastUpdated = Date.now();
        this.emit('updated', { winner, loser }); return { winnerNew, loserNew };
    }

    getRankings(): ModelRating[] { return Array.from(this.ratings.values()).sort((a, b) => b.rating - a.rating); }
    get(modelId: string): ModelRating | null { return this.ratings.get(modelId) || null; }
}
export function getEloRatingEngine(): EloRatingEngine { return EloRatingEngine.getInstance(); }
