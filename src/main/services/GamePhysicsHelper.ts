/**
 * Game Physics Helper Service
 * 
 * Physics calculations and code generation for games:
 * - Collision detection algorithms
 * - Movement physics (gravity, friction, velocity)
 * - Projectile motion
 * - Particle systems
 * - 2D and 3D physics formulas
 */

import { EventEmitter } from 'events';

export interface PhysicsBody {
    x: number;
    y: number;
    z?: number;
    width: number;
    height: number;
    depth?: number;
    velocityX: number;
    velocityY: number;
    velocityZ?: number;
    mass: number;
    friction: number;
    bounciness: number;
    isStatic: boolean;
}

export interface CollisionResult {
    collided: boolean;
    overlapX: number;
    overlapY: number;
    normal: { x: number; y: number };
}

export interface ProjectileParams {
    startX: number;
    startY: number;
    angle: number;  // degrees
    velocity: number;
    gravity: number;
}

export class GamePhysicsHelper extends EventEmitter {
    private static instance: GamePhysicsHelper;

    private constructor() { super(); }

    static getInstance(): GamePhysicsHelper {
        if (!GamePhysicsHelper.instance) {
            GamePhysicsHelper.instance = new GamePhysicsHelper();
        }
        return GamePhysicsHelper.instance;
    }

    // ========================================================================
    // COLLISION DETECTION
    // ========================================================================

    /**
     * AABB (Axis-Aligned Bounding Box) collision detection
     */
    checkAABBCollision(a: PhysicsBody, b: PhysicsBody): CollisionResult {
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

        if (overlapX > 0 && overlapY > 0) {
            const normalX = (a.x + a.width / 2) < (b.x + b.width / 2) ? -1 : 1;
            const normalY = (a.y + a.height / 2) < (b.y + b.height / 2) ? -1 : 1;

            return {
                collided: true,
                overlapX,
                overlapY,
                normal: {
                    x: overlapX < overlapY ? normalX : 0,
                    y: overlapY < overlapX ? normalY : 0
                }
            };
        }

        return { collided: false, overlapX: 0, overlapY: 0, normal: { x: 0, y: 0 } };
    }

    /**
     * Circle collision detection
     */
    checkCircleCollision(
        x1: number, y1: number, r1: number,
        x2: number, y2: number, r2: number
    ): { collided: boolean; distance: number; overlap: number } {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = r1 + r2;

        return {
            collided: distance < minDistance,
            distance,
            overlap: minDistance - distance
        };
    }

    /**
     * Generate collision detection code
     */
    generateCollisionCode(engine: 'unity' | 'godot' | 'phaser' | 'custom'): string {
        const templates: Record<string, string> = {
            unity: `
// Unity C# - AABB Collision
public bool CheckAABBCollision(BoxCollider a, BoxCollider b) {
    return a.bounds.Intersects(b.bounds);
}

// Or use built-in collision events:
void OnCollisionEnter(Collision collision) {
    Debug.Log("Collided with: " + collision.gameObject.name);
}

void OnTriggerEnter(Collider other) {
    Debug.Log("Triggered by: " + other.gameObject.name);
}`,
            godot: `
# GDScript - AABB Collision
func check_aabb_collision(a: Area2D, b: Area2D) -> bool:
    return a.get_overlapping_areas().has(b)

# Or use signals:
func _ready():
    connect("area_entered", self, "_on_area_entered")

func _on_area_entered(area: Area2D):
    print("Collided with: " + area.name)`,
            phaser: `
// Phaser 3 - Collision
this.physics.add.collider(player, platforms);

this.physics.add.overlap(player, coins, collectCoin, null, this);

function collectCoin(player, coin) {
    coin.disableBody(true, true);
    score += 10;
}`,
            custom: `
// Custom AABB Collision Detection
function checkAABB(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Resolve collision
function resolveCollision(a, b) {
    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    
    if (overlapX < overlapY) {
        a.x += (a.x < b.x) ? -overlapX : overlapX;
        a.velocityX *= -a.bounciness;
    } else {
        a.y += (a.y < b.y) ? -overlapY : overlapY;
        a.velocityY *= -a.bounciness;
    }
}`
        };

        return templates[engine] || templates.custom;
    }

    // ========================================================================
    // MOVEMENT PHYSICS
    // ========================================================================

    /**
     * Apply gravity to a body
     */
    applyGravity(body: PhysicsBody, gravity: number, deltaTime: number): void {
        if (!body.isStatic) {
            body.velocityY += gravity * deltaTime;
        }
    }

    /**
     * Apply friction to a body
     */
    applyFriction(body: PhysicsBody, deltaTime: number): void {
        if (!body.isStatic) {
            body.velocityX *= Math.pow(1 - body.friction, deltaTime);
            body.velocityY *= Math.pow(1 - body.friction, deltaTime);
        }
    }

    /**
     * Update body position based on velocity
     */
    updatePosition(body: PhysicsBody, deltaTime: number): void {
        if (!body.isStatic) {
            body.x += body.velocityX * deltaTime;
            body.y += body.velocityY * deltaTime;
            if (body.velocityZ !== undefined && body.z !== undefined) {
                body.z += body.velocityZ * deltaTime;
            }
        }
    }

