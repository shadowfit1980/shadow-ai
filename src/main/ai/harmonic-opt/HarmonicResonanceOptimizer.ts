/**
 * Harmonic Resonance Optimizer
 * 
 * Optimizes code by finding and enhancing harmonic resonances
 * between components, creating a symphonic codebase.
 */

import { EventEmitter } from 'events';

export interface HarmonicAnalysis {
    id: string;
    code: string;
    frequencies: CodeFrequency[];
    resonances: Resonance[];
    dissonances: Dissonance[];
    harmonicScore: number;
    optimizations: HarmonicOptimization[];
    createdAt: Date;
}

export interface CodeFrequency {
    component: string;
    frequency: number;
    amplitude: number;
    phase: number;
}

export interface Resonance {
    components: string[];
    strength: number;
    type: 'constructive' | 'neutral' | 'near-resonance';
}

export interface Dissonance {
    components: string[];
    clash: number;
    resolution: string;
}

export interface HarmonicOptimization {
    target: string;
    adjustment: string;
    expectedImprovement: number;
}

export class HarmonicResonanceOptimizer extends EventEmitter {
    private static instance: HarmonicResonanceOptimizer;
    private analyses: Map<string, HarmonicAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): HarmonicResonanceOptimizer {
        if (!HarmonicResonanceOptimizer.instance) {
            HarmonicResonanceOptimizer.instance = new HarmonicResonanceOptimizer();
        }
        return HarmonicResonanceOptimizer.instance;
    }

    analyze(code: string): HarmonicAnalysis {
        const frequencies = this.measureFrequencies(code);
        const resonances = this.findResonances(frequencies);
        const dissonances = this.findDissonances(frequencies);
        const harmonicScore = this.calculateHarmonicScore(resonances, dissonances);
        const optimizations = this.suggestOptimizations(frequencies, dissonances);

        const analysis: HarmonicAnalysis = {
            id: `harmonic_${Date.now()}`,
            code,
            frequencies,
            resonances,
            dissonances,
            harmonicScore,
            optimizations,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private measureFrequencies(code: string): CodeFrequency[] {
        const frequencies: CodeFrequency[] = [];

        // Classes have low, steady frequency
        const classMatches = code.matchAll(/class\s+(\w+)/g);
        for (const match of classMatches) {
            frequencies.push({
                component: match[1],
                frequency: 100,
                amplitude: 0.8,
                phase: 0,
            });
        }

        // Functions have medium frequency
        const funcMatches = code.matchAll(/(?:function|const)\s+(\w+)/g);
        for (const match of funcMatches) {
            frequencies.push({
                component: match[1],
                frequency: 440,
                amplitude: 0.6,
                phase: Math.PI / 4,
            });
        }

        // Imports have high frequency
        const importMatches = code.matchAll(/import.*from\s+['"]([\w./]+)['"]/g);
        for (const match of importMatches) {
            frequencies.push({
                component: match[1],
                frequency: 1000,
                amplitude: 0.4,
                phase: Math.PI / 2,
            });
        }

        return frequencies;
    }

    private findResonances(frequencies: CodeFrequency[]): Resonance[] {
        const resonances: Resonance[] = [];

        for (let i = 0; i < frequencies.length; i++) {
            for (let j = i + 1; j < frequencies.length; j++) {
                const f1 = frequencies[i];
                const f2 = frequencies[j];

                // Check for harmonic relationships (2:1, 3:2, etc.)
                const ratio = f1.frequency / f2.frequency;
                const harmonicRatios = [2, 1.5, 1.33, 1.25, 1.2];

                for (const hr of harmonicRatios) {
                    if (Math.abs(ratio - hr) < 0.1 || Math.abs(ratio - 1 / hr) < 0.1) {
                        resonances.push({
                            components: [f1.component, f2.component],
                            strength: 1 - Math.abs(ratio - hr),
                            type: 'constructive',
                        });
                        break;
                    }
                }
            }
        }

        return resonances;
    }

    private findDissonances(frequencies: CodeFrequency[]): Dissonance[] {
        const dissonances: Dissonance[] = [];

        // Check for frequency clashes
        for (let i = 0; i < frequencies.length; i++) {
            for (let j = i + 1; j < frequencies.length; j++) {
                const f1 = frequencies[i];
                const f2 = frequencies[j];

                // Close but not harmonically related frequencies clash
                const diff = Math.abs(f1.frequency - f2.frequency);
                if (diff > 0 && diff < 50) {
                    dissonances.push({
                        components: [f1.component, f2.component],
                        clash: 1 - diff / 50,
                        resolution: `Separate or merge ${f1.component} and ${f2.component}`,
                    });
                }
            }
        }

        return dissonances;
    }

    private calculateHarmonicScore(resonances: Resonance[], dissonances: Dissonance[]): number {
        const resonanceBonus = resonances.reduce((s, r) => s + r.strength * 0.1, 0);
        const dissonancePenalty = dissonances.reduce((s, d) => s + d.clash * 0.15, 0);
        return Math.max(0, Math.min(1, 0.5 + resonanceBonus - dissonancePenalty));
    }

    private suggestOptimizations(frequencies: CodeFrequency[], dissonances: Dissonance[]): HarmonicOptimization[] {
        const optimizations: HarmonicOptimization[] = [];

        // Suggest fixing dissonances
        for (const dis of dissonances.slice(0, 3)) {
            optimizations.push({
                target: dis.components.join(' & '),
                adjustment: dis.resolution,
                expectedImprovement: dis.clash * 0.2,
            });
        }

        // Suggest amplitude adjustments
        const lowAmplitude = frequencies.filter(f => f.amplitude < 0.5);
        for (const freq of lowAmplitude.slice(0, 2)) {
            optimizations.push({
                target: freq.component,
                adjustment: 'Increase visibility and documentation',
                expectedImprovement: 0.1,
            });
        }

        return optimizations;
    }

    getAnalysis(id: string): HarmonicAnalysis | undefined {
        return this.analyses.get(id);
    }

    getStats(): { total: number; avgScore: number; totalResonances: number } {
        const analyses = Array.from(this.analyses.values());
        const totalResonances = analyses.reduce((s, a) => s + a.resonances.length, 0);

        return {
            total: analyses.length,
            avgScore: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.harmonicScore, 0) / analyses.length
                : 0,
            totalResonances,
        };
    }
}

export const harmonicResonanceOptimizer = HarmonicResonanceOptimizer.getInstance();
