/**
 * 🏆 Achievement System
 * 
 * Complete achievement/trophy system:
 * - Achievement types (progress, one-time, secret)
 * - Progress tracking
 * - Rewards
 * - Statistics
 * - Leaderboards ready
 */

import { EventEmitter } from 'events';

export type AchievementType = 'one-time' | 'progress' | 'tiered' | 'secret' | 'daily' | 'seasonal';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: AchievementType;
    rarity: AchievementRarity;
    category: string;
    requirements: AchievementRequirement[];
    rewards: AchievementReward[];
    points: number;
    hidden: boolean;
    prerequisite?: string;
}

export interface AchievementRequirement {
    type: 'stat' | 'event' | 'collect' | 'kill' | 'reach' | 'complete' | 'custom';
    target: string;
    value: number;
    operator?: '>' | '>=' | '==' | '<' | '<=';
}

export interface AchievementReward {
    type: 'xp' | 'gold' | 'item' | 'title' | 'cosmetic' | 'ability';
    value: any;
    amount?: number;
}

export interface PlayerAchievements {
    playerId: string;
    unlocked: Map<string, { unlockedAt: number; progress: number }>;
    stats: Map<string, number>;
    totalPoints: number;
}

export class AchievementSystem extends EventEmitter {
    private static instance: AchievementSystem;
    private achievements: Map<string, Achievement> = new Map();
    private players: Map<string, PlayerAchievements> = new Map();

    private constructor() {
        super();
        this.initializeDefaultAchievements();
    }

    static getInstance(): AchievementSystem {
        if (!AchievementSystem.instance) {
            AchievementSystem.instance = new AchievementSystem();
        }
        return AchievementSystem.instance;
    }

    private initializeDefaultAchievements(): void {
        // First Steps
        this.register({
            id: 'first_steps', name: 'First Steps',
            description: 'Complete the tutorial',
            icon: '🚶', type: 'one-time', rarity: 'common',
            category: 'Tutorial', points: 10, hidden: false,
            requirements: [{ type: 'complete', target: 'tutorial', value: 1 }],
            rewards: [{ type: 'xp', value: 100, amount: 100 }]
        });

        // Warrior achievements
        this.register({
            id: 'monster_slayer_1', name: 'Monster Slayer',
            description: 'Defeat 100 enemies',
            icon: '⚔️', type: 'progress', rarity: 'common',
            category: 'Combat', points: 20, hidden: false,
            requirements: [{ type: 'kill', target: 'enemies', value: 100 }],
            rewards: [{ type: 'title', value: 'Monster Slayer' }]
        });

        this.register({
            id: 'monster_slayer_2', name: 'Monster Exterminator',
            description: 'Defeat 1000 enemies',
            icon: '⚔️', type: 'progress', rarity: 'rare',
            category: 'Combat', points: 50, hidden: false,
            prerequisite: 'monster_slayer_1',
            requirements: [{ type: 'kill', target: 'enemies', value: 1000 }],
            rewards: [{ type: 'item', value: 'legendary_sword' }]
        });

        // Explorer
        this.register({
            id: 'explorer', name: 'World Explorer',
            description: 'Discover all areas',
            icon: '🗺️', type: 'progress', rarity: 'epic',
            category: 'Exploration', points: 100, hidden: false,
            requirements: [{ type: 'reach', target: 'areas_discovered', value: 50 }],
            rewards: [{ type: 'cosmetic', value: 'explorer_cloak' }]
        });

        // Secret achievement
        this.register({
            id: 'secret_room', name: '???',
            description: 'You found a secret!',
            icon: '❓', type: 'secret', rarity: 'legendary',
            category: 'Secrets', points: 200, hidden: true,
            requirements: [{ type: 'event', target: 'found_secret_room', value: 1 }],
            rewards: [{ type: 'item', value: 'ancient_artifact' }]
        });
    }

    // ========================================================================
    // REGISTRATION
    // ========================================================================

    register(achievement: Achievement): void {
        this.achievements.set(achievement.id, achievement);
    }

    registerPlayer(playerId: string): PlayerAchievements {
        const player: PlayerAchievements = {
            playerId,
            unlocked: new Map(),
            stats: new Map(),
            totalPoints: 0
        };
        this.players.set(playerId, player);
        return player;
    }

    // ========================================================================
    // PROGRESS TRACKING
    // ========================================================================

    updateStat(playerId: string, stat: string, value: number, increment: boolean = true): void {
        const player = this.players.get(playerId);
        if (!player) return;

        const current = player.stats.get(stat) || 0;
        const newValue = increment ? current + value : value;
        player.stats.set(stat, newValue);

        this.emit('statUpdated', { playerId, stat, value: newValue });

        // Check achievements
        this.checkAchievements(playerId);
    }