    /**
     * Generate movement physics code
     */
    generateMovementCode(type: 'platformer' | 'topdown' | 'space'): string {
        const templates: Record<string, string> = {
            platformer: `
// Platformer Movement
const GRAVITY = 980;
const JUMP_FORCE = -400;
const MOVE_SPEED = 200;

function update(deltaTime) {
    // Apply gravity
    player.velocityY += GRAVITY * deltaTime;
    
    // Horizontal movement
    if (keys.left) player.velocityX = -MOVE_SPEED;
    else if (keys.right) player.velocityX = MOVE_SPEED;
    else player.velocityX *= 0.9; // Friction
    
    // Jump (only when grounded)
    if (keys.jump && player.isGrounded) {
        player.velocityY = JUMP_FORCE;
        player.isGrounded = false;
    }
    
    // Update position
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;
}`,
            topdown: `
// Top-Down Movement
const MOVE_SPEED = 200;
const FRICTION = 0.85;

function update(deltaTime) {
    let moveX = 0, moveY = 0;
    
    if (keys.left) moveX = -1;
    if (keys.right) moveX = 1;
    if (keys.up) moveY = -1;
    if (keys.down) moveY = 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
    }
    
    player.velocityX += moveX * MOVE_SPEED * deltaTime;
    player.velocityY += moveY * MOVE_SPEED * deltaTime;
    
    // Apply friction
    player.velocityX *= FRICTION;
    player.velocityY *= FRICTION;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
}`,
            space: `
// Space/Asteroids Movement
const THRUST = 150;
const ROTATION_SPEED = 180; // degrees per second
const FRICTION = 0.99;

function update(deltaTime) {
    // Rotation
    if (keys.left) ship.rotation -= ROTATION_SPEED * deltaTime;
    if (keys.right) ship.rotation += ROTATION_SPEED * deltaTime;
    
    // Thrust
    if (keys.thrust) {
        const radians = ship.rotation * Math.PI / 180;
        ship.velocityX += Math.cos(radians) * THRUST * deltaTime;
        ship.velocityY += Math.sin(radians) * THRUST * deltaTime;
    }
    
    // Apply friction (space drag)
    ship.velocityX *= FRICTION;
    ship.velocityY *= FRICTION;
    
    // Update position
    ship.x += ship.velocityX * deltaTime;
    ship.y += ship.velocityY * deltaTime;
    
    // Screen wrapping
    if (ship.x < 0) ship.x = screenWidth;
    if (ship.x > screenWidth) ship.x = 0;
    if (ship.y < 0) ship.y = screenHeight;
    if (ship.y > screenHeight) ship.y = 0;
}`
        };

        return templates[type] || templates.platformer;
    }

    // ========================================================================
    // PROJECTILE PHYSICS
    // ========================================================================

    /**
     * Calculate projectile trajectory
     */
    calculateProjectile(params: ProjectileParams, time: number): { x: number; y: number } {
        const radians = params.angle * Math.PI / 180;
        const vx = params.velocity * Math.cos(radians);
        const vy = params.velocity * Math.sin(radians);

        return {
            x: params.startX + vx * time,
            y: params.startY + vy * time + 0.5 * params.gravity * time * time
        };
    }

    /**
     * Calculate projectile landing point
     */
    calculateLandingPoint(params: ProjectileParams): { x: number; time: number } {
        const radians = params.angle * Math.PI / 180;
        const vy = params.velocity * Math.sin(radians);

        // Time to land: 0 = startY + vy*t + 0.5*g*t^2
        // Quadratic: t = (-vy ± sqrt(vy^2 - 2*g*startY)) / g
        const discriminant = vy * vy - 2 * params.gravity * params.startY;
        const time = (-vy - Math.sqrt(discriminant)) / params.gravity;

        const vx = params.velocity * Math.cos(radians);
        const x = params.startX + vx * time;

        return { x, time };
    }

    /**
     * Generate projectile code
     */
    generateProjectileCode(): string {
        return `
// Projectile Motion
class Projectile {
    constructor(x, y, angle, velocity, gravity = 980) {
        this.x = x;
        this.y = y;
        const radians = angle * Math.PI / 180;
        this.velocityX = velocity * Math.cos(radians);
        this.velocityY = velocity * Math.sin(radians);
        this.gravity = gravity;
        this.active = true;
    }
    
    update(deltaTime) {
        this.velocityY += this.gravity * deltaTime;
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Deactivate if off screen
        if (this.y > screenHeight) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Usage:
const bullet = new Projectile(player.x, player.y, -45, 500);
projectiles.push(bullet);`;
    }

    // ========================================================================
    // PARTICLE SYSTEM
    // ========================================================================

    /**
     * Generate particle system code
     */
    generateParticleSystemCode(): string {
        return `
// Simple Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 100;
        this.velocityY = (Math.random() - 0.5) * 100;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 4;
        this.color = color || '#ff6600';
    }
    
    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        this.velocityY += 200 * deltaTime; // Gravity
        this.life -= this.decay;
        this.size *= 0.99;
    }
    
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    get isDead() { return this.life <= 0; }
}

class ParticleEmitter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
    }
    
    emit(count = 10, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.x, this.y, color));
        }
    }
    
    update(deltaTime) {
        this.particles.forEach(p => p.update(deltaTime));
        this.particles = this.particles.filter(p => !p.isDead);
    }
    
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

// Usage:
const emitter = new ParticleEmitter(400, 300);
emitter.emit(50, '#ff0000'); // Red explosion`;
    }

    // ========================================================================
    // PHYSICS FORMULAS
    // ========================================================================

    /**
     * Calculate elastic collision velocities
     */
    elasticCollision(
        m1: number, v1: number,
        m2: number, v2: number
    ): { v1: number; v2: number } {
        const v1Final = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        const v2Final = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
        return { v1: v1Final, v2: v2Final };
    }

    /**
     * Calculate momentum
     */
    calculateMomentum(mass: number, velocity: number): number {
        return mass * velocity;
    }

    /**
     * Calculate kinetic energy
     */
    calculateKineticEnergy(mass: number, velocity: number): number {
        return 0.5 * mass * velocity * velocity;
    }
}

export const gamePhysicsHelper = GamePhysicsHelper.getInstance();
