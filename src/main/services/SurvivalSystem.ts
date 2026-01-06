/**
 * 🏕️ Survival System
 * 
 * Survival game mechanics:
 * - Hunger, thirst, health
 * - Crafting
 * - Building
 * - Day/night survival
 */

import { EventEmitter } from 'events';

export interface SurvivalStats {
    health: number;
    hunger: number;
    thirst: number;
    stamina: number;
    temperature: number;
}

export class SurvivalSystem extends EventEmitter {
    private static instance: SurvivalSystem;

    private constructor() { super(); }

    static getInstance(): SurvivalSystem {
        if (!SurvivalSystem.instance) {
            SurvivalSystem.instance = new SurvivalSystem();
        }
        return SurvivalSystem.instance;
    }

    generateSurvivalCode(): string {
        return `
class SurvivalSystem {
    constructor() {
        this.stats = {
            health: 100,
            maxHealth: 100,
            hunger: 100,
            thirst: 100,
            stamina: 100,
            temperature: 37 // Celsius
        };
        
        this.decayRates = {
            hunger: 0.5,    // per second
            thirst: 0.8,
            stamina: 0      // only when running
        };
        
        this.effects = [];
        this.inventory = [];
        this.craftingRecipes = new Map();
        
        this.setupDefaultRecipes();
    }

    setupDefaultRecipes() {
        this.addRecipe('campfire', [
            { item: 'wood', count: 5 },
            { item: 'stone', count: 2 }
        ], { warmth: true, lightRadius: 100 });
        
        this.addRecipe('bandage', [
            { item: 'cloth', count: 2 }
        ], { healAmount: 20 });
        
        this.addRecipe('water_bottle', [
            { item: 'bottle', count: 1 },
            { item: 'water', count: 1 }
        ], { thirstRestore: 30 });
        
        this.addRecipe('cooked_meat', [
            { item: 'raw_meat', count: 1 }
        ], { hungerRestore: 40, requiresHeat: true });
    }

    addRecipe(name, ingredients, result) {
        this.craftingRecipes.set(name, { ingredients, result });
    }

    update(dt) {
        // Decay stats
        this.stats.hunger -= this.decayRates.hunger * dt;
        this.stats.thirst -= this.decayRates.thirst * dt;
        
        // Clamp values
        this.stats.hunger = Math.max(0, this.stats.hunger);
        this.stats.thirst = Math.max(0, this.stats.thirst);
        
        // Starvation/dehydration damage
        if (this.stats.hunger <= 0) {
            this.takeDamage(2 * dt, 'starvation');
        }
        if (this.stats.thirst <= 0) {
            this.takeDamage(3 * dt, 'dehydration');
        }
        
        // Temperature effects
        if (this.stats.temperature < 30) {
            this.takeDamage(1 * dt, 'hypothermia');
        } else if (this.stats.temperature > 42) {
            this.takeDamage(1 * dt, 'hyperthermia');
        }
        
        // Stamina regeneration
        if (!this.isRunning) {
            this.stats.stamina = Math.min(100, this.stats.stamina + 10 * dt);
        }
        
        // Process effects
        this.updateEffects(dt);
        
        // Check death
        if (this.stats.health <= 0) {
            this.onDeath?.();
        }
    }

    takeDamage(amount, source = 'unknown') {
        this.stats.health -= amount;
        this.stats.health = Math.max(0, this.stats.health);
        this.onDamage?.(amount, source);
    }

    heal(amount) {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    }

    eat(item) {
        if (item.hungerRestore) {
            this.stats.hunger = Math.min(100, this.stats.hunger + item.hungerRestore);
        }
        if (item.healthRestore) {
            this.heal(item.healthRestore);
        }
    }

    drink(item) {
        if (item.thirstRestore) {
            this.stats.thirst = Math.min(100, this.stats.thirst + item.thirstRestore);
        }
    }

    canCraft(recipeName) {
        const recipe = this.craftingRecipes.get(recipeName);
        if (!recipe) return false;
        
        for (const req of recipe.ingredients) {
            const count = this.countItem(req.item);
            if (count < req.count) return false;
        }
        
        if (recipe.result.requiresHeat && !this.nearHeatSource()) {
            return false;
        }
        
        return true;
    }

    craft(recipeName) {
        if (!this.canCraft(recipeName)) return false;
        
        const recipe = this.craftingRecipes.get(recipeName);
        
        // Consume ingredients
        for (const req of recipe.ingredients) {
            this.removeItem(req.item, req.count);
        }
        
        // Add crafted item
        this.addItem(recipeName, 1);
        this.onCraft?.(recipeName);
        
        return true;
    }

    addItem(name, count = 1) {
        const existing = this.inventory.find(i => i.name === name);
        if (existing) {
            existing.count += count;
        } else {
            this.inventory.push({ name, count });
        }
    }

    removeItem(name, count = 1) {
        const idx = this.inventory.findIndex(i => i.name === name);
        if (idx === -1) return false;
        
        this.inventory[idx].count -= count;
        if (this.inventory[idx].count <= 0) {
            this.inventory.splice(idx, 1);
        }
        return true;
    }

    countItem(name) {
        const item = this.inventory.find(i => i.name === name);
        return item ? item.count : 0;
    }

    nearHeatSource() {
        // Override in game
        return false;
    }

    addEffect(effect) {
        this.effects.push({ ...effect, timeLeft: effect.duration });
    }

    updateEffects(dt) {
        this.effects = this.effects.filter(e => {
            e.timeLeft -= dt;
            if (e.healthPerSecond) this.heal(e.healthPerSecond * dt);
            if (e.damagePerSecond) this.takeDamage(e.damagePerSecond * dt, e.source);
            return e.timeLeft > 0;
        });
    }

    getStatusBars() {
        return {
            health: this.stats.health / this.stats.maxHealth,
            hunger: this.stats.hunger / 100,
            thirst: this.stats.thirst / 100,
            stamina: this.stats.stamina / 100
        };
    }

    // Callbacks
    onDamage = null;
    onDeath = null;
    onCraft = null;
}`;
    }
}

export const survivalSystem = SurvivalSystem.getInstance();
