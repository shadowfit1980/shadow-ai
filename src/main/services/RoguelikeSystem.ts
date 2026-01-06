/**
 * 🎲 Roguelike System
 * 
 * Roguelike mechanics:
 * - Procedural runs
 * - Permadeath
 * - Meta-progression
 * - Random rewards
 */

import { EventEmitter } from 'events';

export interface RunStats {
    floor: number;
    gold: number;
    kills: number;
    roomsCleared: number;
    bossesKilled: number;
}

export class RoguelikeSystem extends EventEmitter {
    private static instance: RoguelikeSystem;

    private constructor() { super(); }

    static getInstance(): RoguelikeSystem {
        if (!RoguelikeSystem.instance) {
            RoguelikeSystem.instance = new RoguelikeSystem();
        }
        return RoguelikeSystem.instance;
    }

    generateRoguelikeCode(): string {
        return `
class RoguelikeGame {
    constructor() {
        // Run state
        this.currentRun = null;
        this.seed = 0;
        
        // Meta progression
        this.metaCurrency = 0;
        this.unlocks = new Set();
        this.permanentUpgrades = new Map();
        this.totalRuns = 0;
        this.bestFloor = 0;
        
        // Content pools
        this.roomTypes = ['combat', 'treasure', 'shop', 'event', 'rest', 'boss'];
        this.enemies = new Map();
        this.items = new Map();
        this.events = new Map();
        
        this.setupDefaults();
    }

    setupDefaults() {
        // Enemies by floor difficulty
        this.addEnemy('slime', { health: 20, damage: 5, tier: 1 });
        this.addEnemy('goblin', { health: 30, damage: 8, tier: 1 });
        this.addEnemy('skeleton', { health: 40, damage: 10, tier: 2 });
        this.addEnemy('demon', { health: 60, damage: 15, tier: 2 });
        this.addEnemy('dragon', { health: 200, damage: 25, tier: 3, boss: true });

        // Items
        this.addItem('health_potion', { type: 'consumable', effect: 'heal', value: 30 });
        this.addItem('strength_ring', { type: 'passive', effect: 'damage', value: 5 });
        this.addItem('shield', { type: 'passive', effect: 'armor', value: 10 });
        this.addItem('lucky_coin', { type: 'passive', effect: 'gold', value: 0.2 });

        // Events
        this.addEvent('shrine', {
            description: 'A mysterious shrine offers power...',
            choices: [
                { text: 'Pray (+10 max HP, -20 gold)', effect: { maxHealth: 10, gold: -20 } },
                { text: 'Sacrifice (15 damage, gain item)', effect: { health: -15, item: true } },
                { text: 'Leave', effect: {} }
            ]
        });

        // Permanent upgrades
        this.addPermanentUpgrade('starting_health', { name: '+5 Starting HP', cost: 50, effect: { maxHealth: 5 } });
        this.addPermanentUpgrade('starting_gold', { name: '+10 Starting Gold', cost: 30, effect: { gold: 10 } });
    }

    addEnemy(id, data) { this.enemies.set(id, { id, ...data }); }
    addItem(id, data) { this.items.set(id, { id, ...data }); }
    addEvent(id, data) { this.events.set(id, { id, ...data }); }
    addPermanentUpgrade(id, data) { this.permanentUpgrades.set(id, { id, purchased: false, ...data }); }

    // Seeded random
    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    startRun(seed = Date.now()) {
        this.seed = seed;
        this.totalRuns++;
        
        // Apply permanent upgrades
        let bonusHealth = 0, bonusGold = 0;
        for (const [_, upgrade] of this.permanentUpgrades) {
            if (upgrade.purchased) {
                if (upgrade.effect.maxHealth) bonusHealth += upgrade.effect.maxHealth;
                if (upgrade.effect.gold) bonusGold += upgrade.effect.gold;
            }
        }
        
        this.currentRun = {
            floor: 1,
            room: 0,
            player: {
                health: 100 + bonusHealth,
                maxHealth: 100 + bonusHealth,
                gold: 0 + bonusGold,
                damage: 10,
                armor: 0,
                items: [],
                consumables: []
            },
            stats: {
                kills: 0,
                roomsCleared: 0,
                bossesKilled: 0,
                goldEarned: 0
            },
            map: this.generateFloor(1)
        };
        
        this.onRunStart?.(this.currentRun);
        return this.currentRun;
    }

    generateFloor(floorNum) {
        const rooms = [];
        const roomCount = 5 + floorNum;
        
        for (let i = 0; i < roomCount; i++) {
            let type;
            if (i === roomCount - 1) {
                type = 'boss';
            } else if (i === 0) {
                type = 'combat';
            } else {
                const roll = this.random();
                if (roll < 0.5) type = 'combat';
                else if (roll < 0.65) type = 'treasure';
                else if (roll < 0.75) type = 'shop';
                else if (roll < 0.85) type = 'event';
                else type = 'rest';
            }
            
            rooms.push(this.generateRoom(type, floorNum));
        }
        
        return rooms;
    }

    generateRoom(type, floor) {
        const room = { type, completed: false };
        
        switch (type) {
            case 'combat':
                room.enemies = this.generateEnemies(floor, 1 + Math.floor(this.random() * 2));
                break;
            case 'boss':
                room.enemies = [this.getBossForFloor(floor)];
                break;
            case 'treasure':
                room.reward = this.generateReward(floor);
                break;
            case 'shop':
                room.items = this.generateShopItems(floor);
                break;
            case 'event':
                const eventIds = Array.from(this.events.keys());
                room.event = this.events.get(eventIds[Math.floor(this.random() * eventIds.length)]);
                break;
            case 'rest':
                room.healAmount = 30;
                break;
        }
        
        return room;
    }

    generateEnemies(floor, count) {
        const tier = Math.min(3, Math.ceil(floor / 3));
        const eligible = Array.from(this.enemies.values()).filter(e => e.tier <= tier && !e.boss);
        
        const enemies = [];
        for (let i = 0; i < count; i++) {
            const template = eligible[Math.floor(this.random() * eligible.length)];
            enemies.push({
                ...template,
                health: template.health * (1 + floor * 0.1),
                damage: template.damage * (1 + floor * 0.05)
            });
        }
        return enemies;
    }

    getBossForFloor(floor) {
        const bosses = Array.from(this.enemies.values()).filter(e => e.boss);
        const boss = bosses[Math.floor(this.random() * bosses.length)];
        return {
            ...boss,
            health: boss.health * (1 + floor * 0.2),
            damage: boss.damage * (1 + floor * 0.1)
        };
    }

    generateReward(floor) {
        const items = Array.from(this.items.values());
        return {
            gold: Math.floor(20 + floor * 10 + this.random() * 30),
            item: items[Math.floor(this.random() * items.length)]
        };
    }

    generateShopItems(floor) {
        const items = Array.from(this.items.values());
        const shopItems = [];
        for (let i = 0; i < 3; i++) {
            const item = items[Math.floor(this.random() * items.length)];
            shopItems.push({
                ...item,
                price: Math.floor(30 + floor * 5 + this.random() * 20)
            });
        }
        return shopItems;
    }

    getCurrentRoom() {
        if (!this.currentRun) return null;
        return this.currentRun.map[this.currentRun.room];
    }

    completeRoom() {
        const room = this.getCurrentRoom();
        if (!room) return;
        
        room.completed = true;
        this.currentRun.stats.roomsCleared++;
        
        if (room.type === 'combat' || room.type === 'boss') {
            this.currentRun.stats.kills += room.enemies.length;
            if (room.type === 'boss') this.currentRun.stats.bossesKilled++;
        }
        
        this.onRoomComplete?.(room);
    }

    nextRoom() {
        this.currentRun.room++;
        
        if (this.currentRun.room >= this.currentRun.map.length) {
            this.nextFloor();
        }
        
        return this.getCurrentRoom();
    }

    nextFloor() {
        this.currentRun.floor++;
        this.currentRun.room = 0;
        this.currentRun.map = this.generateFloor(this.currentRun.floor);
        this.bestFloor = Math.max(this.bestFloor, this.currentRun.floor);
        this.onFloorChange?.(this.currentRun.floor);
    }

    endRun(victory = false) {
        const metaReward = Math.floor(
            this.currentRun.stats.kills * 2 +
            this.currentRun.floor * 10 +
            this.currentRun.stats.bossesKilled * 20 +
            (victory ? 100 : 0)
        );
        
        this.metaCurrency += metaReward;
        
        const result = {
            victory,
            floor: this.currentRun.floor,
            stats: this.currentRun.stats,
            metaReward
        };
        
        this.currentRun = null;
        this.onRunEnd?.(result);
        
        return result;
    }

    buyPermanentUpgrade(id) {
        const upgrade = this.permanentUpgrades.get(id);
        if (!upgrade || upgrade.purchased || this.metaCurrency < upgrade.cost) {
            return false;
        }
        
        this.metaCurrency -= upgrade.cost;
        upgrade.purchased = true;
        this.onUpgradePurchased?.(upgrade);
        return true;
    }

    // Callbacks
    onRunStart = null;
    onRunEnd = null;
    onRoomComplete = null;
    onFloorChange = null;
    onUpgradePurchased = null;
}`;
    }
}

export const roguelikeSystem = RoguelikeSystem.getInstance();
