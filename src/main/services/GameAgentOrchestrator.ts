/**
 * 🎮 Game Agent Orchestrator
 * 
 * Master coordinator for autonomous game creation:
 * - Analyzes game requirements
 * - Coordinates all game services
 * - Generates complete games
 * - Handles the full pipeline
 */

import { EventEmitter } from 'events';
import { gameProjectScaffolder, ProjectConfig } from './GameProjectScaffolder';

export interface GameSpec {
    title: string;
    description: string;
    genre: 'platformer' | 'rpg' | 'shooter' | 'puzzle' | 'racing' | 'strategy' | 'roguelike';
    complexity: 'simple' | 'medium' | 'complex';
    features: string[];
    art: 'pixel' | '2d' | '3d' | 'minimal';
    audio: boolean;
    multiplayer: boolean;
    mobile: boolean;
}

export interface GameBuildResult {
    success: boolean;
    projectPath: string;
    files: string[];
    errors: string[];
    warnings: string[];
    commands: { install: string; dev: string; build: string };
    features: string[];
}

export class GameAgentOrchestrator extends EventEmitter {
    private static instance: GameAgentOrchestrator;

    private constructor() { super(); }

    static getInstance(): GameAgentOrchestrator {
        if (!GameAgentOrchestrator.instance) {
            GameAgentOrchestrator.instance = new GameAgentOrchestrator();
        }
        return GameAgentOrchestrator.instance;
    }

    // ========================================================================
    // MAIN ORCHESTRATION
    // ========================================================================

    async createGame(spec: GameSpec, outputPath: string): Promise<GameBuildResult> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const features: string[] = [];

        this.emit('buildStart', { spec });

        try {
            // Step 1: Analyze requirements
            this.emit('step', { step: 'analyze', message: 'Analyzing game requirements...' });
            const analysis = this.analyzeRequirements(spec);
            features.push(...analysis.features);

            // Step 2: Select framework
            this.emit('step', { step: 'framework', message: 'Selecting optimal framework...' });
            const framework = this.selectFramework(spec);

            // Step 3: Create project structure
            this.emit('step', { step: 'scaffold', message: 'Creating project structure...' });
            const config: ProjectConfig = {
                name: this.sanitizeName(spec.title),
                framework,
                genre: spec.genre,
                features: analysis.features,
                multiplayer: spec.multiplayer,
                mobile: spec.mobile,
                outputPath
            };

            const project = await gameProjectScaffolder.createProject(config);

            // Step 4: Add additional systems based on complexity
            this.emit('step', { step: 'systems', message: 'Adding game systems...' });
            const systemsAdded = await this.addGameSystems(project.path, spec);
            features.push(...systemsAdded);

            this.emit('buildComplete', { success: true, path: project.path });

            return {
                success: true,
                projectPath: project.path,
                files: project.files,
                errors,
                warnings,
                commands: project.commands,
                features
            };

        } catch (error: any) {
            errors.push(error.message);
            this.emit('buildError', { error: error.message });

            return {
                success: false,
                projectPath: '',
                files: [],
                errors,
                warnings,
                commands: { install: '', dev: '', build: '' },
                features
            };
        }
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    private analyzeRequirements(spec: GameSpec): { features: string[]; complexity: number } {
        const features: string[] = [];
        let complexity = 1;

        // Base features by genre
        const genreFeatures: Record<string, string[]> = {
            platformer: ['jumping', 'platforms', 'collectibles', 'enemies', 'physics'],
            rpg: ['inventory', 'dialog', 'quests', 'npcs', 'stats'],
            shooter: ['bullets', 'enemies', 'waves', 'powerups', 'explosions'],
            puzzle: ['tiles', 'matching', 'scoring', 'levels', 'hints'],
            racing: ['vehicles', 'tracks', 'laps', 'ai-opponents', 'finish-line'],
            strategy: ['units', 'resources', 'buildings', 'ai', 'fog-of-war'],
            roguelike: ['procedural-levels', 'permadeath', 'items', 'enemies', 'progression']
        };

        features.push(...(genreFeatures[spec.genre] || []));

        // Add requested features
        features.push(...spec.features);

        // Complexity modifiers
        if (spec.multiplayer) { complexity += 2; features.push('multiplayer'); }
        if (spec.mobile) { complexity += 1; features.push('touch-controls'); }
        if (spec.audio) { complexity += 0.5; features.push('sound-effects', 'music'); }

        // Art style features
        if (spec.art === 'pixel') features.push('pixel-art-rendering');
        if (spec.art === '3d') { complexity += 2; features.push('3d-graphics'); }

        return { features: [...new Set(features)], complexity };
    }

