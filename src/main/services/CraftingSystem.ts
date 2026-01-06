/**
 * 🔨 Crafting System
 * 
 * Complete crafting and recipe system:
 * - Recipe definitions
 * - Material requirements
 * - Crafting stations
 * - Quality/rarity outcomes
 * - Skill-based success
 */

import { EventEmitter } from 'events';

export type CraftingStation = 'anvil' | 'forge' | 'alchemy' | 'enchanting' | 'cooking' | 'workbench' | 'any';

export interface CraftingMaterial {
    itemId: string;
    quantity: number;
}

export interface Recipe {
    id: string;
    name: string;
    description: string;
    category: string;
    station: CraftingStation;
    materials: CraftingMaterial[];
    output: CraftingOutput;
    craftingTime: number; // seconds
    requiredLevel?: number;
    requiredSkill?: { skill: string; level: number };
    unlocked: boolean;
}

export interface CraftingOutput {
    itemId: string;
    quantity: number;
    minQuality: number;
    maxQuality: number;
    bonusChance?: number; // Chance for extra output
}

export interface CraftingResult {
    success: boolean;
    item?: { id: string; name: string; quantity: number; quality: number };
    bonusItems?: { id: string; quantity: number }[];
    xpGained?: number;
    error?: string;
}

export class CraftingSystem extends EventEmitter {
    private static instance: CraftingSystem;
    private recipes: Map<string, Recipe> = new Map();
    private playerRecipes: Map<string, Set<string>> = new Map();
    private craftingQueue: Map<string, { recipe: Recipe; startTime: number }[]> = new Map();

    private constructor() {
        super();
        this.initializeDefaultRecipes();
    }

    static getInstance(): CraftingSystem {
        if (!CraftingSystem.instance) {
            CraftingSystem.instance = new CraftingSystem();
        }
        return CraftingSystem.instance;
    }

    private initializeDefaultRecipes(): void {
        // Weapons
        this.register({
            id: 'iron_sword', name: 'Iron Sword',
            description: 'A basic iron sword',
            category: 'Weapons', station: 'forge',
            materials: [
                { itemId: 'iron_ingot', quantity: 3 },
                { itemId: 'leather_strips', quantity: 1 }
            ],
            output: { itemId: 'iron_sword', quantity: 1, minQuality: 50, maxQuality: 100 },
            craftingTime: 10, unlocked: true
        });

        this.register({
            id: 'steel_sword', name: 'Steel Sword',
            description: 'A stronger steel sword',
            category: 'Weapons', station: 'forge',
            materials: [
                { itemId: 'steel_ingot', quantity: 4 },
                { itemId: 'leather_strips', quantity: 2 }
            ],
            output: { itemId: 'steel_sword', quantity: 1, minQuality: 50, maxQuality: 100 },
            craftingTime: 20, requiredSkill: { skill: 'smithing', level: 20 }, unlocked: true
        });

        // Armor
        this.register({
            id: 'iron_armor', name: 'Iron Armor',
            description: 'Basic iron plate armor',
            category: 'Armor', station: 'forge',
            materials: [
                { itemId: 'iron_ingot', quantity: 5 },
                { itemId: 'leather', quantity: 2 }
            ],
            output: { itemId: 'iron_armor', quantity: 1, minQuality: 50, maxQuality: 100 },
            craftingTime: 30, unlocked: true
        });

        // Potions
        this.register({
            id: 'health_potion', name: 'Health Potion',
            description: 'Restores health when consumed',
            category: 'Potions', station: 'alchemy',
            materials: [
                { itemId: 'red_herb', quantity: 2 },
                { itemId: 'empty_vial', quantity: 1 }
            ],
            output: { itemId: 'health_potion', quantity: 1, minQuality: 50, maxQuality: 100, bonusChance: 0.2 },
            craftingTime: 5, unlocked: true
        });

        this.register({
            id: 'mana_potion', name: 'Mana Potion',
            description: 'Restores mana when consumed',
            category: 'Potions', station: 'alchemy',
            materials: [
                { itemId: 'blue_herb', quantity: 2 },
                { itemId: 'empty_vial', quantity: 1 }
            ],
            output: { itemId: 'mana_potion', quantity: 1, minQuality: 50, maxQuality: 100 },
            craftingTime: 5, unlocked: true
        });

        // Food
        this.register({
            id: 'cooked_meat', name: 'Cooked Meat',
            description: 'Restores hunger and provides buffs',
            category: 'Food', station: 'cooking',
            materials: [{ itemId: 'raw_meat', quantity: 1 }],
            output: { itemId: 'cooked_meat', quantity: 1, minQuality: 50, maxQuality: 100 },
            craftingTime: 3, unlocked: true
        });

        // Enchanted items
        this.register({
            id: 'enchanted_ring', name: 'Ring of Power',
            description: 'An enchanted ring',
            category: 'Enchantments', station: 'enchanting',
            materials: [
                { itemId: 'gold_ring', quantity: 1 },
                { itemId: 'soul_gem', quantity: 1 },
                { itemId: 'magic_essence', quantity: 3 }
            ],
            output: { itemId: 'enchanted_ring', quantity: 1, minQuality: 70, maxQuality: 100 },
            craftingTime: 60, requiredSkill: { skill: 'enchanting', level: 30 }, unlocked: false
        });
    }

    // ========================================================================
    // RECIPE MANAGEMENT
    // ========================================================================

    register(recipe: Recipe): void {
        this.recipes.set(recipe.id, recipe);
    }

