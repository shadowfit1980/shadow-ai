/**
 * 💰 Idle Clicker System
 * 
 * Idle/incremental game mechanics:
 * - Click income
 * - Passive generators
 * - Upgrades
 * - Prestige
 */

import { EventEmitter } from 'events';

export interface Generator {
    id: string;
    name: string;
    baseCost: number;
    baseProduction: number;
    count: number;
}

export class IdleClickerSystem extends EventEmitter {
    private static instance: IdleClickerSystem;

    private constructor() { super(); }

    static getInstance(): IdleClickerSystem {
        if (!IdleClickerSystem.instance) {
            IdleClickerSystem.instance = new IdleClickerSystem();
        }
        return IdleClickerSystem.instance;
    }

    generateIdleCode(): string {
        return `
class IdleGame {
    constructor() {
        this.currency = 0;
        this.totalEarned = 0;
        this.clickValue = 1;
        this.clickMultiplier = 1;
        this.globalMultiplier = 1;
        
        this.generators = new Map();
        this.upgrades = new Map();
        this.achievements = new Map();
        
        this.prestigePoints = 0;
        this.prestigeMultiplier = 1;
        
        this.lastUpdate = Date.now();
        this.offlineProgress = true;
        
        this.setupDefaults();
    }

    setupDefaults() {
        this.addGenerator('cursor', {
            name: 'Auto Clicker',
            baseCost: 15,
            costMultiplier: 1.15,
            baseProduction: 0.1
        });

        this.addGenerator('worker', {
            name: 'Worker',
            baseCost: 100,
            costMultiplier: 1.15,
            baseProduction: 1
        });

        this.addGenerator('factory', {
            name: 'Factory',
            baseCost: 1100,
            costMultiplier: 1.15,
            baseProduction: 8
        });

        this.addGenerator('mine', {
            name: 'Mine',
            baseCost: 12000,
            costMultiplier: 1.15,
            baseProduction: 47
        });

        this.addGenerator('bank', {
            name: 'Bank',
            baseCost: 130000,
            costMultiplier: 1.15,
            baseProduction: 260
        });

        // Upgrades
        this.addUpgrade('double_click', {
            name: 'Double Click',
            description: 'Doubles click value',
            cost: 100,
            effect: () => { this.clickMultiplier *= 2; }
        });

        this.addUpgrade('better_cursors', {
            name: 'Better Cursors',
            description: 'Cursors are twice as effective',
            cost: 500,
            requires: { generator: 'cursor', count: 10 },
            effect: () => { this.generators.get('cursor').multiplier *= 2; }
        });
    }

    addGenerator(id, config) {
        this.generators.set(id, {
            id,
            ...config,
            count: 0,
            multiplier: 1
        });
    }

    addUpgrade(id, config) {
        this.upgrades.set(id, {
            id,
            ...config,
            purchased: false
        });
    }

    click() {
        const value = this.clickValue * this.clickMultiplier * this.globalMultiplier * this.prestigeMultiplier;
        this.currency += value;
        this.totalEarned += value;
        this.onClick?.(value);
        return value;
    }

    getGeneratorCost(id) {
        const gen = this.generators.get(id);
        if (!gen) return Infinity;
        return Math.floor(gen.baseCost * Math.pow(gen.costMultiplier, gen.count));
    }

    buyGenerator(id, amount = 1) {
        const gen = this.generators.get(id);
        if (!gen) return false;

        let totalCost = 0;
        for (let i = 0; i < amount; i++) {
            totalCost += Math.floor(gen.baseCost * Math.pow(gen.costMultiplier, gen.count + i));
        }

        if (this.currency < totalCost) return false;

        this.currency -= totalCost;
        gen.count += amount;
        this.onGeneratorBought?.(gen, amount);
        return true;
    }

    buyMaxGenerators(id) {
        let bought = 0;
        while (this.buyGenerator(id, 1)) {
            bought++;
        }
        return bought;
    }

    getProduction(id) {
        const gen = this.generators.get(id);
        if (!gen) return 0;
        return gen.baseProduction * gen.count * gen.multiplier * this.globalMultiplier * this.prestigeMultiplier;
    }

    getTotalProduction() {
        let total = 0;
        for (const gen of this.generators.values()) {
            total += this.getProduction(gen.id);
        }
        return total;
    }

    canBuyUpgrade(id) {
        const upgrade = this.upgrades.get(id);
        if (!upgrade || upgrade.purchased) return false;
        if (this.currency < upgrade.cost) return false;
        
        if (upgrade.requires) {
            const gen = this.generators.get(upgrade.requires.generator);
            if (!gen || gen.count < upgrade.requires.count) return false;
        }
        
        return true;
    }

    buyUpgrade(id) {
        if (!this.canBuyUpgrade(id)) return false;

        const upgrade = this.upgrades.get(id);
        this.currency -= upgrade.cost;
        upgrade.purchased = true;
        upgrade.effect();
        
        this.onUpgradeBought?.(upgrade);
        return true;
    }

    update() {
        const now = Date.now();
        const dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        const production = this.getTotalProduction() * dt;
        this.currency += production;
        this.totalEarned += production;

        this.checkAchievements();
    }

    calculateOfflineProgress(offlineSeconds) {
        if (!this.offlineProgress) return 0;
        
        const production = this.getTotalProduction() * offlineSeconds * 0.5; // 50% efficiency
        this.currency += production;
        this.totalEarned += production;
        return production;
    }

    getPrestigePoints() {
        // Prestige formula based on total earned
        return Math.floor(Math.pow(this.totalEarned / 1e12, 0.5));
    }

    prestige() {
        const points = this.getPrestigePoints();
        if (points < 1) return false;

        this.prestigePoints += points;
        this.prestigeMultiplier = 1 + (this.prestigePoints * 0.1); // 10% per point

        // Reset
        this.currency = 0;
        this.totalEarned = 0;
        this.clickMultiplier = 1;
        this.globalMultiplier = 1;

        for (const gen of this.generators.values()) {
            gen.count = 0;
            gen.multiplier = 1;
        }

        for (const upgrade of this.upgrades.values()) {
            upgrade.purchased = false;
        }

        this.onPrestige?.(points);
        return true;
    }

    formatNumber(num) {
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
        if (num < 1000) return num.toFixed(num < 10 ? 1 : 0);
        
        const exp = Math.floor(Math.log10(num) / 3);
        const suffix = suffixes[Math.min(exp, suffixes.length - 1)];
        return (num / Math.pow(1000, exp)).toFixed(2) + suffix;
    }

    checkAchievements() {
        // Override to add achievements
    }

    save() {
        return JSON.stringify({
            currency: this.currency,
            totalEarned: this.totalEarned,
            clickMultiplier: this.clickMultiplier,
            globalMultiplier: this.globalMultiplier,
            prestigePoints: this.prestigePoints,
            generators: Array.from(this.generators.entries()),
            upgrades: Array.from(this.upgrades.entries()).filter(([_, u]) => u.purchased).map(([id]) => id),
            lastUpdate: Date.now()
        });
    }

    load(data) {
        const save = JSON.parse(data);
        this.currency = save.currency;
        this.totalEarned = save.totalEarned;
        this.prestigePoints = save.prestigePoints || 0;
        this.prestigeMultiplier = 1 + (this.prestigePoints * 0.1);

        for (const [id, gen] of save.generators) {
            const existing = this.generators.get(id);
            if (existing) existing.count = gen.count;
        }

        for (const id of save.upgrades) {
            const upgrade = this.upgrades.get(id);
            if (upgrade) {
                upgrade.purchased = true;
                upgrade.effect();
            }
        }

        // Calculate offline progress
        const offlineTime = (Date.now() - save.lastUpdate) / 1000;
        if (offlineTime > 60) {
            return this.calculateOfflineProgress(offlineTime);
        }
        return 0;
    }

    // Callbacks
    onClick = null;
    onGeneratorBought = null;
    onUpgradeBought = null;
    onPrestige = null;
}`;
    }
}

export const idleClickerSystem = IdleClickerSystem.getInstance();