    triggerEvent(playerId: string, event: string, value: number = 1): void {
        this.updateStat(playerId, `event_${event}`, value);
    }

    private checkAchievements(playerId: string): void {
        const player = this.players.get(playerId);
        if (!player) return;

        this.achievements.forEach((achievement, id) => {
            if (player.unlocked.has(id)) return;
            if (achievement.prerequisite && !player.unlocked.has(achievement.prerequisite)) return;

            const progress = this.calculateProgress(player, achievement);

            if (progress >= 1) {
                this.unlock(playerId, id);
            } else if (progress > 0) {
                this.emit('achievementProgress', { playerId, achievementId: id, progress });
            }
        });
    }

    private calculateProgress(player: PlayerAchievements, achievement: Achievement): number {
        let totalProgress = 0;

        for (const req of achievement.requirements) {
            let current = 0;

            switch (req.type) {
                case 'stat':
                case 'kill':
                case 'collect':
                case 'reach':
                    current = player.stats.get(req.target) || 0;
                    break;
                case 'event':
                    current = player.stats.get(`event_${req.target}`) || 0;
                    break;
                case 'complete':
                    current = player.stats.get(`completed_${req.target}`) || 0;
                    break;
            }

            const reqProgress = Math.min(1, current / req.value);
            totalProgress += reqProgress;
        }

        return totalProgress / achievement.requirements.length;
    }

    // ========================================================================
    // UNLOCKING
    // ========================================================================

    unlock(playerId: string, achievementId: string): boolean {
        const player = this.players.get(playerId);
        const achievement = this.achievements.get(achievementId);

        if (!player || !achievement) return false;
        if (player.unlocked.has(achievementId)) return false;

        player.unlocked.set(achievementId, {
            unlockedAt: Date.now(),
            progress: 1
        });

        player.totalPoints += achievement.points;

        this.emit('achievementUnlocked', {
            playerId,
            achievement,
            timestamp: Date.now(),
            totalPoints: player.totalPoints
        });

        return true;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getPlayerAchievements(playerId: string): { unlocked: Achievement[]; locked: Achievement[]; progress: Map<string, number> } {
        const player = this.players.get(playerId);
        if (!player) return { unlocked: [], locked: [], progress: new Map() };

        const unlocked: Achievement[] = [];
        const locked: Achievement[] = [];
        const progress = new Map<string, number>();

        this.achievements.forEach((achievement, id) => {
            if (player.unlocked.has(id)) {
                unlocked.push(achievement);
            } else if (!achievement.hidden) {
                locked.push(achievement);
                progress.set(id, this.calculateProgress(player, achievement));
            }
        });

        return { unlocked, locked, progress };
    }

    getLeaderboard(limit: number = 10): { playerId: string; points: number; count: number }[] {
        return Array.from(this.players.values())
            .map(p => ({
                playerId: p.playerId,
                points: p.totalPoints,
                count: p.unlocked.size
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateAchievementCode(): string {
        return `
// Achievement System
class AchievementManager {
    constructor() {
        this.achievements = new Map();
        this.unlocked = new Set();
        this.stats = {};
        this.points = 0;
    }

    register(achievement) {
        this.achievements.set(achievement.id, achievement);
    }

    updateStat(stat, value, increment = true) {
        this.stats[stat] = increment ? (this.stats[stat] || 0) + value : value;
        this.checkAchievements();
    }

    checkAchievements() {
        this.achievements.forEach((ach, id) => {
            if (this.unlocked.has(id)) return;
            
            const complete = ach.requirements.every(req => {
                const current = this.stats[req.target] || 0;
                return current >= req.value;
            });

            if (complete) this.unlock(id);
        });
    }

    unlock(id) {
        const ach = this.achievements.get(id);
        if (!ach || this.unlocked.has(id)) return;

        this.unlocked.add(id);
        this.points += ach.points;

        // UI notification
        game.showAchievementPopup(ach);
        
        // Grant rewards
        ach.rewards?.forEach(r => {
            switch (r.type) {
                case 'xp': game.player.addXP(r.amount); break;
                case 'item': game.inventory.add(r.value); break;
                case 'title': game.player.addTitle(r.value); break;
            }
        });
    }

    getProgress(id) {
        const ach = this.achievements.get(id);
        if (!ach) return 0;
        
        let total = 0;
        ach.requirements.forEach(req => {
            const current = Math.min(this.stats[req.target] || 0, req.value);
            total += current / req.value;
        });
        return total / ach.requirements.length;
    }
}`;
    }
}

export const achievementSystem = AchievementSystem.getInstance();
