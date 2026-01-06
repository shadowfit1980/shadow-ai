/**
 * Autonomous Learning Hub
 * 
 * Self-paced learning system that adapts to the developer's skill level,
 * provides personalized tutorials, and tracks mastery progression.
 */

import { EventEmitter } from 'events';

export interface LearningProfile {
    id: string;
    userId: string;
    skillLevels: Map<string, SkillLevel>;
    learningPaths: LearningPath[];
    completedLessons: string[];
    achievements: LearningAchievement[];
    preferences: LearningPreferences;
    streak: number;
    lastActivity: Date;
}

export interface SkillLevel {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    progress: number;
    xp: number;
    assessedAt: Date;
}

export interface LearningPath {
    id: string;
    title: string;
    description: string;
    topics: Topic[];
    estimatedHours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    progress: number;
    status: 'not_started' | 'in_progress' | 'completed';
}

export interface Topic {
    id: string;
    title: string;
    lessons: Lesson[];
    prerequisites: string[];
    mastery: number;
}

export interface Lesson {
    id: string;
    title: string;
    type: LessonType;
    content: string;
    exercises: Exercise[];
    duration: number; // minutes
    completed: boolean;
    score?: number;
}

export type LessonType = 'concept' | 'tutorial' | 'exercise' | 'project' | 'quiz';

export interface Exercise {
    id: string;
    prompt: string;
    hints: string[];
    solution: string;
    difficulty: number;
    completed: boolean;
    attempts: number;
}

export interface LearningAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    category: 'milestone' | 'streak' | 'mastery' | 'challenge';
}

export interface LearningPreferences {
    dailyGoalMinutes: number;
    preferredLessonType: LessonType;
    notificationsEnabled: boolean;
    adaptiveDifficulty: boolean;
    focusAreas: string[];
}

export interface PersonalizedLesson {
    lesson: Lesson;
    adaptations: string[];
    confidence: number;
    alternativeResources: string[];
}

export class AutonomousLearningHub extends EventEmitter {
    private static instance: AutonomousLearningHub;
    private profiles: Map<string, LearningProfile> = new Map();
    private pathTemplates: Map<string, Omit<LearningPath, 'id' | 'progress' | 'status'>> = new Map();

    private constructor() {
        super();
        this.initializePathTemplates();
    }

    static getInstance(): AutonomousLearningHub {
        if (!AutonomousLearningHub.instance) {
            AutonomousLearningHub.instance = new AutonomousLearningHub();
        }
        return AutonomousLearningHub.instance;
    }

    private initializePathTemplates(): void {
        this.pathTemplates.set('typescript-mastery', {
            title: 'TypeScript Mastery',
            description: 'Master TypeScript from basics to advanced patterns',
            topics: this.createTypescriptTopics(),
            estimatedHours: 40,
            difficulty: 'intermediate',
        });

        this.pathTemplates.set('react-modern', {
            title: 'Modern React Development',
            description: 'Build modern React applications with hooks and patterns',
            topics: this.createReactTopics(),
            estimatedHours: 35,
            difficulty: 'intermediate',
        });

        this.pathTemplates.set('ai-integration', {
            title: 'AI Integration for Developers',
            description: 'Learn to integrate AI/ML into your applications',
            topics: this.createAITopics(),
            estimatedHours: 30,
            difficulty: 'advanced',
        });
    }

    private createTypescriptTopics(): Topic[] {
        return [
            {
                id: 'ts-basics',
                title: 'TypeScript Fundamentals',
                lessons: [
                    this.createLesson('Types and Interfaces', 'concept', 15),
                    this.createLesson('Generics Deep Dive', 'tutorial', 30),
                    this.createLesson('Build a Type-Safe API', 'project', 60),
                ],
                prerequisites: [],
                mastery: 0,
            },
            {
                id: 'ts-advanced',
                title: 'Advanced TypeScript',
                lessons: [
                    this.createLesson('Conditional Types', 'concept', 25),
                    this.createLesson('Mapped Types', 'tutorial', 30),
                    this.createLesson('Template Literal Types', 'exercise', 20),
                ],
                prerequisites: ['ts-basics'],
                mastery: 0,
            },
        ];
    }

    private createReactTopics(): Topic[] {
        return [
            {
                id: 'react-hooks',
                title: 'React Hooks Mastery',
                lessons: [
                    this.createLesson('useState & useEffect', 'concept', 20),
                    this.createLesson('Custom Hooks', 'tutorial', 40),
                    this.createLesson('Hook Patterns Quiz', 'quiz', 15),
                ],
                prerequisites: [],
                mastery: 0,
            },
        ];
    }

    private createAITopics(): Topic[] {
        return [
            {
                id: 'ai-basics',
                title: 'AI/ML Fundamentals',
                lessons: [
                    this.createLesson('Understanding LLMs', 'concept', 30),
                    this.createLesson('API Integration', 'tutorial', 45),
                    this.createLesson('Build a Chatbot', 'project', 90),
                ],
                prerequisites: [],
                mastery: 0,
            },
        ];
    }

