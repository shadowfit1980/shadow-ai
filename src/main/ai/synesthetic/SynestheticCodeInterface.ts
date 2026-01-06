/**
 * Synesthetic Code Interface
 * 
 * Translates code into multi-sensory representations:
 * colors, sounds, and patterns for enhanced debugging
 * and understanding.
 */

import { EventEmitter } from 'events';

export interface SynestheticRepresentation {
    id: string;
    code: string;
    visual: VisualMapping[];
    audio: AudioMapping[];
    haptic: HapticMapping[];
    emotions: EmotionalMapping;
    timestamp: Date;
}

export interface VisualMapping {
    line: number;
    color: string;
    intensity: number;
    pattern: PatternType;
    shape: ShapeType;
    animation?: AnimationType;
}

export type PatternType = 'solid' | 'gradient' | 'pulse' | 'wave' | 'spiral' | 'fractal';
export type ShapeType = 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'organic';
export type AnimationType = 'glow' | 'rotate' | 'bounce' | 'fade' | 'ripple' | 'pulse';

export interface AudioMapping {
    line: number;
    frequency: number;
    instrument: InstrumentType;
    volume: number;
    duration: number;
    note: MusicalNote;
}

export type InstrumentType = 'sine' | 'piano' | 'strings' | 'bells' | 'drum' | 'synth';
export type MusicalNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface HapticMapping {
    line: number;
    intensity: number;
    pattern: 'vibrate' | 'pulse' | 'wave' | 'tap';
    duration: number;
}

export interface EmotionalMapping {
    overall: EmotionType;
    distribution: Record<EmotionType, number>;
    hotspots: { line: number; emotion: EmotionType }[];
}

export type EmotionType =
    | 'calm'
    | 'energetic'
    | 'tense'
    | 'chaotic'
    | 'harmonious'
    | 'discordant';

export interface CodeElementTheme {
    element: CodeElement;
    color: string;
    note: MusicalNote;
    shape: ShapeType;
}

export type CodeElement =
    | 'function'
    | 'class'
    | 'variable'
    | 'string'
    | 'number'
    | 'operator'
    | 'keyword'
    | 'comment'
    | 'error';

export class SynestheticCodeInterface extends EventEmitter {
    private static instance: SynestheticCodeInterface;
    private representations: Map<string, SynestheticRepresentation> = new Map();
    private themes: Map<CodeElement, CodeElementTheme> = new Map();

    private constructor() {
        super();
        this.initializeThemes();
    }

    static getInstance(): SynestheticCodeInterface {
        if (!SynestheticCodeInterface.instance) {
            SynestheticCodeInterface.instance = new SynestheticCodeInterface();
        }
        return SynestheticCodeInterface.instance;
    }

    private initializeThemes(): void {
        const defaultThemes: CodeElementTheme[] = [
            { element: 'function', color: '#00ff88', note: 'G', shape: 'hexagon' },
            { element: 'class', color: '#ff0088', note: 'C', shape: 'square' },
            { element: 'variable', color: '#0088ff', note: 'E', shape: 'circle' },
            { element: 'string', color: '#ffaa00', note: 'A', shape: 'organic' },
            { element: 'number', color: '#00ffff', note: 'D', shape: 'triangle' },
            { element: 'operator', color: '#ff00ff', note: 'F', shape: 'star' },
            { element: 'keyword', color: '#ff5500', note: 'B', shape: 'hexagon' },
            { element: 'comment', color: '#666666', note: 'C', shape: 'circle' },
            { element: 'error', color: '#ff0000', note: 'B', shape: 'star' },
        ];

        for (const theme of defaultThemes) {
            this.themes.set(theme.element, theme);
        }
    }

    // ========================================================================
    // SYNESTHETIC GENERATION
    // ========================================================================

    async generateRepresentation(code: string): Promise<SynestheticRepresentation> {
        const visual = this.generateVisualMapping(code);
        const audio = this.generateAudioMapping(code);
        const haptic = this.generateHapticMapping(code);
        const emotions = this.analyzeEmotions(code);

        const representation: SynestheticRepresentation = {
            id: `syn_${Date.now()}`,
            code,
            visual,
            audio,
            haptic,
            emotions,
            timestamp: new Date(),
        };

        this.representations.set(representation.id, representation);
        this.emit('representation:created', representation);
        return representation;
    }

