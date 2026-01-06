/**
 * 🎁 Loot Table System
 * 
 * Comprehensive loot drop and reward system:
 * - Weighted random drops
 * - Rarity tiers
 * - Level scaling
 * - Loot pools
 * - Guaranteed drops
 */

import { EventEmitter } from 'events';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface LootItem {
    id: string;
    name: string;
    rarity: ItemRarity;
    type: string;
    value: number;
    stats?: Record<string, number>;
    effects?: string[];
}

export interface LootEntry {
    item: LootItem | string; // Item or item ID
    weight: number;
    minLevel?: number;
    maxLevel?: number;
    guaranteed?: boolean;
    quantity?: { min: number; max: number };
}

export interface LootTable {
    id: string;
    name: string;
    entries: LootEntry[];
    minDrops: number;
    maxDrops: number;
    guaranteedDrops: LootEntry[];
    bonusChance?: number;
}

export interface LootDropResult {
    items: { item: LootItem; quantity: number }[];
    source: string;
    timestamp: number;
}

export class LootTableSystem extends EventEmitter {
    private static instance: LootTableSystem;
    private tables: Map<string, LootTable> = new Map();
    private itemDatabase: Map<string, LootItem> = new Map();

    private constructor() {
        super();
        this.initializeDefaultItems();
    }

    static getInstance(): LootTableSystem {
        if (!LootTableSystem.instance) {
            LootTableSystem.instance = new LootTableSystem();
        }
        return LootTableSystem.instance;
    }

    private initializeDefaultItems(): void {
        // Common items
        this.registerItem({ id: 'gold', name: 'Gold Coins', rarity: 'common', type: 'currency', value: 1 });
        this.registerItem({ id: 'potion_health', name: 'Health Potion', rarity: 'common', type: 'consumable', value: 25 });
        this.registerItem({ id: 'potion_mana', name: 'Mana Potion', rarity: 'common', type: 'consumable', value: 25 });

        // Uncommon
        this.registerItem({ id: 'iron_sword', name: 'Iron Sword', rarity: 'uncommon', type: 'weapon', value: 50, stats: { damage: 10 } });
        this.registerItem({ id: 'iron_armor', name: 'Iron Armor', rarity: 'uncommon', type: 'armor', value: 75, stats: { defense: 8 } });

        // Rare
        this.registerItem({ id: 'steel_sword', name: 'Steel Sword', rarity: 'rare', type: 'weapon', value: 150, stats: { damage: 20 } });
        this.registerItem({ id: 'enchanted_ring', name: 'Ring of Power', rarity: 'rare', type: 'accessory', value: 200, stats: { magic: 15 } });

        // Epic
        this.registerItem({ id: 'dragon_blade', name: 'Dragon Blade', rarity: 'epic', type: 'weapon', value: 500, stats: { damage: 40, fire: 20 } });
        this.registerItem({ id: 'phoenix_armor', name: 'Phoenix Armor', rarity: 'epic', type: 'armor', value: 600, stats: { defense: 30, fireRes: 50 } });

        // Legendary
        this.registerItem({
            id: 'excalibur', name: 'Excalibur', rarity: 'legendary', type: 'weapon', value: 2000,
            stats: { damage: 100, holy: 50, critChance: 25 },
            effects: ['Blinds enemies on critical hit']
        });

        // Mythic
        this.registerItem({
            id: 'staff_creation', name: 'Staff of Creation', rarity: 'mythic', type: 'weapon', value: 10000,
            stats: { magic: 200, wisdom: 100 },
            effects: ['Can create matter from nothing', 'Infinite mana']
        });
    }

    // ========================================================================
    // ITEM REGISTRATION
    // ========================================================================

    registerItem(item: LootItem): void {
        this.itemDatabase.set(item.id, item);
    }

    getItem(id: string): LootItem | undefined {
        return this.itemDatabase.get(id);
    }

    // ========================================================================
    // LOOT TABLE MANAGEMENT
    // ========================================================================

