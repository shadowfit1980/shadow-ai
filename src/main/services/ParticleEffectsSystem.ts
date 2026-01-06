/**
 * ✨ Particle Effects System
 * 
 * Visual effects and particle system:
 * - Emitter configurations
 * - Preset effects (explosions, fire, magic)
 * - Color gradients
 * - Physics-based particles
 */

import { EventEmitter } from 'events';

export interface Vector2 { x: number; y: number; }
export interface Color { r: number; g: number; b: number; a: number; }

export interface ParticleConfig {
    position: Vector2;
    velocity: Vector2;
    acceleration: Vector2;
    size: { start: number; end: number };
    color: { start: Color; end: Color };
    lifetime: number;
    rotation: number;
    rotationSpeed: number;
}

export interface EmitterConfig {
    id: string;
    name: string;
    position: Vector2;
    rate: number; // particles per second
    burst?: { count: number; interval: number };
    lifetime?: number; // emitter lifetime, -1 for infinite
    maxParticles: number;
    particle: {
        lifetime: { min: number; max: number };
        speed: { min: number; max: number };
        direction: { min: number; max: number }; // degrees
        size: { start: { min: number; max: number }; end: { min: number; max: number } };
        color: { start: Color; end: Color };
        gravity: number;
        rotation: { min: number; max: number };
        rotationSpeed: { min: number; max: number };
        fadeIn?: number;
        fadeOut?: number;
    };
    texture?: string;
    blendMode?: 'normal' | 'additive' | 'multiply';
}

export class ParticleEffectsSystem extends EventEmitter {
    private static instance: ParticleEffectsSystem;
    private presets: Map<string, EmitterConfig> = new Map();

    private constructor() {
        super();
        this.initializePresets();
    }

    static getInstance(): ParticleEffectsSystem {
        if (!ParticleEffectsSystem.instance) {
            ParticleEffectsSystem.instance = new ParticleEffectsSystem();
        }
        return ParticleEffectsSystem.instance;
    }

    private initializePresets(): void {
        // Fire effect
        this.presets.set('fire', {
            id: 'fire', name: 'Fire',
            position: { x: 0, y: 0 }, rate: 50, maxParticles: 200,
            particle: {
                lifetime: { min: 0.5, max: 1.5 },
                speed: { min: 50, max: 100 },
                direction: { min: 250, max: 290 },
                size: { start: { min: 10, max: 20 }, end: { min: 2, max: 5 } },
                color: {
                    start: { r: 255, g: 200, b: 50, a: 1 },
                    end: { r: 255, g: 50, b: 0, a: 0 }
                },
                gravity: -50, rotation: { min: 0, max: 360 }, rotationSpeed: { min: -90, max: 90 }
            },
            blendMode: 'additive'
        });

        // Explosion
        this.presets.set('explosion', {
            id: 'explosion', name: 'Explosion',
            position: { x: 0, y: 0 }, rate: 0, maxParticles: 100,
            burst: { count: 100, interval: 0 }, lifetime: 0.1,
            particle: {
                lifetime: { min: 0.3, max: 0.8 },
                speed: { min: 200, max: 400 },
                direction: { min: 0, max: 360 },
                size: { start: { min: 15, max: 30 }, end: { min: 5, max: 10 } },
                color: {
                    start: { r: 255, g: 255, b: 200, a: 1 },
                    end: { r: 255, g: 100, b: 0, a: 0 }
                },
                gravity: 100, rotation: { min: 0, max: 360 }, rotationSpeed: { min: -180, max: 180 }
            },
            blendMode: 'additive'
        });

        // Magic sparkle
        this.presets.set('magic', {
            id: 'magic', name: 'Magic Sparkle',
            position: { x: 0, y: 0 }, rate: 30, maxParticles: 100,
            particle: {
                lifetime: { min: 0.5, max: 1 },
                speed: { min: 20, max: 50 },
                direction: { min: 0, max: 360 },
                size: { start: { min: 5, max: 10 }, end: { min: 1, max: 3 } },
                color: {
                    start: { r: 100, g: 150, b: 255, a: 1 },
                    end: { r: 200, g: 100, b: 255, a: 0 }
                },
                gravity: -20, rotation: { min: 0, max: 360 }, rotationSpeed: { min: 0, max: 0 }
            },
            blendMode: 'additive'
        });

        // Smoke
        this.presets.set('smoke', {
            id: 'smoke', name: 'Smoke',
            position: { x: 0, y: 0 }, rate: 20, maxParticles: 100,
            particle: {
                lifetime: { min: 2, max: 4 },
                speed: { min: 20, max: 40 },
                direction: { min: 250, max: 290 },
                size: { start: { min: 20, max: 40 }, end: { min: 60, max: 100 } },
                color: {
                    start: { r: 100, g: 100, b: 100, a: 0.8 },
                    end: { r: 150, g: 150, b: 150, a: 0 }
                },
                gravity: -10, rotation: { min: 0, max: 360 }, rotationSpeed: { min: -20, max: 20 }
            },
            blendMode: 'normal'
        });

        // Rain
        this.presets.set('rain', {
            id: 'rain', name: 'Rain',
            position: { x: 0, y: 0 }, rate: 200, maxParticles: 500,
            particle: {
                lifetime: { min: 0.5, max: 1 },
                speed: { min: 400, max: 600 },
                direction: { min: 85, max: 95 },
                size: { start: { min: 2, max: 4 }, end: { min: 2, max: 4 } },
                color: {
                    start: { r: 150, g: 200, b: 255, a: 0.7 },
                    end: { r: 150, g: 200, b: 255, a: 0.3 }
                },
                gravity: 200, rotation: { min: 0, max: 0 }, rotationSpeed: { min: 0, max: 0 }
            },
            blendMode: 'normal'
        });

        // Blood splatter
        this.presets.set('blood', {
            id: 'blood', name: 'Blood',
            position: { x: 0, y: 0 }, rate: 0, maxParticles: 50,
            burst: { count: 30, interval: 0 }, lifetime: 0.1,
            particle: {
                lifetime: { min: 0.3, max: 0.6 },
                speed: { min: 100, max: 200 },
                direction: { min: 200, max: 340 },
                size: { start: { min: 5, max: 15 }, end: { min: 3, max: 8 } },
                color: {
                    start: { r: 180, g: 0, b: 0, a: 1 },
                    end: { r: 100, g: 0, b: 0, a: 0.5 }
                },
                gravity: 300, rotation: { min: 0, max: 360 }, rotationSpeed: { min: 0, max: 0 }
            },
            blendMode: 'normal'
        });
    }

