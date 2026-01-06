/**
 * Health Monitoring Tie-In
 * Integrate with wearables to detect user fatigue and suggest breaks
 * Grok Recommendation: Health Monitoring Tie-In
 */
import { EventEmitter } from 'events';

interface HealthMetrics {
    heartRate: number;
    heartRateVariability: number;
    stressLevel: number;
    focusScore: number;
    fatigueLevel: number;
    eyeStrainRisk: number;
    postureSCore: number;
    caffenineLevel: number;
}

interface Session {
    id: string;
    startTime: Date;
    endTime?: Date;
    activeMinutes: number;
    breaksTaken: number;
    focusBlocks: number;
    keystrokes: number;
    mouseDistance: number;
    screensLookedAt: number;
}

interface BreakSuggestion {
    type: 'micro' | 'short' | 'long' | 'eye' | 'stretch' | 'walk';
    duration: number;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    activity: string;
    timestamp: Date;
}

interface WellnessGoal {
    id: string;
    name: string;
    target: number;
    current: number;
    unit: string;
    period: 'daily' | 'weekly';
}

interface ActivitySummary {
    date: Date;
    totalActiveTime: number;
    totalBreakTime: number;
    focusScore: number;
    stressAverage: number;
    achievements: string[];
}

export class HealthMonitor extends EventEmitter {
    private static instance: HealthMonitor;
    private currentSession: Session | null = null;
    private sessionHistory: Session[] = [];
    private metrics: HealthMetrics;
    private breakHistory: BreakSuggestion[] = [];
    private goals: WellnessGoal[] = [];
    private lastBreakTime: Date;
    private settings: {
        breakReminders: boolean;
        focusMode: boolean;
        eyeCareMode: boolean;
        pomodoroEnabled: boolean;
        pomodoroDuration: number;
        breakDuration: number;
    };

    private constructor() {
        super();
        this.metrics = this.getDefaultMetrics();
        this.lastBreakTime = new Date();
        this.settings = {
            breakReminders: true,
            focusMode: false,
            eyeCareMode: true,
            pomodoroEnabled: false,
            pomodoroDuration: 25,
            breakDuration: 5
        };
        this.initializeGoals();
    }

    static getInstance(): HealthMonitor {
        if (!HealthMonitor.instance) {
            HealthMonitor.instance = new HealthMonitor();
        }
        return HealthMonitor.instance;
    }

    private getDefaultMetrics(): HealthMetrics {
        return {
            heartRate: 72,
            heartRateVariability: 50,
            stressLevel: 30,
            focusScore: 80,
            fatigueLevel: 20,
            eyeStrainRisk: 30,
            postureSCore: 75,
            caffenineLevel: 30
        };
    }

    private initializeGoals(): void {
        this.goals = [
            { id: 'breaks', name: 'Take Regular Breaks', target: 8, current: 0, unit: 'breaks', period: 'daily' },
            { id: 'steps', name: 'Walking Breaks', target: 3, current: 0, unit: 'walks', period: 'daily' },
            { id: 'water', name: 'Stay Hydrated', target: 8, current: 0, unit: 'glasses', period: 'daily' },
            { id: 'stretch', name: 'Stretching Sessions', target: 4, current: 0, unit: 'sessions', period: 'daily' },
            { id: 'focus', name: 'Focus Blocks', target: 6, current: 0, unit: 'blocks', period: 'daily' },
            { id: 'screen_free', name: 'Screen-Free Time', target: 60, current: 0, unit: 'minutes', period: 'daily' }
        ];
    }

    startSession(): Session {
        if (this.currentSession) {
            this.endSession();
        }

        this.currentSession = {
            id: `session_${Date.now()}`,
            startTime: new Date(),
            activeMinutes: 0,
            breaksTaken: 0,
            focusBlocks: 0,
            keystrokes: 0,
            mouseDistance: 0,
            screensLookedAt: 1
        };

        this.emit('sessionStarted', this.currentSession);
        this.startMonitoring();
        return this.currentSession;
    }

