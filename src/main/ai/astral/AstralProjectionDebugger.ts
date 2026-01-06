/**
 * Astral Projection Debugger
 * 
 * Allows developers to "leave their body" and observe code execution
 * from an outside perspective, seeing the bigger picture.
 */

import { EventEmitter } from 'events';

export interface AstralSession {
    id: string;
    code: string;
    perspective: Perspective;
    observations: Observation[];
    insights: AstralInsight[];
    journeyPath: JourneyStep[];
    createdAt: Date;
}

export interface Perspective {
    level: 'earthly' | 'elevated' | 'celestial' | 'cosmic';
    zoom: number;
    focus: string;
    clarity: number;
}

export interface Observation {
    id: string;
    timestamp: Date;
    type: 'flow' | 'bottleneck' | 'connection' | 'anomaly';
    description: string;
    location: { start: number; end: number };
    significance: number;
}

export interface AstralInsight {
    category: 'architecture' | 'flow' | 'purpose' | 'improvement';
    revelation: string;
    confidence: number;
    actionable: boolean;
}

export interface JourneyStep {
    position: number;
    perspective: string;
    discovery: string;
}

export class AstralProjectionDebugger extends EventEmitter {
    private static instance: AstralProjectionDebugger;
    private sessions: Map<string, AstralSession> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): AstralProjectionDebugger {
        if (!AstralProjectionDebugger.instance) {
            AstralProjectionDebugger.instance = new AstralProjectionDebugger();
        }
        return AstralProjectionDebugger.instance;
    }

    beginJourney(code: string): AstralSession {
        const session: AstralSession = {
            id: `astral_${Date.now()}`,
            code,
            perspective: { level: 'earthly', zoom: 1, focus: 'entry', clarity: 0.5 },
            observations: [],
            insights: [],
            journeyPath: [],
            createdAt: new Date(),
        };

        this.ascend(session);
        this.observe(session);
        this.synthesize(session);

        this.sessions.set(session.id, session);
        this.emit('journey:completed', session);
        return session;
    }

    private ascend(session: AstralSession): void {
        const levels: Perspective['level'][] = ['earthly', 'elevated', 'celestial', 'cosmic'];

        for (const level of levels) {
            session.perspective.level = level;
            session.perspective.clarity = levels.indexOf(level) / 3;

            session.journeyPath.push({
                position: levels.indexOf(level),
                perspective: level,
                discovery: this.discoverAtLevel(session.code, level),
            });
        }
    }

    private discoverAtLevel(code: string, level: Perspective['level']): string {
        switch (level) {
            case 'earthly':
                return `Detected ${code.split('\n').length} lines of implementation`;
            case 'elevated':
                return `Found ${(code.match(/function|class/g) || []).length} major components`;
            case 'celestial':
                return `Architecture pattern: ${code.includes('class') ? 'OOP' : 'Functional'}`;
            case 'cosmic':
                return `Primary purpose: ${this.inferPurpose(code)}`;
        }
    }

    private inferPurpose(code: string): string {
        if (code.includes('render') || code.includes('Component')) return 'UI rendering';
        if (code.includes('fetch') || code.includes('api')) return 'Data communication';
        if (code.includes('test') || code.includes('describe')) return 'Quality assurance';
        if (code.includes('route') || code.includes('handler')) return 'Request handling';
        return 'Core business logic';
    }

    private observe(session: AstralSession): void {
        const code = session.code;
        const lines = code.split('\n');

        // Observe flows
        const asyncCount = (code.match(/async|await/g) || []).length;
        if (asyncCount > 0) {
            session.observations.push({
                id: `obs_flow_${Date.now()}`,
                timestamp: new Date(),
                type: 'flow',
                description: `Asynchronous flow with ${asyncCount} async operations`,
                location: { start: 0, end: code.length },
                significance: 0.7,
            });
        }

        // Observe bottlenecks
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 120) {
                session.observations.push({
                    id: `obs_bottleneck_${i}`,
                    timestamp: new Date(),
                    type: 'bottleneck',
                    description: `Complex line at ${i + 1} may slow comprehension`,
                    location: { start: i, end: i },
                    significance: 0.5,
                });
                break;
            }
        }

        // Observe connections
        const imports = (code.match(/import|require/g) || []).length;
        if (imports > 5) {
            session.observations.push({
                id: `obs_conn_${Date.now()}`,
                timestamp: new Date(),
                type: 'connection',
                description: `High connectivity: ${imports} external dependencies`,
                location: { start: 0, end: 20 },
                significance: 0.6,
            });
        }
    }

    private synthesize(session: AstralSession): void {
        // Generate insights from observations
        if (session.observations.some(o => o.type === 'bottleneck')) {
            session.insights.push({
                category: 'improvement',
                revelation: 'Code contains complexity hotspots that could benefit from refactoring',
                confidence: 0.8,
                actionable: true,
            });
        }

        if (session.observations.some(o => o.type === 'flow')) {
            session.insights.push({
                category: 'flow',
                revelation: 'Asynchronous patterns suggest event-driven architecture',
                confidence: 0.7,
                actionable: false,
            });
        }

        // Architecture insight
        session.insights.push({
            category: 'architecture',
            revelation: `This code serves as ${this.inferPurpose(session.code)}`,
            confidence: 0.75,
            actionable: false,
        });
    }

    getSession(id: string): AstralSession | undefined {
        return this.sessions.get(id);
    }

    getStats(): { total: number; avgClarity: number; insightCount: number } {
        const sessions = Array.from(this.sessions.values());
        return {
            total: sessions.length,
            avgClarity: sessions.length > 0
                ? sessions.reduce((s, sess) => s + sess.perspective.clarity, 0) / sessions.length
                : 0,
            insightCount: sessions.reduce((s, sess) => s + sess.insights.length, 0),
        };
    }
}

export const astralProjectionDebugger = AstralProjectionDebugger.getInstance();
