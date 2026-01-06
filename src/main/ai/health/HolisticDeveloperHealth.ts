/**
 * Holistic Developer Health System
 * 
 * Monitors developer wellbeing, suggests breaks, tracks focus patterns,
 * and integrates with wearables for a sustainable development experience.
 */

import { EventEmitter } from 'events';

export interface HealthProfile {
    id: string;
    userId: string;
    currentState: DeveloperState;
    sessions: CodingSession[];
    patterns: WorkPattern[];
    recommendations: HealthRecommendation[];
    achievements: WellnessAchievement[];
    settings: HealthSettings;
    lastUpdated: Date;
}

export interface DeveloperState {
    focusLevel: number; // 0-100
    fatigueLevel: number; // 0-100
    stressLevel: number; // 0-100
    productivityScore: number; // 0-100
    mood: Mood;
    eyeStrain: number; // 0-100
    postureAlert: boolean;
}

export type Mood = 'energized' | 'focused' | 'neutral' | 'tired' | 'frustrated' | 'stressed';

export interface CodingSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    breaks: Break[];
    focusIntervals: FocusInterval[];
    productivity: number;
    notes?: string;
}

export interface Break {
    startTime: Date;
    duration: number;
    type: 'micro' | 'short' | 'long' | 'meal';
    activities: BreakActivity[];
    refreshmentScore: number;
}

export type BreakActivity =
    | 'walk'
    | 'stretch'
    | 'hydrate'
    | 'snack'
    | 'meditation'
    | 'eyes_rest'
    | 'social'
    | 'nature';

export interface FocusInterval {
    startTime: Date;
    duration: number;
    depth: 'shallow' | 'medium' | 'deep' | 'flow';
    interruptions: number;
}

export interface WorkPattern {
    name: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
}

export interface HealthRecommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    urgency: 'immediate' | 'soon' | 'later';
    benefits: string[];
    actions: string[];
}

export type RecommendationType =
    | 'break'
    | 'posture'
    | 'hydration'
    | 'eye_care'
    | 'exercise'
    | 'sleep'
    | 'nutrition'
    | 'mindfulness';

export interface WellnessAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    category: 'consistency' | 'balance' | 'focus' | 'health';
}

export interface HealthSettings {
    breakReminders: boolean;
    breakInterval: number; // minutes
    focusMode: boolean;
    dailyGoals: {
        focusMinutes: number;
        breaks: number;
        steps: number;
        waterGlasses: number;
    };
    notifications: boolean;
    darkModeSync: boolean;
}

export class HolisticDeveloperHealth extends EventEmitter {
    private static instance: HolisticDeveloperHealth;
    private profiles: Map<string, HealthProfile> = new Map();
    private currentSession?: CodingSession;
    private breakTimer?: NodeJS.Timeout;

    private constructor() {
        super();
    }