    unlockRecipe(playerId: string, recipeId: string): boolean {
        if (!this.recipes.has(recipeId)) return false;

        let playerRecipes = this.playerRecipes.get(playerId);
        if (!playerRecipes) {
            playerRecipes = new Set();
            this.playerRecipes.set(playerId, playerRecipes);
        }

        playerRecipes.add(recipeId);
        this.emit('recipeUnlocked', { playerId, recipeId });
        return true;
    }

    getAvailableRecipes(playerId: string, station?: CraftingStation): Recipe[] {
        const playerRecipes = this.playerRecipes.get(playerId) || new Set();

        return Array.from(this.recipes.values()).filter(recipe => {
            if (!recipe.unlocked && !playerRecipes.has(recipe.id)) return false;
            if (station && recipe.station !== station && recipe.station !== 'any') return false;
            return true;
        });
    }

    // ========================================================================
    // CRAFTING
    // ========================================================================

    craft(
        playerId: string,
        recipeId: string,
        inventory: Map<string, number>,
        playerSkills: Map<string, number> = new Map()
    ): CraftingResult {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            return { success: false, error: 'Recipe not found' };
        }

        // Check skill requirements
        if (recipe.requiredSkill) {
            const playerSkillLevel = playerSkills.get(recipe.requiredSkill.skill) || 0;
            if (playerSkillLevel < recipe.requiredSkill.level) {
                return {
                    success: false,
                    error: `Requires ${recipe.requiredSkill.skill} level ${recipe.requiredSkill.level}`
                };
            }
        }

        // Check materials
        for (const material of recipe.materials) {
            const available = inventory.get(material.itemId) || 0;
            if (available < material.quantity) {
                return {
                    success: false,
                    error: `Not enough ${material.itemId} (need ${material.quantity}, have ${available})`
                };
            }
        }

        // Consume materials
        for (const material of recipe.materials) {
            const current = inventory.get(material.itemId) || 0;
            inventory.set(material.itemId, current - material.quantity);
        }

        // Calculate quality based on skill
        const skillBonus = recipe.requiredSkill
            ? (playerSkills.get(recipe.requiredSkill.skill) || 0) / 100
            : 0;

        const qualityRange = recipe.output.maxQuality - recipe.output.minQuality;
        const quality = Math.floor(
            recipe.output.minQuality +
            (qualityRange * Math.random()) +
            (qualityRange * skillBonus * 0.3)
        );

        const result: CraftingResult = {
            success: true,
            item: {
                id: recipe.output.itemId,
                name: recipe.name,
                quantity: recipe.output.quantity,
                quality: Math.min(quality, 100)
            },
            xpGained: Math.floor(recipe.craftingTime * 2)
        };

        // Bonus output chance
        if (recipe.output.bonusChance && Math.random() < recipe.output.bonusChance + skillBonus * 0.1) {
            result.bonusItems = [{
                id: recipe.output.itemId,
                quantity: 1
            }];
        }

        this.emit('itemCrafted', { playerId, result, recipe });
        return result;
    }

    // ========================================================================
    // QUEUE CRAFTING
    // ========================================================================

    queueCraft(playerId: string, recipeId: string): boolean {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;

        let queue = this.craftingQueue.get(playerId);
        if (!queue) {
            queue = [];
            this.craftingQueue.set(playerId, queue);
        }

        queue.push({ recipe, startTime: Date.now() });
        this.emit('craftQueued', { playerId, recipeId });
        return true;
    }

    checkQueue(playerId: string): CraftingResult[] {
        const queue = this.craftingQueue.get(playerId);
        if (!queue) return [];

        const completed: CraftingResult[] = [];
        const now = Date.now();

        const remaining = queue.filter(item => {
            const elapsed = (now - item.startTime) / 1000;
            if (elapsed >= item.recipe.craftingTime) {
                // Mock inventory for queue (in real game, check actual inventory)
                completed.push({
                    success: true,
                    item: {
                        id: item.recipe.output.itemId,
                        name: item.recipe.name,
                        quantity: item.recipe.output.quantity,
                        quality: Math.floor(Math.random() * 50) + 50
                    }
                });
                return false;
            }
            return true;
        });

        this.craftingQueue.set(playerId, remaining);
        return completed;
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateCraftingCode(): string {
        return `
// Crafting System
class CraftingManager {
    constructor() {
        this.recipes = new Map();
        this.unlockedRecipes = new Set();
    }

    canCraft(recipeId, inventory) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;

        return recipe.materials.every(mat => 
            (inventory.get(mat.itemId) || 0) >= mat.quantity
        );
    }

    craft(recipeId, inventory, skillLevel = 0) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return { success: false, error: 'Recipe not found' };

        if (!this.canCraft(recipeId, inventory)) {
            return { success: false, error: 'Missing materials' };
        }

        // Consume materials
        recipe.materials.forEach(mat => {
            const current = inventory.get(mat.itemId) || 0;
            inventory.set(mat.itemId, current - mat.quantity);
        });

        // Calculate quality
        const baseQuality = recipe.output.minQuality;
        const range = recipe.output.maxQuality - baseQuality;
        const quality = Math.floor(baseQuality + range * (Math.random() + skillLevel / 200));

        // Add to inventory
        const output = {
            id: recipe.output.itemId,
            quantity: recipe.output.quantity,
            quality: Math.min(quality, 100)
        };
        
        inventory.set(output.id, (inventory.get(output.id) || 0) + output.quantity);

        return { success: true, item: output };
    }

    getRecipesByStation(station) {
        return Array.from(this.recipes.values())
            .filter(r => r.station === station || r.station === 'any');
    }
}`;
    }

    getRecipe(id: string): Recipe | undefined {
        return this.recipes.get(id);
    }
}

export const craftingSystem = CraftingSystem.getInstance();
