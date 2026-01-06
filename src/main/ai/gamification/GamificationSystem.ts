/**
 * Gamification System
 * 
 * XP system + badges for good coding practices.
 * Motivates developers through achievements and progress tracking.
 */

import { EventEmitter } from 'events';

export interface Developer {
    id: string;
    name: string;
    level: number;
    xp: number;
    totalXp: number;
    badges: Badge[];
    streaks: Streak[];
    stats: DeveloperStats;
    joinedAt: Date;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    earnedAt: Date;
    category: BadgeCategory;
}

export type BadgeCategory =
    | 'productivity'
    | 'quality'
    | 'collaboration'
    | 'learning'
    | 'maintenance'
    | 'special';

export interface Streak {
    type: StreakType;
    currentCount: number;
    bestCount: number;
    lastActivity: Date;
}

export type StreakType =
    | 'daily_commit'
    | 'test_coverage'
    | 'code_review'
    | 'zero_bugs'
    | 'documentation';

export interface DeveloperStats {
    tasksCompleted: number;
    linesWritten: number;
    bugsFixed: number;
    testsWritten: number;
    codeReviews: number;
    pullRequests: number;
    documentationPages: number;
}

export interface Challenge {
    id: string;
    name: string;
    description: string;
    type: ChallengeType;
    target: number;
    current: number;
    reward: XPReward;
    deadline?: Date;
    status: 'active' | 'completed' | 'failed' | 'expired';
}

export type ChallengeType =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'special';

export interface XPReward {
    amount: number;
    bonus?: number; // Extra for streaks
    badgeId?: string;
}

export interface Achievement {
    id: string;
    action: AchievementAction;
    context?: any;
    xpEarned: number;
    timestamp: Date;
}

export type AchievementAction =
    | 'task_completed'
    | 'bug_fixed'
    | 'test_written'
    | 'code_reviewed'
    | 'pr_merged'
    | 'streak_maintained'
    | 'challenge_completed'
    | 'level_up';

// Badge definitions
const BADGE_DEFINITIONS: Omit<Badge, 'earnedAt'>[] = [
    // Productivity
    { id: 'first_commit', name: 'First Steps', description: 'Made your first commit', icon: '👶', rarity: 'common', category: 'productivity' },
    { id: 'hundred_tasks', name: 'Task Master', description: 'Completed 100 tasks', icon: '🏆', rarity: 'rare', category: 'productivity' },
    { id: 'thousand_lines', name: 'Code Warrior', description: 'Wrote 1000 lines of code', icon: '⚔️', rarity: 'rare', category: 'productivity' },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Completed 10 tasks in one day', icon: '⚡', rarity: 'epic', category: 'productivity' },

    // Quality
    { id: 'bug_hunter', name: 'Bug Hunter', description: 'Fixed 50 bugs', icon: '🐛', rarity: 'rare', category: 'quality' },
    { id: 'test_champion', name: 'Test Champion', description: 'Wrote 100 tests', icon: '🧪', rarity: 'rare', category: 'quality' },
    { id: 'zero_defects', name: 'Zero Defects', description: 'Week without introducing bugs', icon: '🛡️', rarity: 'epic', category: 'quality' },
    { id: 'coverage_king', name: 'Coverage King', description: 'Maintained 90%+ coverage for a month', icon: '📊', rarity: 'legendary', category: 'quality' },

    // Collaboration
    { id: 'team_player', name: 'Team Player', description: 'Reviewed 25 pull requests', icon: '🤝', rarity: 'rare', category: 'collaboration' },
    { id: 'mentor', name: 'Mentor', description: 'Helped 10 team members', icon: '🎓', rarity: 'epic', category: 'collaboration' },
    { id: 'hive_mind', name: 'Hive Mind', description: 'Participated in swarm coding session', icon: '🐝', rarity: 'rare', category: 'collaboration' },

    // Learning
    { id: 'polyglot', name: 'Polyglot', description: 'Used 5 different languages', icon: '🌍', rarity: 'rare', category: 'learning' },
    { id: 'framework_explorer', name: 'Framework Explorer', description: 'Worked with 10 frameworks', icon: '🧭', rarity: 'epic', category: 'learning' },
    { id: 'ai_whisperer', name: 'AI Whisperer', description: 'Mastered AI pair programming', icon: '🤖', rarity: 'legendary', category: 'learning' },

    // Maintenance
    { id: 'debt_slayer', name: 'Debt Slayer', description: 'Reduced tech debt by 50%', icon: '💸', rarity: 'epic', category: 'maintenance' },
    { id: 'documentation_hero', name: 'Documentation Hero', description: 'Wrote 50 pages of docs', icon: '📚', rarity: 'rare', category: 'maintenance' },
    { id: 'refactor_master', name: 'Refactor Master', description: 'Completed major refactoring', icon: '🔧', rarity: 'epic', category: 'maintenance' },

    // Special
    { id: 'night_owl', name: 'Night Owl', description: 'Coded at 3 AM', icon: '🦉', rarity: 'common', category: 'special' },
    { id: 'early_bird', name: 'Early Bird', description: 'First commit before 6 AM', icon: '🐤', rarity: 'common', category: 'special' },
    { id: 'marathon', name: 'Marathon Coder', description: '8 hour coding streak', icon: '🏃', rarity: 'epic', category: 'special' },
    { id: 'enlightened', name: 'Enlightened', description: 'Reached level 50', icon: '✨', rarity: 'mythic', category: 'special' },
    { id: 'legend', name: 'Living Legend', description: 'Reached level 100', icon: '👑', rarity: 'mythic', category: 'special' },
];

