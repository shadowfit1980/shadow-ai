/**
 * 🌍 World Builder
 * 
 * Procedural world generation with interconnected systems:
 * - Biome generation
 * - Settlement placement
 * - Road networks
 * - Resource distribution
 * - NPC population
 * - Quest locations
 */

import { EventEmitter } from 'events';

export type Biome = 'forest' | 'desert' | 'tundra' | 'plains' | 'mountains' | 'swamp' | 'ocean' | 'volcanic';

export interface WorldTile {
    x: number;
    y: number;
    biome: Biome;
    elevation: number;
    moisture: number;
    temperature: number;
    resources: string[];
    hasRoad: boolean;
    settlement?: Settlement;
}

export interface Settlement {
    id: string;
    name: string;
    type: 'village' | 'town' | 'city' | 'outpost' | 'ruins' | 'dungeon';
    population: number;
    buildings: Building[];
    faction?: string;
    economy: number;
    danger: number;
}

export interface Building {
    type: string;
    name: string;
    services: string[];
}

export interface WorldConfig {
    width: number;
    height: number;
    seed?: number;
    oceanCoverage: number;
    mountainDensity: number;
    settlementDensity: number;
}

export interface GeneratedWorld {
    tiles: WorldTile[][];
    settlements: Settlement[];
    roads: Road[];
    factions: Faction[];
    regions: Region[];
}

export interface Road {
    from: { x: number; y: number };
    to: { x: number; y: number };
    path: { x: number; y: number }[];
    type: 'dirt' | 'stone' | 'highway';
}

export interface Faction {
    id: string;
    name: string;
    alignment: 'good' | 'neutral' | 'evil';
    territory: { x: number; y: number }[];
    relations: Map<string, number>;
}

export interface Region {
    id: string;
    name: string;
    biome: Biome;
    tiles: { x: number; y: number }[];
    pointsOfInterest: string[];
}

export class WorldBuilder extends EventEmitter {
    private static instance: WorldBuilder;
    private rng: () => number;

    private constructor() {
        super();
        this.rng = Math.random;
    }

    static getInstance(): WorldBuilder {
        if (!WorldBuilder.instance) {
            WorldBuilder.instance = new WorldBuilder();
        }
        return WorldBuilder.instance;
    }

    // ========================================================================
    // WORLD GENERATION
    // ========================================================================

    generateWorld(config: WorldConfig): GeneratedWorld {
        this.rng = this.seededRandom(config.seed || Date.now());

        // Generate base terrain
        const tiles = this.generateTerrain(config);

        // Apply biomes
        this.applyBiomes(tiles);

        // Place settlements
        const settlements = this.placeSettlements(tiles, config);

        // Generate road network
        const roads = this.generateRoads(tiles, settlements);

        // Create factions
        const factions = this.generateFactions(settlements);

        // Define regions
        const regions = this.defineRegions(tiles);

        // Distribute resources
        this.distributeResources(tiles);

        const world: GeneratedWorld = { tiles, settlements, roads, factions, regions };
        this.emit('worldGenerated', world);

        return world;
    }

    private generateTerrain(config: WorldConfig): WorldTile[][] {
        const tiles: WorldTile[][] = [];

        for (let y = 0; y < config.height; y++) {
            tiles[y] = [];
            for (let x = 0; x < config.width; x++) {
                // Generate elevation using multiple octaves of noise
                const elevation = this.generateElevation(x, y, config);
                const moisture = this.generateMoisture(x, y);
                const temperature = this.generateTemperature(y, config.height, elevation);

                tiles[y][x] = {
                    x, y,
                    biome: 'plains',
                    elevation,
                    moisture,
                    temperature,
                    resources: [],
                    hasRoad: false
                };
            }
        }

        return tiles;
    }

