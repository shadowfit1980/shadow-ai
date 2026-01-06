/**
 * Harmonic Code Resonator
 * 
 * Finds the natural "resonance frequency" of code - the patterns
 * and rhythms that make code flow naturally and feel cohesive.
 */

import { EventEmitter } from 'events';

export interface ResonanceAnalysis {
    id: string;
    code: string;
    frequency: ResonanceFrequency;
    harmonics: Harmonic[];
    dissonances: Dissonance[];
    rhythm: CodeRhythm;
    tuning: TuningRecommendation[];
    createdAt: Date;
}

export interface ResonanceFrequency {
    primary: number;
    harmonyLevel: number;
    stability: number;
    naturalness: number;
}

export interface Harmonic {
    id: string;
    pattern: string;
    frequency: number;
    amplitude: number;
    description: string;
}

export interface Dissonance {
    id: string;
    location: number;
    type: 'style' | 'pattern' | 'naming' | 'structure';
    description: string;
    resolution: string;
}

export interface CodeRhythm {
    pattern: string;
    tempo: number;
    consistency: number;
    variations: string[];
}

export interface TuningRecommendation {
    area: string;
    currentFrequency: number;
    targetFrequency: number;
    adjustment: string;
}

export class HarmonicCodeResonator extends EventEmitter {
    private static instance: HarmonicCodeResonator;
    private analyses: Map<string, ResonanceAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): HarmonicCodeResonator {
        if (!HarmonicCodeResonator.instance) {
            HarmonicCodeResonator.instance = new HarmonicCodeResonator();
        }
        return HarmonicCodeResonator.instance;
    }

    analyze(code: string): ResonanceAnalysis {
        const frequency = this.calculateFrequency(code);
        const harmonics = this.findHarmonics(code);
        const dissonances = this.detectDissonances(code);
        const rhythm = this.analyzeRhythm(code);
        const tuning = this.suggestTuning(frequency, dissonances);

        const analysis: ResonanceAnalysis = {
            id: `resonance_${Date.now()}`,
            code,
            frequency,
            harmonics,
            dissonances,
            rhythm,
            tuning,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:created', analysis);
        return analysis;
    }

    private calculateFrequency(code: string): ResonanceFrequency {
        const lines = code.split('\n');
        const avgLineLength = code.length / lines.length;

        // Calculate primary frequency based on code characteristics
        const primary = Math.round(220 + (avgLineLength * 2)); // A3 base + adjustment

        // Harmony level based on consistency
        const lineLengths = lines.map(l => l.length);
        const variance = this.calculateVariance(lineLengths);
        const harmonyLevel = Math.max(0, 1 - variance / 100);

        // Stability based on structure
        const hasStructure = code.includes('class') || code.includes('function');
        const stability = hasStructure ? 0.8 : 0.5;

        // Naturalness based on readability
        const hasComments = code.includes('//');
        const hasTypes = code.includes(':');
        const naturalness = (hasComments ? 0.4 : 0) + (hasTypes ? 0.4 : 0) + 0.2;

        return { primary, harmonyLevel, stability, naturalness };
    }

    private calculateVariance(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((s, n) => s + n, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => (n - mean) ** 2);
        return squaredDiffs.reduce((s, n) => s + n, 0) / numbers.length;
    }

    private findHarmonics(code: string): Harmonic[] {
        const harmonics: Harmonic[] = [];

        // Function pattern harmonic
        const functionCount = (code.match(/function/g) || []).length;
        if (functionCount > 0) {
            harmonics.push({
                id: 'harmonic_function',
                pattern: 'Function declarations',
                frequency: 440 * (functionCount / 5),
                amplitude: Math.min(1, functionCount / 10),
                description: 'Functional structure resonance',
            });
        }

        // Class pattern harmonic
        const classCount = (code.match(/class/g) || []).length;
        if (classCount > 0) {
            harmonics.push({
                id: 'harmonic_class',
                pattern: 'Class declarations',
                frequency: 523 * (classCount / 3),
                amplitude: Math.min(1, classCount / 5),
                description: 'Object-oriented structure resonance',
            });
        }

        // Async pattern harmonic
        const asyncCount = (code.match(/async|await/g) || []).length;
        if (asyncCount > 0) {
            harmonics.push({
                id: 'harmonic_async',
                pattern: 'Async patterns',
                frequency: 659 * (asyncCount / 10),
                amplitude: Math.min(1, asyncCount / 20),
                description: 'Asynchronous flow resonance',
            });
        }

        return harmonics;
    }

    private detectDissonances(code: string): Dissonance[] {
        const dissonances: Dissonance[] = [];
        const lines = code.split('\n');

        // Style dissonance - mixed indentation
        const hasSpaces = lines.some(l => l.startsWith('  '));
        const hasTabs = lines.some(l => l.startsWith('\t'));
        if (hasSpaces && hasTabs) {
            dissonances.push({
                id: 'dissonance_indent',
                location: 0,
                type: 'style',
                description: 'Mixed indentation (spaces and tabs)',
                resolution: 'Standardize on one indentation style',
            });
        }

        // Naming dissonance - inconsistent case
        const hasCamel = /[a-z][A-Z]/.test(code);
        const hasSnake = /_[a-z]/.test(code);
        if (hasCamel && hasSnake) {
            dissonances.push({
                id: 'dissonance_naming',
                location: 0,
                type: 'naming',
                description: 'Mixed naming conventions (camelCase and snake_case)',
                resolution: 'Standardize naming convention',
            });
        }

        // Structure dissonance - very long lines
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 120) {
                dissonances.push({
                    id: `dissonance_line_${i}`,
                    location: i,
                    type: 'structure',
                    description: `Line ${i + 1} exceeds recommended length`,
                    resolution: 'Break into multiple lines',
                });
                break; // Only report first occurrence
            }
        }

        return dissonances;
    }

    private analyzeRhythm(code: string): CodeRhythm {
        const lines = code.split('\n');
        const patterns: string[] = [];

        // Detect rhythmic patterns
        for (const line of lines) {
            if (line.includes('if')) patterns.push('conditional');
            else if (line.includes('for') || line.includes('while')) patterns.push('loop');
            else if (line.includes('function') || line.includes('=>')) patterns.push('declaration');
            else if (line.includes('return')) patterns.push('return');
            else if (line.trim().length > 0) patterns.push('statement');
        }

        // Calculate tempo (based on code density)
        const tempo = Math.round(60 + (lines.length / 10));

        // Calculate consistency
        const patternSet = new Set(patterns);
        const consistency = 1 - (patternSet.size / Math.max(patterns.length, 1));

        return {
            pattern: patterns.slice(0, 10).join('-'),
            tempo,
            consistency,
            variations: Array.from(patternSet),
        };
    }

    private suggestTuning(frequency: ResonanceFrequency, dissonances: Dissonance[]): TuningRecommendation[] {
        const recommendations: TuningRecommendation[] = [];

        if (frequency.harmonyLevel < 0.7) {
            recommendations.push({
                area: 'Line Length Consistency',
                currentFrequency: frequency.harmonyLevel,
                targetFrequency: 0.8,
                adjustment: 'Normalize line lengths for better visual rhythm',
            });
        }

        if (frequency.naturalness < 0.6) {
            recommendations.push({
                area: 'Code Documentation',
                currentFrequency: frequency.naturalness,
                targetFrequency: 0.8,
                adjustment: 'Add comments and type annotations',
            });
        }

        for (const dissonance of dissonances.slice(0, 3)) {
            recommendations.push({
                area: dissonance.type,
                currentFrequency: 0.3,
                targetFrequency: 0.9,
                adjustment: dissonance.resolution,
            });
        }

        return recommendations;
    }

    getAnalysis(id: string): ResonanceAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): ResonanceAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getStats(): { total: number; avgHarmony: number; avgNaturalness: number } {
        const analyses = Array.from(this.analyses.values());
        return {
            total: analyses.length,
            avgHarmony: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.frequency.harmonyLevel, 0) / analyses.length
                : 0,
            avgNaturalness: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.frequency.naturalness, 0) / analyses.length
                : 0,
        };
    }
}

export const harmonicCodeResonator = HarmonicCodeResonator.getInstance();
