/**
 * 📋 Code Snippet Library
 * 
 * Pre-built code snippets for common game patterns
 */

import { EventEmitter } from 'events';

export interface CodeSnippet {
    id: string;
    name: string;
    category: string;
    language: string;
    description: string;
    code: string;
    tags: string[];
}

export class CodeSnippetLibrary extends EventEmitter {
    private static instance: CodeSnippetLibrary;
    private snippets: Map<string, CodeSnippet> = new Map();

    private constructor() {
        super();
        this.initializeSnippets();
    }

    static getInstance(): CodeSnippetLibrary {
        if (!CodeSnippetLibrary.instance) {
            CodeSnippetLibrary.instance = new CodeSnippetLibrary();
        }
        return CodeSnippetLibrary.instance;
    }

    private initializeSnippets(): void {
        // Movement snippets
        this.addSnippet({
            id: 'player-movement-wasd',
            name: 'WASD Movement',
            category: 'movement',
            language: 'javascript',
            description: 'Basic WASD player movement',
            tags: ['player', 'input', 'movement'],
            code: `// WASD Movement
const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function updateMovement(player, speed = 5) {
    if (keys.w) player.y -= speed;
    if (keys.s) player.y += speed;
    if (keys.a) player.x -= speed;
    if (keys.d) player.x += speed;
}`
        });

        this.addSnippet({
            id: 'platformer-physics',
            name: 'Platformer Physics',
            category: 'physics',
            language: 'javascript',
            description: 'Gravity and jump mechanics',
            tags: ['platformer', 'physics', 'jump'],
            code: `// Platformer Physics
function updatePhysics(entity, dt) {
    const GRAVITY = 980;
    const JUMP_FORCE = -400;
    
    // Apply gravity
    entity.vy += GRAVITY * dt;
    
    // Jump
    if (entity.onGround && keys.space) {
        entity.vy = JUMP_FORCE;
        entity.onGround = false;
    }
    
    // Apply velocity
    entity.y += entity.vy * dt;
    
    // Ground collision
    if (entity.y > groundY) {
        entity.y = groundY;
        entity.vy = 0;
        entity.onGround = true;
    }
}`
        });

        this.addSnippet({
            id: 'game-loop',
            name: 'Game Loop',
            category: 'core',
            language: 'javascript',
            description: 'Basic game loop with delta time',
            tags: ['loop', 'core', 'animation'],
            code: `// Game Loop with Delta Time
let lastTime = 0;

function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    update(dt);
    render();
    
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Update game state
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw game
}

requestAnimationFrame(gameLoop);`
        });

        this.addSnippet({
            id: 'collision-aabb',
            name: 'AABB Collision',
            category: 'physics',
            language: 'javascript',
            description: 'Axis-aligned bounding box collision',
            tags: ['collision', 'physics', 'hitbox'],
            code: `// AABB Collision Detection
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Circle collision
function circleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.radius + b.radius;
}`
        });

        this.addSnippet({
            id: 'sprite-animation',
            name: 'Sprite Animation',
            category: 'animation',
            language: 'javascript',
            description: 'Frame-based sprite animation',
            tags: ['sprite', 'animation', 'frames'],
            code: `// Sprite Animation
class SpriteAnimator {
    constructor(spriteSheet, frameWidth, frameHeight) {
        this.image = spriteSheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.currentFrame = 0;
        this.frameTime = 0.1;
        this.timer = 0;
        this.animations = new Map();
        this.currentAnim = null;
    }

    addAnimation(name, frames) {
        this.animations.set(name, frames);
    }

    play(name) {
        if (this.currentAnim !== name) {
            this.currentAnim = name;
            this.currentFrame = 0;
            this.timer = 0;
        }
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.frameTime) {
            this.timer = 0;
            const frames = this.animations.get(this.currentAnim);
            this.currentFrame = (this.currentFrame + 1) % frames.length;
        }
    }

    draw(ctx, x, y) {
        const frames = this.animations.get(this.currentAnim);
        const frame = frames[this.currentFrame];
        ctx.drawImage(
            this.image,
            frame * this.frameWidth, 0,
            this.frameWidth, this.frameHeight,
            x, y,
            this.frameWidth, this.frameHeight
        );
    }
}`
        });

        this.addSnippet({
            id: 'particle-system',
            name: 'Particle System',
            category: 'effects',
            language: 'javascript',
            description: 'Simple particle effect system',
            tags: ['particles', 'effects', 'vfx'],
            code: `// Simple Particle System
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1,
                size: 3 + Math.random() * 5,
                color: \`hsl(\${Math.random() * 60}, 100%, 50%)\`
            });
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            return p.life > 0;
        });
    }

    render(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}`
        });

        this.addSnippet({
            id: 'input-manager',
            name: 'Input Manager',
            category: 'input',
            language: 'javascript',
            description: 'Unified keyboard and gamepad input',
            tags: ['input', 'keyboard', 'gamepad'],
            code: `// Input Manager
class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        
        document.addEventListener('keydown', e => {
            if (!this.keys[e.code]) this.keysPressed[e.code] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });
    }

    isDown(key) {
        return !!this.keys[key];
    }

    isPressed(key) {
        const pressed = !!this.keysPressed[key];
        this.keysPressed[key] = false;
        return pressed;
    }

    getAxis(negative, positive) {
        return (this.isDown(positive) ? 1 : 0) - (this.isDown(negative) ? 1 : 0);
    }
}

const input = new InputManager();`
        });

        this.addSnippet({
            id: 'camera-follow',
            name: 'Camera Follow',
            category: 'camera',
            language: 'javascript',
            description: 'Smooth camera following player',
            tags: ['camera', 'follow', 'smooth'],
            code: `// Smooth Camera Follow
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.smoothing = 0.1;
        this.deadzone = { x: 50, y: 30 };
    }

    follow(target, worldWidth, worldHeight) {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        // Deadzone
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        if (Math.abs(dx) > this.deadzone.x) {
            this.x += (targetX - this.x) * this.smoothing;
        }
        if (Math.abs(dy) > this.deadzone.y) {
            this.y += (targetY - this.y) * this.smoothing;
        }
        
        // Clamp to world bounds
        this.x = Math.max(0, Math.min(this.x, worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, worldHeight - this.height));
    }

    apply(ctx) {
        ctx.translate(-this.x, -this.y);
    }
}`
        });
    }

    addSnippet(snippet: CodeSnippet): void {
        this.snippets.set(snippet.id, snippet);
    }

    getSnippet(id: string): CodeSnippet | undefined {
        return this.snippets.get(id);
    }

    getByCategory(category: string): CodeSnippet[] {
        return Array.from(this.snippets.values())
            .filter(s => s.category === category);
    }

    search(query: string): CodeSnippet[] {
        const q = query.toLowerCase();
        return Array.from(this.snippets.values())
            .filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.tags.some(t => t.toLowerCase().includes(q))
            );
    }

    getAllCategories(): string[] {
        return [...new Set(Array.from(this.snippets.values()).map(s => s.category))];
    }

    getAll(): CodeSnippet[] {
        return Array.from(this.snippets.values());
    }
}

export const codeSnippetLibrary = CodeSnippetLibrary.getInstance();