    private generateVisualMapping(code: string): VisualMapping[] {
        const mappings: VisualMapping[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const element = this.classifyLine(line);
            const theme = this.themes.get(element) || this.themes.get('variable')!;

            const complexity = this.calculateLineComplexity(line);

            mappings.push({
                line: i + 1,
                color: this.adjustColorByComplexity(theme.color, complexity),
                intensity: Math.min(1, 0.3 + complexity * 0.7),
                pattern: this.selectPattern(complexity),
                shape: theme.shape,
                animation: complexity > 0.7 ? 'pulse' : complexity > 0.5 ? 'glow' : undefined,
            });
        }

        return mappings;
    }

    private generateAudioMapping(code: string): AudioMapping[] {
        const mappings: AudioMapping[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const element = this.classifyLine(line);
            const theme = this.themes.get(element) || this.themes.get('variable')!;
            const complexity = this.calculateLineComplexity(line);

            mappings.push({
                line: i + 1,
                frequency: this.noteToFrequency(theme.note) + complexity * 100,
                instrument: this.selectInstrument(element),
                volume: 0.3 + complexity * 0.5,
                duration: 200 + line.length * 5,
                note: theme.note,
            });
        }

        return mappings;
    }

    private generateHapticMapping(code: string): HapticMapping[] {
        const mappings: HapticMapping[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const complexity = this.calculateLineComplexity(line);

            // Only generate haptic for significant lines
            if (complexity > 0.3) {
                mappings.push({
                    line: i + 1,
                    intensity: complexity,
                    pattern: complexity > 0.7 ? 'vibrate' : complexity > 0.5 ? 'pulse' : 'tap',
                    duration: 100 + complexity * 400,
                });
            }
        }

        return mappings;
    }

    private analyzeEmotions(code: string): EmotionalMapping {
        const distribution: Record<EmotionType, number> = {
            calm: 0,
            energetic: 0,
            tense: 0,
            chaotic: 0,
            harmonious: 0,
            discordant: 0,
        };

        const lines = code.split('\n');
        const hotspots: { line: number; emotion: EmotionType }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const emotion = this.classifyEmotion(line);
            distribution[emotion]++;

            if (this.isEmotionalHotspot(line)) {
                hotspots.push({ line: i + 1, emotion });
            }
        }

        // Normalize distribution
        const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
        for (const key in distribution) {
            distribution[key as EmotionType] /= total;
        }

        // Determine overall emotion
        const overall = (Object.entries(distribution) as [EmotionType, number][])
            .sort((a, b) => b[1] - a[1])[0][0];

