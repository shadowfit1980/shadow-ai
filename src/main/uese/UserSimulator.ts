/**
 * UESE User Behavior Simulator
 * 
 * Simulates realistic human behavior including normal users,
 * edge cases, accessibility users, and malicious actors.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type UserType = 'normal' | 'power' | 'beginner' | 'accessibility' | 'mobile' | 'bot' | 'malicious';
export type InteractionType = 'click' | 'type' | 'scroll' | 'hover' | 'swipe' | 'pinch' | 'voice' | 'keyboard_nav';

export interface UserProfile {
    id: string;
    type: UserType;
    name: string;
    characteristics: {
        typingSpeed: number;      // WPM
        reactionTime: number;     // ms
        errorRate: number;        // 0-1
        patience: number;         // 0-1
        techSavvy: number;        // 0-1
    };
    accessibility?: {
        screenReader: boolean;
        reducedMotion: boolean;
        highContrast: boolean;
        largeText: boolean;
        keyboardOnly: boolean;
    };
    device: 'desktop' | 'mobile' | 'tablet';
    locale: string;
}

export interface UserAction {
    id: string;
    userId: string;
    type: InteractionType;
    target: string;
    value?: string;
    timestamp: number;
    duration: number;
    success: boolean;
    error?: string;
}

export interface UserSession {
    id: string;
    userId: string;
    startTime: number;
    endTime?: number;
    actions: UserAction[];
    pageViews: string[];
    errors: string[];
    satisfaction: number; // 0-10
}

export interface SimulationConfig {
    userCount: number;
    duration: number;
    userTypes: UserType[];
    scenario?: 'normal' | 'peak_load' | 'stress_test' | 'accessibility_audit';
}

// ============================================================================
// USER PROFILES
// ============================================================================

const USER_PROFILES: Record<UserType, Omit<UserProfile, 'id' | 'name'>> = {
    normal: {
        type: 'normal',
        characteristics: {
            typingSpeed: 40,
            reactionTime: 500,
            errorRate: 0.05,
            patience: 0.7,
            techSavvy: 0.5
        },
        device: 'desktop',
        locale: 'en-US'
    },
    power: {
        type: 'power',
        characteristics: {
            typingSpeed: 80,
            reactionTime: 200,
            errorRate: 0.02,
            patience: 0.4,
            techSavvy: 0.95
        },
        device: 'desktop',
        locale: 'en-US'
    },
    beginner: {
        type: 'beginner',
        characteristics: {
            typingSpeed: 20,
            reactionTime: 1000,
            errorRate: 0.15,
            patience: 0.9,
            techSavvy: 0.2
        },
        device: 'desktop',
        locale: 'en-US'
    },
    accessibility: {
        type: 'accessibility',
        characteristics: {
            typingSpeed: 30,
            reactionTime: 800,
            errorRate: 0.08,
            patience: 0.8,
            techSavvy: 0.4
        },
        accessibility: {
            screenReader: true,
            reducedMotion: true,
            highContrast: true,
            largeText: true,
            keyboardOnly: true
        },
        device: 'desktop',
        locale: 'en-US'
    },
    mobile: {
        type: 'mobile',
        characteristics: {
            typingSpeed: 25,
            reactionTime: 400,
            errorRate: 0.1,
            patience: 0.5,
            techSavvy: 0.6
        },
        device: 'mobile',
        locale: 'en-US'
    },
    bot: {
        type: 'bot',
        characteristics: {
            typingSpeed: 1000,
            reactionTime: 10,
            errorRate: 0,
            patience: 0,
            techSavvy: 1
        },
        device: 'desktop',
        locale: 'en-US'
    },
    malicious: {
        type: 'malicious',
        characteristics: {
            typingSpeed: 100,
            reactionTime: 100,
            errorRate: 0,
            patience: 0.1,
            techSavvy: 0.99
        },
        device: 'desktop',
        locale: 'en-US'
    }
};

// ============================================================================
// USER SIMULATOR
// ============================================================================

export class UserSimulator extends EventEmitter {
    private static instance: UserSimulator;
    private users: Map<string, UserProfile> = new Map();
    private sessions: Map<string, UserSession> = new Map();
    private activeSimulation: boolean = false;
    private actionQueue: UserAction[] = [];

    private constructor() {
        super();
        console.log('👥 User Simulator initialized');
    }

    static getInstance(): UserSimulator {
        if (!UserSimulator.instance) {
            UserSimulator.instance = new UserSimulator();
        }
        return UserSimulator.instance;
    }

    // ========================================================================
    // USER MANAGEMENT
    // ========================================================================

    createUser(type: UserType, name?: string): UserProfile {
        const template = USER_PROFILES[type];
        const user: UserProfile = {
            ...template,
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: name || `${type}_user_${this.users.size + 1}`
        };

        this.users.set(user.id, user);
        this.emit('user-created', user);
        return user;
    }

    createUsers(count: number, types?: UserType[]): UserProfile[] {
        const availableTypes = types || Object.keys(USER_PROFILES) as UserType[];
        const users: UserProfile[] = [];

        for (let i = 0; i < count; i++) {
            const type = availableTypes[i % availableTypes.length];
            users.push(this.createUser(type));
        }

        return users;
    }

    getUser(userId: string): UserProfile | undefined {
        return this.users.get(userId);
    }

    listUsers(): UserProfile[] {
        return Array.from(this.users.values());
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    startSession(userId: string): UserSession {
        const session: UserSession = {
            id: `session_${Date.now()}`,
            userId,
            startTime: Date.now(),
            actions: [],
            pageViews: [],
            errors: [],
            satisfaction: 7 // Default satisfaction
        };

        this.sessions.set(session.id, session);
        this.emit('session-started', session);
        return session;
    }

    endSession(sessionId: string): UserSession | undefined {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.endTime = Date.now();
            this.emit('session-ended', session);
        }
        return session;
    }

    // ========================================================================
    // ACTION SIMULATION
    // ========================================================================

    simulateAction(userId: string, type: InteractionType, target: string, value?: string): UserAction {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');

        const characteristics = user.characteristics;

        // Calculate action duration based on user characteristics
        let duration = characteristics.reactionTime;
        if (type === 'type' && value) {
            const charsPerMinute = characteristics.typingSpeed * 5;
            duration = (value.length / charsPerMinute) * 60000;
        }

        // Determine if action succeeds based on error rate
        const success = Math.random() > characteristics.errorRate;

        const action: UserAction = {
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            userId,
            type,
            target,
            value,
            timestamp: Date.now(),
            duration,
            success,
            error: success ? undefined : 'User error: misclick or typo'
        };

        this.actionQueue.push(action);
        this.emit('action-performed', action);

        // Update session
        const sessions = Array.from(this.sessions.values()).filter(s => s.userId === userId && !s.endTime);
        sessions.forEach(s => s.actions.push(action));

        return action;
    }

    simulateTyping(userId: string, target: string, text: string): UserAction[] {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');

        const actions: UserAction[] = [];
        const chars = text.split('');

        // Simulate character-by-character typing
        chars.forEach((char, index) => {
            // Simulate typo based on error rate
            const actualChar = Math.random() < user.characteristics.errorRate
                ? this.generateTypo(char)
                : char;

            actions.push(this.simulateAction(userId, 'type', target, actualChar));
        });

        return actions;
    }

    private generateTypo(char: string): string {
        const keyboard = {
            'a': 'sqwz', 'b': 'vghn', 'c': 'xdfv', 'd': 'serfcx',
            'e': 'wrsdf', 'f': 'drtgvc', 'g': 'ftyhbv', 'h': 'gyujnb',
            'i': 'ujklo', 'j': 'huiknm', 'k': 'jiolm', 'l': 'kop',
            'm': 'njk', 'n': 'bhjm', 'o': 'iklp', 'p': 'ol',
            'q': 'wa', 'r': 'edft', 's': 'awedxz', 't': 'rfgy',
            'u': 'yhji', 'v': 'cfgb', 'w': 'qase', 'x': 'zsdc',
            'y': 'tghu', 'z': 'asx'
        };
        const neighbors = keyboard[char.toLowerCase() as keyof typeof keyboard] || char;
        return neighbors[Math.floor(Math.random() * neighbors.length)] || char;
    }

    // ========================================================================
    // BEHAVIOR SIMULATION
    // ========================================================================

    async simulateUserJourney(userId: string, pages: string[], actions: { type: InteractionType; target: string; value?: string }[]): Promise<UserSession> {
        const session = this.startSession(userId);
        const user = this.users.get(userId)!;

        for (const page of pages) {
            session.pageViews.push(page);
            this.emit('page-view', { userId, page });

            // Wait based on user's reading speed
            await this.delay(user.characteristics.reactionTime * 3);
        }

        for (const action of actions) {
            this.simulateAction(userId, action.type, action.target, action.value);
            await this.delay(user.characteristics.reactionTime);
        }

        this.endSession(session.id);
        return session;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================================================
    // LOAD SIMULATION
    // ========================================================================

    async runSimulation(config: SimulationConfig): Promise<{
        users: UserProfile[];
        sessions: UserSession[];
        metrics: {
            totalActions: number;
            errorRate: number;
            avgSessionDuration: number;
            avgSatisfaction: number;
        };
    }> {
        this.activeSimulation = true;
        this.emit('simulation-started', config);

        // Create users
        const users = this.createUsers(config.userCount, config.userTypes);

        // Start sessions
        const sessions: UserSession[] = [];
        for (const user of users) {
            const session = this.startSession(user.id);
            sessions.push(session);

            // Simulate actions
            for (let i = 0; i < 10; i++) {
                if (!this.activeSimulation) break;

                const actionTypes: InteractionType[] = ['click', 'scroll', 'type', 'hover'];
                const type = actionTypes[Math.floor(Math.random() * actionTypes.length)];
                const target = `element_${Math.floor(Math.random() * 100)}`;

                this.simulateAction(user.id, type, target, type === 'type' ? 'test input' : undefined);
                await this.delay(100);
            }

            this.endSession(session.id);
        }

        // Calculate metrics
        const allActions = this.actionQueue;
        const errors = allActions.filter(a => !a.success).length;
        const durations = sessions.map(s => (s.endTime || Date.now()) - s.startTime);
        const satisfactions = sessions.map(s => s.satisfaction);

        this.activeSimulation = false;
        this.emit('simulation-completed');

        return {
            users,
            sessions,
            metrics: {
                totalActions: allActions.length,
                errorRate: errors / allActions.length,
                avgSessionDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
                avgSatisfaction: satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length
            }
        };
    }

    stopSimulation(): void {
        this.activeSimulation = false;
        this.emit('simulation-stopped');
    }

    // ========================================================================
    // METRICS
    // ========================================================================

    getActionHistory(): UserAction[] {
        return [...this.actionQueue];
    }

    getSessions(): UserSession[] {
        return Array.from(this.sessions.values());
    }

    getMetrics(): {
        userCount: number;
        sessionCount: number;
        actionCount: number;
        avgSatisfaction: number;
    } {
        const sessions = Array.from(this.sessions.values());
        const satisfactions = sessions.map(s => s.satisfaction);

        return {
            userCount: this.users.size,
            sessionCount: this.sessions.size,
            actionCount: this.actionQueue.length,
            avgSatisfaction: satisfactions.length > 0
                ? satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length
                : 0
        };
    }

    reset(): void {
        this.users.clear();
        this.sessions.clear();
        this.actionQueue = [];
        this.activeSimulation = false;
        this.emit('reset');
    }
}

export const userSimulator = UserSimulator.getInstance();