    private selectFramework(spec: GameSpec): 'phaser' | 'three' | 'babylon' | 'pixi' | 'kaboom' | 'godot' {
        // 3D games
        if (spec.art === '3d') {
            return spec.complexity === 'complex' ? 'babylon' : 'three';
        }

        // Simple 2D games
        if (spec.complexity === 'simple') {
            return 'kaboom';
        }

        // Default to Phaser for 2D
        return 'phaser';
    }

    // ========================================================================
    // SYSTEM INTEGRATION
    // ========================================================================

    private async addGameSystems(projectPath: string, spec: GameSpec): Promise<string[]> {
        const added: string[] = [];
        const fs = require('fs');
        const path = require('path');

        // Add systems based on genre
        if (spec.genre === 'rpg') {
            // Add inventory system
            const inventoryCode = this.generateInventorySystem();
            fs.writeFileSync(path.join(projectPath, 'src', 'utils', 'inventory.ts'), inventoryCode);
            added.push('inventory-system');

            // Add quest system  
            const questCode = this.generateQuestSystem();
            fs.writeFileSync(path.join(projectPath, 'src', 'utils', 'quests.ts'), questCode);
            added.push('quest-system');
        }

        if (spec.genre === 'shooter' || spec.genre === 'platformer') {
            // Add particle effects
            const particleCode = this.generateParticleSystem();
            fs.writeFileSync(path.join(projectPath, 'src', 'utils', 'particles.ts'), particleCode);
            added.push('particle-effects');
        }

        if (spec.complexity !== 'simple') {
            // Add save system
            const saveCode = this.generateSaveSystem();
            fs.writeFileSync(path.join(projectPath, 'src', 'utils', 'save.ts'), saveCode);
            added.push('save-system');
        }

        if (spec.audio) {
            // Add audio manager
            const audioCode = this.generateAudioManager();
            fs.writeFileSync(path.join(projectPath, 'src', 'utils', 'audio.ts'), audioCode);
            added.push('audio-manager');
        }

        return added;
    }

    private generateInventorySystem(): string {
        return `
export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    type: 'weapon' | 'armor' | 'consumable' | 'key' | 'misc';
}

export class Inventory {
    private items: Map<string, InventoryItem> = new Map();
    private maxSlots = 20;

    add(item: InventoryItem): boolean {
        if (this.items.has(item.id)) {
            const existing = this.items.get(item.id)!;
            existing.quantity += item.quantity;
            return true;
        }
        
        if (this.items.size >= this.maxSlots) return false;
        
        this.items.set(item.id, { ...item });
        return true;
    }

    remove(id: string, quantity = 1): boolean {
        const item = this.items.get(id);
        if (!item || item.quantity < quantity) return false;
        
        item.quantity -= quantity;
        if (item.quantity <= 0) this.items.delete(id);
        return true;
    }

    has(id: string, quantity = 1): boolean {
        const item = this.items.get(id);
        return item ? item.quantity >= quantity : false;
    }

    getAll(): InventoryItem[] {
        return Array.from(this.items.values());
    }

    toJSON() {
        return Array.from(this.items.values());
    }

    fromJSON(data: InventoryItem[]) {
        this.items.clear();
        data.forEach(item => this.items.set(item.id, item));
    }
}

export const inventory = new Inventory();
`.trim();
    }

    private generateQuestSystem(): string {
        return `
export interface Quest {
    id: string;
    title: string;
    description: string;
    objectives: QuestObjective[];
    rewards: { gold?: number; xp?: number; items?: string[] };
    status: 'available' | 'active' | 'completed' | 'failed';
}

export interface QuestObjective {
    id: string;
    description: string;
    current: number;
    required: number;
}

class QuestManager {
    private quests: Map<string, Quest> = new Map();

    add(quest: Quest) {
        this.quests.set(quest.id, quest);
    }

    start(id: string): boolean {
        const quest = this.quests.get(id);
        if (quest?.status === 'available') {
            quest.status = 'active';
            return true;
        }
        return false;
    }

    updateObjective(questId: string, objectiveId: string, amount = 1) {
        const quest = this.quests.get(questId);
        if (!quest || quest.status !== 'active') return;

        const obj = quest.objectives.find(o => o.id === objectiveId);
        if (obj) {
            obj.current = Math.min(obj.current + amount, obj.required);
        }

        // Check completion
        if (quest.objectives.every(o => o.current >= o.required)) {
            quest.status = 'completed';
        }
    }

    getActive(): Quest[] {
        return Array.from(this.quests.values()).filter(q => q.status === 'active');
    }
}

export const questManager = new QuestManager();
`.trim();
    }

