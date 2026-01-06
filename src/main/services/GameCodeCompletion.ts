/**
 * 🧠 Game Code Completion
 * 
 * AI-powered code suggestions for game development:
 * - Context-aware completions
 * - Game pattern recognition
 * - Physics calculations
 * - Shader snippets
 */

import { EventEmitter } from 'events';

export interface CompletionContext {
    code: string;
    cursorPosition: number;
    filePath: string;
    language: string;
    gameFramework?: string;
}

export interface CompletionItem {
    label: string;
    insertText: string;
    detail: string;
    kind: 'function' | 'snippet' | 'variable' | 'class' | 'property';
    documentation?: string;
}

export class GameCodeCompletion extends EventEmitter {
    private static instance: GameCodeCompletion;
    private patterns: Map<string, CompletionItem[]> = new Map();

    private constructor() {
        super();
        this.initializePatterns();
    }

    static getInstance(): GameCodeCompletion {
        if (!GameCodeCompletion.instance) {
            GameCodeCompletion.instance = new GameCodeCompletion();
        }
        return GameCodeCompletion.instance;
    }

    private initializePatterns(): void {
        // Physics patterns
        this.patterns.set('physics', [
            {
                label: 'applyGravity',
                insertText: `velocity.y += gravity * deltaTime;
position.y += velocity.y * deltaTime;`,
                detail: 'Apply gravity to velocity',
                kind: 'snippet',
                documentation: 'Standard gravity calculation with delta time'
            },
            {
                label: 'bounceCollision',
                insertText: `if (position.y + height > groundY) {
    position.y = groundY - height;
    velocity.y = -velocity.y * bounceFactor;
}`,
                detail: 'Bounce off ground',
                kind: 'snippet'
            },
            {
                label: 'circleCollision',
                insertText: `function circleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.radius + b.radius;
}`,
                detail: 'Circle-to-circle collision',
                kind: 'function'
            },
            {
                label: 'aabbCollision',
                insertText: `function aabbCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}`,
                detail: 'AABB collision detection',
                kind: 'function'
            }
        ]);

        // Enemy AI patterns
        this.patterns.set('enemyAI', [
            {
                label: 'chasePlayer',
                insertText: `const dx = player.x - enemy.x;
const dy = player.y - enemy.y;
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist > 0) {
    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;
}`,
                detail: 'Chase player directly',
                kind: 'snippet'
            },
            {
                label: 'patrolBehavior',
                insertText: `if (Math.abs(enemy.x - enemy.patrolTarget.x) < 5) {
    enemy.patrolDirection *= -1;
    enemy.patrolTarget.x = enemy.x + enemy.patrolDistance * enemy.patrolDirection;
}
enemy.x += enemy.speed * enemy.patrolDirection * dt;`,
                detail: 'Horizontal patrol',
                kind: 'snippet'
            },
            {
                label: 'fleeFromPlayer',
                insertText: `const dx = enemy.x - player.x;
const dy = enemy.y - player.y;
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist < enemy.fleeDistance && dist > 0) {
    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;
}`,
                detail: 'Flee from player',
                kind: 'snippet'
            }
        ]);

        // Player controls
        this.patterns.set('controls', [
            {
                label: 'platformerControls',
                insertText: `// Horizontal movement
if (keys.left) player.vx = -player.speed;
else if (keys.right) player.vx = player.speed;
else player.vx *= friction;

// Jump
if (keys.jump && player.grounded) {
    player.vy = -player.jumpForce;
    player.grounded = false;
}`,
                detail: 'Platformer movement',
                kind: 'snippet'
            },
            {
                label: 'topDownControls',
                insertText: `player.vx = 0;
player.vy = 0;
if (keys.left) player.vx = -player.speed;
if (keys.right) player.vx = player.speed;
if (keys.up) player.vy = -player.speed;
if (keys.down) player.vy = player.speed;

// Normalize diagonal
if (player.vx !== 0 && player.vy !== 0) {
    player.vx *= 0.707;
    player.vy *= 0.707;
}`,
                detail: 'Top-down 8-directional',
                kind: 'snippet'
            }
        ]);

        // Game loops
        this.patterns.set('gameLoop', [
            {
                label: 'fixedTimestep',
                insertText: `const TIMESTEP = 1000 / 60;
let accumulator = 0;
let lastTime = performance.now();

function gameLoop(currentTime) {
    const dt = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += dt;

    while (accumulator >= TIMESTEP) {
        update(TIMESTEP / 1000);
        accumulator -= TIMESTEP;
    }

    render();
    requestAnimationFrame(gameLoop);
}`,
                detail: 'Fixed timestep loop',
                kind: 'snippet'
            }
        ]);

        // Particles
        this.patterns.set('particles', [
            {
                label: 'particleEmit',
                insertText: `function emitParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200 - 100,
            life: 1,
            color: \`hsl(\${Math.random() * 60 + 10}, 100%, 50%)\`
        });
    }
}`,
                detail: 'Burst particle emission',
                kind: 'function'
            }
        ]);

        // Camera
        this.patterns.set('camera', [
            {
                label: 'smoothFollow',
                insertText: `camera.x += (target.x - camera.x) * smoothing * dt;
camera.y += (target.y - camera.y) * smoothing * dt;`,
                detail: 'Smooth camera follow',
                kind: 'snippet'
            },
            {
                label: 'screenShake',
                insertText: `function shake(intensity, duration) {
    shakeIntensity = intensity;
    shakeDuration = duration;
}

function updateShake(dt) {
    if (shakeDuration > 0) {
        shakeOffset.x = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeOffset.y = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeDuration -= dt;
    } else {
        shakeOffset.x = shakeOffset.y = 0;
    }
}`,
                detail: 'Screen shake effect',
                kind: 'function'
            }
        ]);
    }

    getCompletions(context: CompletionContext): CompletionItem[] {
        const results: CompletionItem[] = [];
        const codeSnippet = context.code.slice(Math.max(0, context.cursorPosition - 50), context.cursorPosition).toLowerCase();

        // Match patterns based on context
        if (codeSnippet.includes('veloc') || codeSnippet.includes('gravity') || codeSnippet.includes('collis')) {
            results.push(...(this.patterns.get('physics') || []));
        }

        if (codeSnippet.includes('enemy') || codeSnippet.includes('chase') || codeSnippet.includes('patrol')) {
            results.push(...(this.patterns.get('enemyAI') || []));
        }

        if (codeSnippet.includes('player') || codeSnippet.includes('move') || codeSnippet.includes('jump')) {
            results.push(...(this.patterns.get('controls') || []));
        }

        if (codeSnippet.includes('loop') || codeSnippet.includes('update') || codeSnippet.includes('timestep')) {
            results.push(...(this.patterns.get('gameLoop') || []));
        }

        if (codeSnippet.includes('particle') || codeSnippet.includes('emit') || codeSnippet.includes('effect')) {
            results.push(...(this.patterns.get('particles') || []));
        }

        if (codeSnippet.includes('camera') || codeSnippet.includes('shake') || codeSnippet.includes('follow')) {
            results.push(...(this.patterns.get('camera') || []));
        }

        // If no specific match, return common ones
        if (results.length === 0) {
            this.patterns.forEach(items => results.push(...items.slice(0, 2)));
        }

        return results.slice(0, 10);
    }

    getAllPatternCategories(): string[] {
        return Array.from(this.patterns.keys());
    }

    getPatternsByCategory(category: string): CompletionItem[] {
        return this.patterns.get(category) || [];
    }
}

export const gameCodeCompletion = GameCodeCompletion.getInstance();
