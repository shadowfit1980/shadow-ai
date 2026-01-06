/**
 * 🤖 Natural Language Game Design
 * 
 * Convert natural language to game mechanics:
 * - Parse game descriptions
 * - Generate game code
 * - Suggest mechanics
 */

import { EventEmitter } from 'events';

export interface GameDesignRequest {
    description: string;
    genre?: string;
    mechanics?: string[];
}

export interface GameDesignResult {
    genre: string;
    mechanics: string[];
    suggestedFeatures: string[];
    generatedCode: string;
}

export class NaturalLanguageGameDesign extends EventEmitter {
    private static instance: NaturalLanguageGameDesign;

    private constructor() { super(); }

    static getInstance(): NaturalLanguageGameDesign {
        if (!NaturalLanguageGameDesign.instance) {
            NaturalLanguageGameDesign.instance = new NaturalLanguageGameDesign();
        }
        return NaturalLanguageGameDesign.instance;
    }

    parseDescription(description: string): GameDesignResult {
        const desc = description.toLowerCase();
        const result: GameDesignResult = {
            genre: this.detectGenre(desc),
            mechanics: this.detectMechanics(desc),
            suggestedFeatures: [],
            generatedCode: ''
        };

        result.suggestedFeatures = this.suggestFeatures(result.genre, result.mechanics);
        result.generatedCode = this.generateCode(result);

        return result;
    }

