/**
 * Gamification Engine
 * Coding challenges, achievements, and XP progression
 * Grok Recommendation: Gamified Coding Challenges
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface PlayerProfile {
    id: string;
    username: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalXp: number;
    rank: string;
    achievements: Achievement[];
    badges: Badge[];
    stats: PlayerStats;
    streaks: StreakData;
    createdAt: Date;
    lastActive: Date;
}

interface PlayerStats {
    linesWritten: number;
    filesCreated: number;
    bugsFixed: number;
    testsWritten: number;
    codeReviews: number;
    pullRequests: number;
    commits: number;
    challengesCompleted: number;
    hoursCodedTotal: number;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'coding' | 'learning' | 'collaboration' | 'quality' | 'speedrun' | 'legendary';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
    unlockedAt?: Date;
    progress?: number;
    maxProgress?: number;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    earnedAt: Date;
}

interface StreakData {
    currentDaily: number;
    longestDaily: number;
    currentWeekly: number;
    longestWeekly: number;
    lastCodingDay: Date;
    codingDaysThisWeek: number;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary';
    category: 'algorithm' | 'refactoring' | 'debugging' | 'design' | 'performance' | 'testing';
    xpReward: number;
    timeLimit?: number;
    requirements: string[];
    hints: string[];
    testCases?: { input: string; expected: string }[];
    completedBy: number;
}

interface Leaderboard {
    period: 'daily' | 'weekly' | 'monthly' | 'allTime';
    entries: { rank: number; playerId: string; username: string; score: number }[];
    updatedAt: Date;
}

interface Quest {
    id: string;
    name: string;
    description: string;
    objectives: { description: string; current: number; target: number; completed: boolean }[];
    xpReward: number;
    deadline?: Date;
    status: 'active' | 'completed' | 'failed' | 'expired';
}

const LEVEL_XP_TABLE = [
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
    4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000,
    26000, 30500, 35500, 41000, 47000, 54000, 62000, 71000, 81000, 92000,
    105000, 120000, 137000, 156000, 178000, 203000, 231000, 263000, 299000, 340000
];

const RANKS = [
    'Newbie Coder', 'Code Apprentice', 'Junior Developer', 'Developer',
    'Senior Developer', 'Lead Developer', 'Software Architect', 'Tech Lead',
    'Principal Engineer', 'Distinguished Engineer', 'Code Master', 'Legend'
];

export class GamificationEngine extends EventEmitter {
    private static instance: GamificationEngine;
    private players: Map<string, PlayerProfile> = new Map();
    private achievements: Map<string, Achievement> = new Map();
    private challenges: Map<string, Challenge> = new Map();
    private quests: Map<string, Quest> = new Map();
    private leaderboards: Map<string, Leaderboard> = new Map();

    private constructor() {
        super();
        this.initializeAchievements();
        this.initializeChallenges();
    }

    static getInstance(): GamificationEngine {
        if (!GamificationEngine.instance) {
            GamificationEngine.instance = new GamificationEngine();
        }
        return GamificationEngine.instance;
    }

    private initializeAchievements(): void {
        const achievementDefs: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
            { id: 'first_line', name: 'Hello World', description: 'Write your first line of code', icon: '👋', category: 'coding', rarity: 'common', xpReward: 10, maxProgress: 1 },
            { id: 'century', name: 'Century Club', description: 'Write 100 lines of code', icon: '💯', category: 'coding', rarity: 'common', xpReward: 50, maxProgress: 100 },
            { id: 'thousand', name: 'Prolific Writer', description: 'Write 1,000 lines of code', icon: '📝', category: 'coding', rarity: 'uncommon', xpReward: 200, maxProgress: 1000 },
            { id: 'tenk', name: 'Code Machine', description: 'Write 10,000 lines of code', icon: '🤖', category: 'coding', rarity: 'rare', xpReward: 1000, maxProgress: 10000 },
            { id: 'first_bug', name: 'Exterminator', description: 'Fix your first bug', icon: '🐛', category: 'quality', rarity: 'common', xpReward: 25, maxProgress: 1 },
            { id: 'bug_hunter', name: 'Bug Hunter', description: 'Fix 50 bugs', icon: '🎯', category: 'quality', rarity: 'rare', xpReward: 500, maxProgress: 50 },
            { id: 'first_test', name: 'Quality Guardian', description: 'Write your first test', icon: '✅', category: 'quality', rarity: 'common', xpReward: 30, maxProgress: 1 },
            { id: 'full_coverage', name: 'Test Master', description: 'Achieve 100% test coverage', icon: '🛡️', category: 'quality', rarity: 'epic', xpReward: 1500, maxProgress: 100 },
            { id: 'streak_7', name: 'Weekly Warrior', description: 'Code for 7 days in a row', icon: '🔥', category: 'coding', rarity: 'uncommon', xpReward: 150, maxProgress: 7 },
            { id: 'streak_30', name: 'Monthly Master', description: 'Code for 30 days in a row', icon: '💪', category: 'coding', rarity: 'epic', xpReward: 1000, maxProgress: 30 },
            { id: 'streak_100', name: 'Centurion', description: 'Code for 100 days in a row', icon: '👑', category: 'legendary', rarity: 'legendary', xpReward: 5000, maxProgress: 100 },
            { id: 'night_owl', name: 'Night Owl', description: 'Code after midnight', icon: '🦉', category: 'coding', rarity: 'common', xpReward: 20, maxProgress: 1 },
            { id: 'early_bird', name: 'Early Bird', description: 'Code before 6 AM', icon: '🌅', category: 'coding', rarity: 'uncommon', xpReward: 50, maxProgress: 1 },
            { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a challenge in under 5 minutes', icon: '⚡', category: 'speedrun', rarity: 'rare', xpReward: 300, maxProgress: 1 },
            { id: 'polyglot', name: 'Polyglot', description: 'Code in 5 different languages', icon: '🌍', category: 'learning', rarity: 'rare', xpReward: 400, maxProgress: 5 },
            { id: 'perfectionist', name: 'Perfectionist', description: 'Get 0 linting errors for a week', icon: '✨', category: 'quality', rarity: 'epic', xpReward: 800, maxProgress: 7 },
            { id: 'contributor', name: 'Open Source Hero', description: 'Make 10 open source contributions', icon: '🦸', category: 'collaboration', rarity: 'rare', xpReward: 600, maxProgress: 10 },
            { id: 'mentor', name: 'Mentor', description: 'Help 25 other developers', icon: '🎓', category: 'collaboration', rarity: 'epic', xpReward: 1200, maxProgress: 25 },
            { id: 'reviewer', name: 'Code Reviewer', description: 'Complete 100 code reviews', icon: '👁️', category: 'collaboration', rarity: 'rare', xpReward: 500, maxProgress: 100 },
            { id: 'legend', name: 'Living Legend', description: 'Reach level 40', icon: '🏆', category: 'legendary', rarity: 'legendary', xpReward: 10000, maxProgress: 40 }
        ];

        achievementDefs.forEach(a => this.achievements.set(a.id, { ...a, progress: 0 }));
    }

    private initializeChallenges(): void {
        const challengeDefs: Challenge[] = [
            {
                id: 'reverse_string',
                title: 'Reverse a String',
                description: 'Write a function that reverses a string without using built-in reverse methods',
                difficulty: 'beginner',
                category: 'algorithm',
                xpReward: 50,
                timeLimit: 600,
                requirements: ['Function must handle empty strings', 'Must not use .reverse()'],
                hints: ['Try using a loop', 'Consider using split and join'],
                completedBy: 1234
            },
            {
                id: 'palindrome',
                title: 'Palindrome Checker',
                description: 'Check if a given string is a palindrome, ignoring spaces and punctuation',
                difficulty: 'beginner',
                category: 'algorithm',
                xpReward: 75,
                timeLimit: 900,
                requirements: ['Handle mixed case', 'Ignore non-alphanumeric characters'],
                hints: ['Clean the string first', 'Compare with reversed version'],
                completedBy: 987
            },
            {
                id: 'debounce',
                title: 'Implement Debounce',
                description: 'Create a debounce function that limits function execution frequency',
                difficulty: 'intermediate',
                category: 'design',
                xpReward: 150,
                timeLimit: 1200,
                requirements: ['Must use closures', 'Support immediate execution option'],
                hints: ['Use setTimeout', 'Track the timeout ID'],
                completedBy: 456
            },
            {
                id: 'binary_search',
                title: 'Binary Search',
                description: 'Implement binary search on a sorted array',
                difficulty: 'intermediate',
                category: 'algorithm',
                xpReward: 125,
                timeLimit: 900,
                requirements: ['O(log n) time complexity', 'Handle edge cases'],
                hints: ['Use two pointers', 'Compare with middle element'],
                completedBy: 678
            },
            {
                id: 'lru_cache',
                title: 'LRU Cache',
                description: 'Implement a Least Recently Used (LRU) cache',
                difficulty: 'advanced',
                category: 'design',
                xpReward: 300,
                timeLimit: 2400,
                requirements: ['O(1) get and put operations', 'Fixed capacity'],
                hints: ['Use a Map for O(1) access', 'Track usage order'],
                completedBy: 234
            },
            {
                id: 'promise_all',
                title: 'Implement Promise.all',
                description: 'Create your own implementation of Promise.all',
                difficulty: 'advanced',
                category: 'design',
                xpReward: 250,
                timeLimit: 1800,
                requirements: ['Handle rejections correctly', 'Preserve order'],
                hints: ['Track completion count', 'Reject on first failure'],
                completedBy: 345
            },
            {
                id: 'tree_traversal',
                title: 'Binary Tree Traversal',
                description: 'Implement inorder, preorder, and postorder traversals',
                difficulty: 'intermediate',
                category: 'algorithm',
                xpReward: 175,
                timeLimit: 1500,
                requirements: ['Recursive implementation', 'Iterative bonus'],
                hints: ['Use recursion for simplicity', 'Stack for iterative'],
                completedBy: 567
            },
            {
                id: 'refactor_legacy',
                title: 'Legacy Code Refactor',
                description: 'Refactor callback-based code to use async/await',
                difficulty: 'intermediate',
                category: 'refactoring',
                xpReward: 200,
                timeLimit: 1800,
                requirements: ['Preserve functionality', 'Add error handling'],
                hints: ['Wrap callbacks in Promises', 'Use try/catch'],
                completedBy: 289
            }
        ];

        challengeDefs.forEach(c => this.challenges.set(c.id, c));
    }

    createPlayer(username: string): PlayerProfile {
        const player: PlayerProfile = {
            id: crypto.randomUUID(),
            username,
            level: 1,
            xp: 0,
            xpToNextLevel: LEVEL_XP_TABLE[1],
            totalXp: 0,
            rank: RANKS[0],
            achievements: [],
            badges: [],
            stats: {
                linesWritten: 0,
                filesCreated: 0,
                bugsFixed: 0,
                testsWritten: 0,
                codeReviews: 0,
                pullRequests: 0,
                commits: 0,
                challengesCompleted: 0,
                hoursCodedTotal: 0
            },
            streaks: {
                currentDaily: 0,
                longestDaily: 0,
                currentWeekly: 0,
                longestWeekly: 0,
                lastCodingDay: new Date(),
                codingDaysThisWeek: 0
            },
            createdAt: new Date(),
            lastActive: new Date()
        };

        this.players.set(player.id, player);
        this.emit('playerCreated', player);
        return player;
    }

    awardXp(playerId: string, amount: number, reason: string): { newXp: number; leveledUp: boolean; newLevel?: number } {
        const player = this.players.get(playerId);
        if (!player) return { newXp: 0, leveledUp: false };

        player.xp += amount;
        player.totalXp += amount;
        player.lastActive = new Date();

        let leveledUp = false;
        let newLevel = player.level;

        while (player.xp >= player.xpToNextLevel && player.level < LEVEL_XP_TABLE.length - 1) {
            player.xp -= player.xpToNextLevel;
            player.level++;
            player.xpToNextLevel = LEVEL_XP_TABLE[player.level] - LEVEL_XP_TABLE[player.level - 1];
            player.rank = RANKS[Math.min(Math.floor(player.level / 4), RANKS.length - 1)];
            leveledUp = true;
            newLevel = player.level;


            this.emit('levelUp', { player, newLevel });
        }

        this.emit('xpAwarded', { player, amount, reason });

        return { newXp: player.xp, leveledUp, newLevel: leveledUp ? newLevel : undefined };
    }

    updateStat(playerId: string, stat: keyof PlayerStats, increment: number = 1): void {
        const player = this.players.get(playerId);
        if (!player) return;

        player.stats[stat] += increment;
        this.checkAchievements(playerId);
        this.emit('statUpdated', { playerId, stat, value: player.stats[stat] });
    }

    private checkAchievements(playerId: string): void {
        const player = this.players.get(playerId);
        if (!player) return;

        const checks: { id: string; condition: () => boolean; progress?: number }[] = [
            { id: 'first_line', condition: () => player.stats.linesWritten >= 1, progress: player.stats.linesWritten },
            { id: 'century', condition: () => player.stats.linesWritten >= 100, progress: player.stats.linesWritten },
            { id: 'thousand', condition: () => player.stats.linesWritten >= 1000, progress: player.stats.linesWritten },
            { id: 'tenk', condition: () => player.stats.linesWritten >= 10000, progress: player.stats.linesWritten },
            { id: 'first_bug', condition: () => player.stats.bugsFixed >= 1, progress: player.stats.bugsFixed },
            { id: 'bug_hunter', condition: () => player.stats.bugsFixed >= 50, progress: player.stats.bugsFixed },
            { id: 'first_test', condition: () => player.stats.testsWritten >= 1, progress: player.stats.testsWritten },
            { id: 'streak_7', condition: () => player.streaks.currentDaily >= 7, progress: player.streaks.currentDaily },
            { id: 'streak_30', condition: () => player.streaks.currentDaily >= 30, progress: player.streaks.currentDaily },
            { id: 'streak_100', condition: () => player.streaks.currentDaily >= 100, progress: player.streaks.currentDaily },
            { id: 'reviewer', condition: () => player.stats.codeReviews >= 100, progress: player.stats.codeReviews },
            { id: 'legend', condition: () => player.level >= 40, progress: player.level }
        ];

        for (const check of checks) {
            const hasAchievement = player.achievements.some(a => a.id === check.id);
            if (!hasAchievement && check.condition()) {
                this.unlockAchievement(playerId, check.id);
            }
        }
    }

    unlockAchievement(playerId: string, achievementId: string): boolean {
        const player = this.players.get(playerId);
        const achievement = this.achievements.get(achievementId);

        if (!player || !achievement) return false;
        if (player.achievements.some(a => a.id === achievementId)) return false;

        const unlockedAchievement = { ...achievement, unlockedAt: new Date() };
        player.achievements.push(unlockedAchievement);

        this.awardXp(playerId, achievement.xpReward, `Achievement: ${achievement.name}`);
        this.emit('achievementUnlocked', { player, achievement: unlockedAchievement });

        return true;
    }

    completeChallenge(playerId: string, challengeId: string, timeSpent: number): { success: boolean; xpEarned: number; bonusXp: number } {
        const player = this.players.get(playerId);
        const challenge = this.challenges.get(challengeId);

        if (!player || !challenge) return { success: false, xpEarned: 0, bonusXp: 0 };

        let xpEarned = challenge.xpReward;
        let bonusXp = 0;

        // Time bonus
        if (challenge.timeLimit && timeSpent < challenge.timeLimit * 0.5) {
            bonusXp = Math.floor(xpEarned * 0.5);

            if (timeSpent < 300) { // Under 5 minutes
                this.unlockAchievement(playerId, 'speed_demon');
            }
        }

        this.awardXp(playerId, xpEarned + bonusXp, `Challenge: ${challenge.title}`);
        player.stats.challengesCompleted++;
        challenge.completedBy++;

        this.emit('challengeCompleted', { player, challenge, timeSpent, xpEarned, bonusXp });

        return { success: true, xpEarned, bonusXp };
    }

    updateStreak(playerId: string): void {
        const player = this.players.get(playerId);
        if (!player) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDay = new Date(player.streaks.lastCodingDay);
        lastDay.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            player.streaks.currentDaily++;
            player.streaks.longestDaily = Math.max(player.streaks.longestDaily, player.streaks.currentDaily);
        } else if (diffDays > 1) {
            player.streaks.currentDaily = 1;
        }

        player.streaks.lastCodingDay = new Date();
        this.checkAchievements(playerId);
    }

    getPlayer(playerId: string): PlayerProfile | undefined {
        return this.players.get(playerId);
    }

    getLeaderboard(period: Leaderboard['period']): Leaderboard {
        const players = Array.from(this.players.values())
            .sort((a, b) => b.totalXp - a.totalXp)
            .slice(0, 100)
            .map((p, i) => ({
                rank: i + 1,
                playerId: p.id,
                username: p.username,
                score: p.totalXp
            }));

        return {
            period,
            entries: players,
            updatedAt: new Date()
        };
    }

    getChallenges(difficulty?: Challenge['difficulty']): Challenge[] {
        let challenges = Array.from(this.challenges.values());
        if (difficulty) {
            challenges = challenges.filter(c => c.difficulty === difficulty);
        }
        return challenges;
    }

    getAchievements(): Achievement[] {
        return Array.from(this.achievements.values());
    }

    getPlayerStats(playerId: string): PlayerStats | undefined {
        return this.players.get(playerId)?.stats;
    }
}

export const gamificationEngine = GamificationEngine.getInstance();
