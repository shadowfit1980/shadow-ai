/**
 * 📊 Game Analytics
 * 
 * Player behavior tracking:
 * - Session tracking
 * - Event logging
 * - Heat maps
 * - Performance metrics
 */

import { EventEmitter } from 'events';

export interface AnalyticsEvent {
    type: string;
    data: any;
    timestamp: number;
    sessionId: string;
}

export interface PlayerSession {
    id: string;
    startTime: number;
    endTime?: number;
    events: AnalyticsEvent[];
    positions: { x: number; y: number; time: number }[];
    deaths: { x: number; y: number; cause: string; time: number }[];
    levelProgress: { level: string; startTime: number; endTime?: number; completed: boolean }[];
}

export interface AnalyticsReport {
    totalSessions: number;
    averageSessionLength: number;
    deathHeatmap: { x: number; y: number; count: number }[];
    popularPaths: { from: string; to: string; count: number }[];
    completionRates: { level: string; rate: number }[];
    eventFrequency: { event: string; count: number }[];
}

export class GameAnalytics extends EventEmitter {
    private static instance: GameAnalytics;
    private sessions: Map<string, PlayerSession> = new Map();
    private currentSessionId: string | null = null;

    private constructor() { super(); }

    static getInstance(): GameAnalytics {
        if (!GameAnalytics.instance) {
            GameAnalytics.instance = new GameAnalytics();
        }
        return GameAnalytics.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    startSession(): string {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session: PlayerSession = {
            id: sessionId,
            startTime: Date.now(),
            events: [],
            positions: [],
            deaths: [],
            levelProgress: []
        };

        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;

        this.trackEvent('session_start', {});
        this.emit('sessionStarted', sessionId);

        return sessionId;
    }

    endSession(): void {
        if (!this.currentSessionId) return;

        const session = this.sessions.get(this.currentSessionId);
        if (session) {
            session.endTime = Date.now();
            this.trackEvent('session_end', {
                duration: session.endTime - session.startTime
            });
        }

        this.emit('sessionEnded', this.currentSessionId);
        this.currentSessionId = null;
    }

    // ========================================================================
    // EVENT TRACKING
    // ========================================================================

    trackEvent(type: string, data: any): void {
        if (!this.currentSessionId) return;

        const session = this.sessions.get(this.currentSessionId);
        if (!session) return;

        const event: AnalyticsEvent = {
            type,
            data,
            timestamp: Date.now(),
            sessionId: this.currentSessionId
        };

        session.events.push(event);
        this.emit('eventTracked', event);
    }

    trackPosition(x: number, y: number): void {
        if (!this.currentSessionId) return;

        const session = this.sessions.get(this.currentSessionId);
        if (!session) return;

        session.positions.push({ x, y, time: Date.now() });
    }

    trackDeath(x: number, y: number, cause: string): void {
        if (!this.currentSessionId) return;

        const session = this.sessions.get(this.currentSessionId);
        if (!session) return;

        session.deaths.push({ x, y, cause, time: Date.now() });
        this.trackEvent('player_death', { x, y, cause });
    }

    trackLevelStart(level: string): void {
        if (!this.currentSessionId) return;

        const session = this.sessions.get(this.currentSessionId);
        if (!session) return;

        session.levelProgress.push({
            level,
            startTime: Date.now(),
            completed: false
        });

        this.trackEvent('level_start', { level });
    }

    trackLevelComplete(level: string): void {
        if (!this.currentSessionId) return;

        const session = this.sessions.get(this.currentSessionId);
        if (!session) return;

        const progress = session.levelProgress.find(
            p => p.level === level && !p.completed
        );

        if (progress) {
            progress.endTime = Date.now();
            progress.completed = true;
        }

        this.trackEvent('level_complete', {
            level,
            duration: progress ? (progress.endTime! - progress.startTime) : 0
        });
    }

    // ========================================================================
    // REPORTING
    // ========================================================================

    generateReport(): AnalyticsReport {
        const allSessions = Array.from(this.sessions.values());

        // Session stats
        const totalSessions = allSessions.length;
        const averageSessionLength = allSessions.reduce((sum, s) => {
            const duration = (s.endTime || Date.now()) - s.startTime;
            return sum + duration;
        }, 0) / (totalSessions || 1);

        // Death heatmap
        const deathGrid: Map<string, number> = new Map();
        allSessions.forEach(s => {
            s.deaths.forEach(d => {
                const gridX = Math.floor(d.x / 50) * 50;
                const gridY = Math.floor(d.y / 50) * 50;
                const key = `${gridX},${gridY}`;
                deathGrid.set(key, (deathGrid.get(key) || 0) + 1);
            });
        });
        const deathHeatmap = Array.from(deathGrid.entries()).map(([key, count]) => {
            const [x, y] = key.split(',').map(Number);
            return { x, y, count };
        }).sort((a, b) => b.count - a.count);

        // Event frequency
        const eventCounts: Map<string, number> = new Map();
        allSessions.forEach(s => {
            s.events.forEach(e => {
                eventCounts.set(e.type, (eventCounts.get(e.type) || 0) + 1);
            });
        });
        const eventFrequency = Array.from(eventCounts.entries())
            .map(([event, count]) => ({ event, count }))
            .sort((a, b) => b.count - a.count);

        // Completion rates
        const levelStats: Map<string, { attempts: number; completions: number }> = new Map();
        allSessions.forEach(s => {
            s.levelProgress.forEach(p => {
                const stats = levelStats.get(p.level) || { attempts: 0, completions: 0 };
                stats.attempts++;
                if (p.completed) stats.completions++;
                levelStats.set(p.level, stats);
            });
        });
        const completionRates = Array.from(levelStats.entries()).map(([level, stats]) => ({
            level,
            rate: stats.completions / stats.attempts
        }));

        return {
            totalSessions,
            averageSessionLength,
            deathHeatmap,
            popularPaths: [],
            completionRates,
            eventFrequency
        };
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateAnalyticsCode(): string {
        return `
// Game Analytics Client
class Analytics {
    constructor() {
        this.sessionId = null;
        this.events = [];
        this.positionBuffer = [];
        this.flushInterval = 5000;
    }

    startSession() {
        this.sessionId = 'session_' + Date.now();
        this.track('session_start');
        
        // Periodic flush
        setInterval(() => this.flush(), this.flushInterval);
        
        // Track on exit
        window.addEventListener('beforeunload', () => {
            this.track('session_end');
            this.flush();
        });
    }

    track(event, data = {}) {
        this.events.push({
            event,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId
        });
    }

    trackPosition(x, y) {
        this.positionBuffer.push({ x, y, t: Date.now() });
        
        // Keep buffer size reasonable
        if (this.positionBuffer.length > 100) {
            this.positionBuffer.shift();
        }
    }

    trackDeath(x, y, cause) {
        this.track('death', { x, y, cause });
    }

    trackLevelStart(level) {
        this.track('level_start', { level });
    }

    trackLevelComplete(level, time) {
        this.track('level_complete', { level, time });
    }

    flush() {
        if (this.events.length === 0) return;
        
        // Send to server (or localStorage for offline)
        try {
            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    events: this.events,
                    positions: this.positionBuffer
                })
            });
        } catch (e) {
            // Fallback to localStorage
            const stored = JSON.parse(localStorage.getItem('analytics') || '[]');
            stored.push(...this.events);
            localStorage.setItem('analytics', JSON.stringify(stored));
        }

        this.events = [];
        this.positionBuffer = [];
    }
}

export const analytics = new Analytics();
`;
    }

    getSessions(): PlayerSession[] {
        return Array.from(this.sessions.values());
    }
}

export const gameAnalytics = GameAnalytics.getInstance();
