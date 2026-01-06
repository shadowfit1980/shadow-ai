/**
 * Procedural Generation Service
 * 
 * AI-powered procedural content generation for games:
 * - Terrain/Dungeon generation
 * - Character/Item generation
 * - Quest/Dialogue generation
 * - Name generation
 */

import { EventEmitter } from 'events';

export interface TerrainParams {
    width: number;
    height: number;
    seed?: number;
    biome: 'forest' | 'desert' | 'snow' | 'ocean' | 'volcanic';
    features: ('mountains' | 'rivers' | 'lakes' | 'caves')[];
}

export interface DungeonParams {
    width: number;
    height: number;
    seed?: number;
    style: 'cave' | 'castle' | 'crypt' | 'temple' | 'sewer';
    rooms: number;
    corridorWidth: number;
    hasSecretRooms: boolean;
}

export interface CharacterParams {
    race?: string;
    class?: string;
    level?: number;
    alignment?: 'good' | 'neutral' | 'evil';
    personality?: string[];
}

export interface ItemParams {
    type: 'weapon' | 'armor' | 'potion' | 'artifact' | 'treasure';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    level?: number;
}

export interface QuestParams {
    type: 'fetch' | 'kill' | 'escort' | 'explore' | 'puzzle' | 'boss';
    difficulty: 'easy' | 'medium' | 'hard' | 'heroic';
    rewards?: string[];
}

export class ProceduralGenerationService extends EventEmitter {
    private static instance: ProceduralGenerationService;

    private constructor() { super(); }

    static getInstance(): ProceduralGenerationService {
        if (!ProceduralGenerationService.instance) {
            ProceduralGenerationService.instance = new ProceduralGenerationService();
        }
        return ProceduralGenerationService.instance;
    }

    // ========================================================================
    // TERRAIN GENERATION
    // ========================================================================

    generateTerrain(params: TerrainParams): number[][] {
        const { width, height, seed, biome } = params;
        const rng = this.seededRandom(seed || Date.now());

        // Initialize heightmap
        const heightmap: number[][] = [];

        // Generate using diamond-square algorithm simplified
        for (let y = 0; y < height; y++) {
            heightmap[y] = [];
            for (let x = 0; x < width; x++) {
                // Base noise
                const nx = x / width - 0.5;
                const ny = y / height - 0.5;

                // Multiple octaves of noise
                let value = this.noise2D(nx * 4, ny * 4, rng) * 0.5;
                value += this.noise2D(nx * 8, ny * 8, rng) * 0.25;
                value += this.noise2D(nx * 16, ny * 16, rng) * 0.125;

                // Normalize to 0-1
                value = (value + 1) / 2;

                // Apply biome modifiers
                value = this.applyBiomeModifier(value, biome);

                heightmap[y][x] = value;
            }
        }

        this.emit('terrainGenerated', { params, heightmap });
        return heightmap;
    }

    private applyBiomeModifier(value: number, biome: string): number {
        switch (biome) {
            case 'desert': return Math.pow(value, 0.7); // Flatter
            case 'snow': return Math.pow(value, 1.3); // More peaks
            case 'volcanic': return value > 0.7 ? value * 1.2 : value * 0.8;
            default: return value;
        }
    }

    // ========================================================================
    // DUNGEON GENERATION
    // ========================================================================

