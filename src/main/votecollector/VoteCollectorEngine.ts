/**
 * Vote Collector - Aggregate voting data
 */
import { EventEmitter } from 'events';

export interface Vote { id: string; battleId: string; userId: string; winner: 'A' | 'B' | 'tie'; timestamp: number; category: string; }
export interface VoteStats { total: number; aWins: number; bWins: number; ties: number; }

export class VoteCollectorEngine extends EventEmitter {
    private static instance: VoteCollectorEngine;
    private votes: Vote[] = [];
    private constructor() { super(); }
    static getInstance(): VoteCollectorEngine { if (!VoteCollectorEngine.instance) VoteCollectorEngine.instance = new VoteCollectorEngine(); return VoteCollectorEngine.instance; }

    record(battleId: string, userId: string, winner: 'A' | 'B' | 'tie', category = 'general'): Vote { const vote: Vote = { id: `vote_${Date.now()}`, battleId, userId, winner, timestamp: Date.now(), category }; this.votes.push(vote); this.emit('recorded', vote); return vote; }

    getStats(battleId?: string): VoteStats { const filtered = battleId ? this.votes.filter(v => v.battleId === battleId) : this.votes; return { total: filtered.length, aWins: filtered.filter(v => v.winner === 'A').length, bWins: filtered.filter(v => v.winner === 'B').length, ties: filtered.filter(v => v.winner === 'tie').length }; }
    getByCategory(category: string): Vote[] { return this.votes.filter(v => v.category === category); }
    getByUser(userId: string): Vote[] { return this.votes.filter(v => v.userId === userId); }
    getRecent(limit = 100): Vote[] { return this.votes.slice(-limit); }
    getTotalCount(): number { return this.votes.length; }
}
export function getVoteCollectorEngine(): VoteCollectorEngine { return VoteCollectorEngine.getInstance(); }