        return { overall, distribution, hotspots };
    }

    // ========================================================================
    // CLASSIFICATION HELPERS
    // ========================================================================

    private classifyLine(line: string): CodeElement {
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return 'comment';
        if (/function\s+\w+|=>\s*{|=>\s*\w/.test(trimmed)) return 'function';
        if (/class\s+\w+/.test(trimmed)) return 'class';
        if (/['"`]/.test(trimmed)) return 'string';
        if (/\d+/.test(trimmed)) return 'number';
        if (/\b(if|else|for|while|return|const|let|var|import|export)\b/.test(trimmed)) return 'keyword';
        if (/[+\-*/%=<>!&|]/.test(trimmed)) return 'operator';
        if (/error|throw|catch/.test(trimmed.toLowerCase())) return 'error';

        return 'variable';
    }

    private calculateLineComplexity(line: string): number {
        let complexity = 0;

        // Nesting depth
        const leadingSpaces = line.search(/\S/);
        complexity += Math.min(leadingSpaces / 8, 0.3);

        // Operators and logic
        const operators = (line.match(/[+\-*/%=<>!&|]/g) || []).length;
        complexity += Math.min(operators * 0.05, 0.3);

        // Function calls
        const calls = (line.match(/\w+\(/g) || []).length;
        complexity += Math.min(calls * 0.1, 0.2);

        // Ternary and conditionals
        if (line.includes('?')) complexity += 0.15;
        if (line.includes('if') || line.includes('else')) complexity += 0.1;

        return Math.min(1, complexity);
    }

    private classifyEmotion(line: string): EmotionType {
        const trimmed = line.trim().toLowerCase();

        if (!trimmed || trimmed.startsWith('//')) return 'calm';
        if (trimmed.includes('error') || trimmed.includes('throw')) return 'tense';
        if (trimmed.includes('try') || trimmed.includes('catch')) return 'tense';
        if (/for.*for|while.*while/.test(trimmed)) return 'chaotic';
        if (/(&&|\|\|).*(\&&|\|\|)/.test(trimmed)) return 'discordant';
        if (trimmed.includes('async') || trimmed.includes('await')) return 'harmonious';
        if (trimmed.includes('function') || trimmed.includes('=>')) return 'energetic';
        if (trimmed.includes('return')) return 'harmonious';

        return 'calm';
    }

    private isEmotionalHotspot(line: string): boolean {
        const trimmed = line.trim().toLowerCase();
        return (
            trimmed.includes('error') ||
            trimmed.includes('throw') ||
            trimmed.includes('!') ||
            trimmed.includes('?') ||
            (line.match(/[A-Z]/g) || []).length > 5
        );
    }

    // ========================================================================
    // CONVERSION HELPERS
    // ========================================================================

    private adjustColorByComplexity(baseColor: string, complexity: number): string {
        // Parse hex color
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);

        // Adjust brightness based on complexity
        const factor = 0.5 + complexity * 0.5;
        const newR = Math.min(255, Math.round(r * factor));
        const newG = Math.min(255, Math.round(g * factor));
        const newB = Math.min(255, Math.round(b * factor));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    private selectPattern(complexity: number): PatternType {
        if (complexity > 0.8) return 'fractal';
        if (complexity > 0.6) return 'spiral';
        if (complexity > 0.4) return 'wave';
        if (complexity > 0.2) return 'pulse';
        if (complexity > 0.1) return 'gradient';
        return 'solid';
    }

    private selectInstrument(element: CodeElement): InstrumentType {
        const map: Record<CodeElement, InstrumentType> = {
            function: 'piano',
            class: 'strings',
            variable: 'bells',
            string: 'synth',
            number: 'bells',
            operator: 'drum',
            keyword: 'piano',
            comment: 'sine',
            error: 'drum',
        };
        return map[element] || 'sine';
    }

    private noteToFrequency(note: MusicalNote): number {
        const frequencies: Record<MusicalNote, number> = {
            C: 261.63,
            D: 293.66,
            E: 329.63,
            F: 349.23,
            G: 392.00,
            A: 440.00,
            B: 493.88,
        };
        return frequencies[note];
    }

    // ========================================================================
    // PLAYBACK
    // ========================================================================

    async playCodeAudio(representationId: string, startLine = 1, endLine?: number): Promise<void> {
        const rep = this.representations.get(representationId);
        if (!rep) return;

        const end = endLine || rep.audio.length;
        const toPlay = rep.audio.filter(a => a.line >= startLine && a.line <= end);

        for (const mapping of toPlay) {
            this.emit('audio:play', mapping);
            await new Promise(r => setTimeout(r, mapping.duration / 2));
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getRepresentation(id: string): SynestheticRepresentation | undefined {
        return this.representations.get(id);
    }

    getAllRepresentations(): SynestheticRepresentation[] {
        return Array.from(this.representations.values());
    }

    getTheme(element: CodeElement): CodeElementTheme | undefined {
        return this.themes.get(element);
    }

    setTheme(element: CodeElement, theme: Partial<CodeElementTheme>): void {
        const existing = this.themes.get(element);
        if (existing) {
            this.themes.set(element, { ...existing, ...theme });
        }
    }

    getStats(): {
        totalRepresentations: number;
        avgComplexity: number;
        emotionDistribution: Record<EmotionType, number>;
    } {
        const reps = Array.from(this.representations.values());

        const emotionDistribution: Record<EmotionType, number> = {
            calm: 0, energetic: 0, tense: 0, chaotic: 0, harmonious: 0, discordant: 0,
        };

        for (const rep of reps) {
            for (const [emotion, count] of Object.entries(rep.emotions.distribution)) {
                emotionDistribution[emotion as EmotionType] += count;
            }
        }

        const avgComplexity = reps.length > 0
            ? reps.reduce((s, r) => s + r.visual.reduce((vs, v) => vs + v.intensity, 0) / r.visual.length, 0) / reps.length
            : 0;

        return {
            totalRepresentations: reps.length,
            avgComplexity,
            emotionDistribution,
        };
    }
}

export const synestheticCodeInterface = SynestheticCodeInterface.getInstance();
