/**
 * OnboardingEngine - Progressive Feature Disclosure System
 * 
 * Addresses UX concerns about 599 services overwhelming users.
 * Implements progressive disclosure, achievement tracking, and
 * contextual feature discovery.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type UserLevel = 'newcomer' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface UserProfile {
    id: string;
    level: UserLevel;
    xp: number;
    achievements: string[];
    completedTutorials: string[];
    unlockedFeatures: string[];
    preferences: Record<string, any>;
    createdAt: Date;
    lastActiveAt: Date;
    stats: UserStats;
}

export interface UserStats {
    tasksCompleted: number;
    filesGenerated: number;
    testsRun: number;
    deploymentsSuccessful: number;
    hoursActive: number;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    steps: TutorialStep[];
    requiredLevel: UserLevel;
    xpReward: number;
    estimatedMinutes: number;
}

export interface TutorialStep {
    id: string;
    instruction: string;
    action?: string; // Action to detect completion
    hint?: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    criteria: AchievementCriteria;
}

export interface AchievementCriteria {
    type: 'count' | 'streak' | 'unlock' | 'milestone';
    target: number | string;
    current?: number;
}

export interface ContextualTip {
    id: string;
    trigger: string; // Event or context that triggers this tip
    title: string;
    content: string;
    level: UserLevel;
    feature?: string; // Related feature to unlock
}

// ============================================================================
// ONBOARDING ENGINE
// ============================================================================

export class OnboardingEngine extends EventEmitter {
    private static instance: OnboardingEngine;

    private users: Map<string, UserProfile> = new Map();
    private defaultUserId = 'default-user';

    // XP thresholds for levels
    private readonly LEVEL_XP: Record<UserLevel, number> = {
        newcomer: 0,
        beginner: 100,
        intermediate: 500,
        advanced: 2000,
        expert: 10000
    };

    // Features unlocked at each level
    private readonly LEVEL_FEATURES: Record<UserLevel, string[]> = {
        newcomer: ['basic-chat', 'file-explorer'],
        beginner: ['code-generation', 'code-analysis', 'simple-testing'],
        intermediate: ['multi-file-editing', 'refactoring', 'debugging', 'git-integration'],
        advanced: ['custom-agents', 'workflow-builder', 'api-integration', 'autonomous-mode'],
        expert: ['all-features', 'experimental', 'plugin-development']
    };

    private tutorials: Map<string, Tutorial> = new Map();
    private achievements: Map<string, Achievement> = new Map();
    private tips: ContextualTip[] = [];

    private constructor() {
        super();
        this.initializeContent();
        this.ensureDefaultUser();
    }

    static getInstance(): OnboardingEngine {
        if (!OnboardingEngine.instance) {
            OnboardingEngine.instance = new OnboardingEngine();
        }
        return OnboardingEngine.instance;
    }

    // ========================================================================
    // USER MANAGEMENT
    // ========================================================================

    private ensureDefaultUser(): void {
        if (!this.users.has(this.defaultUserId)) {
            this.createUser(this.defaultUserId);
        }
    }

    createUser(id: string): UserProfile {
        const profile: UserProfile = {
            id,
            level: 'newcomer',
            xp: 0,
            achievements: [],
            completedTutorials: [],
            unlockedFeatures: [...this.LEVEL_FEATURES.newcomer],
            preferences: {},
            createdAt: new Date(),
            lastActiveAt: new Date(),
            stats: {
                tasksCompleted: 0,
                filesGenerated: 0,
                testsRun: 0,
                deploymentsSuccessful: 0,
                hoursActive: 0
            }
        };

        this.users.set(id, profile);
        this.emit('user:created', profile);
        return profile;
    }

    getUser(id: string = this.defaultUserId): UserProfile | undefined {
        const user = this.users.get(id);
        if (user) {
            user.lastActiveAt = new Date();
        }
        return user;
    }

    // ========================================================================
    // XP & LEVELING
    // ========================================================================

    /**
     * Award XP and check for level up
     */
    awardXP(userId: string, amount: number, reason: string): void {
        const user = this.users.get(userId) || this.getUser();
        if (!user) return;

        const oldXP = user.xp;
        user.xp += amount;

        console.log(`🎮 [Onboarding] +${amount} XP for ${reason}`);
        this.emit('xp:awarded', { userId, amount, reason, total: user.xp });

        // Check level up
        const newLevel = this.calculateLevel(user.xp);
        if (newLevel !== user.level) {
            this.levelUp(user, newLevel);
        }
    }

    private calculateLevel(xp: number): UserLevel {
        if (xp >= this.LEVEL_XP.expert) return 'expert';
        if (xp >= this.LEVEL_XP.advanced) return 'advanced';
        if (xp >= this.LEVEL_XP.intermediate) return 'intermediate';
        if (xp >= this.LEVEL_XP.beginner) return 'beginner';
        return 'newcomer';
    }

    private levelUp(user: UserProfile, newLevel: UserLevel): void {
        const oldLevel = user.level;
        user.level = newLevel;

        // Unlock features for new level
        const newFeatures = this.LEVEL_FEATURES[newLevel];
        for (const feature of newFeatures) {
            if (!user.unlockedFeatures.includes(feature)) {
                user.unlockedFeatures.push(feature);
            }
        }

        console.log(`🎉 [Onboarding] Level up! ${oldLevel} → ${newLevel}`);
        this.emit('level:up', {
            userId: user.id,
            oldLevel,
            newLevel,
            unlockedFeatures: newFeatures
        });
    }

    // ========================================================================
    // FEATURE ACCESS
    // ========================================================================

    /**
     * Check if a feature is unlocked for user
     */
    isFeatureUnlocked(featureId: string, userId?: string): boolean {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) return false;

        return user.unlockedFeatures.includes(featureId) ||
            user.unlockedFeatures.includes('all-features');
    }

    /**
     * Get available features for user
     */
    getAvailableFeatures(userId?: string): string[] {
        const user = this.users.get(userId || this.defaultUserId);
        return user?.unlockedFeatures || this.LEVEL_FEATURES.newcomer;
    }

    /**
     * Get locked features user will unlock at next levels
     */
    getUpcomingFeatures(userId?: string): Array<{ feature: string; level: UserLevel }> {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) return [];

        const upcoming: Array<{ feature: string; level: UserLevel }> = [];
        const levels: UserLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
        const levelIndex = levels.indexOf(user.level);

        for (let i = levelIndex + 1; i < levels.length; i++) {
            for (const feature of this.LEVEL_FEATURES[levels[i]]) {
                if (!user.unlockedFeatures.includes(feature)) {
                    upcoming.push({ feature, level: levels[i] });
                }
            }
        }

        return upcoming;
    }

    // ========================================================================
    // TUTORIALS
    // ========================================================================

    /**
     * Get available tutorials for user's level
     */
    getAvailableTutorials(userId?: string): Tutorial[] {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) return [];

        return Array.from(this.tutorials.values()).filter(t =>
            !user.completedTutorials.includes(t.id) &&
            this.meetsLevelRequirement(user.level, t.requiredLevel)
        );
    }

    /**
     * Complete a tutorial
     */
    completeTutorial(tutorialId: string, userId?: string): boolean {
        const user = this.users.get(userId || this.defaultUserId);
        const tutorial = this.tutorials.get(tutorialId);

        if (!user || !tutorial) return false;
        if (user.completedTutorials.includes(tutorialId)) return false;

        user.completedTutorials.push(tutorialId);
        this.awardXP(user.id, tutorial.xpReward, `tutorial:${tutorialId}`);

        this.emit('tutorial:completed', { userId: user.id, tutorialId });
        return true;
    }

    private meetsLevelRequirement(userLevel: UserLevel, required: UserLevel): boolean {
        const levels: UserLevel[] = ['newcomer', 'beginner', 'intermediate', 'advanced', 'expert'];
        return levels.indexOf(userLevel) >= levels.indexOf(required);
    }

    // ========================================================================
    // ACHIEVEMENTS
    // ========================================================================

    /**
     * Check and award achievements
     */
    checkAchievements(userId?: string): Achievement[] {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) return [];

        const newAchievements: Achievement[] = [];

        for (const achievement of this.achievements.values()) {
            if (user.achievements.includes(achievement.id)) continue;

            if (this.checkAchievementCriteria(user, achievement.criteria)) {
                user.achievements.push(achievement.id);
                this.awardXP(user.id, achievement.xpReward, `achievement:${achievement.id}`);
                newAchievements.push(achievement);

                this.emit('achievement:unlocked', { userId: user.id, achievement });
            }
        }

        return newAchievements;
    }

    private checkAchievementCriteria(user: UserProfile, criteria: AchievementCriteria): boolean {
        switch (criteria.type) {
            case 'count':
                return user.stats.tasksCompleted >= (criteria.target as number);
            case 'milestone':
                return user.xp >= (criteria.target as number);
            case 'unlock':
                return user.unlockedFeatures.includes(criteria.target as string);
            default:
                return false;
        }
    }

    // ========================================================================
    // CONTEXTUAL TIPS
    // ========================================================================

    /**
     * Get relevant tip for current context
     */
    getTip(trigger: string, userId?: string): ContextualTip | undefined {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) return undefined;

        return this.tips.find(tip =>
            tip.trigger === trigger &&
            this.meetsLevelRequirement(user.level, tip.level)
        );
    }

    // ========================================================================
    // STATS TRACKING
    // ========================================================================

    /**
     * Track user action
     */
    trackAction(action: string, userId?: string): void {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) return;

        switch (action) {
            case 'task_complete':
                user.stats.tasksCompleted++;
                this.awardXP(user.id, 10, 'task completed');
                break;
            case 'file_generated':
                user.stats.filesGenerated++;
                this.awardXP(user.id, 5, 'file generated');
                break;
            case 'test_run':
                user.stats.testsRun++;
                this.awardXP(user.id, 3, 'test run');
                break;
            case 'deploy_success':
                user.stats.deploymentsSuccessful++;
                this.awardXP(user.id, 50, 'successful deployment');
                break;
        }

        // Check for new achievements
        this.checkAchievements(user.id);
    }

    // ========================================================================
    // CONTENT INITIALIZATION
    // ========================================================================

    private initializeContent(): void {
        // Tutorials
        this.tutorials.set('quick-start', {
            id: 'quick-start',
            title: 'Quick Start Guide',
            description: 'Learn the basics of Shadow AI',
            requiredLevel: 'newcomer',
            xpReward: 50,
            estimatedMinutes: 5,
            steps: [
                { id: 's1', instruction: 'Open the chat panel and say hello' },
                { id: 's2', instruction: 'Ask the AI to create a simple function' },
                { id: 's3', instruction: 'Review the generated code' }
            ]
        });

        this.tutorials.set('code-generation', {
            id: 'code-generation',
            title: 'Code Generation Basics',
            description: 'Learn to generate code with AI',
            requiredLevel: 'beginner',
            xpReward: 100,
            estimatedMinutes: 10,
            steps: [
                { id: 's1', instruction: 'Describe a component to generate' },
                { id: 's2', instruction: 'Review and apply the generated code' },
                { id: 's3', instruction: 'Ask for modifications' }
            ]
        });

        // Achievements
        this.achievements.set('first-task', {
            id: 'first-task',
            name: 'First Steps',
            description: 'Complete your first task',
            icon: '🎯',
            xpReward: 25,
            criteria: { type: 'count', target: 1 }
        });

        this.achievements.set('power-user', {
            id: 'power-user',
            name: 'Power User',
            description: 'Complete 100 tasks',
            icon: '⚡',
            xpReward: 500,
            criteria: { type: 'count', target: 100 }
        });

        this.achievements.set('xp-milestone', {
            id: 'xp-milestone',
            name: 'Rising Star',
            description: 'Earn 1000 XP',
            icon: '⭐',
            xpReward: 100,
            criteria: { type: 'milestone', target: 1000 }
        });

        // Tips
        this.tips.push({
            id: 'tip-shortcuts',
            trigger: 'first-chat',
            title: 'Pro Tip',
            content: 'Use keyboard shortcuts: Ctrl+Enter to send, Ctrl+L to clear',
            level: 'newcomer'
        });
    }

    // ========================================================================
    // STATS & EXPORT
    // ========================================================================

    getProgress(userId?: string): {
        level: UserLevel;
        xp: number;
        xpToNextLevel: number;
        percentToNextLevel: number;
        achievements: number;
        tutorialsCompleted: number;
    } {
        const user = this.users.get(userId || this.defaultUserId);
        if (!user) {
            return {
                level: 'newcomer',
                xp: 0,
                xpToNextLevel: this.LEVEL_XP.beginner,
                percentToNextLevel: 0,
                achievements: 0,
                tutorialsCompleted: 0
            };
        }

        const levels: UserLevel[] = ['newcomer', 'beginner', 'intermediate', 'advanced', 'expert'];
        const currentLevelIndex = levels.indexOf(user.level);
        const nextLevel = levels[currentLevelIndex + 1] || 'expert';
        const currentLevelXP = this.LEVEL_XP[user.level];
        const nextLevelXP = this.LEVEL_XP[nextLevel];
        const xpToNext = nextLevelXP - user.xp;
        const progressInLevel = user.xp - currentLevelXP;
        const levelRange = nextLevelXP - currentLevelXP;

        return {
            level: user.level,
            xp: user.xp,
            xpToNextLevel: Math.max(0, xpToNext),
            percentToNextLevel: Math.min(100, (progressInLevel / levelRange) * 100),
            achievements: user.achievements.length,
            tutorialsCompleted: user.completedTutorials.length
        };
    }

    clear(): void {
        this.users.clear();
        this.ensureDefaultUser();
    }
}

// Export singleton
export const onboardingEngine = OnboardingEngine.getInstance();
