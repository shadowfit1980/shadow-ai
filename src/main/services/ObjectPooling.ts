/**
 * 🔄 Object Pooling
 * 
 * Memory optimization:
 * - Pre-allocated objects
 * - Recycling
 * - Multiple pools
 */

import { EventEmitter } from 'events';

export interface PoolConfig {
    initialSize: number;
    maxSize: number;
    growthRate: number;
}

export class ObjectPooling extends EventEmitter {
    private static instance: ObjectPooling;

    private constructor() { super(); }

    static getInstance(): ObjectPooling {
        if (!ObjectPooling.instance) {
            ObjectPooling.instance = new ObjectPooling();
        }
        return ObjectPooling.instance;
    }

    generatePoolCode(): string {
        return `
class ObjectPool {
    constructor(factory, config = {}) {
        this.factory = factory;
        this.initialSize = config.initialSize || 10;
        this.maxSize = config.maxSize || 100;
        this.growthRate = config.growthRate || 5;
        
        this.available = [];
        this.active = new Set();
        this.totalCreated = 0;
        
        // Pre-populate
        for (let i = 0; i < this.initialSize; i++) {
            this.available.push(this.createObject());
        }
    }

    createObject() {
        this.totalCreated++;
        const obj = this.factory();
        obj._poolId = this.totalCreated;
        return obj;
    }

    acquire() {
        let obj;

        if (this.available.length > 0) {
            obj = this.available.pop();
        } else if (this.totalCreated < this.maxSize) {
            // Grow pool
            for (let i = 0; i < this.growthRate - 1 && this.totalCreated < this.maxSize; i++) {
                this.available.push(this.createObject());
            }
            obj = this.createObject();
        } else {
            console.warn('Object pool exhausted!');
            return null;
        }

        this.active.add(obj);
        
        // Reset object
        if (obj.reset) obj.reset();
        obj._active = true;

        return obj;
    }

    release(obj) {
        if (!obj || !this.active.has(obj)) return;

        this.active.delete(obj);
        obj._active = false;
        
        // Clean object
        if (obj.onRelease) obj.onRelease();
        
        this.available.push(obj);
    }

    releaseAll() {
        for (const obj of this.active) {
            obj._active = false;
            if (obj.onRelease) obj.onRelease();
            this.available.push(obj);
        }
        this.active.clear();
    }

    getStats() {
        return {
            available: this.available.length,
            active: this.active.size,
            total: this.totalCreated,
            utilization: this.active.size / this.totalCreated
        };
    }
}

// Particle pool example
class ParticlePool extends ObjectPool {
    constructor(maxParticles = 1000) {
        super(() => ({
            x: 0, y: 0,
            vx: 0, vy: 0,
            life: 0, maxLife: 1,
            size: 5, color: '#ffffff',
            alpha: 1,
            
            reset() {
                this.x = 0; this.y = 0;
                this.vx = 0; this.vy = 0;
                this.life = 0; this.maxLife = 1;
                this.size = 5; this.alpha = 1;
            }
        }), { initialSize: 100, maxSize: maxParticles });
    }

    spawn(x, y, vx, vy, life, size, color) {
        const p = this.acquire();
        if (!p) return null;
        
        p.x = x; p.y = y;
        p.vx = vx; p.vy = vy;
        p.life = 0; p.maxLife = life;
        p.size = size; p.color = color;
        p.alpha = 1;
        
        return p;
    }

    update(dt) {
        for (const p of this.active) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life += dt;
            p.alpha = 1 - (p.life / p.maxLife);
            
            if (p.life >= p.maxLife) {
                this.release(p);
            }
        }
    }

    render(ctx) {
        for (const p of this.active) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

// Bullet pool example
class BulletPool extends ObjectPool {
    constructor(maxBullets = 200) {
        super(() => ({
            x: 0, y: 0,
            vx: 0, vy: 0,
            damage: 1,
            owner: null,
            
            reset() {
                this.x = 0; this.y = 0;
                this.vx = 0; this.vy = 0;
                this.damage = 1;
                this.owner = null;
            }
        }), { initialSize: 50, maxSize: maxBullets });
    }

    spawn(x, y, angle, speed, damage, owner) {
        const bullet = this.acquire();
        if (!bullet) return null;
        
        bullet.x = x;
        bullet.y = y;
        bullet.vx = Math.cos(angle) * speed;
        bullet.vy = Math.sin(angle) * speed;
        bullet.damage = damage;
        bullet.owner = owner;
        
        return bullet;
    }

    update(dt, bounds) {
        for (const b of this.active) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            
            // Out of bounds check
            if (b.x < 0 || b.x > bounds.width || b.y < 0 || b.y > bounds.height) {
                this.release(b);
            }
        }
    }
}`;
    }
}

export const objectPooling = ObjectPooling.getInstance();