    private createLesson(title: string, type: LessonType, duration: number): Lesson {
        return {
            id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title,
            type,
            content: `# ${title}\n\nLesson content for ${title}...`,
            exercises: type === 'exercise' || type === 'project' ? [this.createExercise()] : [],
            duration,
            completed: false,
        };
    }

    private createExercise(): Exercise {
        return {
            id: `ex_${Date.now()}`,
            prompt: 'Complete the exercise...',
            hints: ['Hint 1', 'Hint 2'],
            solution: '// Solution code here',
            difficulty: 1,
            completed: false,
            attempts: 0,
        };
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    createProfile(userId: string): LearningProfile {
        const profile: LearningProfile = {
            id: `profile_${Date.now()}`,
            userId,
            skillLevels: new Map(),
            learningPaths: [],
            completedLessons: [],
            achievements: [],
            preferences: {
                dailyGoalMinutes: 30,
                preferredLessonType: 'tutorial',
                notificationsEnabled: true,
                adaptiveDifficulty: true,
                focusAreas: [],
            },
            streak: 0,
            lastActivity: new Date(),
        };

        this.profiles.set(profile.id, profile);
        this.emit('profile:created', profile);
        return profile;
    }

    // ========================================================================
    // SKILL ASSESSMENT
    // ========================================================================

    async assessSkill(profileId: string, skill: string, answers: { question: string; correct: boolean }[]): Promise<SkillLevel> {
        const profile = this.profiles.get(profileId);
        if (!profile) throw new Error('Profile not found');

        const correctRate = answers.filter(a => a.correct).length / answers.length;

        let level: SkillLevel['level'];
        if (correctRate >= 0.9) level = 'expert';
        else if (correctRate >= 0.7) level = 'advanced';
        else if (correctRate >= 0.5) level = 'intermediate';
        else level = 'beginner';

        const skillLevel: SkillLevel = {
            skill,
            level,
            progress: correctRate * 100,
            xp: Math.round(correctRate * 500),
            assessedAt: new Date(),
        };

        profile.skillLevels.set(skill, skillLevel);
        this.emit('skill:assessed', { profile, skillLevel });
        return skillLevel;
    }

    // ========================================================================
    // LEARNING PATHS
    // ========================================================================

    enrollInPath(profileId: string, pathId: string): LearningPath | undefined {
        const profile = this.profiles.get(profileId);
        const template = this.pathTemplates.get(pathId);
        if (!profile || !template) return undefined;

        const path: LearningPath = {
            id: `path_${Date.now()}`,
            ...template,
            progress: 0,
            status: 'not_started',
        };

        profile.learningPaths.push(path);
        this.emit('path:enrolled', { profile, path });
        return path;
    }

    // ========================================================================
    // PERSONALIZED LEARNING
    // ========================================================================

    async getPersonalizedLesson(profileId: string, topicId: string): Promise<PersonalizedLesson | undefined> {
        const profile = this.profiles.get(profileId);
        if (!profile) return undefined;

        // Find the topic in any enrolled path
        for (const path of profile.learningPaths) {
            const topic = path.topics.find(t => t.id === topicId);
            if (topic) {
                const nextLesson = topic.lessons.find(l => !l.completed);
                if (nextLesson) {
                    const adaptations = this.generateAdaptations(profile, nextLesson);
                    return {
                        lesson: nextLesson,
                        adaptations,
                        confidence: this.calculateLessonConfidence(profile, nextLesson),
                        alternativeResources: this.findAlternativeResources(nextLesson),
                    };
                }
            }
        }

        return undefined;
    }

    private generateAdaptations(profile: LearningProfile, lesson: Lesson): string[] {
        const adaptations: string[] = [];

        // Based on preferred lesson type
        if (profile.preferences.preferredLessonType !== lesson.type) {
            adaptations.push(`Adapted from ${lesson.type} to include ${profile.preferences.preferredLessonType} elements`);
        }

        // Based on skill level
        for (const [skill, level] of profile.skillLevels) {
            if (lesson.content.toLowerCase().includes(skill.toLowerCase())) {
                if (level.level === 'beginner') {
                    adaptations.push(`Added extra explanations for ${skill}`);
                } else if (level.level === 'expert') {
                    adaptations.push(`Condensed ${skill} sections - you know this!`);
                }
            }
        }

        // Based on completion history
        if (profile.completedLessons.length > 10) {
            adaptations.push('Accelerated pacing based on your learning speed');
        }

        return adaptations;
    }

    private calculateLessonConfidence(profile: LearningProfile, lesson: Lesson): number {
        const completionRate = profile.completedLessons.length /
            Math.max(1, profile.learningPaths.reduce((s, p) =>
                s + p.topics.reduce((ts, t) => ts + t.lessons.length, 0), 0));

        const avgMastery = profile.learningPaths.length > 0
            ? profile.learningPaths.reduce((s, p) =>
                s + p.topics.reduce((ts, t) => ts + t.mastery, 0) / p.topics.length, 0) / profile.learningPaths.length
            : 0.5;

        return 0.5 + completionRate * 0.3 + avgMastery * 0.2;
    }

    private findAlternativeResources(lesson: Lesson): string[] {
        return [
            `Video: ${lesson.title} Explained`,
            `Article: Deep Dive into ${lesson.title}`,
            `Interactive: ${lesson.title} Playground`,
        ];
    }

    // ========================================================================
    // LESSON COMPLETION
    // ========================================================================

    async completeLesson(profileId: string, lessonId: string, score?: number): Promise<void> {
        const profile = this.profiles.get(profileId);
        if (!profile) return;

        for (const path of profile.learningPaths) {
            for (const topic of path.topics) {
                const lesson = topic.lessons.find(l => l.id === lessonId);
                if (lesson) {
                    lesson.completed = true;
                    lesson.score = score;
                    profile.completedLessons.push(lessonId);

                    // Update topic mastery
                    const completed = topic.lessons.filter(l => l.completed).length;
                    topic.mastery = completed / topic.lessons.length;

                    // Update path progress
                    const totalLessons = path.topics.reduce((s, t) => s + t.lessons.length, 0);
                    path.progress = profile.completedLessons.filter(id =>
                        path.topics.some(t => t.lessons.some(l => l.id === id))
                    ).length / totalLessons * 100;

                    if (path.progress === 100) {
                        path.status = 'completed';
                        this.checkAchievements(profile, 'path_complete');
                    } else if (path.status === 'not_started') {
                        path.status = 'in_progress';
                    }

                    // Update streak
                    this.updateStreak(profile);

                    this.emit('lesson:completed', { profile, lesson, score });
                    return;
                }
            }
        }
    }

    private updateStreak(profile: LearningProfile): void {
        const today = new Date().toDateString();
        const lastDay = profile.lastActivity.toDateString();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDay === today) {
            // Already active today
        } else if (lastDay === yesterday.toDateString()) {
            profile.streak++;
            this.checkAchievements(profile, 'streak');
        } else {
            profile.streak = 1;
        }

        profile.lastActivity = new Date();
    }

