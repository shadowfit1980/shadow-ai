/**
 * 🏆 Leaderboard Service
 * 
 * Online score tracking:
 * - Local and mock online scores
 * - Rankings
 * - Multiple boards
 */

import { EventEmitter } from 'events';

export interface LeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    score: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface Leaderboard {
    id: string;
    name: string;
    sortOrder: 'asc' | 'desc';
    entries: LeaderboardEntry[];
    maxEntries: number;
}

export class LeaderboardService extends EventEmitter {
    private static instance: LeaderboardService;
    private leaderboards: Map<string, Leaderboard> = new Map();

    private constructor() {
        super();
        this.initializeDefaultBoards();
    }

    static getInstance(): LeaderboardService {
        if (!LeaderboardService.instance) {
            LeaderboardService.instance = new LeaderboardService();
        }
        return LeaderboardService.instance;
    }

    private initializeDefaultBoards(): void {
        this.leaderboards.set('highscores', {
            id: 'highscores', name: 'High Scores', sortOrder: 'desc', maxEntries: 100,
            entries: this.generateMockEntries(20)
        });

        this.leaderboards.set('speedrun', {
            id: 'speedrun', name: 'Speedrun', sortOrder: 'asc', maxEntries: 100,
            entries: this.generateMockEntries(20, true)
        });
    }

    private generateMockEntries(count: number, isTime: boolean = false): LeaderboardEntry[] {
        const names = ['Shadow', 'Phoenix', 'Dragon', 'Ninja', 'Ghost', 'Storm', 'Blade', 'Frost', 'Thunder', 'Viper'];
        const entries: LeaderboardEntry[] = [];

        for (let i = 0; i < count; i++) {
            entries.push({
                rank: i + 1,
                playerId: `player_${i}`,
                playerName: names[i % names.length] + (Math.floor(i / names.length) || ''),
                score: isTime ? 60000 + i * 5000 : 10000 - i * 400,
                timestamp: Date.now() - i * 3600000
            });
        }

        return entries;
    }

    getLeaderboard(id: string): Leaderboard | undefined {
        return this.leaderboards.get(id);
    }

    submitScore(boardId: string, playerId: string, playerName: string, score: number): { rank: number; isNewBest: boolean } {
        const board = this.leaderboards.get(boardId);
        if (!board) return { rank: -1, isNewBest: false };

        // Check existing entry
        const existing = board.entries.find(e => e.playerId === playerId);
        const isNewBest = !existing ||
            (board.sortOrder === 'desc' ? score > existing.score : score < existing.score);

        if (isNewBest) {
            // Remove old entry if exists
            board.entries = board.entries.filter(e => e.playerId !== playerId);

            // Add new entry
            board.entries.push({
                rank: 0,
                playerId,
                playerName,
                score,
                timestamp: Date.now()
            });

            // Re-sort and re-rank
            board.entries.sort((a, b) =>
                board.sortOrder === 'desc' ? b.score - a.score : a.score - b.score
            );
            board.entries.forEach((e, i) => e.rank = i + 1);

            // Trim to max
            board.entries = board.entries.slice(0, board.maxEntries);
        }

        const newEntry = board.entries.find(e => e.playerId === playerId);
        return { rank: newEntry?.rank || -1, isNewBest };
    }

    generateLeaderboardCode(): string {
        return `
class Leaderboard {
    constructor(id, options = {}) {
        this.id = id;
        this.sortOrder = options.sortOrder || 'desc';
        this.maxEntries = options.maxEntries || 100;
        this.entries = [];
        this.storageKey = 'leaderboard_' + id;
        
        this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.entries = JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load leaderboard:', e);
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
        } catch (e) {
            console.warn('Failed to save leaderboard:', e);
        }
    }

    submit(playerName, score, metadata = {}) {
        // Find existing entry
        const existingIndex = this.entries.findIndex(e => e.playerName === playerName);
        const existing = this.entries[existingIndex];

        // Check if better score
        const isBetter = !existing || 
            (this.sortOrder === 'desc' ? score > existing.score : score < existing.score);

        if (!isBetter) {
            return { rank: existing?.rank || -1, isNewBest: false };
        }

        // Remove existing
        if (existingIndex !== -1) {
            this.entries.splice(existingIndex, 1);
        }

        // Add new entry
        const entry = {
            playerName,
            score,
            timestamp: Date.now(),
            metadata
        };

        this.entries.push(entry);

        // Sort
        this.entries.sort((a, b) => 
            this.sortOrder === 'desc' ? b.score - a.score : a.score - b.score
        );

        // Trim and rank
        this.entries = this.entries.slice(0, this.maxEntries);
        this.entries.forEach((e, i) => e.rank = i + 1);

        this.save();

        const newEntry = this.entries.find(e => e.playerName === playerName);
        return { rank: newEntry?.rank || -1, isNewBest: true };
    }

    getTop(count = 10) {
        return this.entries.slice(0, count);
    }

    getRankAround(playerName, count = 5) {
        const index = this.entries.findIndex(e => e.playerName === playerName);
        if (index === -1) return [];

        const start = Math.max(0, index - Math.floor(count / 2));
        const end = Math.min(this.entries.length, start + count);
        return this.entries.slice(start, end);
    }

    getPlayerRank(playerName) {
        const entry = this.entries.find(e => e.playerName === playerName);
        return entry?.rank || -1;
    }

    clear() {
        this.entries = [];
        this.save();
    }
}

class LeaderboardUI {
    constructor(leaderboard, container) {
        this.leaderboard = leaderboard;
        this.container = container;
    }

    render() {
        const entries = this.leaderboard.getTop(10);
        
        this.container.innerHTML = \`
            <div class="leaderboard">
                <h2>🏆 \${this.leaderboard.id}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${entries.map(e => \`
                            <tr class="rank-\${e.rank <= 3 ? e.rank : 'other'}">
                                <td>\${this.getRankIcon(e.rank)}</td>
                                <td>\${e.playerName}</td>
                                <td>\${this.formatScore(e.score)}</td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            </div>
        \`;
    }

    getRankIcon(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    }

    formatScore(score) {
        return score.toLocaleString();
    }
}`;
    }
}

export const leaderboardService = LeaderboardService.getInstance();