// XP requirements per level
const XP_PER_LEVEL = 1000;
const XP_SCALING = 1.15; // Each level needs 15% more XP

// XP rewards for actions
const XP_REWARDS: Record<AchievementAction, number> = {
    task_completed: 50,
    bug_fixed: 75,
    test_written: 25,
    code_reviewed: 40,
    pr_merged: 100,
    streak_maintained: 25,
    challenge_completed: 200,
    level_up: 0, // Calculated separately
};

export class GamificationSystem extends EventEmitter {
    private static instance: GamificationSystem;
    private developers: Map<string, Developer> = new Map();
    private challenges: Map<string, Challenge> = new Map();
    private achievements: Achievement[] = [];

    private constructor() {
        super();
        this.initializeChallenges();
    }

    static getInstance(): GamificationSystem {
        if (!GamificationSystem.instance) {
            GamificationSystem.instance = new GamificationSystem();
        }
        return GamificationSystem.instance;
    }

    // ========================================================================
    // DEVELOPER MANAGEMENT
    // ========================================================================

    registerDeveloper(id: string, name: string): Developer {
        if (this.developers.has(id)) {
            return this.developers.get(id)!;
        }

        const developer: Developer = {
            id,
            name,
            level: 1,
            xp: 0,
            totalXp: 0,
            badges: [],
            streaks: [
                { type: 'daily_commit', currentCount: 0, bestCount: 0, lastActivity: new Date() },
                { type: 'test_coverage', currentCount: 0, bestCount: 0, lastActivity: new Date() },
                { type: 'code_review', currentCount: 0, bestCount: 0, lastActivity: new Date() },
                { type: 'zero_bugs', currentCount: 0, bestCount: 0, lastActivity: new Date() },
            ],
            stats: {
                tasksCompleted: 0,
                linesWritten: 0,
                bugsFixed: 0,
                testsWritten: 0,
                codeReviews: 0,
                pullRequests: 0,
                documentationPages: 0,
            },
            joinedAt: new Date(),
        };

        this.developers.set(id, developer);
        this.emit('developer:registered', developer);
        return developer;
    }

    getDeveloper(id: string): Developer | undefined {
        return this.developers.get(id);
    }

    // ========================================================================
    // XP & LEVELING
    // ========================================================================

    awardXP(developerId: string, action: AchievementAction, context?: any): Achievement | undefined {
        const developer = this.developers.get(developerId);
        if (!developer) return undefined;

        const baseXP = XP_REWARDS[action];
        let xpEarned = baseXP;

        // Streak bonus
        const relevantStreak = this.getRelevantStreak(action, developer);
        if (relevantStreak && relevantStreak.currentCount > 0) {
            xpEarned = Math.floor(xpEarned * (1 + relevantStreak.currentCount * 0.1));
        }

        developer.xp += xpEarned;
        developer.totalXp += xpEarned;

        // Update stats
        this.updateStats(developer, action);

        // Check for level up
        this.checkLevelUp(developer);

        // Check for badges
        this.checkBadges(developer);

        // Record achievement
        const achievement: Achievement = {
            id: `ach_${Date.now()}`,
            action,
            context,
            xpEarned,
            timestamp: new Date(),
        };

        this.achievements.push(achievement);
        this.emit('xp:awarded', { developerId, xpEarned, action });

        return achievement;
    }

    private getXPForLevel(level: number): number {
        return Math.floor(XP_PER_LEVEL * Math.pow(XP_SCALING, level - 1));
    }

    private checkLevelUp(developer: Developer): boolean {
        const xpNeeded = this.getXPForLevel(developer.level);

        if (developer.xp >= xpNeeded) {
            developer.xp -= xpNeeded;
            developer.level++;

            this.emit('level:up', {
                developerId: developer.id,
                newLevel: developer.level
            });

            // Recursive check for multiple level ups
            return this.checkLevelUp(developer);
        }

        return false;
    }

    private updateStats(developer: Developer, action: AchievementAction): void {
        switch (action) {
            case 'task_completed':
                developer.stats.tasksCompleted++;
                break;
            case 'bug_fixed':
                developer.stats.bugsFixed++;
                break;
            case 'test_written':
                developer.stats.testsWritten++;
                break;
            case 'code_reviewed':
                developer.stats.codeReviews++;
                break;
            case 'pr_merged':
                developer.stats.pullRequests++;
                break;
        }
    }