    private detectGenre(desc: string): string {
        const genreKeywords: Record<string, string[]> = {
            platformer: ['jump', 'platform', 'mario', 'run and jump', 'side-scrolling'],
            rpg: ['rpg', 'quest', 'level up', 'inventory', 'stats', 'characters'],
            shooter: ['shoot', 'gun', 'bullet', 'enemies', 'weapon', 'fps', 'space invaders'],
            puzzle: ['puzzle', 'match', 'solve', 'brain', 'logic', 'block'],
            racing: ['race', 'car', 'drive', 'speed', 'track', 'vehicle'],
            fighting: ['fight', 'combat', 'punch', 'kick', 'versus', 'fighting'],
            rhythm: ['rhythm', 'music', 'beat', 'notes', 'timing', 'dance'],
            strategy: ['strategy', 'build', 'resource', 'army', 'tower defense', 'rts'],
            adventure: ['adventure', 'explore', 'story', 'open world', 'quest']
        };

        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some(k => desc.includes(k))) {
                return genre;
            }
        }

        return 'action';
    }

    private detectMechanics(desc: string): string[] {
        const mechanics: string[] = [];
        const mechanicKeywords: Record<string, string[]> = {
            movement: ['move', 'walk', 'run', 'player moves'],
            jump: ['jump', 'hop', 'leap', 'double jump'],
            shooting: ['shoot', 'fire', 'bullet', 'projectile'],
            melee: ['attack', 'sword', 'melee', 'punch', 'hit'],
            health: ['health', 'hp', 'life', 'damage', 'die'],
            inventory: ['inventory', 'item', 'collect', 'pickup'],
            enemies: ['enemy', 'enemies', 'monster', 'boss'],
            score: ['score', 'points', 'high score', 'ranking'],
            powerups: ['powerup', 'power-up', 'boost', 'ability'],
            levels: ['level', 'stage', 'world', 'progression'],
            save: ['save', 'load', 'progress', 'checkpoint'],
            multiplayer: ['multiplayer', 'co-op', 'pvp', 'online']
        };

        for (const [mechanic, keywords] of Object.entries(mechanicKeywords)) {
            if (keywords.some(k => desc.includes(k))) {
                mechanics.push(mechanic);
            }
        }

        return mechanics.length > 0 ? mechanics : ['movement', 'enemies', 'score'];
    }

    private suggestFeatures(genre: string, mechanics: string[]): string[] {
        const suggestions: string[] = [];

        // Genre-based suggestions
        const genreSuggestions: Record<string, string[]> = {
            platformer: ['Wall jump', 'Moving platforms', 'Collectibles', 'Checkpoints'],
            rpg: ['Skill tree', 'Crafting', 'NPC dialogue', 'Quests'],
            shooter: ['Weapon upgrades', 'Ammo system', 'Boss battles', 'Combo scoring'],
            puzzle: ['Hint system', 'Undo/Redo', 'Star rating', 'Daily challenges'],
            racing: ['Drift mechanics', 'Boost pads', 'Lap times', 'Ghost replays'],
            rhythm: ['Combo system', 'Perfect timing bonus', 'Difficulty levels', 'Custom songs'],
            strategy: ['Fog of war', 'Resource management', 'Unit upgrades', 'Tech tree'],
            adventure: ['Day/night cycle', 'Weather', 'Map system', 'Fast travel']
        };

        if (genreSuggestions[genre]) {
            suggestions.push(...genreSuggestions[genre]);
        }

        // Missing mechanic suggestions
        if (!mechanics.includes('health')) suggestions.push('Add health/lives system');
        if (!mechanics.includes('score')) suggestions.push('Add scoring system');
        if (!mechanics.includes('save')) suggestions.push('Add save/load functionality');

        return suggestions.slice(0, 5);
    }

    private generateCode(design: GameDesignResult): string {
        let code = `// Auto-generated game code for: ${design.genre.toUpperCase()}\n\n`;

        code += `class Game {\n`;
        code += `    constructor(canvas) {\n`;
        code += `        this.canvas = canvas;\n`;
        code += `        this.ctx = canvas.getContext('2d');\n`;
        code += `        this.player = { x: 100, y: 300, vx: 0, vy: 0, health: 100 };\n`;
        code += `        this.entities = [];\n`;
        code += `        this.score = 0;\n`;
        code += `        this.init();\n`;
        code += `    }\n\n`;

        // Init based on genre
        code += `    init() {\n`;
        code += `        // Initialize ${design.genre} game\n`;

        if (design.mechanics.includes('enemies')) {
            code += `        this.spawnEnemies(5);\n`;
        }
        if (design.mechanics.includes('powerups')) {
            code += `        this.spawnPowerups(3);\n`;
        }

        code += `        this.startGameLoop();\n`;
        code += `    }\n\n`;

        // Update method
        code += `    update(dt) {\n`;
        if (design.mechanics.includes('movement')) {
            code += `        this.handleInput(dt);\n`;
        }
        if (design.mechanics.includes('jump') || design.genre === 'platformer') {
            code += `        this.applyPhysics(dt);\n`;
        }
        if (design.mechanics.includes('enemies')) {
            code += `        this.updateEnemies(dt);\n`;
            code += `        this.checkCollisions();\n`;
        }
        code += `    }\n\n`;

        // Basic methods
        code += `    handleInput(dt) {\n`;
        code += `        // Movement input handling\n`;
        code += `        const speed = 200;\n`;
        code += `        if (this.keys.left) this.player.x -= speed * dt;\n`;
        code += `        if (this.keys.right) this.player.x += speed * dt;\n`;

        if (design.mechanics.includes('jump')) {
            code += `        if (this.keys.up && this.player.grounded) {\n`;
            code += `            this.player.vy = -400;\n`;
            code += `            this.player.grounded = false;\n`;
            code += `        }\n`;
        }

        code += `    }\n`;

        code += `}\n`;

        return code;
    }

    getSupportedGenres(): string[] {
        return ['platformer', 'rpg', 'shooter', 'puzzle', 'racing', 'fighting', 'rhythm', 'strategy', 'adventure', 'action'];
    }

    getSupportedMechanics(): string[] {
        return ['movement', 'jump', 'shooting', 'melee', 'health', 'inventory', 'enemies', 'score', 'powerups', 'levels', 'save', 'multiplayer'];
    }
}

export const naturalLanguageGameDesign = NaturalLanguageGameDesign.getInstance();
