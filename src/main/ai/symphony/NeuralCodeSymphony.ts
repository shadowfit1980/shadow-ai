/**
 * Neural Code Symphony
 * 
 * Transforms code into music and visualization, allowing developers
 * to experience their codebase through audio and visual harmonies.
 */

import { EventEmitter } from 'events';

export interface Symphony {
    id: string;
    code: string;
    composition: Composition;
    visualization: Visualization;
    performance: Performance;
    mood: Mood;
    createdAt: Date;
}

export interface Composition {
    name: string;
    tempo: number;
    key: MusicalKey;
    timeSignature: string;
    sections: Section[];
    duration: number;
}

export type MusicalKey = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B' | 'Cm' | 'Dm' | 'Em' | 'Fm' | 'Gm' | 'Am' | 'Bm';

export interface Section {
    id: string;
    name: string;
    start: number;
    duration: number;
    instruments: Instrument[];
    theme: string;
    codeLines: { start: number; end: number };
}

export interface Instrument {
    name: string;
    role: InstrumentRole;
    volume: number;
    pattern: string;
}

export type InstrumentRole = 'melody' | 'harmony' | 'bass' | 'rhythm' | 'ambient';

export interface Visualization {
    type: VisualizationType;
    colorPalette: string[];
    elements: VisualElement[];
    animation: AnimationSettings;
}

export type VisualizationType = 'particle' | 'wave' | 'galaxy' | 'tree' | 'network' | 'abstract';

export interface VisualElement {
    id: string;
    shape: 'circle' | 'square' | 'line' | 'star' | 'polygon';
    size: number;
    color: string;
    position: { x: number; y: number };
    linkedToCode: number;
}

export interface AnimationSettings {
    speed: number;
    easing: string;
    loop: boolean;
    reactiveToBeat: boolean;
}

export interface Performance {
    state: 'stopped' | 'playing' | 'paused';
    currentTime: number;
    currentSection?: string;
    highlightedLines: number[];
}

export interface Mood {
    primary: string;
    secondary: string;
    energy: number;
    complexity: number;
    harmony: number;
}

