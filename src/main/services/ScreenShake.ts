/**
 * 📺 Screen Shake
 * 
 * Camera shake effects:
 * - Multiple shake types
 * - Trauma system
 * - Decay
 */

import { EventEmitter } from 'events';

export type ShakeType = 'random' | 'sine' | 'circular' | 'directional';

export interface ShakeConfig {
    type: ShakeType;
    intensity: number;
    duration: number;
    frequency?: number;
    decay?: number;
    direction?: number;
}

export class ScreenShake extends EventEmitter {
    private static instance: ScreenShake;

    private constructor() { super(); }

    static getInstance(): ScreenShake {
        if (!ScreenShake.instance) {
            ScreenShake.instance = new ScreenShake();
        }
        return ScreenShake.instance;
    }

    generateShakeCode(): string {
        return `
class ScreenShake {
    constructor() {
        this.trauma = 0;
        this.maxTrauma = 1;
        this.traumaDecay = 0.8; // per second
        this.maxOffset = 20;
        this.maxAngle = 5; // degrees
        this.offsetX = 0;
        this.offsetY = 0;
        this.rotation = 0;
        this.noise = 0;
        this.shakes = [];
    }

    // Add trauma (will be squared for actual shake)
    addTrauma(amount) {
        this.trauma = Math.min(this.maxTrauma, this.trauma + amount);
    }

    // Start a timed shake
    shake(config = {}) {
        this.shakes.push({
            type: config.type || 'random',
            intensity: config.intensity || 10,
            duration: config.duration || 0.3,
            elapsed: 0,
            frequency: config.frequency || 30,
            decay: config.decay ?? 1,
            direction: config.direction || 0
        });
    }

    // Presets
    light() { this.shake({ intensity: 3, duration: 0.2 }); }
    medium() { this.shake({ intensity: 8, duration: 0.3 }); }
    heavy() { this.shake({ intensity: 15, duration: 0.5 }); }
    explosion() { this.shake({ intensity: 25, duration: 0.6, decay: 2 }); }
    hit() { this.shake({ intensity: 5, duration: 0.1 }); }
    
    // Directional (knockback feel)
    directional(angle, intensity = 10) {
        this.shake({ type: 'directional', intensity, direction: angle, duration: 0.3 });
    }

    update(dt) {
        // Update trauma-based shake
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
        }

        // Process active shakes
        let totalOffsetX = 0;
        let totalOffsetY = 0;
        let totalRotation = 0;

        // Trauma shake (squared for feel)
        const traumaShake = this.trauma * this.trauma;
        if (traumaShake > 0) {
            this.noise += dt * 50;
            totalOffsetX += this.maxOffset * traumaShake * this.perlinish(this.noise);
            totalOffsetY += this.maxOffset * traumaShake * this.perlinish(this.noise + 1000);
            totalRotation += this.maxAngle * traumaShake * this.perlinish(this.noise + 2000);
        }

        // Timed shakes
        this.shakes = this.shakes.filter(shake => {
            shake.elapsed += dt;
            
            if (shake.elapsed >= shake.duration) {
                return false;
            }

            const progress = shake.elapsed / shake.duration;
            const decay = Math.pow(1 - progress, shake.decay);
            const intensity = shake.intensity * decay;
            const time = shake.elapsed * shake.frequency;

            switch (shake.type) {
                case 'random':
                    totalOffsetX += (Math.random() * 2 - 1) * intensity;
                    totalOffsetY += (Math.random() * 2 - 1) * intensity;
                    break;

                case 'sine':
                    totalOffsetX += Math.sin(time * Math.PI * 2) * intensity;
                    totalOffsetY += Math.cos(time * Math.PI * 2 * 0.7) * intensity;
                    break;

                case 'circular':
                    totalOffsetX += Math.cos(time * Math.PI * 2) * intensity;
                    totalOffsetY += Math.sin(time * Math.PI * 2) * intensity;
                    break;

                case 'directional':
                    const angle = shake.direction;
                    const perpAngle = angle + Math.PI / 2;
                    const mainOffset = Math.sin(time * Math.PI * 2) * intensity;
                    const perpOffset = Math.sin(time * Math.PI * 4) * intensity * 0.3;
                    totalOffsetX += Math.cos(angle) * mainOffset + Math.cos(perpAngle) * perpOffset;
                    totalOffsetY += Math.sin(angle) * mainOffset + Math.sin(perpAngle) * perpOffset;
                    break;
            }

            return true;
        });

        this.offsetX = totalOffsetX;
        this.offsetY = totalOffsetY;
        this.rotation = totalRotation;
    }

    // Simple noise function
    perlinish(x) {
        return Math.sin(x * 0.1) * 0.5 + Math.sin(x * 0.23) * 0.3 + Math.sin(x * 0.47) * 0.2;
    }

    // Apply to canvas context
    apply(ctx) {
        ctx.translate(this.offsetX, this.offsetY);
        ctx.rotate(this.rotation * Math.PI / 180);
    }

    // Get current offsets
    getOffset() {
        return { x: this.offsetX, y: this.offsetY, rotation: this.rotation };
    }

    // Check if shaking
    isShaking() {
        return this.trauma > 0.01 || this.shakes.length > 0;
    }

    // Stop all shakes
    stop() {
        this.trauma = 0;
        this.shakes = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.rotation = 0;
    }
}`;
    }

    getShakeTypes(): ShakeType[] {
        return ['random', 'sine', 'circular', 'directional'];
    }
}

export const screenShake = ScreenShake.getInstance();