    createLootTable(config: Omit<LootTable, 'guaranteedDrops'> & { guaranteedDrops?: LootEntry[] }): LootTable {
        const table: LootTable = {
            ...config,
            guaranteedDrops: config.guaranteedDrops || []
        };
        this.tables.set(table.id, table);
        return table;
    }

    // ========================================================================
    // LOOT GENERATION
    // ========================================================================

    generateLoot(tableId: string, playerLevel: number = 1, luckModifier: number = 0): LootDropResult {
        const table = this.tables.get(tableId);
        if (!table) {
            return { items: [], source: tableId, timestamp: Date.now() };
        }

        const result: { item: LootItem; quantity: number }[] = [];

        // Add guaranteed drops
        for (const entry of table.guaranteedDrops) {
            const item = this.resolveItem(entry.item);
            if (item && this.isLevelValid(entry, playerLevel)) {
                const qty = this.rollQuantity(entry.quantity);
                result.push({ item, quantity: qty });
            }
        }

        // Calculate number of random drops
        const numDrops = Math.floor(Math.random() * (table.maxDrops - table.minDrops + 1)) + table.minDrops;

        // Filter valid entries by level
        const validEntries = table.entries.filter(e => this.isLevelValid(e, playerLevel));

        // Generate random drops
        for (let i = 0; i < numDrops; i++) {
            const entry = this.weightedRandom(validEntries, luckModifier);
            if (entry) {
                const item = this.resolveItem(entry.item);
                if (item) {
                    const qty = this.rollQuantity(entry.quantity);

                    // Check if we already have this item
                    const existing = result.find(r => r.item.id === item.id);
                    if (existing) {
                        existing.quantity += qty;
                    } else {
                        result.push({ item, quantity: qty });
                    }
                }
            }
        }

        // Bonus drop chance
        if (table.bonusChance && Math.random() < table.bonusChance + luckModifier * 0.1) {
            const bonusEntry = this.weightedRandom(validEntries, luckModifier + 0.5);
            if (bonusEntry) {
                const item = this.resolveItem(bonusEntry.item);
                if (item) {
                    result.push({ item, quantity: 1 });
                }
            }
        }

        const dropResult: LootDropResult = {
            items: result,
            source: tableId,
            timestamp: Date.now()
        };

        this.emit('lootDropped', dropResult);
        return dropResult;
    }

    private resolveItem(item: LootItem | string): LootItem | undefined {
        if (typeof item === 'string') {
            return this.itemDatabase.get(item);
        }
        return item;
    }

    private isLevelValid(entry: LootEntry, level: number): boolean {
        if (entry.minLevel && level < entry.minLevel) return false;
        if (entry.maxLevel && level > entry.maxLevel) return false;
        return true;
    }

    private rollQuantity(quantity?: { min: number; max: number }): number {
        if (!quantity) return 1;
        return Math.floor(Math.random() * (quantity.max - quantity.min + 1)) + quantity.min;
    }

    private weightedRandom(entries: LootEntry[], luckModifier: number): LootEntry | null {
        if (entries.length === 0) return null;

        // Apply luck modifier - higher luck = better chance at rare items
        const modifiedEntries = entries.map(e => {
            const item = this.resolveItem(e.item);
            const rarityBonus = item ? this.getRarityBonus(item.rarity, luckModifier) : 1;
            return { entry: e, weight: e.weight * rarityBonus };
        });

        const totalWeight = modifiedEntries.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;

        for (const { entry, weight } of modifiedEntries) {
            random -= weight;
            if (random <= 0) {
                return entry;
            }
        }

        return modifiedEntries[modifiedEntries.length - 1].entry;
    }

    private getRarityBonus(rarity: ItemRarity, luck: number): number {
        const rarityFactors: Record<ItemRarity, number> = {
            common: 1 - luck * 0.1,
            uncommon: 1,
            rare: 1 + luck * 0.2,
            epic: 1 + luck * 0.4,
            legendary: 1 + luck * 0.6,
            mythic: 1 + luck * 0.8
        };
        return Math.max(0.1, rarityFactors[rarity]);
    }

