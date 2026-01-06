/**
 * 🎥 Camera System
 * 
 * Game camera controls and cinematics:
 * - Follow targets
 * - Screen shake
 * - Zoom
 * - Cinematics/cutscenes
 * - Letterboxing
 */

import { EventEmitter } from 'events';

export interface Vector2 { x: number; y: number; }

export interface CameraState {
    x: number;
    y: number;
    zoom: number;
    rotation: number;
    shakeIntensity: number;
    shakeDecay: number;
}

export interface CameraTarget {
    x: number;
    y: number;
    zoom?: number;
    rotation?: number;
}

export interface CinematicKeyframe {
    time: number;
    position?: Vector2;
    zoom?: number;
    rotation?: number;
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
    event?: string;
}

export interface CinematicSequence {
    id: string;
    name: string;
    duration: number;
    keyframes: CinematicKeyframe[];
    letterbox?: boolean;
    skipable?: boolean;
}

export class CameraSystem extends EventEmitter {
    private static instance: CameraSystem;
    private cinematics: Map<string, CinematicSequence> = new Map();

    private constructor() {
        super();
        this.initializeCinematics();
    }

    static getInstance(): CameraSystem {
        if (!CameraSystem.instance) {
            CameraSystem.instance = new CameraSystem();
        }
        return CameraSystem.instance;
    }

    private initializeCinematics(): void {
        // Boss intro
        this.cinematics.set('boss_intro', {
            id: 'boss_intro', name: 'Boss Introduction', duration: 5, letterbox: true, skipable: true,
            keyframes: [
                { time: 0, position: { x: 0, y: 0 }, zoom: 1, easing: 'easeInOut' },
                { time: 1, position: { x: 500, y: 0 }, zoom: 0.8, event: 'show_boss_name' },
                { time: 3, position: { x: 500, y: 0 }, zoom: 1.2, easing: 'easeIn' },
                { time: 4, position: { x: 250, y: 0 }, zoom: 1, event: 'start_fight' },
                { time: 5, zoom: 1 }
            ]
        });

        // Victory zoom
        this.cinematics.set('victory', {
            id: 'victory', name: 'Victory Celebration', duration: 3, letterbox: false, skipable: false,
            keyframes: [
                { time: 0, zoom: 1, easing: 'easeOut' },
                { time: 1, zoom: 1.5, event: 'show_victory_text' },
                { time: 2.5, zoom: 1.3, event: 'show_rewards' },
                { time: 3, zoom: 1 }
            ]
        });
    }

    getCinematic(id: string): CinematicSequence | undefined {
        return this.cinematics.get(id);
    }

    createCinematic(sequence: CinematicSequence): void {
        this.cinematics.set(sequence.id, sequence);
    }

