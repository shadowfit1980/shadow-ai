/**
 * Learning Pathway System
 * 
 * Personalized skill progression based on developer performance.
 * Recommends tutorials, exercises, and challenges tailored to gaps.
 */

import { EventEmitter } from 'events';

export interface LearnerProfile {
    id: string;
    name: string;
    skillLevels: Map<string, SkillLevel>;
    completedModules: string[];
    currentPathway?: string;
    streak: number;
    totalXP: number;
    badges: string[];
    preferences: LearnerPreferences;
    joinedAt: Date;
}

export interface SkillLevel {
    skill: string;
    category: SkillCategory;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    score: number; // 0-100
    lastAssessed: Date;
    practiceCount: number;
}

export type SkillCategory =
    | 'language'
    | 'framework'
    | 'tool'
    | 'concept'
    | 'pattern'
    | 'methodology';

export interface LearnerPreferences {
    learningStyle: 'visual' | 'reading' | 'hands-on' | 'video';
    sessionLength: 'short' | 'medium' | 'long'; // 15, 30, 60 min
    difficulty: 'easy' | 'balanced' | 'challenging';
    focusAreas: string[];
}

export interface LearningModule {
    id: string;
    title: string;
    description: string;
    skill: string;
    category: SkillCategory;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    type: ModuleType;
    duration: number; // minutes
    content: ModuleContent;
    prerequisites: string[];
    xpReward: number;
}

export type ModuleType =
    | 'tutorial'
    | 'exercise'
    | 'challenge'
    | 'quiz'
    | 'project'
    | 'video'
    | 'reading';

export interface ModuleContent {
    sections: ContentSection[];
    code?: { language: string; content: string }[];
    resources?: { title: string; url: string }[];
}

export interface ContentSection {
    title: string;
    content: string;
    type: 'text' | 'code' | 'image' | 'interactive';
}

export interface LearningPathway {
    id: string;
    name: string;
    description: string;
    targetSkill: string;
    modules: string[]; // Module IDs in order
    estimatedHours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillGapAnalysis {
    learnerId: string;
    gaps: SkillGap[];
    recommendations: ModuleRecommendation[];
    prioritySkills: string[];
}

export interface SkillGap {
    skill: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    priority: 'low' | 'medium' | 'high';
}

export interface ModuleRecommendation {
    moduleId: string;
    reason: string;
    priority: number;
    estimatedImpact: number;
}

export class LearningPathwaySystem extends EventEmitter {
    private static instance: LearningPathwaySystem;
    private learners: Map<string, LearnerProfile> = new Map();
    private modules: Map<string, LearningModule> = new Map();
    private pathways: Map<string, LearningPathway> = new Map();

    private constructor() {
        super();
        this.initializeContent();
    }