    getPreset(name: string): EmitterConfig | undefined {
        return this.presets.get(name);
    }

    getAllPresets(): EmitterConfig[] {
        return Array.from(this.presets.values());
    }

    createCustomEmitter(config: Partial<EmitterConfig>): EmitterConfig {
        return {
            id: config.id || `emitter_${Date.now()}`,
            name: config.name || 'Custom Emitter',
            position: config.position || { x: 0, y: 0 },
            rate: config.rate ?? 10,
            maxParticles: config.maxParticles ?? 100,
            particle: {
                lifetime: config.particle?.lifetime || { min: 1, max: 2 },
                speed: config.particle?.speed || { min: 50, max: 100 },
                direction: config.particle?.direction || { min: 0, max: 360 },
                size: config.particle?.size || { start: { min: 5, max: 10 }, end: { min: 1, max: 3 } },
                color: config.particle?.color || {
                    start: { r: 255, g: 255, b: 255, a: 1 },
                    end: { r: 255, g: 255, b: 255, a: 0 }
                },
                gravity: config.particle?.gravity ?? 0,
                rotation: config.particle?.rotation || { min: 0, max: 0 },
                rotationSpeed: config.particle?.rotationSpeed || { min: 0, max: 0 }
            },
            ...config
        };
    }

    generateParticleCode(): string {
        return `
// Particle System
class Particle {
    constructor(config) {
        this.x = config.position.x;
        this.y = config.position.y;
        this.vx = config.velocity.x;
        this.vy = config.velocity.y;
        this.size = config.size.start;
        this.sizeEnd = config.size.end;
        this.color = { ...config.color.start };
        this.colorEnd = config.color.end;
        this.lifetime = config.lifetime;
        this.maxLifetime = config.lifetime;
        this.rotation = config.rotation;
        this.rotationSpeed = config.rotationSpeed;
        this.gravity = config.gravity || 0;
    }

    update(dt) {
        this.lifetime -= dt;
        const t = 1 - (this.lifetime / this.maxLifetime);

        // Position
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Size interpolation
        this.size = this.lerp(this.sizeStart, this.sizeEnd, t);

        // Color interpolation
        this.color.r = this.lerp(this.colorStart.r, this.colorEnd.r, t);
        this.color.g = this.lerp(this.colorStart.g, this.colorEnd.g, t);
        this.color.b = this.lerp(this.colorStart.b, this.colorEnd.b, t);
        this.color.a = this.lerp(this.colorStart.a, this.colorEnd.a, t);

        // Rotation
        this.rotation += this.rotationSpeed * dt;
    }

    lerp(a, b, t) { return a + (b - a) * t; }
    get isDead() { return this.lifetime <= 0; }
}

class ParticleEmitter {
    constructor(config) {
        this.config = config;
        this.particles = [];
        this.emitTimer = 0;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        // Emit new particles
        this.emitTimer += dt;
        while (this.emitTimer >= 1 / this.config.rate && 
               this.particles.length < this.config.maxParticles) {
            this.emit();
            this.emitTimer -= 1 / this.config.rate;
        }

        // Update particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.isDead);
    }

    emit() {
        const cfg = this.config.particle;
        const angle = this.random(cfg.direction.min, cfg.direction.max) * Math.PI / 180;
        const speed = this.random(cfg.speed.min, cfg.speed.max);

        this.particles.push(new Particle({
            position: { ...this.config.position },
            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            size: { 
                start: this.random(cfg.size.start.min, cfg.size.start.max),
                end: this.random(cfg.size.end.min, cfg.size.end.max)
            },
            color: { start: cfg.color.start, end: cfg.color.end },
            lifetime: this.random(cfg.lifetime.min, cfg.lifetime.max),
            rotation: this.random(cfg.rotation.min, cfg.rotation.max),
            rotationSpeed: this.random(cfg.rotationSpeed.min, cfg.rotationSpeed.max),
            gravity: cfg.gravity
        }));
    }

    random(min, max) { return min + Math.random() * (max - min); }

    draw(ctx) {
        ctx.save();
        if (this.config.blendMode === 'additive') {
            ctx.globalCompositeOperation = 'lighter';
        }
        
        this.particles.forEach(p => {
            ctx.fillStyle = \`rgba(\${p.color.r}, \${p.color.g}, \${p.color.b}, \${p.color.a})\`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}`;
    }
}

export const particleEffectsSystem = ParticleEffectsSystem.getInstance();