export class NeuralCodeSymphony extends EventEmitter {
    private static instance: NeuralCodeSymphony;
    private symphonies: Map<string, Symphony> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): NeuralCodeSymphony {
        if (!NeuralCodeSymphony.instance) {
            NeuralCodeSymphony.instance = new NeuralCodeSymphony();
        }
        return NeuralCodeSymphony.instance;
    }

    // ========================================================================
    // COMPOSITION
    // ========================================================================

    compose(code: string, name?: string): Symphony {
        const mood = this.analyzeMood(code);
        const composition = this.createComposition(code, mood, name);
        const visualization = this.createVisualization(code, mood);

        const symphony: Symphony = {
            id: `symphony_${Date.now()}`,
            code,
            composition,
            visualization,
            performance: {
                state: 'stopped',
                currentTime: 0,
                highlightedLines: [],
            },
            mood,
            createdAt: new Date(),
        };

        this.symphonies.set(symphony.id, symphony);
        this.emit('symphony:composed', symphony);
        return symphony;
    }

    private analyzeMood(code: string): Mood {
        const lines = code.split('\n').length;
        const hasErrors = code.includes('error') || code.includes('throw');
        const hasLoops = code.includes('for') || code.includes('while');
        const hasAsync = code.includes('async') || code.includes('Promise');
        const hasComments = code.includes('//') || code.includes('/*');
        const complexity = this.calculateComplexity(code);

        // Determine primary mood based on code characteristics
        let primary = 'contemplative';
        let energy = 0.5;

        if (hasLoops && hasAsync) {
            primary = 'dynamic';
            energy = 0.8;
        } else if (hasErrors) {
            primary = 'dramatic';
            energy = 0.7;
        } else if (hasComments) {
            primary = 'thoughtful';
            energy = 0.4;
        } else if (lines > 200) {
            primary = 'epic';
            energy = 0.9;
        }

        return {
            primary,
            secondary: hasAsync ? 'flowing' : 'structured',
            energy,
            complexity,
            harmony: hasComments ? 0.8 : 0.6,
        };
    }

    private calculateComplexity(code: string): number {
        let complexity = 0;
        complexity += (code.match(/if|else|switch|case/g) || []).length * 0.1;
        complexity += (code.match(/for|while|do/g) || []).length * 0.15;
        complexity += (code.match(/try|catch/g) || []).length * 0.1;
        complexity += (code.match(/function|class/g) || []).length * 0.2;
        return Math.min(1, complexity);
    }

    private createComposition(code: string, mood: Mood, name?: string): Composition {
        const lines = code.split('\n');
        const sections: Section[] = [];

        // Tempo based on energy
        const tempo = 60 + Math.floor(mood.energy * 80);

        // Key based on mood
        let key: MusicalKey = 'C';
        if (mood.primary === 'dramatic') key = 'Dm';
        else if (mood.primary === 'epic') key = 'Em';
        else if (mood.primary === 'dynamic') key = 'G';
        else if (mood.primary === 'thoughtful') key = 'Am';

        // Create sections based on code structure
        let currentSection = 0;
        let sectionStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // New section on function/class declaration
            if (line.includes('function') || line.includes('class') || (line.includes('export') && line.includes('const'))) {
                if (i > sectionStart) {
                    sections.push(this.createSection(currentSection, sectionStart, i, mood));
                    currentSection++;
                    sectionStart = i;
                }
            }
        }

        // Add final section
        if (sectionStart < lines.length) {
            sections.push(this.createSection(currentSection, sectionStart, lines.length, mood));
        }

        return {
            name: name || `Code Symphony #${Date.now().toString(36)}`,
            tempo,
            key,
            timeSignature: mood.complexity > 0.7 ? '7/8' : '4/4',
            sections,
            duration: sections.reduce((s, sec) => s + sec.duration, 0),
        };
    }

    private createSection(index: number, startLine: number, endLine: number, mood: Mood): Section {
        const themes = ['Introduction', 'Development', 'Bridge', 'Climax', 'Resolution', 'Coda'];
        const instruments: Instrument[] = [];

        // Add instruments based on mood
        instruments.push({
            name: 'Piano',
            role: 'melody',
            volume: 0.8,
            pattern: mood.primary === 'dynamic' ? 'arpeggios' : 'chords',
        });

        if (mood.energy > 0.6) {
            instruments.push({
                name: 'Strings',
                role: 'harmony',
                volume: 0.6,
                pattern: 'sustained',
            });
        }

        if (mood.complexity > 0.5) {
            instruments.push({
                name: 'Bass',
                role: 'bass',
                volume: 0.5,
                pattern: 'walking',
            });
        }

        instruments.push({
            name: 'Ambient',
            role: 'ambient',
            volume: 0.3,
            pattern: 'pad',
        });

        return {
            id: `section_${index}`,
            name: themes[index % themes.length],
            start: index * 30,
            duration: 30,
            instruments,
            theme: mood.primary,
            codeLines: { start: startLine, end: endLine },
        };
    }

    private createVisualization(code: string, mood: Mood): Visualization {
        // Determine visualization type based on mood
        let type: VisualizationType = 'particle';
        if (mood.primary === 'epic') type = 'galaxy';
        else if (mood.primary === 'thoughtful') type = 'tree';
        else if (mood.primary === 'dynamic') type = 'wave';
        else if (mood.complexity > 0.7) type = 'network';

        // Create color palette based on mood
        let colorPalette: string[] = [];
        switch (mood.primary) {
            case 'dramatic':
                colorPalette = ['#FF3366', '#FF6B6B', '#C44D58', '#8B0000'];
                break;
            case 'dynamic':
                colorPalette = ['#00D9FF', '#00FF87', '#FFE66D', '#FF6B6B'];
                break;
            case 'epic':
                colorPalette = ['#4158D0', '#C850C0', '#FFCC70', '#FFE66D'];
                break;
            case 'thoughtful':
                colorPalette = ['#667EEA', '#764BA2', '#B06AB3', '#6DD5ED'];
                break;
            default:
                colorPalette = ['#6366F1', '#8B5CF6', '#A855F7', '#D946EF'];
        }

        // Create visual elements for each significant code structure
        const elements: VisualElement[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < Math.min(lines.length, 50); i++) {
            const line = lines[i];
            if (line.trim().length > 0) {
                elements.push({
                    id: `elem_${i}`,
                    shape: line.includes('class') ? 'star' :
                        line.includes('function') ? 'polygon' :
                            line.includes('const') ? 'square' : 'circle',
                    size: Math.min(50, line.length / 2),
                    color: colorPalette[i % colorPalette.length],
                    position: {
                        x: (i % 10) * 100,
                        y: Math.floor(i / 10) * 100
                    },
                    linkedToCode: i,
                });
            }
        }

        return {
            type,
            colorPalette,
            elements,
            animation: {
                speed: mood.energy,
                easing: 'easeInOutQuad',
                loop: true,
                reactiveToBeat: true,
            },
        };
    }

    // ========================================================================
    // PLAYBACK
    // ========================================================================

    play(symphonyId: string): void {
        const symphony = this.symphonies.get(symphonyId);
        if (symphony) {
            symphony.performance.state = 'playing';
            this.emit('performance:started', symphony);
        }
    }

    pause(symphonyId: string): void {
        const symphony = this.symphonies.get(symphonyId);
        if (symphony) {
            symphony.performance.state = 'paused';
            this.emit('performance:paused', symphony);
        }
    }

    stop(symphonyId: string): void {
        const symphony = this.symphonies.get(symphonyId);
        if (symphony) {
            symphony.performance.state = 'stopped';
            symphony.performance.currentTime = 0;
            symphony.performance.highlightedLines = [];
            this.emit('performance:stopped', symphony);
        }
    }

    seek(symphonyId: string, time: number): void {
        const symphony = this.symphonies.get(symphonyId);
        if (symphony) {
            symphony.performance.currentTime = time;

            // Find which section we're in
            for (const section of symphony.composition.sections) {
                if (time >= section.start && time < section.start + section.duration) {
                    symphony.performance.currentSection = section.id;
                    symphony.performance.highlightedLines = [
                        section.codeLines.start,
                        section.codeLines.end
                    ];
                    break;
                }
            }

            this.emit('performance:seeked', { symphony, time });
        }
    }

    // ========================================================================
    // EXPORT
    // ========================================================================

    exportMIDI(symphonyId: string): { notes: any[]; tempo: number } | undefined {
        const symphony = this.symphonies.get(symphonyId);
        if (!symphony) return undefined;

        // Generate MIDI-like representation
        const notes: any[] = [];
        const comp = symphony.composition;

        for (const section of comp.sections) {
            for (const instrument of section.instruments) {
                const baseNote = this.keyToMIDI(comp.key);
                notes.push({
                    instrument: instrument.name,
                    note: baseNote,
                    velocity: Math.floor(instrument.volume * 127),
                    start: section.start,
                    duration: section.duration,
                    pattern: instrument.pattern,
                });
            }
        }

        return { notes, tempo: comp.tempo };
    }

    private keyToMIDI(key: MusicalKey): number {
        const keyMap: Record<MusicalKey, number> = {
            'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71,
            'Cm': 60, 'Dm': 62, 'Em': 64, 'Fm': 65, 'Gm': 67, 'Am': 69, 'Bm': 71,
        };
        return keyMap[key] || 60;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSymphony(id: string): Symphony | undefined {
        return this.symphonies.get(id);
    }

    getAllSymphonies(): Symphony[] {
        return Array.from(this.symphonies.values());
    }

    getStats(): {
        totalSymphonies: number;
        avgDuration: number;
        moodDistribution: Record<string, number>;
    } {
        const symphonies = Array.from(this.symphonies.values());
        const moodDistribution: Record<string, number> = {};

        for (const s of symphonies) {
            moodDistribution[s.mood.primary] = (moodDistribution[s.mood.primary] || 0) + 1;
        }

        return {
            totalSymphonies: symphonies.length,
            avgDuration: symphonies.length > 0
                ? symphonies.reduce((s, sym) => s + sym.composition.duration, 0) / symphonies.length
                : 0,
            moodDistribution,
        };
    }
}

export const neuralCodeSymphony = NeuralCodeSymphony.getInstance();