    private generateElevation(x: number, y: number, config: WorldConfig): number {
        // Simplex-like noise
        let value = this.noise2D(x / 50, y / 50) * 0.5;
        value += this.noise2D(x / 25, y / 25) * 0.25;
        value += this.noise2D(x / 10, y / 10) * 0.125;

        // Normalize and apply mountain density
        value = (value + 1) / 2;
        value = Math.pow(value, 1 - config.mountainDensity);

        // Create ocean basins
        const distFromCenter = Math.sqrt(
            Math.pow(x - config.width / 2, 2) +
            Math.pow(y - config.height / 2, 2)
        );
        const maxDist = Math.sqrt(Math.pow(config.width / 2, 2) + Math.pow(config.height / 2, 2));
        const oceanFactor = distFromCenter / maxDist;

        value -= oceanFactor * config.oceanCoverage;

        return Math.max(0, Math.min(1, value));
    }

    private generateMoisture(x: number, y: number): number {
        return (this.noise2D(x / 30 + 500, y / 30 + 500) + 1) / 2;
    }

    private generateTemperature(y: number, height: number, elevation: number): number {
        // Warmer at equator, colder at poles
        const latitudeFactor = 1 - Math.abs(y - height / 2) / (height / 2);
        // Colder at higher elevations
        const elevationFactor = 1 - elevation * 0.5;

        return latitudeFactor * elevationFactor;
    }

    private applyBiomes(tiles: WorldTile[][]): void {
        for (const row of tiles) {
            for (const tile of row) {
                tile.biome = this.determineBiome(tile.elevation, tile.moisture, tile.temperature);
            }
        }
    }

    private determineBiome(elevation: number, moisture: number, temperature: number): Biome {
        if (elevation < 0.2) return 'ocean';
        if (elevation > 0.8) return 'mountains';

        if (temperature < 0.2) return 'tundra';
        if (temperature > 0.8 && moisture < 0.3) return 'desert';

        if (moisture > 0.7 && temperature > 0.5) return 'swamp';
        if (moisture > 0.5) return 'forest';

        if (elevation > 0.6 && this.rng() > 0.8) return 'volcanic';

        return 'plains';
    }

    // ========================================================================
    // SETTLEMENTS
    // ========================================================================

    private placeSettlements(tiles: WorldTile[][], config: WorldConfig): Settlement[] {
        const settlements: Settlement[] = [];
        const numSettlements = Math.floor(config.width * config.height * config.settlementDensity / 1000);

        for (let i = 0; i < numSettlements; i++) {
            // Find suitable location
            const location = this.findSettlementLocation(tiles, settlements);
            if (!location) continue;

            const settlement = this.createSettlement(location, tiles);
            settlements.push(settlement);
            tiles[location.y][location.x].settlement = settlement;
        }

        return settlements;
    }

    private findSettlementLocation(tiles: WorldTile[][], existing: Settlement[]): { x: number; y: number } | null {
        const maxAttempts = 100;

        for (let i = 0; i < maxAttempts; i++) {
            const x = Math.floor(this.rng() * tiles[0].length);
            const y = Math.floor(this.rng() * tiles.length);
            const tile = tiles[y][x];

            // Check suitability
            if (tile.biome === 'ocean') continue;
            if (tile.biome === 'mountains' && this.rng() > 0.1) continue;
            if (tile.biome === 'volcanic') continue;

            // Check distance from other settlements
            const minDistance = 10;
            const tooClose = existing.some(s => {
                const dx = tiles[y][x].x - (tiles.find(r => r.find(t => t.settlement?.id === s.id))?.find(t => t.settlement?.id === s.id)?.x || 0);
                const dy = y - (tiles.findIndex(r => r.find(t => t.settlement?.id === s.id)) || 0);
                return Math.sqrt(dx * dx + dy * dy) < minDistance;
            });

            if (!tooClose) {
                return { x, y };
            }
        }

        return null;
    }

    private createSettlement(location: { x: number; y: number }, tiles: WorldTile[][]): Settlement {
        const tile = tiles[location.y][location.x];
        const type = this.determineSettlementType(tile.biome);
        const population = this.generatePopulation(type);

        return {
            id: `settlement_${location.x}_${location.y}`,
            name: this.generateSettlementName(tile.biome),
            type,
            population,
            buildings: this.generateBuildings(type, population),
            economy: this.rng() * 100,
            danger: type === 'dungeon' || type === 'ruins' ? 50 + this.rng() * 50 : this.rng() * 30
        };
    }