    generateDungeon(params: DungeonParams): { map: string[][]; rooms: any[] } {
        const { width, height, seed, rooms: roomCount, corridorWidth } = params;
        const rng = this.seededRandom(seed || Date.now());

        // Initialize map with walls
        const map: string[][] = [];
        for (let y = 0; y < height; y++) {
            map[y] = Array(width).fill('#');
        }

        // Generate rooms using BSP
        const rooms: any[] = [];

        for (let i = 0; i < roomCount; i++) {
            const roomWidth = Math.floor(rng() * 6) + 4;
            const roomHeight = Math.floor(rng() * 6) + 4;
            const x = Math.floor(rng() * (width - roomWidth - 2)) + 1;
            const y = Math.floor(rng() * (height - roomHeight - 2)) + 1;

            // Check overlap
            let valid = true;
            for (const room of rooms) {
                if (this.roomsOverlap(
                    { x, y, width: roomWidth, height: roomHeight },
                    room
                )) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                rooms.push({ x, y, width: roomWidth, height: roomHeight });

                // Carve room
                for (let ry = y; ry < y + roomHeight; ry++) {
                    for (let rx = x; rx < x + roomWidth; rx++) {
                        map[ry][rx] = '.';
                    }
                }
            }
        }

        // Connect rooms with corridors
        for (let i = 1; i < rooms.length; i++) {
            const prev = rooms[i - 1];
            const curr = rooms[i];

            const prevCenterX = Math.floor(prev.x + prev.width / 2);
            const prevCenterY = Math.floor(prev.y + prev.height / 2);
            const currCenterX = Math.floor(curr.x + curr.width / 2);
            const currCenterY = Math.floor(curr.y + curr.height / 2);

            // Horizontal then vertical corridor
            this.carveHCorridor(map, prevCenterX, currCenterX, prevCenterY, corridorWidth);
            this.carveVCorridor(map, prevCenterY, currCenterY, currCenterX, corridorWidth);
        }

        this.emit('dungeonGenerated', { params, map, rooms });
        return { map, rooms };
    }

    private roomsOverlap(a: any, b: any): boolean {
        return !(
            a.x + a.width + 1 < b.x ||
            b.x + b.width + 1 < a.x ||
            a.y + a.height + 1 < b.y ||
            b.y + b.height + 1 < a.y
        );
    }

    private carveHCorridor(map: string[][], x1: number, x2: number, y: number, width: number): void {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        for (let x = start; x <= end; x++) {
            for (let w = 0; w < width; w++) {
                if (map[y + w]) map[y + w][x] = '.';
            }
        }
    }

    private carveVCorridor(map: string[][], y1: number, y2: number, x: number, width: number): void {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        for (let y = start; y <= end; y++) {
            for (let w = 0; w < width; w++) {
                if (map[y] && map[y][x + w] !== undefined) map[y][x + w] = '.';
            }
        }
    }

    // ========================================================================
    // CHARACTER GENERATION
    // ========================================================================

    generateCharacter(params: CharacterParams): any {
        const races = ['Human', 'Elf', 'Dwarf', 'Orc', 'Halfling', 'Dragonborn'];
        const classes = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Ranger', 'Paladin'];
        const personalities = ['Brave', 'Cautious', 'Greedy', 'Noble', 'Mysterious', 'Cheerful'];

        const race = params.race || races[Math.floor(Math.random() * races.length)];
        const charClass = params.class || classes[Math.floor(Math.random() * classes.length)];
        const level = params.level || Math.floor(Math.random() * 20) + 1;

        const stats = {
            strength: this.rollStat(),
            dexterity: this.rollStat(),
            constitution: this.rollStat(),
            intelligence: this.rollStat(),
            wisdom: this.rollStat(),
            charisma: this.rollStat(),
        };

        return {
            name: this.generateName(race),
            race,
            class: charClass,
            level,
            alignment: params.alignment || ['good', 'neutral', 'evil'][Math.floor(Math.random() * 3)],
            personality: params.personality || [personalities[Math.floor(Math.random() * personalities.length)]],
            stats,
            hp: 10 + stats.constitution + level * 5,
        };
    }

