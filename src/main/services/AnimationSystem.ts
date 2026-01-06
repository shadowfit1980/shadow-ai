/**
 * 🎬 Animation System
 * 
 * Sprite animation management:
 * - Animation definitions
 * - State machines
 * - Blending
 * - Events
 */

import { EventEmitter } from 'events';

export interface AnimationFrame {
    index: number;
    duration: number; // ms
    event?: string;
}

export interface Animation {
    id: string;
    name: string;
    frames: AnimationFrame[];
    loop: boolean;
    speed: number;
}

export interface AnimationState {
    id: string;
    name: string;
    animation: string;
    transitions: { to: string; condition: string }[];
}

export interface AnimatorController {
    id: string;
    states: AnimationState[];
    defaultState: string;
    parameters: { name: string; type: 'bool' | 'int' | 'float' | 'trigger' }[];
}

export class AnimationSystem extends EventEmitter {
    private static instance: AnimationSystem;
    private animations: Map<string, Animation> = new Map();
    private controllers: Map<string, AnimatorController> = new Map();

    private constructor() {
        super();
        this.initializePresets();
    }

    static getInstance(): AnimationSystem {
        if (!AnimationSystem.instance) {
            AnimationSystem.instance = new AnimationSystem();
        }
        return AnimationSystem.instance;
    }

    private initializePresets(): void {
        // Idle animation
        this.animations.set('idle', {
            id: 'idle', name: 'Idle', loop: true, speed: 1,
            frames: [
                { index: 0, duration: 200 },
                { index: 1, duration: 200 },
                { index: 0, duration: 200 },
                { index: 2, duration: 200 }
            ]
        });

        // Walk animation
        this.animations.set('walk', {
            id: 'walk', name: 'Walk', loop: true, speed: 1,
            frames: [
                { index: 3, duration: 100 },
                { index: 4, duration: 100 },
                { index: 5, duration: 100 },
                { index: 6, duration: 100 }
            ]
        });

        // Run animation
        this.animations.set('run', {
            id: 'run', name: 'Run', loop: true, speed: 1,
            frames: [
                { index: 7, duration: 80 },
                { index: 8, duration: 80 },
                { index: 9, duration: 80 },
                { index: 10, duration: 80 }
            ]
        });

        // Jump animation
        this.animations.set('jump', {
            id: 'jump', name: 'Jump', loop: false, speed: 1,
            frames: [
                { index: 11, duration: 100 },
                { index: 12, duration: 300, event: 'apex' },
                { index: 13, duration: 100 }
            ]
        });

        // Attack animation
        this.animations.set('attack', {
            id: 'attack', name: 'Attack', loop: false, speed: 1,
            frames: [
                { index: 14, duration: 50 },
                { index: 15, duration: 100, event: 'hitframe' },
                { index: 16, duration: 150 }
            ]
        });

        // Default controller
        this.controllers.set('player', {
            id: 'player',
            defaultState: 'idle',
            parameters: [
                { name: 'speed', type: 'float' },
                { name: 'grounded', type: 'bool' },
                { name: 'attack', type: 'trigger' }
            ],
            states: [
                {
                    id: 'idle', name: 'Idle', animation: 'idle',
                    transitions: [
                        { to: 'walk', condition: 'speed > 0' },
                        { to: 'jump', condition: '!grounded' },
                        { to: 'attack', condition: 'attack' }
                    ]
                },
                {
                    id: 'walk', name: 'Walk', animation: 'walk',
                    transitions: [
                        { to: 'idle', condition: 'speed == 0' },
                        { to: 'run', condition: 'speed > 5' },
                        { to: 'jump', condition: '!grounded' }
                    ]
                },
                {
                    id: 'run', name: 'Run', animation: 'run',
                    transitions: [
                        { to: 'walk', condition: 'speed <= 5' },
                        { to: 'jump', condition: '!grounded' }
                    ]
                },
                {
                    id: 'jump', name: 'Jump', animation: 'jump',
                    transitions: [
                        { to: 'idle', condition: 'grounded && speed == 0' },
                        { to: 'walk', condition: 'grounded && speed > 0' }
                    ]
                },
                {
                    id: 'attack', name: 'Attack', animation: 'attack',
                    transitions: [
                        { to: 'idle', condition: 'animationComplete' }
                    ]
                }
            ]
        });
    }

    getAnimation(id: string): Animation | undefined {
        return this.animations.get(id);
    }

    getController(id: string): AnimatorController | undefined {
        return this.controllers.get(id);
    }

    createAnimation(animation: Animation): void {
        this.animations.set(animation.id, animation);
    }

    generateAnimationCode(): string {
        return `
class Animator {
    constructor(spriteSheet, frameWidth, frameHeight) {
        this.spriteSheet = spriteSheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.animations = new Map();
        this.currentAnim = null;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.parameters = {};
        this.events = [];
    }

    addAnimation(id, frames, loop = true, speed = 1) {
        this.animations.set(id, { frames, loop, speed });
    }

    play(animationId, force = false) {
        if (this.currentAnim === animationId && !force) return;
        
        this.currentAnim = animationId;
        this.currentFrame = 0;
        this.frameTime = 0;
    }

    setParameter(name, value) {
        this.parameters[name] = value;
    }

    update(dt) {
        if (!this.currentAnim) return;
        
        const anim = this.animations.get(this.currentAnim);
        if (!anim) return;

        this.frameTime += dt * 1000 * anim.speed;
        const frame = anim.frames[this.currentFrame];

        if (this.frameTime >= frame.duration) {
            this.frameTime = 0;
            
            // Fire event if present
            if (frame.event) {
                this.events.push(frame.event);
            }

            this.currentFrame++;
            
            if (this.currentFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = anim.frames.length - 1;
                }
            }
        }
    }

    getCurrentFrameIndex() {
        if (!this.currentAnim) return 0;
        const anim = this.animations.get(this.currentAnim);
        return anim?.frames[this.currentFrame]?.index || 0;
    }

    draw(ctx, x, y, scale = 1, flipX = false) {
        const frameIndex = this.getCurrentFrameIndex();
        const cols = Math.floor(this.spriteSheet.width / this.frameWidth);
        const sx = (frameIndex % cols) * this.frameWidth;
        const sy = Math.floor(frameIndex / cols) * this.frameHeight;

        ctx.save();
        ctx.translate(x, y);
        if (flipX) ctx.scale(-1, 1);
        
        ctx.drawImage(
            this.spriteSheet,
            sx, sy, this.frameWidth, this.frameHeight,
            -this.frameWidth * scale / 2,
            -this.frameHeight * scale / 2,
            this.frameWidth * scale,
            this.frameHeight * scale
        );
        
        ctx.restore();
    }

    consumeEvents() {
        const events = this.events;
        this.events = [];
        return events;
    }
}`;
    }
}

export const animationSystem = AnimationSystem.getInstance();