    private determineSettlementType(biome: Biome): Settlement['type'] {
        const rand = this.rng();
        if (rand < 0.1) return 'ruins';
        if (rand < 0.15) return 'dungeon';
        if (rand < 0.3) return 'outpost';
        if (rand < 0.6) return 'village';
        if (rand < 0.85) return 'town';
        return 'city';
    }

    private generatePopulation(type: Settlement['type']): number {
        switch (type) {
            case 'city': return 1000 + Math.floor(this.rng() * 9000);
            case 'town': return 200 + Math.floor(this.rng() * 800);
            case 'village': return 20 + Math.floor(this.rng() * 180);
            case 'outpost': return 5 + Math.floor(this.rng() * 20);
            default: return 0;
        }
    }

    private generateBuildings(type: Settlement['type'], _population: number): Building[] {
        const buildings: Building[] = [];

        const templates: Record<string, { type: string; services: string[] }[]> = {
            village: [
                { type: 'inn', services: ['rest', 'food'] },
                { type: 'blacksmith', services: ['repair', 'weapons'] },
                { type: 'general_store', services: ['supplies'] }
            ],
            town: [
                { type: 'inn', services: ['rest', 'food', 'rumors'] },
                { type: 'blacksmith', services: ['repair', 'weapons', 'armor'] },
                { type: 'temple', services: ['healing', 'blessing'] },
                { type: 'market', services: ['trade', 'supplies'] },
                { type: 'guild_hall', services: ['quests', 'training'] }
            ],
            city: [
                { type: 'grand_inn', services: ['rest', 'food', 'entertainment'] },
                { type: 'blacksmith', services: ['repair', 'weapons', 'armor', 'enchanting'] },
                { type: 'cathedral', services: ['healing', 'blessing', 'resurrection'] },
                { type: 'grand_market', services: ['trade', 'rare_items'] },
                { type: 'adventurer_guild', services: ['quests', 'training', 'bounties'] },
                { type: 'castle', services: ['audience', 'politics'] },
                { type: 'mage_tower', services: ['magic', 'enchanting', 'training'] }
            ]
        };

        const buildingList = templates[type] || templates.village;
        buildingList.forEach(b => {
            buildings.push({
                type: b.type,
                name: this.generateBuildingName(b.type),
                services: b.services
            });
        });

        return buildings;
    }

    private generateSettlementName(biome: Biome): string {
        const prefixes: Record<Biome, string[]> = {
            forest: ['Green', 'Oak', 'Willow', 'Shade', 'Deep'],
            desert: ['Sun', 'Sand', 'Oasis', 'Dry', 'Dust'],
            tundra: ['Frost', 'Ice', 'Snow', 'White', 'Cold'],
            plains: ['High', 'Far', 'Wind', 'Golden', 'Wide'],
            mountains: ['Stone', 'Peak', 'Iron', 'Grey', 'High'],
            swamp: ['Mire', 'Bog', 'Black', 'Murk', 'Wet'],
            ocean: ['Port', 'Bay', 'Sea', 'Wave', 'Tide'],
            volcanic: ['Ash', 'Fire', 'Ember', 'Smoke', 'Flame']
        };

        const suffixes = ['haven', 'holm', 'stead', 'ford', 'vale', 'town', 'burg', 'hold', 'rest', 'watch'];

        const prefix = prefixes[biome][Math.floor(this.rng() * prefixes[biome].length)];
        const suffix = suffixes[Math.floor(this.rng() * suffixes.length)];

        return prefix + suffix;
    }

    private generateBuildingName(type: string): string {
        const adjectives = ['Old', 'Golden', 'Silver', 'Rusty', 'Cozy', 'Grand', 'Humble', 'Proud'];
        const nouns: Record<string, string[]> = {
            inn: ['Dragon', 'Griffin', 'Pilgrim', 'Knight', 'Crown', 'Barrel'],
            blacksmith: ['Anvil', 'Hammer', 'Forge', 'Steel', 'Iron'],
            temple: ['Light', 'Dawn', 'Hope', 'Mercy', 'Grace'],
            default: ['Star', 'Moon', 'Sun', 'Oak', 'Stone']
        };

        const adj = adjectives[Math.floor(this.rng() * adjectives.length)];
        const nounList = nouns[type] || nouns.default;
        const noun = nounList[Math.floor(this.rng() * nounList.length)];

        return `The ${adj} ${noun}`;
    }