    private generateParticleSystem(): string {
        return `
interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    size: number; color: string;
}

export class ParticleEmitter {
    private particles: Particle[] = [];

    emit(x: number, y: number, count = 10, config?: Partial<{
        speed: number; spread: number; life: number; 
        size: number; color: string; gravity: number;
    }>) {
        const c = { speed: 100, spread: 360, life: 1, size: 5, color: '#ffff00', gravity: 0, ...config };
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() * c.spread - c.spread / 2) * Math.PI / 180;
            const speed = c.speed * (0.5 + Math.random() * 0.5);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: c.life, maxLife: c.life,
                size: c.size, color: c.color
            });
        }
    }

    update(dt: number, gravity = 300) {
        this.particles = this.particles.filter(p => {
            p.life -= dt;
            if (p.life <= 0) return false;
            
            p.vy += gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            return true;
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

export const particles = new ParticleEmitter();
`.trim();
    }

    private generateSaveSystem(): string {
        return `
export interface SaveData {
    version: string;
    timestamp: number;
    player: any;
    level: string;
    inventory: any[];
    quests: any[];
    settings: any;
}

class SaveManager {
    private key = 'game_save';

    save(data: Partial<SaveData>): boolean {
        try {
            const saveData: SaveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                player: data.player || {},
                level: data.level || 'level1',
                inventory: data.inventory || [],
                quests: data.quests || [],
                settings: data.settings || {}
            };
            localStorage.setItem(this.key, JSON.stringify(saveData));
            return true;
        } catch {
            return false;
        }
    }

    load(): SaveData | null {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    delete(): void {
        localStorage.removeItem(this.key);
    }

    hasSave(): boolean {
        return localStorage.getItem(this.key) !== null;
    }
}

export const saveManager = new SaveManager();
`.trim();
    }

    private generateAudioManager(): string {
        return `
class AudioManager {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private music: HTMLAudioElement | null = null;
    private soundVolume = 1;
    private musicVolume = 0.5;

    preload(id: string, src: string) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.sounds.set(id, audio);
    }

    play(id: string, volume = 1) {
        const sound = this.sounds.get(id);
        if (sound) {
            const clone = sound.cloneNode() as HTMLAudioElement;
            clone.volume = volume * this.soundVolume;
            clone.play().catch(() => {});
        }
    }

    playMusic(src: string, loop = true) {
        this.stopMusic();
        this.music = new Audio(src);
        this.music.loop = loop;
        this.music.volume = this.musicVolume;
        this.music.play().catch(() => {});
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music = null;
        }
    }

    setSoundVolume(v: number) { this.soundVolume = Math.max(0, Math.min(1, v)); }
    setMusicVolume(v: number) { 
        this.musicVolume = Math.max(0, Math.min(1, v));
        if (this.music) this.music.volume = this.musicVolume;
    }
}

export const audio = new AudioManager();
`.trim();
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private sanitizeName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // ========================================================================
    // QUICK GAME GENERATORS
    // ========================================================================

    async createPlatformer(title: string, outputPath: string): Promise<GameBuildResult> {
        return this.createGame({
            title,
            description: 'A fun platformer game',
            genre: 'platformer',
            complexity: 'medium',
            features: ['double-jump', 'collectibles', 'checkpoints'],
            art: 'pixel',
            audio: true,
            multiplayer: false,
            mobile: false
        }, outputPath);
    }

    async createRPG(title: string, outputPath: string): Promise<GameBuildResult> {
        return this.createGame({
            title,
            description: 'An epic RPG adventure',
            genre: 'rpg',
            complexity: 'complex',
            features: ['quests', 'inventory', 'dialog', 'combat', 'leveling'],
            art: 'pixel',
            audio: true,
            multiplayer: false,
            mobile: false
        }, outputPath);
    }

    async createShooter(title: string, outputPath: string): Promise<GameBuildResult> {
        return this.createGame({
            title,
            description: 'An action-packed shooter',
            genre: 'shooter',
            complexity: 'medium',
            features: ['waves', 'powerups', 'boss-fights', 'highscores'],
            art: '2d',
            audio: true,
            multiplayer: false,
            mobile: true
        }, outputPath);
    }
}

export const gameAgentOrchestrator = GameAgentOrchestrator.getInstance();