    private rollStat(): number {
        // Roll 4d6, drop lowest
        const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => b - a);
        return rolls[0] + rolls[1] + rolls[2];
    }

    // ========================================================================
    // ITEM GENERATION
    // ========================================================================

    generateItem(params: ItemParams): any {
        const prefixes: Record<string, string[]> = {
            common: ['Simple', 'Basic', 'Plain'],
            uncommon: ['Fine', 'Sturdy', 'Keen'],
            rare: ['Enchanted', 'Blessed', 'Forged'],
            epic: ['Legendary', 'Ancient', 'Mythic'],
            legendary: ['Divine', 'Godslayer', 'World-ender'],
        };

        const suffixes: Record<string, string[]> = {
            weapon: ['of Slaying', 'of Power', 'of Speed', 'of the Dragon'],
            armor: ['of Protection', 'of the Guardian', 'of Resilience'],
            potion: ['of Healing', 'of Strength', 'of Invisibility'],
            artifact: ['of the Ancients', 'of Destiny', 'of Chaos'],
            treasure: ['Hoard', 'Cache', 'Fortune'],
        };

        const baseItems: Record<string, string[]> = {
            weapon: ['Sword', 'Axe', 'Bow', 'Staff', 'Dagger'],
            armor: ['Plate', 'Chainmail', 'Shield', 'Helmet', 'Gauntlets'],
            potion: ['Elixir', 'Draught', 'Vial', 'Flask'],
            artifact: ['Amulet', 'Ring', 'Orb', 'Crown', 'Tome'],
            treasure: ['Gold Coins', 'Gems', 'Jewelry', 'Art'],
        };

        const prefix = prefixes[params.rarity][Math.floor(Math.random() * prefixes[params.rarity].length)];
        const base = baseItems[params.type][Math.floor(Math.random() * baseItems[params.type].length)];
        const suffix = suffixes[params.type][Math.floor(Math.random() * suffixes[params.type].length)];

        const rarityMultiplier = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 };
        const baseValue = 10 * (params.level || 1) * rarityMultiplier[params.rarity];

        return {
            name: `${prefix} ${base} ${suffix}`,
            type: params.type,
            rarity: params.rarity,
            level: params.level || 1,
            value: baseValue + Math.floor(Math.random() * baseValue),
            stats: this.generateItemStats(params.type, params.rarity),
        };
    }

    private generateItemStats(type: string, rarity: string): Record<string, number> {
        const multiplier = { common: 1, uncommon: 2, rare: 3, epic: 5, legendary: 8 }[rarity] || 1;

        switch (type) {
            case 'weapon':
                return { damage: 5 * multiplier, critChance: 5 + multiplier };
            case 'armor':
                return { defense: 3 * multiplier, hp: 10 * multiplier };
            case 'potion':
                return { effect: 20 * multiplier };
            default:
                return {};
        }
    }

    // ========================================================================
    // NAME GENERATION
    // ========================================================================

    generateName(race?: string): string {
        const nameParts: Record<string, { prefix: string[]; suffix: string[] }> = {
            Human: {
                prefix: ['John', 'Mar', 'Ed', 'Will', 'Rob', 'Eli', 'Sar', 'Emi'],
                suffix: ['son', 'wick', 'ward', 'ton', 'ley', 'beth', 'lyn', 'rose'],
            },
            Elf: {
                prefix: ['Ael', 'Thran', 'Syl', 'Gal', 'Fen', 'Lir', 'Ar', 'El'],
                suffix: ['wen', 'las', 'wind', 'dor', 'iel', 'ion', 'vain', 'driel'],
            },
            Dwarf: {
                prefix: ['Thor', 'Bram', 'Dur', 'Grim', 'Bor', 'Kar', 'Vor'],
                suffix: ['in', 'ak', 'din', 'gar', 'rok', 'helm', 'beard'],
            },
            Orc: {
                prefix: ['Gru', 'Mog', 'Thok', 'Gor', 'Zug', 'Dra'],
                suffix: ['gash', 'mar', 'zug', 'nak', 'tuk', 'rok'],
            },
            default: {
                prefix: ['Al', 'Be', 'Ca', 'De', 'El', 'Fa'],
                suffix: ['ex', 'on', 'is', 'us', 'a', 'ian'],
            },
        };

        const parts = nameParts[race || 'default'] || nameParts.default;
        const prefix = parts.prefix[Math.floor(Math.random() * parts.prefix.length)];
        const suffix = parts.suffix[Math.floor(Math.random() * parts.suffix.length)];

        return prefix + suffix;
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    private seededRandom(seed: number): () => number {
        let s = seed;
        return () => {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    }

    private noise2D(x: number, y: number, rng: () => number): number {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;

        // Simple noise approximation
        const a = this.hash2D(ix, iy, rng);
        const b = this.hash2D(ix + 1, iy, rng);
        const c = this.hash2D(ix, iy + 1, rng);
        const d = this.hash2D(ix + 1, iy + 1, rng);

        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);

        return this.lerp(
            this.lerp(a, b, ux),
            this.lerp(c, d, ux),
            uy
        );
    }

    private hash2D(x: number, y: number, _rng: () => number): number {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    private lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }
}

export const proceduralGenService = ProceduralGenerationService.getInstance();
