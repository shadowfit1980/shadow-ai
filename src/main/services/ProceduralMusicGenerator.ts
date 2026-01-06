/**
 * 🎵 Procedural Music Generator
 * 
 * Generate game music dynamically:
 * - Chord progressions
 * - Melodies
 * - Drum patterns
 * - Web Audio API integration
 */

import { EventEmitter } from 'events';

export type MusicMood = 'epic' | 'tense' | 'peaceful' | 'mysterious' | 'action' | 'sad' | 'victory';
export type MusicKey = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type MusicScale = 'major' | 'minor' | 'pentatonic' | 'blues' | 'dorian';

export interface MusicConfig {
    mood: MusicMood;
    key: MusicKey;
    scale: MusicScale;
    tempo: number;
    bars: number;
}

export interface GeneratedMusic {
    chords: string[];
    melody: number[];
    bass: number[];
    drums: string[];
    tempo: number;
}

export class ProceduralMusicGenerator extends EventEmitter {
    private static instance: ProceduralMusicGenerator;
    private scales: Map<MusicScale, number[]> = new Map();
    private chordProgressions: Map<MusicMood, number[][]> = new Map();

    private constructor() {
        super();
        this.initializeScales();
        this.initializeProgressions();
    }

    static getInstance(): ProceduralMusicGenerator {
        if (!ProceduralMusicGenerator.instance) {
            ProceduralMusicGenerator.instance = new ProceduralMusicGenerator();
        }
        return ProceduralMusicGenerator.instance;
    }

    private initializeScales(): void {
        this.scales.set('major', [0, 2, 4, 5, 7, 9, 11]);
        this.scales.set('minor', [0, 2, 3, 5, 7, 8, 10]);
        this.scales.set('pentatonic', [0, 2, 4, 7, 9]);
        this.scales.set('blues', [0, 3, 5, 6, 7, 10]);
        this.scales.set('dorian', [0, 2, 3, 5, 7, 9, 10]);
    }

    private initializeProgressions(): void {
        // Chord progressions (scale degrees 1-7)
        this.chordProgressions.set('epic', [[1, 5, 6, 4], [1, 4, 5, 5], [6, 4, 1, 5]]);
        this.chordProgressions.set('tense', [[6, 4, 1, 5], [1, 7, 6, 5], [4, 5, 6, 6]]);
        this.chordProgressions.set('peaceful', [[1, 4, 1, 5], [1, 6, 4, 5], [4, 1, 4, 5]]);
        this.chordProgressions.set('mysterious', [[6, 7, 1, 1], [4, 5, 6, 6], [1, 7, 6, 7]]);
        this.chordProgressions.set('action', [[1, 5, 6, 4], [1, 1, 4, 5], [5, 4, 1, 1]]);
        this.chordProgressions.set('sad', [[6, 4, 1, 5], [1, 5, 6, 4], [4, 1, 5, 6]]);
        this.chordProgressions.set('victory', [[1, 4, 5, 1], [4, 5, 1, 1], [1, 5, 4, 1]]);
    }

    generateMusic(config: MusicConfig): GeneratedMusic {
        const scale = this.scales.get(config.scale) || this.scales.get('major')!;
        const progressionsForMood = this.chordProgressions.get(config.mood) || [[1, 4, 5, 1]];
        const progression = progressionsForMood[Math.floor(Math.random() * progressionsForMood.length)];

        const rootNote = this.getNoteNumber(config.key);

        // Generate chord names
        const chords = progression.map(degree => {
            const chordRoot = this.getNoteName(rootNote + scale[(degree - 1) % scale.length]);
            return config.scale === 'minor' && degree === 1 ? `${chordRoot}m` : chordRoot;
        });

        // Generate melody (notes within scale)
        const melody: number[] = [];
        for (let i = 0; i < config.bars * 8; i++) {
            const scaleIndex = Math.floor(Math.random() * scale.length);
            const octave = Math.random() > 0.3 ? 4 : 5;
            melody.push(rootNote + scale[scaleIndex] + (octave * 12));
        }

        // Generate bass line
        const bass: number[] = [];
        for (let i = 0; i < config.bars; i++) {
            const chordRoot = rootNote + scale[(progression[i % progression.length] - 1) % scale.length];
            for (let j = 0; j < 4; j++) {
                bass.push(chordRoot + 36); // Bass octave
            }
        }

        // Generate drum pattern
        const drums = this.generateDrumPattern(config.mood, config.bars);

        return { chords, melody, bass, drums, tempo: config.tempo };
    }

    private generateDrumPattern(mood: MusicMood, bars: number): string[] {
        const patterns: Record<MusicMood, string[]> = {
            epic: ['K---S---K-K-S---', 'K---S---K---S-K-'],
            tense: ['K-K-S-K-K-K-S---', 'K---S-K-K---S-K-'],
            peaceful: ['K-------S-------', 'K---H---S---H---'],
            mysterious: ['K-------S---K---', 'K-H-----S-H-----'],
            action: ['K-K-S-K-K-K-S-S-', 'KKKKSSSSKKKKSSS-'],
            sad: ['K-------S-------', 'K---H---S-------'],
            victory: ['K-K-S---K-K-S-SS', 'K---S---K-K-SSSS']
        };

        const basePattern = patterns[mood] || patterns['action'];
        const result: string[] = [];
        for (let i = 0; i < bars; i++) {
            result.push(basePattern[i % basePattern.length]);
        }
        return result;
    }

    private getNoteNumber(note: MusicKey): number {
        const notes: Record<MusicKey, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        return notes[note];
    }

    private getNoteName(noteNumber: number): string {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return notes[noteNumber % 12];
    }

    generateMusicPlayerCode(): string {
        return `
class MusicPlayer {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;
        this.tempo = 120;
        this.playing = false;
    }

    playNote(frequency, duration, time, type = 'sine', gain = 0.3) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(gain, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + duration);
    }

    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    playMelody(notes, tempo = 120) {
        const beatDuration = 60 / tempo / 2;
        let time = this.ctx.currentTime;
        
        notes.forEach(note => {
            if (note > 0) {
                this.playNote(this.midiToFreq(note), beatDuration * 0.9, time, 'triangle', 0.2);
            }
            time += beatDuration;
        });
    }

    playDrums(pattern, tempo = 120) {
        const beatDuration = 60 / tempo / 4;
        let time = this.ctx.currentTime;
        
        pattern.forEach(char => {
            if (char === 'K') this.playKick(time);
            if (char === 'S') this.playSnare(time);
            if (char === 'H') this.playHiHat(time);
            time += beatDuration;
        });
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playSnare(time) {
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
    }

    playHiHat(time) {
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        
        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 7000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        noise.connect(highpass);
        highpass.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
    }
}`;
    }

    getMoods(): MusicMood[] {
        return ['epic', 'tense', 'peaceful', 'mysterious', 'action', 'sad', 'victory'];
    }
}

export const proceduralMusicGenerator = ProceduralMusicGenerator.getInstance();
