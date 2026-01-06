/**
 * Temporal Code Archaeology
 * 
 * Unearths the history and evolution of code, revealing patterns
 * of change, fossilized decisions, and ancient wisdom.
 */

import { EventEmitter } from 'events';

export interface ArchaeologicalDig {
    id: string;
    code: string;
    artifacts: Artifact[];
    layers: StratigraphicLayer[];
    fossilizedDecisions: FossilizedDecision[];
    ancientWisdom: string[];
    age: CodeAge;
    createdAt: Date;
}

export interface Artifact {
    id: string;
    type: 'pattern' | 'style' | 'comment' | 'structure';
    description: string;
    era: string;
    significance: number;
}

export interface StratigraphicLayer {
    depth: number;
    name: string;
    characteristics: string[];
    period: string;
}

export interface FossilizedDecision {
    decision: string;
    reasoning?: string;
    stillRelevant: boolean;
    modernAlternative?: string;
}

export interface CodeAge {
    era: 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'modern' | 'contemporary';
    years: number;
    characteristics: string[];
}

export class TemporalCodeArchaeology extends EventEmitter {
    private static instance: TemporalCodeArchaeology;
    private digs: Map<string, ArchaeologicalDig> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TemporalCodeArchaeology {
        if (!TemporalCodeArchaeology.instance) {
            TemporalCodeArchaeology.instance = new TemporalCodeArchaeology();
        }
        return TemporalCodeArchaeology.instance;
    }

    excavate(code: string): ArchaeologicalDig {
        const artifacts = this.findArtifacts(code);
        const layers = this.analyzeStratigraphy(code);
        const fossilizedDecisions = this.findFossilizedDecisions(code);
        const ancientWisdom = this.extractAncientWisdom(code);
        const age = this.dateCode(code);

        const dig: ArchaeologicalDig = {
            id: `dig_${Date.now()}`,
            code,
            artifacts,
            layers,
            fossilizedDecisions,
            ancientWisdom,
            age,
            createdAt: new Date(),
        };

        this.digs.set(dig.id, dig);
        this.emit('excavation:complete', dig);
        return dig;
    }

    private findArtifacts(code: string): Artifact[] {
        const artifacts: Artifact[] = [];

        // Pattern artifacts
        if (code.includes('singleton') || code.includes('getInstance')) {
            artifacts.push({
                id: `artifact_singleton`,
                type: 'pattern',
                description: 'Singleton pattern - a classical design artifact',
                era: 'classical',
                significance: 0.8,
            });
        }

        if (code.includes('factory') || code.includes('create')) {
            artifacts.push({
                id: `artifact_factory`,
                type: 'pattern',
                description: 'Factory pattern - building objects',
                era: 'classical',
                significance: 0.7,
            });
        }

        // Style artifacts
        if (code.includes('var ')) {
            artifacts.push({
                id: `artifact_var`,
                type: 'style',
                description: 'var keyword - ancient JavaScript relic',
                era: 'ancient',
                significance: 0.9,
            });
        }

        if (code.includes('callback')) {
            artifacts.push({
                id: `artifact_callback`,
                type: 'style',
                description: 'Callback pattern - pre-Promise era',
                era: 'medieval',
                significance: 0.6,
            });
        }

        // Comment artifacts
        const commentMatches = code.match(/\/\/.*\d{4}/g) || [];
        for (const match of commentMatches.slice(0, 3)) {
            artifacts.push({
                id: `artifact_dated_comment_${Math.random().toString(36).substr(2, 5)}`,
                type: 'comment',
                description: `Dated comment: ${match}`,
                era: 'varies',
                significance: 0.4,
            });
        }

        return artifacts;
    }

    private analyzeStratigraphy(code: string): StratigraphicLayer[] {
        const layers: StratigraphicLayer[] = [];

        // Surface layer - most recent patterns
        layers.push({
            depth: 0,
            name: 'Surface Layer',
            characteristics: this.findModernCharacteristics(code),
            period: 'Contemporary',
        });

        // Middle layer - established patterns
        layers.push({
            depth: 1,
            name: 'Established Layer',
            characteristics: this.findEstablishedCharacteristics(code),
            period: 'Renaissance',
        });

        // Deep layer - ancient patterns
        layers.push({
            depth: 2,
            name: 'Foundation Layer',
            characteristics: this.findAncientCharacteristics(code),
            period: 'Ancient',
        });

        return layers;
    }

