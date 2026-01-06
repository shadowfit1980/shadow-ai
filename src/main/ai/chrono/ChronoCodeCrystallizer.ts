/**
 * Chrono Code Crystallizer
 * 
 * Crystallizes code at specific points in time, preserving
 * perfect snapshots that can be retrieved and restored.
 */

import { EventEmitter } from 'events';

export interface ChronoCrystal {
    id: string;
    code: string;
    timestamp: Date;
    epoch: string;
    clarity: number;
    facets: CrystalFacet[];
    resonanceFrequency: number;
}

export interface CrystalFacet {
    name: string;
    type: 'structure' | 'logic' | 'data' | 'interface';
    content: string;
    purity: number;
}

export interface CrystallineTimeline {
    crystals: ChronoCrystal[];
    stability: number;
    continuity: number;
}

export class ChronoCodeCrystallizer extends EventEmitter {
    private static instance: ChronoCodeCrystallizer;
    private crystals: Map<string, ChronoCrystal> = new Map();
    private timeline: CrystallineTimeline = { crystals: [], stability: 1, continuity: 1 };

    private constructor() {
        super();
    }

    static getInstance(): ChronoCodeCrystallizer {
        if (!ChronoCodeCrystallizer.instance) {
            ChronoCodeCrystallizer.instance = new ChronoCodeCrystallizer();
        }
        return ChronoCodeCrystallizer.instance;
    }

    crystallize(code: string, epochName?: string): ChronoCrystal {
        const facets = this.extractFacets(code);
        const clarity = this.calculateClarity(facets);

        const crystal: ChronoCrystal = {
            id: `crystal_${Date.now()}`,
            code,
            timestamp: new Date(),
            epoch: epochName || this.determineEpoch(code),
            clarity,
            facets,
            resonanceFrequency: this.calculateResonance(code),
        };

        this.crystals.set(crystal.id, crystal);
        this.timeline.crystals.push(crystal);
        this.updateTimelineStability();

        this.emit('crystal:formed', crystal);
        return crystal;
    }

    private extractFacets(code: string): CrystalFacet[] {
        const facets: CrystalFacet[] = [];

        // Structure facet
        const classes = code.match(/class\s+\w+/g) || [];
        const functions = code.match(/function\s+\w+|const\s+\w+\s*=/g) || [];
        facets.push({
            name: 'Structure',
            type: 'structure',
            content: `${classes.length} classes, ${functions.length} functions`,
            purity: classes.length > 0 || functions.length > 0 ? 0.8 : 0.4,
        });

        // Logic facet
        const conditions = (code.match(/if|else|switch|case|for|while/g) || []).length;
        facets.push({
            name: 'Logic',
            type: 'logic',
            content: `${conditions} control structures`,
            purity: conditions > 0 && conditions < 20 ? 0.9 : 0.5,
        });

        // Data facet
        const types = (code.match(/interface|type\s+\w+/g) || []).length;
        facets.push({
            name: 'Data',
            type: 'data',
            content: `${types} type definitions`,
            purity: types > 0 ? 0.85 : 0.6,
        });

        // Interface facet
        const exports = (code.match(/export/g) || []).length;
        facets.push({
            name: 'Interface',
            type: 'interface',
            content: `${exports} exports`,
            purity: exports > 0 ? 0.8 : 0.5,
        });

        return facets;
    }

    private calculateClarity(facets: CrystalFacet[]): number {
        if (facets.length === 0) return 0;
        return facets.reduce((s, f) => s + f.purity, 0) / facets.length;
    }

    private determineEpoch(code: string): string {
        if (code.includes('async') && code.includes('await')) {
            return 'Modern Era';
        }
        if (code.includes('Promise')) {
            return 'Promise Age';
        }
        if (code.includes('class')) {
            return 'Class Period';
        }
        if (code.includes('var')) {
            return 'Ancient Times';
        }
        return 'Unknown Era';
    }

    private calculateResonance(code: string): number {
        // Resonance based on code harmony
        const lines = code.split('\n').length;
        const avgLineLength = code.length / lines;

        // Ideal line length is around 80 characters
        const lineLengthFactor = 1 - Math.abs(avgLineLength - 80) / 100;

        // Fibonacci line counts resonate well
        const fibNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
        const linesFactor = fibNumbers.includes(lines) ? 1.0 : 0.7;

        return Math.min(1, (lineLengthFactor + linesFactor) / 2 + 0.3);
    }

    private updateTimelineStability(): void {
        const count = this.timeline.crystals.length;
        this.timeline.stability = Math.max(0.5, 1 - count * 0.01);
        this.timeline.continuity = count > 1 ? 0.9 : 1.0;
    }

    restore(crystalId: string): string | undefined {
        const crystal = this.crystals.get(crystalId);
        if (!crystal) return undefined;

        this.emit('crystal:restored', crystal);
        return crystal.code;
    }

    compareCrystals(id1: string, id2: string): { similarity: number; differences: string[] } | undefined {
        const c1 = this.crystals.get(id1);
        const c2 = this.crystals.get(id2);
        if (!c1 || !c2) return undefined;

        const similarity = 1 - Math.abs(c1.clarity - c2.clarity);
        const differences: string[] = [];

        if (c1.epoch !== c2.epoch) {
            differences.push(`Epoch: ${c1.epoch} → ${c2.epoch}`);
        }
        if (c1.facets.length !== c2.facets.length) {
            differences.push(`Facet count: ${c1.facets.length} → ${c2.facets.length}`);
        }

        return { similarity, differences };
    }

    getCrystal(id: string): ChronoCrystal | undefined {
        return this.crystals.get(id);
    }

    getTimeline(): CrystallineTimeline {
        return this.timeline;
    }

    getStats(): { total: number; avgClarity: number; epochs: Record<string, number> } {
        const crystals = Array.from(this.crystals.values());
        const epochs: Record<string, number> = {};

        for (const c of crystals) {
            epochs[c.epoch] = (epochs[c.epoch] || 0) + 1;
        }

        return {
            total: crystals.length,
            avgClarity: crystals.length > 0
                ? crystals.reduce((s, c) => s + c.clarity, 0) / crystals.length
                : 0,
            epochs,
        };
    }
}

export const chronoCodeCrystallizer = ChronoCodeCrystallizer.getInstance();