    generateCameraCode(): string {
        return `
// Game Camera System
class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.rotation = 0;
        
        // Follow
        this.target = null;
        this.followSpeed = 5;
        this.deadzone = { x: 50, y: 50 };
        this.bounds = null;
        
        // Shake
        this.shakeIntensity = 0;
        this.shakeDecay = 5;
        this.shakeOffset = { x: 0, y: 0 };
        
        // Cinematic
        this.cinematic = null;
        this.cinematicTime = 0;
        this.letterbox = 0;
    }

    follow(target, speed = 5) {
        this.target = target;
        this.followSpeed = speed;
    }

    setBounds(x, y, width, height) {
        this.bounds = { x, y, width, height };
    }

    shake(intensity, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeDecay = intensity / duration;
    }

    zoomTo(zoom, duration = 0.5) {
        this.targetZoom = zoom;
        this.zoomSpeed = (zoom - this.zoom) / duration;
    }

    update(dt) {
        // Follow target
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            
            if (Math.abs(dx) > this.deadzone.x) {
                this.x += (dx - Math.sign(dx) * this.deadzone.x) * this.followSpeed * dt;
            }
            if (Math.abs(dy) > this.deadzone.y) {
                this.y += (dy - Math.sign(dy) * this.deadzone.y) * this.followSpeed * dt;
            }
        }

        // Apply bounds
        if (this.bounds) {
            const halfW = (this.canvas.width / 2) / this.zoom;
            const halfH = (this.canvas.height / 2) / this.zoom;
            this.x = Math.max(this.bounds.x + halfW, 
                     Math.min(this.bounds.x + this.bounds.width - halfW, this.x));
            this.y = Math.max(this.bounds.y + halfH, 
                     Math.min(this.bounds.y + this.bounds.height - halfH, this.y));
        }

        // Screen shake
        if (this.shakeIntensity > 0) {
            this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity -= this.shakeDecay * dt;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }

        // Zoom animation
        if (this.targetZoom !== undefined) {
            this.zoom += this.zoomSpeed * dt;
            if ((this.zoomSpeed > 0 && this.zoom >= this.targetZoom) ||
                (this.zoomSpeed < 0 && this.zoom <= this.targetZoom)) {
                this.zoom = this.targetZoom;
                this.targetZoom = undefined;
            }
        }

        // Cinematic playback
        if (this.cinematic) {
            this.updateCinematic(dt);
        }
    }

    updateCinematic(dt) {
        this.cinematicTime += dt;
        
        if (this.cinematicTime >= this.cinematic.duration) {
            this.endCinematic();
            return;
        }

        // Find current keyframes
        const kfs = this.cinematic.keyframes;
        let prev = kfs[0], next = kfs[1];
        
        for (let i = 0; i < kfs.length - 1; i++) {
            if (this.cinematicTime >= kfs[i].time && this.cinematicTime < kfs[i + 1].time) {
                prev = kfs[i];
                next = kfs[i + 1];
                break;
            }
        }

        // Interpolate
        const t = (this.cinematicTime - prev.time) / (next.time - prev.time);
        const eased = this.ease(t, next.easing || 'linear');

        if (prev.position && next.position) {
            this.x = this.lerp(prev.position.x, next.position.x, eased);
            this.y = this.lerp(prev.position.y, next.position.y, eased);
        }
        if (prev.zoom !== undefined && next.zoom !== undefined) {
            this.zoom = this.lerp(prev.zoom, next.zoom, eased);
        }
    }

    playCinematic(sequence) {
        this.cinematic = sequence;
        this.cinematicTime = 0;
        if (sequence.letterbox) this.showLetterbox();
    }

    endCinematic() {
        this.hideLetterbox();
        this.cinematic = null;
        game.emit('cinematicEnded');
    }

    showLetterbox() {
        // Animate letterbox bars
        this.letterbox = 0.15; // 15% of screen height
    }

    hideLetterbox() {
        this.letterbox = 0;
    }

    begin(ctx) {
        ctx.save();
        ctx.translate(
            this.canvas.width / 2 + this.shakeOffset.x,
            this.canvas.height / 2 + this.shakeOffset.y
        );
        ctx.scale(this.zoom, this.zoom);
        ctx.rotate(this.rotation);
        ctx.translate(-this.x, -this.y);
    }

    end(ctx) {
        ctx.restore();
        
        // Draw letterbox
        if (this.letterbox > 0) {
            const h = this.canvas.height * this.letterbox;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, this.canvas.width, h);
            ctx.fillRect(0, this.canvas.height - h, this.canvas.width, h);
        }
    }

    lerp(a, b, t) { return a + (b - a) * t; }
    
    ease(t, type) {
        switch (type) {
            case 'easeIn': return t * t;
            case 'easeOut': return 1 - (1 - t) * (1 - t);
            case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            default: return t;
        }
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvas.width / 2) / this.zoom + this.x,
            y: (screenY - this.canvas.height / 2) / this.zoom + this.y
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom + this.canvas.width / 2,
            y: (worldY - this.y) * this.zoom + this.canvas.height / 2
        };
    }
}`;
    }
}

export const cameraSystem = CameraSystem.getInstance();