    private findModernCharacteristics(code: string): string[] {
        const chars: string[] = [];
        if (code.includes('async')) chars.push('Async/await syntax');
        if (code.includes('=>')) chars.push('Arrow functions');
        if (code.includes('const')) chars.push('Block-scoped constants');
        if (code.includes('interface')) chars.push('TypeScript types');
        return chars;
    }

    private findEstablishedCharacteristics(code: string): string[] {
        const chars: string[] = [];
        if (code.includes('class')) chars.push('ES6 classes');
        if (code.includes('Promise')) chars.push('Promise-based async');
        if (code.includes('export')) chars.push('ES modules');
        return chars;
    }

    private findAncientCharacteristics(code: string): string[] {
        const chars: string[] = [];
        if (code.includes('var')) chars.push('var declarations');
        if (code.includes('prototype')) chars.push('Prototypal inheritance');
        if (code.includes('require(')) chars.push('CommonJS modules');
        return chars;
    }

    private findFossilizedDecisions(code: string): FossilizedDecision[] {
        const decisions: FossilizedDecision[] = [];

        if (code.includes('TODO')) {
            decisions.push({
                decision: 'Deferred implementation',
                reasoning: 'Time constraints or uncertainty',
                stillRelevant: true,
                modernAlternative: 'Create issue tracker ticket',
            });
        }

        if (code.includes('HACK') || code.includes('FIXME')) {
            decisions.push({
                decision: 'Temporary workaround',
                reasoning: 'Quick fix needed',
                stillRelevant: true,
                modernAlternative: 'Proper refactoring',
            });
        }

        if (code.includes('deprecated')) {
            decisions.push({
                decision: 'Deprecation marker',
                reasoning: 'API evolution',
                stillRelevant: false,
                modernAlternative: 'Remove deprecated code',
            });
        }

        return decisions;
    }

    private extractAncientWisdom(code: string): string[] {
        const wisdom: string[] = [];

        // Extract wisdom from comments
        const wisdomPatterns = [
            /\/\/\s*(?:NOTE|IMPORTANT|NB):\s*(.+)/gi,
            /\/\/\s*(?:LESSON|TIP|WISDOM):\s*(.+)/gi,
        ];

        for (const pattern of wisdomPatterns) {
            const matches = code.matchAll(pattern);
            for (const match of matches) {
                wisdom.push(match[1]);
            }
        }

        // Default wisdom based on patterns
        if (code.includes('try') && code.includes('catch')) {
            wisdom.push('Error handling was valued by ancient developers');
        }
        if (code.includes('interface')) {
            wisdom.push('Contracts through types bring stability');
        }

        return wisdom.slice(0, 5);
    }

    private dateCode(code: string): CodeAge {
        const modernMarkers = ['async', '=>', 'const', 'interface', '?.'];
        const classicalMarkers = ['class', 'Promise', 'export'];
        const ancientMarkers = ['var ', 'prototype', 'require('];

        let modernScore = 0;
        let ancientScore = 0;

        for (const marker of modernMarkers) {
            if (code.includes(marker)) modernScore++;
        }
        for (const marker of ancientMarkers) {
            if (code.includes(marker)) ancientScore++;
        }

        let era: CodeAge['era'];
        let years: number;
        let characteristics: string[] = [];

        if (modernScore > 3) {
            era = 'contemporary';
            years = 1;
            characteristics = ['Modern syntax', 'Type-safe', 'Async-first'];
        } else if (modernScore > 1) {
            era = 'modern';
            years = 3;
            characteristics = ['ES6+', 'Classes', 'Modules'];
        } else if (ancientScore > 2) {
            era = 'ancient';
            years = 10;
            characteristics = ['Legacy patterns', 'Callback-based', 'Prototypal'];
        } else {
            era = 'classical';
            years = 5;
            characteristics = ['Established patterns', 'Well-tested'];
        }

        return { era, years, characteristics };
    }

    getDig(id: string): ArchaeologicalDig | undefined {
        return this.digs.get(id);
    }

    getStats(): { total: number; avgArtifacts: number; eraCounts: Record<string, number> } {
        const digs = Array.from(this.digs.values());
        const eraCounts: Record<string, number> = {};

        for (const dig of digs) {
            eraCounts[dig.age.era] = (eraCounts[dig.age.era] || 0) + 1;
        }

        return {
            total: digs.length,
            avgArtifacts: digs.length > 0
                ? digs.reduce((s, d) => s + d.artifacts.length, 0) / digs.length
                : 0,
            eraCounts,
        };
    }
}

export const temporalCodeArchaeology = TemporalCodeArchaeology.getInstance();