    static getInstance(): LearningPathwaySystem {
        if (!LearningPathwaySystem.instance) {
            LearningPathwaySystem.instance = new LearningPathwaySystem();
        }
        return LearningPathwaySystem.instance;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    private initializeContent(): void {
        // Sample modules
        const sampleModules: Omit<LearningModule, 'id'>[] = [
            {
                title: 'TypeScript Fundamentals',
                description: 'Learn the basics of TypeScript type system',
                skill: 'typescript',
                category: 'language',
                difficulty: 'beginner',
                type: 'tutorial',
                duration: 30,
                content: {
                    sections: [
                        { title: 'Introduction', content: 'TypeScript adds static types to JavaScript...', type: 'text' },
                        { title: 'Basic Types', content: 'let name: string = "Alice";', type: 'code' },
                    ],
                },
                prerequisites: [],
                xpReward: 100,
            },
            {
                title: 'React Hooks Deep Dive',
                description: 'Master useState, useEffect, and custom hooks',
                skill: 'react',
                category: 'framework',
                difficulty: 'intermediate',
                type: 'tutorial',
                duration: 45,
                content: {
                    sections: [
                        { title: 'useState', content: 'Managing state in functional components...', type: 'text' },
                    ],
                },
                prerequisites: ['typescript_fundamentals'],
                xpReward: 150,
            },
            {
                title: 'Design Patterns in Practice',
                description: 'Apply common design patterns in real code',
                skill: 'design_patterns',
                category: 'pattern',
                difficulty: 'advanced',
                type: 'project',
                duration: 120,
                content: {
                    sections: [
                        { title: 'Factory Pattern', content: 'Creating objects without specifying exact class...', type: 'text' },
                    ],
                },
                prerequisites: ['typescript_fundamentals'],
                xpReward: 300,
            },
            {
                title: 'Testing Best Practices',
                description: 'Write effective unit and integration tests',
                skill: 'testing',
                category: 'methodology',
                difficulty: 'intermediate',
                type: 'exercise',
                duration: 60,
                content: {
                    sections: [
                        { title: 'Test Structure', content: 'Arrange-Act-Assert pattern...', type: 'text' },
                    ],
                },
                prerequisites: [],
                xpReward: 200,
            },
        ];

        for (const module of sampleModules) {
            const id = module.title.toLowerCase().replace(/\s+/g, '_');
            this.modules.set(id, { ...module, id });
        }

        // Sample pathways
        const samplePathways: Omit<LearningPathway, 'id'>[] = [
            {
                name: 'Full Stack TypeScript',
                description: 'Master TypeScript for frontend and backend',
                targetSkill: 'typescript',
                modules: ['typescript_fundamentals', 'react_hooks_deep_dive'],
                estimatedHours: 10,
                difficulty: 'intermediate',
            },
            {
                name: 'Testing Mastery',
                description: 'Become proficient in all forms of testing',
                targetSkill: 'testing',
                modules: ['testing_best_practices'],
                estimatedHours: 5,
                difficulty: 'intermediate',
            },
        ];

        for (const pathway of samplePathways) {
            const id = pathway.name.toLowerCase().replace(/\s+/g, '_');
            this.pathways.set(id, { ...pathway, id });
        }
    }

    // ========================================================================
    // LEARNER MANAGEMENT
    // ========================================================================

    registerLearner(id: string, name: string): LearnerProfile {
        const profile: LearnerProfile = {
            id,
            name,
            skillLevels: new Map(),
            completedModules: [],
            streak: 0,
            totalXP: 0,
            badges: [],
            preferences: {
                learningStyle: 'hands-on',
                sessionLength: 'medium',
                difficulty: 'balanced',
                focusAreas: [],
            },
            joinedAt: new Date(),
        };

        this.learners.set(id, profile);
        this.emit('learner:registered', profile);
        return profile;
    }

    getLearner(id: string): LearnerProfile | undefined {
        return this.learners.get(id);
    }

    updatePreferences(learnerId: string, prefs: Partial<LearnerPreferences>): void {
        const learner = this.learners.get(learnerId);
        if (learner) {
            learner.preferences = { ...learner.preferences, ...prefs };
        }
    }

    // ========================================================================
    // SKILL ASSESSMENT
    // ========================================================================

    assessSkill(learnerId: string, skill: string, score: number): SkillLevel {
        const learner = this.learners.get(learnerId);
        if (!learner) throw new Error('Learner not found');

        const level = this.scoreToLevel(score);
        const category = this.getSkillCategory(skill);

        const skillLevel: SkillLevel = {
            skill,
            category,
            level,
            score,
            lastAssessed: new Date(),
            practiceCount: (learner.skillLevels.get(skill)?.practiceCount || 0) + 1,
        };

        learner.skillLevels.set(skill, skillLevel);
        this.emit('skill:assessed', { learnerId, skillLevel });
        return skillLevel;
    }

    private scoreToLevel(score: number): SkillLevel['level'] {
        if (score >= 90) return 'expert';
        if (score >= 70) return 'advanced';
        if (score >= 50) return 'intermediate';
        return 'beginner';
    }

    private getSkillCategory(skill: string): SkillCategory {
        const categories: Record<string, SkillCategory> = {
            typescript: 'language',
            javascript: 'language',
            python: 'language',
            react: 'framework',
            vue: 'framework',
            git: 'tool',
            testing: 'methodology',
            design_patterns: 'pattern',
            algorithms: 'concept',
        };
        return categories[skill] || 'concept';
    }

    // ========================================================================
    // GAP ANALYSIS
    // ========================================================================

    analyzeSkillGaps(learnerId: string, targetSkills?: string[]): SkillGapAnalysis {
        const learner = this.learners.get(learnerId);
        if (!learner) throw new Error('Learner not found');

        const gaps: SkillGap[] = [];
        const skills = targetSkills || Array.from(this.getRequiredSkills());

        for (const skill of skills) {
            const current = learner.skillLevels.get(skill);
            const currentScore = current?.score || 0;
            const targetScore = 80; // Target level

            if (currentScore < targetScore) {
                gaps.push({
                    skill,
                    currentLevel: currentScore,
                    targetLevel: targetScore,
                    gap: targetScore - currentScore,
                    priority: this.calculateGapPriority(skill, currentScore, learner.preferences.focusAreas),
                });
            }
        }

        // Sort by priority
        gaps.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Generate recommendations
        const recommendations = this.generateRecommendations(learner, gaps);

        return {
            learnerId,
            gaps,
            recommendations,
            prioritySkills: gaps.slice(0, 3).map(g => g.skill),
        };
    }

    private getRequiredSkills(): Set<string> {
        const skills = new Set<string>();
        for (const module of this.modules.values()) {
            skills.add(module.skill);
        }
        return skills;
    }

    private calculateGapPriority(skill: string, currentScore: number, focusAreas: string[]): 'low' | 'medium' | 'high' {
        if (focusAreas.includes(skill)) return 'high';
        if (currentScore < 30) return 'high';
        if (currentScore < 60) return 'medium';
        return 'low';
    }

    private generateRecommendations(learner: LearnerProfile, gaps: SkillGap[]): ModuleRecommendation[] {
        const recommendations: ModuleRecommendation[] = [];

        for (const gap of gaps.slice(0, 5)) { // Top 5 gaps
            const matchingModules = Array.from(this.modules.values())
                .filter(m => m.skill === gap.skill)
                .filter(m => !learner.completedModules.includes(m.id))
                .filter(m => this.matchesDifficulty(m.difficulty, gap.currentLevel));

            for (const module of matchingModules.slice(0, 2)) {
                recommendations.push({
                    moduleId: module.id,
                    reason: `Addresses ${gap.skill} gap (${gap.gap} points to target)`,
                    priority: gap.priority === 'high' ? 3 : gap.priority === 'medium' ? 2 : 1,
                    estimatedImpact: module.xpReward / 10,
                });
            }
        }

        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    private matchesDifficulty(moduleDifficulty: string, currentScore: number): boolean {
        if (currentScore < 30) return moduleDifficulty === 'beginner';
        if (currentScore < 70) return moduleDifficulty === 'intermediate';
        return moduleDifficulty === 'advanced';
    }

    // ========================================================================
    // PROGRESS TRACKING
    // ========================================================================

    completeModule(learnerId: string, moduleId: string): { xpEarned: number; newLevel?: SkillLevel } {
        const learner = this.learners.get(learnerId);
        const module = this.modules.get(moduleId);

        if (!learner || !module) {
            throw new Error('Learner or module not found');
        }

        // Mark as complete
        if (!learner.completedModules.includes(moduleId)) {
            learner.completedModules.push(moduleId);
        }

        // Award XP
        learner.totalXP += module.xpReward;

        // Update skill level
        const currentSkill = learner.skillLevels.get(module.skill);
        const newScore = Math.min(100, (currentSkill?.score || 0) + module.xpReward / 10);
        const newLevel = this.assessSkill(learnerId, module.skill, newScore);

        // Update streak
        learner.streak++;

        this.emit('module:completed', { learnerId, moduleId, xpEarned: module.xpReward });

        return { xpEarned: module.xpReward, newLevel };
    }

    // ========================================================================
    // PATHWAY MANAGEMENT
    // ========================================================================

    startPathway(learnerId: string, pathwayId: string): LearningPathway | undefined {
        const learner = this.learners.get(learnerId);
        const pathway = this.pathways.get(pathwayId);

        if (!learner || !pathway) return undefined;

        learner.currentPathway = pathwayId;
        this.emit('pathway:started', { learnerId, pathwayId });
        return pathway;
    }

    getPathwayProgress(learnerId: string): { pathway: LearningPathway; completedModules: number; totalModules: number } | undefined {
        const learner = this.learners.get(learnerId);
        if (!learner?.currentPathway) return undefined;

        const pathway = this.pathways.get(learner.currentPathway);
        if (!pathway) return undefined;

        const completed = pathway.modules.filter(m => learner.completedModules.includes(m)).length;

        return {
            pathway,
            completedModules: completed,
            totalModules: pathway.modules.length,
        };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getModules(filter?: { skill?: string; difficulty?: string }): LearningModule[] {
        let results = Array.from(this.modules.values());

        if (filter?.skill) {
            results = results.filter(m => m.skill === filter.skill);
        }
        if (filter?.difficulty) {
            results = results.filter(m => m.difficulty === filter.difficulty);
        }

        return results;
    }

    getPathways(): LearningPathway[] {
        return Array.from(this.pathways.values());
    }

    getLeaderboard(limit: number = 10): { id: string; name: string; xp: number }[] {
        return Array.from(this.learners.values())
            .sort((a, b) => b.totalXP - a.totalXP)
            .slice(0, limit)
            .map(l => ({ id: l.id, name: l.name, xp: l.totalXP }));
    }
}

export const learningPathwaySystem = LearningPathwaySystem.getInstance();