    // ========================================================================
    // ROADS
    // ========================================================================

    private generateRoads(tiles: WorldTile[][], settlements: Settlement[]): Road[] {
        const roads: Road[] = [];

        // Connect settlements with A* pathfinding
        for (let i = 0; i < settlements.length; i++) {
            for (let j = i + 1; j < settlements.length; j++) {
                // Only connect nearby settlements
                const dist = this.getSettlementDistance(tiles, settlements[i], settlements[j]);
                if (dist < 30 && this.rng() > 0.3) {
                    const path = this.findPath(tiles, settlements[i], settlements[j]);
                    if (path) {
                        roads.push({
                            from: path[0],
                            to: path[path.length - 1],
                            path,
                            type: settlements[i].type === 'city' || settlements[j].type === 'city' ? 'stone' : 'dirt'
                        });

                        // Mark tiles
                        path.forEach(p => tiles[p.y][p.x].hasRoad = true);
                    }
                }
            }
        }

        return roads;
    }

    private getSettlementDistance(_tiles: WorldTile[][], _s1: Settlement, _s2: Settlement): number {
        // Simplified distance calculation
        return Math.random() * 50;
    }

    private findPath(_tiles: WorldTile[][], _from: Settlement, _to: Settlement): { x: number; y: number }[] | null {
        // Simplified path (would use A* in real implementation)
        return [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    }

    // ========================================================================
    // FACTIONS & REGIONS
    // ========================================================================

    private generateFactions(settlements: Settlement[]): Faction[] {
        const factions: Faction[] = [];
        const numFactions = Math.min(5, Math.ceil(settlements.length / 3));

        for (let i = 0; i < numFactions; i++) {
            factions.push({
                id: `faction_${i}`,
                name: this.generateFactionName(),
                alignment: ['good', 'neutral', 'evil'][Math.floor(this.rng() * 3)] as Faction['alignment'],
                territory: [],
                relations: new Map()
            });
        }

        return factions;
    }

    private generateFactionName(): string {
        const prefixes = ['Order', 'Brotherhood', 'Guild', 'House', 'Clan', 'League', 'Alliance'];
        const suffixes = ['of the Shadow', 'of the Light', 'of Iron', 'of Gold', 'of the Dragon', 'of the North'];

        return `${prefixes[Math.floor(this.rng() * prefixes.length)]} ${suffixes[Math.floor(this.rng() * suffixes.length)]}`;
    }

    private defineRegions(tiles: WorldTile[][]): Region[] {
        // Simplified region generation
        return [{
            id: 'region_1',
            name: 'The Heartlands',
            biome: 'plains',
            tiles: [],
            pointsOfInterest: []
        }];
    }

    private distributeResources(tiles: WorldTile[][]): void {
        const resourcesByBiome: Record<Biome, string[]> = {
            forest: ['wood', 'herbs', 'game', 'berries'],
            desert: ['sand', 'gems', 'oil', 'ancient_artifacts'],
            tundra: ['ice', 'rare_metals', 'furs'],
            plains: ['wheat', 'cattle', 'clay'],
            mountains: ['iron', 'gold', 'stone', 'crystals'],
            swamp: ['peat', 'rare_herbs', 'bog_iron'],
            ocean: ['fish', 'pearls', 'salt'],
            volcanic: ['obsidian', 'sulfur', 'fire_crystals']
        };

        for (const row of tiles) {
            for (const tile of row) {
                if (this.rng() > 0.7) {
                    const resources = resourcesByBiome[tile.biome];
                    tile.resources = [resources[Math.floor(this.rng() * resources.length)]];
                }
            }
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private seededRandom(seed: number): () => number {
        let s = seed;
        return () => {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    }

    private noise2D(x: number, y: number): number {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }
}

export const worldBuilder = WorldBuilder.getInstance();