    endSession(): Session | null {
        if (!this.currentSession) return null;

        this.currentSession.endTime = new Date();
        const completedSession = { ...this.currentSession };
        this.sessionHistory.push(completedSession);
        this.currentSession = null;

        this.emit('sessionEnded', completedSession);
        return completedSession;
    }

    private startMonitoring(): void {
        // Simulate periodic health checks
        const checkInterval = setInterval(() => {
            if (!this.currentSession) {
                clearInterval(checkInterval);
                return;
            }

            this.updateMetrics();
            this.checkForBreakNeeded();
            this.currentSession.activeMinutes++;

        }, 60000); // Check every minute
    }

    private updateMetrics(): void {
        if (!this.currentSession) return;

        const minutesSinceBreak = (Date.now() - this.lastBreakTime.getTime()) / 60000;

        // Simulate fatigue increasing over time
        this.metrics.fatigueLevel = Math.min(100, 20 + minutesSinceBreak * 0.5);
        this.metrics.eyeStrainRisk = Math.min(100, 30 + minutesSinceBreak * 0.7);
        this.metrics.stressLevel = Math.min(100, 30 + minutesSinceBreak * 0.3);
        this.metrics.focusScore = Math.max(0, 80 - minutesSinceBreak * 0.4);

        this.emit('metricsUpdated', this.metrics);
    }

    private checkForBreakNeeded(): void {
        const minutesSinceBreak = (Date.now() - this.lastBreakTime.getTime()) / 60000;

        let suggestion: BreakSuggestion | null = null;

        // Eye care (20-20-20 rule)
        if (this.settings.eyeCareMode && minutesSinceBreak >= 20 && this.metrics.eyeStrainRisk > 60) {
            suggestion = {
                type: 'eye',
                duration: 20, // seconds
                reason: '20-20-20 Rule: Look at something 20 feet away',
                priority: 'medium',
                activity: 'Look at a distant object for 20 seconds',
                timestamp: new Date()
            };
        }
        // Micro break
        else if (minutesSinceBreak >= 25 && this.metrics.fatigueLevel > 40) {
            suggestion = {
                type: 'micro',
                duration: 2,
                reason: 'Short break to reset focus',
                priority: 'low',
                activity: 'Stand up and stretch',
                timestamp: new Date()
            };
        }
        // Short break
        else if (minutesSinceBreak >= 50 && this.metrics.fatigueLevel > 60) {
            suggestion = {
                type: 'short',
                duration: 5,
                reason: 'Fatigue detected - time for a break',
                priority: 'medium',
                activity: 'Take a 5-minute break away from screen',
                timestamp: new Date()
            };
        }
        // Stretch break
        else if (minutesSinceBreak >= 60 && this.metrics.postureSCore < 50) {
            suggestion = {
                type: 'stretch',
                duration: 5,
                reason: 'Posture fatigue detected',
                priority: 'medium',
                activity: 'Do neck and shoulder stretches',
                timestamp: new Date()
            };
        }
        // Long break / walk
        else if (minutesSinceBreak >= 90) {
            suggestion = {
                type: 'walk',
                duration: 10,
                reason: 'Extended focus period - movement recommended',
                priority: 'high',
                activity: 'Take a short walk to refresh',
                timestamp: new Date()
            };
        }
        // Urgent break
        else if (this.metrics.stressLevel > 80 || this.metrics.fatigueLevel > 85) {
            suggestion = {
                type: 'long',
                duration: 15,
                reason: 'High stress/fatigue levels detected',
                priority: 'urgent',
                activity: 'Step away and practice deep breathing',
                timestamp: new Date()
            };
        }

        if (suggestion && this.settings.breakReminders) {
            this.breakHistory.push(suggestion);
            this.emit('breakSuggested', suggestion);
        }
    }

