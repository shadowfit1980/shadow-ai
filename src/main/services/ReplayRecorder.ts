/**
 * 🎥 Replay Recorder
 * 
 * Gameplay recording and playback:
 * - Input recording
 * - State snapshots
 * - Replay playback
 * - Export/sharing
 */

import { EventEmitter } from 'events';

export interface ReplayFrame {
    tick: number;
    inputs: Record<string, any>;
    events?: { type: string; data: any }[];
}

export interface ReplayData {
    id: string;
    version: string;
    startTime: number;
    duration: number;
    frames: ReplayFrame[];
    metadata: {
        playerName?: string;
        level?: string;
        score?: number;
    };
}

export class ReplayRecorder extends EventEmitter {
    private static instance: ReplayRecorder;

    private constructor() { super(); }

    static getInstance(): ReplayRecorder {
        if (!ReplayRecorder.instance) {
            ReplayRecorder.instance = new ReplayRecorder();
        }
        return ReplayRecorder.instance;
    }

    generateReplayCode(): string {
        return `
class ReplayRecorder {
    constructor() {
        this.frames = [];
        this.recording = false;
        this.tickRate = 60;
        this.currentTick = 0;
        this.startTime = 0;
        this.metadata = {};
    }

    startRecording(metadata = {}) {
        this.frames = [];
        this.currentTick = 0;
        this.startTime = Date.now();
        this.metadata = metadata;
        this.recording = true;
        console.log('Recording started');
    }

    stopRecording() {
        this.recording = false;
        const data = {
            id: 'replay_' + Date.now(),
            version: '1.0',
            startTime: this.startTime,
            duration: Date.now() - this.startTime,
            frames: this.frames,
            metadata: this.metadata
        };
        console.log('Recording stopped:', this.frames.length, 'frames');
        return data;
    }

    recordFrame(inputs, events = []) {
        if (!this.recording) return;
        
        this.frames.push({
            tick: this.currentTick,
            inputs: { ...inputs },
            events: events.length ? events : undefined
        });
        
        this.currentTick++;
    }

    // Compress replay data for storage
    compress(replayData) {
        // Delta compression - only store changes
        const compressed = [];
        let lastInputs = {};

        for (const frame of replayData.frames) {
            const delta = {};
            let hasChanges = false;

            for (const key in frame.inputs) {
                if (frame.inputs[key] !== lastInputs[key]) {
                    delta[key] = frame.inputs[key];
                    hasChanges = true;
                }
            }

            if (hasChanges || frame.events) {
                compressed.push({
                    t: frame.tick,
                    i: Object.keys(delta).length ? delta : undefined,
                    e: frame.events
                });
            }

            lastInputs = { ...frame.inputs };
        }

        return {
            ...replayData,
            frames: compressed,
            compressed: true
        };
    }

    // Decompress for playback
    decompress(compressedData) {
        if (!compressedData.compressed) return compressedData;

        const frames = [];
        let currentInputs = {};
        let frameIndex = 0;

        for (let tick = 0; tick <= compressedData.frames[compressedData.frames.length - 1]?.t || 0; tick++) {
            const compFrame = compressedData.frames[frameIndex];

            if (compFrame && compFrame.t === tick) {
                if (compFrame.i) {
                    currentInputs = { ...currentInputs, ...compFrame.i };
                }
                frames.push({
                    tick,
                    inputs: { ...currentInputs },
                    events: compFrame.e
                });
                frameIndex++;
            } else {
                frames.push({
                    tick,
                    inputs: { ...currentInputs }
                });
            }
        }

        return { ...compressedData, frames, compressed: false };
    }
}

class ReplayPlayer {
    constructor(game) {
        this.game = game;
        this.replayData = null;
        this.playing = false;
        this.currentTick = 0;
        this.speed = 1;
    }

    load(replayData) {
        this.replayData = replayData;
        this.currentTick = 0;
        console.log('Replay loaded:', replayData.frames.length, 'frames');
    }

    play() {
        if (!this.replayData) return;
        this.playing = true;
        this.game.paused = false;
        console.log('Replay playing');
    }

    pause() {
        this.playing = false;
    }

    setSpeed(speed) {
        this.speed = Math.max(0.25, Math.min(4, speed));
    }

    seekTo(tick) {
        this.currentTick = Math.max(0, Math.min(tick, this.replayData.frames.length - 1));
        // In real implementation, would need to reconstruct game state
    }

    update() {
        if (!this.playing || !this.replayData) return null;

        const frame = this.replayData.frames[this.currentTick];
        
        if (frame) {
            // Process events
            if (frame.events) {
                frame.events.forEach(e => this.game.processEvent?.(e));
            }

            this.currentTick += this.speed;

            if (this.currentTick >= this.replayData.frames.length) {
                this.playing = false;
                this.onComplete?.();
            }

            return frame.inputs;
        }

        return null;
    }

    getProgress() {
        if (!this.replayData) return 0;
        return this.currentTick / this.replayData.frames.length;
    }

    getCurrentTime() {
        if (!this.replayData) return 0;
        return (this.currentTick / 60) * 1000; // Assuming 60 tick rate
    }
}`;
    }
}

export const replayRecorder = ReplayRecorder.getInstance();