    static getInstance(): HolisticDeveloperHealth {
        if (!HolisticDeveloperHealth.instance) {
            HolisticDeveloperHealth.instance = new HolisticDeveloperHealth();
        }
        return HolisticDeveloperHealth.instance;
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    createProfile(userId: string): HealthProfile {
        const profile: HealthProfile = {
            id: `health_${Date.now()}`,
            userId,
            currentState: {
                focusLevel: 100,
                fatigueLevel: 0,
                stressLevel: 0,
                productivityScore: 100,
                mood: 'energized',
                eyeStrain: 0,
                postureAlert: false,
            },
            sessions: [],
            patterns: [],
            recommendations: [],
            achievements: [],
            settings: {
                breakReminders: true,
                breakInterval: 25, // Pomodoro
                focusMode: false,
                dailyGoals: {
                    focusMinutes: 240,
                    breaks: 8,
                    steps: 8000,
                    waterGlasses: 8,
                },
                notifications: true,
                darkModeSync: true,
            },
            lastUpdated: new Date(),
        };

        this.profiles.set(profile.id, profile);
        this.emit('profile:created', profile);
        return profile;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    startSession(profileId: string): CodingSession {
        const profile = this.profiles.get(profileId);
        if (!profile) throw new Error('Profile not found');

        this.currentSession = {
            id: `session_${Date.now()}`,
            startTime: new Date(),
            duration: 0,
            breaks: [],
            focusIntervals: [],
            productivity: 0,
        };

        // Start break reminder
        if (profile.settings.breakReminders) {
            this.startBreakTimer(profile.settings.breakInterval);
        }

        profile.sessions.push(this.currentSession);
        this.emit('session:started', this.currentSession);
        return this.currentSession;
    }

    endSession(profileId: string): CodingSession | undefined {
        if (!this.currentSession) return undefined;

        this.currentSession.endTime = new Date();
        this.currentSession.duration =
            (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 60000;

        this.clearBreakTimer();

        const profile = this.profiles.get(profileId);
        if (profile) {
            this.updatePatterns(profile);
            this.checkAchievements(profile);
            profile.lastUpdated = new Date();
        }

        this.emit('session:ended', this.currentSession);
        const session = this.currentSession;
        this.currentSession = undefined;
        return session;
    }

    // ========================================================================
    // HEALTH MONITORING
    // ========================================================================

    updateState(profileId: string, updates: Partial<DeveloperState>): void {
        const profile = this.profiles.get(profileId);
        if (!profile) return;

        Object.assign(profile.currentState, updates);
        profile.lastUpdated = new Date();

        // Generate recommendations based on state
        this.generateRecommendations(profile);

        this.emit('state:updated', profile.currentState);
    }

    recordFocusInterval(profileId: string, depth: FocusInterval['depth'], duration: number): void {
        if (!this.currentSession) return;

        const interval: FocusInterval = {
            startTime: new Date(Date.now() - duration * 60000),
            duration,
            depth,
            interruptions: 0,
        };

        this.currentSession.focusIntervals.push(interval);

        // Update fatigue
        const profile = this.profiles.get(profileId);
        if (profile) {
            const fatigueDelta = depth === 'flow' ? 15 : depth === 'deep' ? 10 : 5;
            profile.currentState.fatigueLevel = Math.min(100, profile.currentState.fatigueLevel + fatigueDelta);
            this.emit('fatigue:increased', profile.currentState.fatigueLevel);
        }
    }

    takeBreak(profileId: string, type: Break['type'], activities: BreakActivity[]): Break {
        const duration = this.getBreakDuration(type);

        const breakRecord: Break = {
            startTime: new Date(),
            duration,
            type,
            activities,
            refreshmentScore: this.calculateRefreshment(activities, duration),
        };

        if (this.currentSession) {
            this.currentSession.breaks.push(breakRecord);
        }

        // Reduce fatigue and stress
        const profile = this.profiles.get(profileId);
        if (profile) {
            const recovery = breakRecord.refreshmentScore * 0.5;
            profile.currentState.fatigueLevel = Math.max(0, profile.currentState.fatigueLevel - recovery);
            profile.currentState.stressLevel = Math.max(0, profile.currentState.stressLevel - recovery * 0.5);
            profile.currentState.eyeStrain = Math.max(0, profile.currentState.eyeStrain - recovery * 0.7);

            // Mood improvement
            if (breakRecord.refreshmentScore > 50) {
                profile.currentState.mood = 'focused';
            }
        }

        this.emit('break:taken', breakRecord);
        return breakRecord;
    }

    private getBreakDuration(type: Break['type']): number {
        const durations: Record<Break['type'], number> = {
            micro: 1,
            short: 5,
            long: 15,
            meal: 30,
        };
        return durations[type];
    }

    private calculateRefreshment(activities: BreakActivity[], duration: number): number {
        const activityScores: Record<BreakActivity, number> = {
            walk: 25,
            stretch: 20,
            hydrate: 15,
            snack: 10,
            meditation: 30,
            eyes_rest: 20,
            social: 15,
            nature: 35,
        };

        const baseScore = activities.reduce((sum, a) => sum + activityScores[a], 0);
        const durationBonus = Math.min(duration / 5, 2) * 10;

        return Math.min(100, baseScore + durationBonus);
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    private generateRecommendations(profile: HealthProfile): void {
        profile.recommendations = [];

        const state = profile.currentState;

        // Fatigue-based
        if (state.fatigueLevel > 70) {
            profile.recommendations.push({
                id: 'rec_break',
                type: 'break',
                title: 'Time for a Break',
                description: 'Your fatigue level is high. A short break will restore your focus.',
                urgency: 'immediate',
                benefits: ['Reduced fatigue', 'Improved focus', 'Better productivity'],
                actions: ['Take a 5-minute walk', 'Stretch at your desk', 'Grab some water'],
            });
        }

        // Eye strain
        if (state.eyeStrain > 50) {
            profile.recommendations.push({
                id: 'rec_eyes',
                type: 'eye_care',
                title: '20-20-20 Rule',
                description: 'Rest your eyes by looking at something 20 feet away for 20 seconds.',
                urgency: state.eyeStrain > 70 ? 'immediate' : 'soon',
                benefits: ['Reduced eye strain', 'Prevent headaches', 'Better vision health'],
                actions: ['Look away from screen', 'Blink frequently', 'Adjust screen brightness'],
            });
        }

        // Stress
        if (state.stressLevel > 60) {
            profile.recommendations.push({
                id: 'rec_mindful',
                type: 'mindfulness',
                title: 'Mindfulness Moment',
                description: 'Take a minute for deep breathing to reduce stress.',
                urgency: state.stressLevel > 80 ? 'immediate' : 'soon',
                benefits: ['Lower stress', 'Clearer thinking', 'Better decisions'],
                actions: ['Deep breathing', 'Quick meditation', 'Step outside'],
            });
        }

        // Hydration reminder (time-based simulation)
        if (this.currentSession && this.currentSession.duration > 30) {
            const lastHydration = this.currentSession.breaks.find(b => b.activities.includes('hydrate'));
            if (!lastHydration) {
                profile.recommendations.push({
                    id: 'rec_water',
                    type: 'hydration',
                    title: 'Stay Hydrated',
                    description: 'You haven\'t had water in a while. Staying hydrated boosts focus.',
                    urgency: 'soon',
                    benefits: ['Better concentration', 'More energy', 'Reduced headaches'],
                    actions: ['Drink a glass of water', 'Keep water bottle nearby'],
                });
            }
        }

        this.emit('recommendations:updated', profile.recommendations);
    }

    // ========================================================================
    // PATTERNS & ACHIEVEMENTS
    // ========================================================================

    private updatePatterns(profile: HealthProfile): void {
        const sessions = profile.sessions.slice(-30); // Last 30 sessions

        // Detect patterns
        const avgSessionDuration = sessions.reduce((s, sess) => s + sess.duration, 0) / sessions.length;
        const avgBreaks = sessions.reduce((s, sess) => s + sess.breaks.length, 0) / sessions.length;

        profile.patterns = [
            {
                name: avgSessionDuration > 120 ? 'Marathon Coder' : 'Balanced Sessions',
                frequency: sessions.length,
                impact: avgSessionDuration > 180 ? 'negative' : 'positive',
                description: `Average session: ${Math.round(avgSessionDuration)} minutes`,
            },
            {
                name: avgBreaks >= 4 ? 'Break Champion' : 'Needs More Breaks',
                frequency: sessions.length,
                impact: avgBreaks >= 4 ? 'positive' : 'negative',
                description: `Average breaks per session: ${Math.round(avgBreaks)}`,
            },
        ];
    }

    private checkAchievements(profile: HealthProfile): void {
        const achievements = profile.achievements;

        // Break streak
        const recentSessions = profile.sessions.slice(-7);
        const allHaveBreaks = recentSessions.every(s => s.breaks.length >= 2);
        const breakStreakExists = achievements.some(a => a.id === 'break_streak');

        if (allHaveBreaks && recentSessions.length >= 7 && !breakStreakExists) {
            const achievement: WellnessAchievement = {
                id: 'break_streak',
                name: 'Break Champion',
                description: 'Took regular breaks for 7 consecutive days',
                icon: '☕',
                unlockedAt: new Date(),
                category: 'balance',
            };
            achievements.push(achievement);
            this.emit('achievement:unlocked', achievement);
        }

        // Focus master
        const flowCount = recentSessions.reduce(
            (count, s) => count + s.focusIntervals.filter(f => f.depth === 'flow').length,
            0
        );

        if (flowCount >= 10 && !achievements.some(a => a.id === 'flow_master')) {
            const achievement: WellnessAchievement = {
                id: 'flow_master',
                name: 'Flow Master',
                description: 'Achieved flow state 10 times',
                icon: '🧘',
                unlockedAt: new Date(),
                category: 'focus',
            };
            achievements.push(achievement);
            this.emit('achievement:unlocked', achievement);
        }
    }

    // ========================================================================
    // BREAK TIMER
    // ========================================================================

    private startBreakTimer(intervalMinutes: number): void {
        this.clearBreakTimer();
        this.breakTimer = setInterval(() => {
            this.emit('break:reminder', {
                message: 'Time for a short break!',
                suggestion: 'Stand up, stretch, and rest your eyes.',
            });
        }, intervalMinutes * 60 * 1000);
    }

    private clearBreakTimer(): void {
        if (this.breakTimer) {
            clearInterval(this.breakTimer);
            this.breakTimer = undefined;
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getProfile(id: string): HealthProfile | undefined {
        return this.profiles.get(id);
    }

    getCurrentSession(): CodingSession | undefined {
        return this.currentSession;
    }

    getStats(profileId: string): {
        totalSessions: number;
        totalFocusMinutes: number;
        totalBreaks: number;
        avgProductivity: number;
        achievements: number;
    } | undefined {
        const profile = this.profiles.get(profileId);
        if (!profile) return undefined;

        return {
            totalSessions: profile.sessions.length,
            totalFocusMinutes: profile.sessions.reduce(
                (s, sess) => s + sess.focusIntervals.reduce((fs, f) => fs + f.duration, 0),
                0
            ),
            totalBreaks: profile.sessions.reduce((s, sess) => s + sess.breaks.length, 0),
            avgProductivity: profile.sessions.length > 0
                ? profile.sessions.reduce((s, sess) => s + sess.productivity, 0) / profile.sessions.length
                : 0,
            achievements: profile.achievements.length,
        };
    }
}

export const holisticDeveloperHealth = HolisticDeveloperHealth.getInstance();