    takeBreak(type: BreakSuggestion['type']): void {
        this.lastBreakTime = new Date();

        if (this.currentSession) {
            this.currentSession.breaksTaken++;
        }

        // Update goals
        const breakGoal = this.goals.find(g => g.id === 'breaks');
        if (breakGoal) breakGoal.current++;

        if (type === 'walk') {
            const walkGoal = this.goals.find(g => g.id === 'steps');
            if (walkGoal) walkGoal.current++;
        }

        if (type === 'stretch') {
            const stretchGoal = this.goals.find(g => g.id === 'stretch');
            if (stretchGoal) stretchGoal.current++;
        }

        // Reset fatigue metrics
        this.metrics.fatigueLevel = Math.max(10, this.metrics.fatigueLevel - 30);
        this.metrics.eyeStrainRisk = Math.max(10, this.metrics.eyeStrainRisk - 40);
        this.metrics.stressLevel = Math.max(10, this.metrics.stressLevel - 20);
        this.metrics.focusScore = Math.min(100, this.metrics.focusScore + 20);

        this.emit('breakTaken', { type, timestamp: new Date() });
    }

    recordWaterIntake(): void {
        const waterGoal = this.goals.find(g => g.id === 'water');
        if (waterGoal) waterGoal.current++;
        this.emit('waterRecorded');
    }

    getMetrics(): HealthMetrics {
        return { ...this.metrics };
    }

    getSession(): Session | null {
        return this.currentSession ? { ...this.currentSession } : null;
    }

    getGoals(): WellnessGoal[] {
        return this.goals.map(g => ({ ...g }));
    }

    getGoalProgress(goalId: string): number {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return 0;
        return Math.min(100, (goal.current / goal.target) * 100);
    }

    getDailySummary(): ActivitySummary {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySessions = this.sessionHistory.filter(s =>
            new Date(s.startTime).setHours(0, 0, 0, 0) === today.getTime()
        );

        const totalActiveTime = todaySessions.reduce((sum, s) => sum + s.activeMinutes, 0);
        const totalBreakTime = todaySessions.reduce((sum, s) => sum + s.breaksTaken * 5, 0);
        const focusScore = this.metrics.focusScore;
        const stressAverage = this.metrics.stressLevel;

        const achievements: string[] = [];
        for (const goal of this.goals) {
            if (goal.current >= goal.target) {
                achievements.push(`Completed: ${goal.name}`);
            }
        }

        return {
            date: today,
            totalActiveTime,
            totalBreakTime,
            focusScore,
            stressAverage,
            achievements
        };
    }

    updateSettings(newSettings: Partial<typeof this.settings>): void {
        this.settings = { ...this.settings, ...newSettings };
        this.emit('settingsUpdated', this.settings);
    }

    getSettings(): typeof this.settings {
        return { ...this.settings };
    }

    getBreakHistory(): BreakSuggestion[] {
        return [...this.breakHistory];
    }

    getMiniGames(): { name: string; duration: number; description: string }[] {
        return [
            { name: 'Deep Breathing', duration: 60, description: 'Follow the breathing animation to relax' },
            { name: 'Eye Exercises', duration: 30, description: 'Follow the dot with your eyes' },
            { name: 'Neck Stretches', duration: 45, description: 'Guided neck stretch routine' },
            { name: 'Quick Meditation', duration: 120, description: 'Brief mindfulness session' },
            { name: 'Desk Yoga', duration: 180, description: 'Simple yoga poses at your desk' },
            { name: 'Focus Training', duration: 60, description: 'Quick attention exercise' }
        ];
    }

    resetDailyGoals(): void {
        for (const goal of this.goals) {
            goal.current = 0;
        }
        this.emit('goalsReset');
    }

    connectWearable(deviceType: 'fitbit' | 'apple_watch' | 'garmin' | 'generic'): { success: boolean; message: string } {
        // Placeholder for actual wearable integration
        this.emit('wearableConnected', { deviceType });
        return { success: true, message: `Simulated connection to ${deviceType}` };
    }
}

export const healthMonitor = HealthMonitor.getInstance();
