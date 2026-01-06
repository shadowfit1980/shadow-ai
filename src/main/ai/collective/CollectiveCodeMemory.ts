/**
 * Collective Code Memory
 * 
 * A shared memory system that learns from all code interactions,
 * building a collective intelligence across projects and teams.
 */

import { EventEmitter } from 'events';

export interface CollectiveMemory {
    patterns: MemoryPattern[];
    experiences: Experience[];
    wisdom: CollectiveWisdom[];
    connections: MemoryConnection[];
    lastSync: Date;
}

export interface MemoryPattern {
    id: string;
    pattern: string;
    frequency: number;
    successRate: number;
    contexts: string[];
    lastSeen: Date;
}

export interface Experience {
    id: string;
    type: 'success' | 'failure' | 'learning';
    description: string;
    code: string;
    outcome: string;
    lessons: string[];
    timestamp: Date;
}

export interface CollectiveWisdom {
    id: string;
    insight: string;
    confidence: number;
    sources: string[];
    applicability: string[];
}

export interface MemoryConnection {
    pattern1: string;
    pattern2: string;
    strength: number;
    cooccurrence: number;
}

export class CollectiveCodeMemory extends EventEmitter {
    private static instance: CollectiveCodeMemory;
    private memory: CollectiveMemory;

    private constructor() {
        super();
        this.memory = {
            patterns: [],
            experiences: [],
            wisdom: [],
            connections: [],
            lastSync: new Date(),
        };
        this.initializeBaseWisdom();
    }

    static getInstance(): CollectiveCodeMemory {
        if (!CollectiveCodeMemory.instance) {
            CollectiveCodeMemory.instance = new CollectiveCodeMemory();
        }
        return CollectiveCodeMemory.instance;
    }

    private initializeBaseWisdom(): void {
        this.memory.wisdom = [
            {
                id: 'wisdom_dry',
                insight: "Don't Repeat Yourself - Extract common patterns",
                confidence: 0.95,
                sources: ['Collective experience'],
                applicability: ['All code'],
            },
            {
                id: 'wisdom_solid',
                insight: 'SOLID principles lead to maintainable code',
                confidence: 0.9,
                sources: ['Industry best practices'],
                applicability: ['Object-oriented code'],
            },
            {
                id: 'wisdom_simple',
                insight: 'Simple code is often better than clever code',
                confidence: 0.85,
                sources: ['Team experiences'],
                applicability: ['All code'],
            },
        ];
    }

    recordExperience(type: Experience['type'], description: string, code: string, outcome: string): Experience {
        const experience: Experience = {
            id: `exp_${Date.now()}`,
            type,
            description,
            code,
            outcome,
            lessons: this.extractLessons(type, outcome),
            timestamp: new Date(),
        };

        this.memory.experiences.push(experience);
        this.learnFromExperience(experience);
        this.emit('experience:recorded', experience);
        return experience;
    }

    private extractLessons(type: Experience['type'], outcome: string): string[] {
        const lessons: string[] = [];

        if (type === 'failure') {
            lessons.push('Avoid similar patterns in future');
            lessons.push('Consider additional testing');
        } else if (type === 'success') {
            lessons.push('Pattern proven effective');
            lessons.push('Document for team reference');
        } else {
            lessons.push('New approach discovered');
        }

        return lessons;
    }

    private learnFromExperience(experience: Experience): void {
        // Extract patterns from code
        const patterns = this.extractPatterns(experience.code);

        for (const pattern of patterns) {
            const existing = this.memory.patterns.find(p => p.pattern === pattern);
            if (existing) {
                existing.frequency++;
                existing.successRate = experience.type === 'success'
                    ? (existing.successRate + 1) / 2
                    : existing.successRate * 0.9;
                existing.lastSeen = new Date();
            } else {
                this.memory.patterns.push({
                    id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    pattern,
                    frequency: 1,
                    successRate: experience.type === 'success' ? 1 : 0.5,
                    contexts: [experience.type],
                    lastSeen: new Date(),
                });
            }
        }
    }

    private extractPatterns(code: string): string[] {
        const patterns: string[] = [];

        if (code.includes('try') && code.includes('catch')) patterns.push('error-handling');
        if (code.includes('async') && code.includes('await')) patterns.push('async-await');
        if (code.includes('class') && code.includes('extends')) patterns.push('inheritance');
        if (code.includes('map') || code.includes('filter')) patterns.push('functional-array');
        if (code.includes('interface')) patterns.push('type-interface');
        if (code.includes('singleton') || code.includes('getInstance')) patterns.push('singleton');

        return patterns;
    }

    query(context: string): { patterns: MemoryPattern[]; wisdom: CollectiveWisdom[] } {
        const relevantPatterns = this.memory.patterns
            .filter(p => p.contexts.some(c => c.includes(context)) || context.includes(p.pattern))
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5);

        const relevantWisdom = this.memory.wisdom
            .filter(w => w.applicability.some(a => a.toLowerCase().includes(context.toLowerCase())))
            .sort((a, b) => b.confidence - a.confidence);

        return { patterns: relevantPatterns, wisdom: relevantWisdom };
    }

    addWisdom(insight: string, confidence: number, applicability: string[]): CollectiveWisdom {
        const wisdom: CollectiveWisdom = {
            id: `wisdom_${Date.now()}`,
            insight,
            confidence,
            sources: ['User contribution'],
            applicability,
        };

        this.memory.wisdom.push(wisdom);
        this.emit('wisdom:added', wisdom);
        return wisdom;
    }

    findConnections(patternId: string): MemoryConnection[] {
        return this.memory.connections.filter(
            c => c.pattern1 === patternId || c.pattern2 === patternId
        );
    }

    getMemoryStats(): {
        totalPatterns: number;
        totalExperiences: number;
        wisdomCount: number;
        avgSuccessRate: number;
        topPatterns: MemoryPattern[];
    } {
        const patterns = this.memory.patterns;
        return {
            totalPatterns: patterns.length,
            totalExperiences: this.memory.experiences.length,
            wisdomCount: this.memory.wisdom.length,
            avgSuccessRate: patterns.length > 0
                ? patterns.reduce((s, p) => s + p.successRate, 0) / patterns.length
                : 0,
            topPatterns: patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
        };
    }
}

export const collectiveCodeMemory = CollectiveCodeMemory.getInstance();
