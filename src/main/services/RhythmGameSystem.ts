/**
 * 🎵 Rhythm Game System
 * 
 * Music game mechanics:
 * - Beat detection
 * - Note timing
 * - Scoring
 * - Combo system
 */

import { EventEmitter } from 'events';

export type NoteType = 'tap' | 'hold' | 'slide' | 'flick';
export type JudgementType = 'perfect' | 'great' | 'good' | 'miss';

export interface RhythmNote {
    time: number;
    lane: number;
    type: NoteType;
    duration?: number;
}

export interface RhythmChart {
    bpm: number;
    offset: number;
    notes: RhythmNote[];
}

export class RhythmGameSystem extends EventEmitter {
    private static instance: RhythmGameSystem;

    private constructor() { super(); }

    static getInstance(): RhythmGameSystem {
        if (!RhythmGameSystem.instance) {
            RhythmGameSystem.instance = new RhythmGameSystem();
        }
        return RhythmGameSystem.instance;
    }

    generateRhythmCode(): string {
        return `
class RhythmGame {
    constructor(config = {}) {
        this.bpm = config.bpm || 120;
        this.lanes = config.lanes || 4;
        this.hitWindow = {
            perfect: 50,  // ms
            great: 100,
            good: 150
        };
        
        this.notes = [];
        this.activeNotes = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.judgements = { perfect: 0, great: 0, good: 0, miss: 0 };
        
        this.playing = false;
        this.startTime = 0;
        this.currentTime = 0;
        this.audioOffset = 0;
        
        this.noteSpeed = config.noteSpeed || 500; // px per second
        this.hitLineY = config.hitLineY || 500;
    }

    loadChart(chart) {
        this.bpm = chart.bpm;
        this.audioOffset = chart.offset || 0;
        this.notes = chart.notes.map(n => ({
            ...n,
            hit: false,
            missed: false,
            y: 0
        }));
    }

    start(audioElement = null) {
        this.playing = true;
        this.startTime = performance.now() - this.audioOffset;
        this.audio = audioElement;
        if (this.audio) this.audio.play();
    }

    pause() {
        this.playing = false;
        if (this.audio) this.audio.pause();
    }

    resume() {
        this.playing = true;
        if (this.audio) this.audio.play();
    }

    update() {
        if (!this.playing) return;

        this.currentTime = performance.now() - this.startTime;

        // Update note positions
        for (const note of this.notes) {
            if (note.hit || note.missed) continue;

            const timeDiff = note.time - this.currentTime;
            note.y = this.hitLineY - (timeDiff / 1000) * this.noteSpeed;

            // Check for miss (note passed hit line)
            if (timeDiff < -this.hitWindow.good) {
                this.miss(note);
            }
        }
    }

    // Player input
    hit(lane) {
        const now = this.currentTime;
        
        // Find closest unhit note in lane
        let closest = null;
        let closestDiff = Infinity;

        for (const note of this.notes) {
            if (note.lane !== lane || note.hit || note.missed) continue;
            
            const diff = Math.abs(note.time - now);
            if (diff < closestDiff && diff < this.hitWindow.good) {
                closest = note;
                closestDiff = diff;
            }
        }

        if (closest) {
            this.judgeNote(closest, closestDiff);
        }
    }

    judgeNote(note, timeDiff) {
        note.hit = true;

        let judgement;
        let scoreAdd;

        if (timeDiff <= this.hitWindow.perfect) {
            judgement = 'perfect';
            scoreAdd = 1000;
        } else if (timeDiff <= this.hitWindow.great) {
            judgement = 'great';
            scoreAdd = 750;
        } else {
            judgement = 'good';
            scoreAdd = 500;
        }

        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.judgements[judgement]++;
        
        // Combo bonus
        const comboMultiplier = 1 + Math.floor(this.combo / 10) * 0.1;
        this.score += Math.floor(scoreAdd * comboMultiplier);

        this.onJudgement?.(judgement, note, this.combo);
    }

    miss(note) {
        note.missed = true;
        this.combo = 0;
        this.judgements.miss++;
        this.onJudgement?.('miss', note, 0);
    }

    getAccuracy() {
        const total = Object.values(this.judgements).reduce((a, b) => a + b, 0);
        if (total === 0) return 100;
        
        const weighted = 
            this.judgements.perfect * 100 +
            this.judgements.great * 75 +
            this.judgements.good * 50;
        
        return weighted / total;
    }

    getGrade() {
        const acc = this.getAccuracy();
        if (acc >= 95) return 'S';
        if (acc >= 90) return 'A';
        if (acc >= 80) return 'B';
        if (acc >= 70) return 'C';
        if (acc >= 60) return 'D';
        return 'F';
    }

    isComplete() {
        return this.notes.every(n => n.hit || n.missed);
    }

    getResults() {
        return {
            score: this.score,
            accuracy: this.getAccuracy(),
            grade: this.getGrade(),
            maxCombo: this.maxCombo,
            judgements: { ...this.judgements }
        };
    }

    render(ctx, laneWidth = 100) {
        // Draw lanes
        for (let i = 0; i < this.lanes; i++) {
            const x = i * laneWidth;
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x, 0, laneWidth, ctx.canvas.height);
        }

        // Draw hit line
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, this.hitLineY - 2, this.lanes * laneWidth, 4);

        // Draw notes
        for (const note of this.notes) {
            if (note.hit || note.y < 0 || note.y > ctx.canvas.height) continue;

            const x = note.lane * laneWidth + laneWidth / 2;
            const color = note.missed ? '#ff0000' : '#00ff00';

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, note.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Callbacks
    onJudgement = null;
}`;
    }
}

export const rhythmGameSystem = RhythmGameSystem.getInstance();
