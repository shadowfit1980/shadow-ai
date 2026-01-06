/**
 * 🎬 Cutscene System
 * 
 * Cinematic sequences:
 * - Timeline-based events
 * - Camera movements
 * - Dialogue, actions
 * - Skip functionality
 */

import { EventEmitter } from 'events';

export interface CutsceneEvent {
    time: number;
    type: 'dialogue' | 'action' | 'camera' | 'sound' | 'wait' | 'fade' | 'spawn';
    data: any;
}

export interface Cutscene {
    id: string;
    name: string;
    duration: number;
    skippable: boolean;
    events: CutsceneEvent[];
}

export class CutsceneSystem extends EventEmitter {
    private static instance: CutsceneSystem;
    private cutscenes: Map<string, Cutscene> = new Map();

    private constructor() {
        super();
        this.initializePresets();
    }

    static getInstance(): CutsceneSystem {
        if (!CutsceneSystem.instance) {
            CutsceneSystem.instance = new CutsceneSystem();
        }
        return CutsceneSystem.instance;
    }

    private initializePresets(): void {
        // Intro cutscene
        this.cutscenes.set('intro', {
            id: 'intro',
            name: 'Game Intro',
            duration: 10000,
            skippable: true,
            events: [
                { time: 0, type: 'fade', data: { from: 1, to: 0, duration: 1000 } },
                { time: 500, type: 'camera', data: { action: 'pan', from: { x: 0, y: 0 }, to: { x: 400, y: 0 }, duration: 3000 } },
                { time: 1000, type: 'dialogue', data: { speaker: 'Narrator', text: 'In a world of shadows...', duration: 2500 } },
                { time: 4000, type: 'spawn', data: { entity: 'player', x: 100, y: 300 } },
                { time: 4500, type: 'dialogue', data: { speaker: 'Hero', text: 'My journey begins here.', duration: 2000 } },
                { time: 7000, type: 'camera', data: { action: 'zoom', from: 1, to: 1.5, duration: 1500 } },
                { time: 9000, type: 'fade', data: { from: 0, to: 1, duration: 1000 } }
            ]
        });

        // Boss encounter
        this.cutscenes.set('bossEncounter', {
            id: 'bossEncounter',
            name: 'Boss Encounter',
            duration: 8000,
            skippable: false,
            events: [
                { time: 0, type: 'sound', data: { sound: 'rumble' } },
                { time: 500, type: 'camera', data: { action: 'shake', intensity: 5, duration: 2000 } },
                { time: 1000, type: 'spawn', data: { entity: 'boss', x: 600, y: 200, animation: 'appear' } },
                { time: 2500, type: 'dialogue', data: { speaker: 'Boss', text: 'So, you dare challenge me?', duration: 2500 } },
                { time: 5500, type: 'dialogue', data: { speaker: 'Hero', text: 'I will defeat you!', duration: 2000 } },
                { time: 7500, type: 'action', data: { target: 'boss', action: 'startFight' } }
            ]
        });

        // Victory
        this.cutscenes.set('victory', {
            id: 'victory',
            name: 'Victory',
            duration: 6000,
            skippable: true,
            events: [
                { time: 0, type: 'sound', data: { sound: 'victory_fanfare' } },
                { time: 500, type: 'action', data: { target: 'player', action: 'victoryPose' } },
                { time: 1000, type: 'dialogue', data: { speaker: '', text: 'VICTORY!', duration: 2000, style: 'title' } },
                { time: 3500, type: 'fade', data: { from: 0, to: 1, duration: 2000 } }
            ]
        });
    }

    getCutscene(id: string): Cutscene | undefined {
        return this.cutscenes.get(id);
    }

    createCutscene(cutscene: Cutscene): void {
        this.cutscenes.set(cutscene.id, cutscene);
    }

    generateCutscenePlayerCode(): string {
        return `
class CutscenePlayer {
    constructor(game) {
        this.game = game;
        this.currentCutscene = null;
        this.currentTime = 0;
        this.playing = false;
        this.eventIndex = 0;
        this.callbacks = {};
    }

    play(cutscene) {
        this.currentCutscene = cutscene;
        this.currentTime = 0;
        this.eventIndex = 0;
        this.playing = true;
        this.game.paused = true;
        
        this.onStart?.();
    }

    update(dt) {
        if (!this.playing || !this.currentCutscene) return;

        this.currentTime += dt * 1000;

        // Process events
        while (this.eventIndex < this.currentCutscene.events.length) {
            const event = this.currentCutscene.events[this.eventIndex];
            
            if (event.time <= this.currentTime) {
                this.processEvent(event);
                this.eventIndex++;
            } else {
                break;
            }
        }

        // Check completion
        if (this.currentTime >= this.currentCutscene.duration) {
            this.complete();
        }
    }

    processEvent(event) {
        switch (event.type) {
            case 'dialogue':
                this.showDialogue(event.data);
                break;
            case 'camera':
                this.handleCamera(event.data);
                break;
            case 'fade':
                this.handleFade(event.data);
                break;
            case 'spawn':
                this.handleSpawn(event.data);
                break;
            case 'sound':
                this.handleSound(event.data);
                break;
            case 'action':
                this.handleAction(event.data);
                break;
            case 'wait':
                // Just wait
                break;
        }
    }

    showDialogue(data) {
        this.onDialogue?.(data.speaker, data.text, data.duration);
    }

    handleCamera(data) {
        switch (data.action) {
            case 'pan':
                this.game.camera.panTo(data.to.x, data.to.y, data.duration);
                break;
            case 'zoom':
                this.game.camera.zoomTo(data.to, data.duration);
                break;
            case 'shake':
                this.game.camera.shake(data.intensity, data.duration);
                break;
        }
    }

    handleFade(data) {
        this.onFade?.(data.from, data.to, data.duration);
    }

    handleSpawn(data) {
        this.game.spawn(data.entity, data.x, data.y, data.animation);
    }

    handleSound(data) {
        this.game.audio?.play(data.sound);
    }

    handleAction(data) {
        const target = this.game.getEntity(data.target);
        target?.[data.action]?.();
    }

    skip() {
        if (this.currentCutscene?.skippable) {
            this.complete();
        }
    }

    complete() {
        this.playing = false;
        this.game.paused = false;
        this.onComplete?.();
    }

    // Event handlers
    onDialogue = null;
    onFade = null;
    onStart = null;
    onComplete = null;
}`;
    }
}

export const cutsceneSystem = CutsceneSystem.getInstance();