    private getRelevantStreak(action: AchievementAction, developer: Developer): Streak | undefined {
        const mapping: Partial<Record<AchievementAction, StreakType>> = {
            task_completed: 'daily_commit',
            code_reviewed: 'code_review',
            test_written: 'test_coverage',
            bug_fixed: 'zero_bugs',
        };

        const streakType = mapping[action];
        return streakType ? developer.streaks.find(s => s.type === streakType) : undefined;
    }

    // ========================================================================
    // BADGES
    // ========================================================================

    private checkBadges(developer: Developer): void {
        const earnedIds = new Set(developer.badges.map(b => b.id));

        for (const badgeDef of BADGE_DEFINITIONS) {
            if (earnedIds.has(badgeDef.id)) continue;

            if (this.hasBadgeRequirement(developer, badgeDef.id)) {
                const badge: Badge = {
                    ...badgeDef,
                    earnedAt: new Date(),
                };

                developer.badges.push(badge);
                this.emit('badge:earned', { developerId: developer.id, badge });
            }
        }
    }

    private hasBadgeRequirement(developer: Developer, badgeId: string): boolean {
        switch (badgeId) {
            case 'first_commit':
                return developer.stats.tasksCompleted >= 1;
            case 'hundred_tasks':
                return developer.stats.tasksCompleted >= 100;
            case 'thousand_lines':
                return developer.stats.linesWritten >= 1000;
            case 'bug_hunter':
                return developer.stats.bugsFixed >= 50;
            case 'test_champion':
                return developer.stats.testsWritten >= 100;
            case 'team_player':
                return developer.stats.codeReviews >= 25;
            case 'enlightened':
                return developer.level >= 50;
            case 'legend':
                return developer.level >= 100;
            default:
                return false;
        }
    }

    awardBadge(developerId: string, badgeId: string): Badge | undefined {
        const developer = this.developers.get(developerId);
        if (!developer) return undefined;

        const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
        if (!badgeDef) return undefined;

        if (developer.badges.some(b => b.id === badgeId)) {
            return undefined; // Already has badge
        }

        const badge: Badge = {
            ...badgeDef,
            earnedAt: new Date(),
        };

        developer.badges.push(badge);
        this.emit('badge:earned', { developerId, badge });
        return badge;
    }

    // ========================================================================
    // CHALLENGES
    // ========================================================================

    private initializeChallenges(): void {
        const defaultChallenges: Omit<Challenge, 'id' | 'current' | 'status'>[] = [
            {
                name: 'Daily Sprint',
                description: 'Complete 5 tasks today',
                type: 'daily',
                target: 5,
                reward: { amount: 100 },
            },
            {
                name: 'Bug Buster',
                description: 'Fix 10 bugs this week',
                type: 'weekly',
                target: 10,
                reward: { amount: 300, badgeId: 'bug_hunter' },
            },
            {
                name: 'Test Driven',
                description: 'Write 25 tests this week',
                type: 'weekly',
                target: 25,
                reward: { amount: 250 },
            },
            {
                name: 'Code Reviewer',
                description: 'Review 15 PRs this month',
                type: 'monthly',
                target: 15,
                reward: { amount: 500, badgeId: 'team_player' },
            },
        ];

        for (const challenge of defaultChallenges) {
            const id = `challenge_${challenge.name.toLowerCase().replace(/\s+/g, '_')}`;
            this.challenges.set(id, {
                ...challenge,
                id,
                current: 0,
                status: 'active',
            });
        }
    }

    updateChallengeProgress(challengeId: string, increment: number = 1): Challenge | undefined {
        const challenge = this.challenges.get(challengeId);
        if (!challenge || challenge.status !== 'active') return undefined;

        challenge.current += increment;

        if (challenge.current >= challenge.target) {
            challenge.status = 'completed';
            this.emit('challenge:completed', challenge);
        }

        return challenge;
    }

    // ========================================================================
    // LEADERBOARD
    // ========================================================================

    getLeaderboard(limit: number = 10): Developer[] {
        return Array.from(this.developers.values())
            .sort((a, b) => b.totalXp - a.totalXp)
            .slice(0, limit);
    }

    getDeveloperRank(developerId: string): number {
        const sorted = Array.from(this.developers.values())
            .sort((a, b) => b.totalXp - a.totalXp);

        return sorted.findIndex(d => d.id === developerId) + 1;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAllBadges(): Omit<Badge, 'earnedAt'>[] {
        return [...BADGE_DEFINITIONS];
    }

    getActiveChallenges(): Challenge[] {
        return Array.from(this.challenges.values()).filter(c => c.status === 'active');
    }

    getRecentAchievements(limit: number = 20): Achievement[] {
        return this.achievements.slice(-limit);
    }
}

export const gamificationSystem = GamificationSystem.getInstance();