    // ========================================================================
    // ACHIEVEMENTS
    // ========================================================================

    private checkAchievements(profile: LearningProfile, trigger: string): void {
        const achievements: LearningAchievement[] = [];

        if (trigger === 'streak') {
            if (profile.streak === 7 && !profile.achievements.some(a => a.id === 'week_streak')) {
                achievements.push({
                    id: 'week_streak',
                    name: 'Week Warrior',
                    description: '7-day learning streak!',
                    icon: '🔥',
                    unlockedAt: new Date(),
                    category: 'streak',
                });
            }
            if (profile.streak === 30 && !profile.achievements.some(a => a.id === 'month_streak')) {
                achievements.push({
                    id: 'month_streak',
                    name: 'Dedicated Learner',
                    description: '30-day learning streak!',
                    icon: '🏆',
                    unlockedAt: new Date(),
                    category: 'streak',
                });
            }
        }

        if (trigger === 'path_complete' && !profile.achievements.some(a => a.id === 'first_path')) {
            achievements.push({
                id: 'first_path',
                name: 'Pathfinder',
                description: 'Completed your first learning path!',
                icon: '🎯',
                unlockedAt: new Date(),
                category: 'milestone',
            });
        }

        for (const achievement of achievements) {
            profile.achievements.push(achievement);
            this.emit('achievement:unlocked', { profile, achievement });
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getProfile(id: string): LearningProfile | undefined {
        return this.profiles.get(id);
    }

    getAvailablePaths(): string[] {
        return Array.from(this.pathTemplates.keys());
    }

    getRecommendedPaths(profileId: string): string[] {
        const profile = this.profiles.get(profileId);
        if (!profile) return [];

        // Recommend based on skill levels and preferences
        const recommendations: string[] = [];

        for (const [pathId, template] of this.pathTemplates) {
            const enrolled = profile.learningPaths.some(p => p.title === template.title);
            if (!enrolled) {
                recommendations.push(pathId);
            }
        }

        return recommendations;
    }

    getStats(profileId: string): {
        totalLessons: number;
        completedLessons: number;
        streak: number;
        totalXP: number;
        achievements: number;
    } | undefined {
        const profile = this.profiles.get(profileId);
        if (!profile) return undefined;

        const totalLessons = profile.learningPaths.reduce((s, p) =>
            s + p.topics.reduce((ts, t) => ts + t.lessons.length, 0), 0);

        const totalXP = Array.from(profile.skillLevels.values())
            .reduce((s, skill) => s + skill.xp, 0);

        return {
            totalLessons,
            completedLessons: profile.completedLessons.length,
            streak: profile.streak,
            totalXP,
            achievements: profile.achievements.length,
        };
    }
}

export const autonomousLearningHub = AutonomousLearningHub.getInstance();