    // ========================================================================
    // PRESET LOOT TABLES
    // ========================================================================

    createMonsterLootTable(monsterType: string, level: number): LootTable {
        return this.createLootTable({
            id: `monster_${monsterType}_${level}`,
            name: `${monsterType} Loot`,
            minDrops: 1,
            maxDrops: 3,
            bonusChance: 0.1,
            entries: [
                { item: 'gold', weight: 100, quantity: { min: level * 5, max: level * 15 } },
                { item: 'potion_health', weight: 30 },
                { item: 'iron_sword', weight: 10, minLevel: 5 },
                { item: 'steel_sword', weight: 5, minLevel: 10 },
                { item: 'dragon_blade', weight: 1, minLevel: 20 },
            ]
        });
    }

    createChestLootTable(tier: 'wood' | 'iron' | 'gold' | 'legendary'): LootTable {
        const configs: Record<string, Partial<LootTable>> = {
            wood: { minDrops: 1, maxDrops: 2 },
            iron: { minDrops: 2, maxDrops: 4, bonusChance: 0.1 },
            gold: { minDrops: 3, maxDrops: 5, bonusChance: 0.2 },
            legendary: { minDrops: 4, maxDrops: 6, bonusChance: 0.5 }
        };

        const tierWeights: Record<string, number> = {
            wood: 0.5,
            iron: 1,
            gold: 2,
            legendary: 5
        };

        return this.createLootTable({
            id: `chest_${tier}`,
            name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Chest`,
            ...configs[tier],
            minDrops: configs[tier].minDrops || 1,
            maxDrops: configs[tier].maxDrops || 3,
            entries: [
                { item: 'gold', weight: 100, quantity: { min: 10 * tierWeights[tier], max: 50 * tierWeights[tier] } },
                { item: 'potion_health', weight: 50 },
                { item: 'potion_mana', weight: 50 },
                { item: 'iron_sword', weight: 20 * tierWeights[tier] },
                { item: 'iron_armor', weight: 15 * tierWeights[tier] },
                { item: 'steel_sword', weight: 10 * tierWeights[tier] },
                { item: 'enchanted_ring', weight: 5 * tierWeights[tier] },
                { item: 'dragon_blade', weight: 2 * tierWeights[tier] },
                { item: 'excalibur', weight: 0.5 * tierWeights[tier] },
            ]
        });
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateLootSystemCode(): string {
        return `
// Loot Table System
class LootSystem {
    constructor() {
        this.tables = new Map();
        this.items = new Map();
    }

    registerItem(item) {
        this.items.set(item.id, item);
    }

    createTable(config) {
        this.tables.set(config.id, config);
    }

    generateLoot(tableId, playerLevel, luck = 0) {
        const table = this.tables.get(tableId);
        if (!table) return [];

        const drops = [];
        const numDrops = Math.floor(Math.random() * 
            (table.maxDrops - table.minDrops + 1)) + table.minDrops;

        // Guaranteed drops
        table.guaranteedDrops?.forEach(entry => {
            const item = this.items.get(entry.itemId);
            if (item) drops.push({ item, quantity: this.rollQuantity(entry) });
        });

        // Random weighted drops
        for (let i = 0; i < numDrops; i++) {
            const entry = this.weightedRandom(table.entries, luck);
            if (entry) {
                const item = this.items.get(entry.itemId);
                if (item) drops.push({ item, quantity: this.rollQuantity(entry) });
            }
        }

        return drops;
    }

    weightedRandom(entries, luck) {
        const total = entries.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * total;
        
        for (const entry of entries) {
            roll -= entry.weight;
            if (roll <= 0) return entry;
        }
        return entries[entries.length - 1];
    }

    rollQuantity(entry) {
        if (!entry.quantity) return 1;
        return Math.floor(Math.random() * 
            (entry.quantity.max - entry.quantity.min + 1)) + entry.quantity.min;
    }
}`;
    }
}

export const lootTableSystem = LootTableSystem.getInstance();
