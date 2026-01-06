/**
 * 🌳 Skill Tree System
 * 
 * RPG skill tree and progression:
 * - Multiple skill trees
 * - Prerequisites
 * - Point allocation
 * - Passive/Active skills
 * - Respec support
 */

import { EventEmitter } from 'events';

export type SkillType = 'active' | 'passive' | 'ultimate' | 'toggle';

export interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: SkillType;
    tier: number;
    maxLevel: number;
    prerequisites: string[];
    requiredPoints: number; // Total points needed in tree
    effects: SkillEffect[];
    cooldown?: number;
    manaCost?: number;
}

export interface SkillEffect {
    stat: string;
    value: number;
    perLevel: number; // Added per level
    type: 'flat' | 'percent' | 'multiply';
}

export interface SkillTree {
    id: string;
    name: string;
    icon: string;
    description: string;
    skills: Map<string, Skill>;
    tiers: number;
    requiredLevel?: number;
}

export interface PlayerSkills {
    playerId: string;
    trees: Map<string, Map<string, number>>; // tree -> skill -> level
    totalPoints: number;
    spentPoints: number;
    unlockedSkills: Set<string>;
}

export class SkillTreeSystem extends EventEmitter {
    private static instance: SkillTreeSystem;
    private trees: Map<string, SkillTree> = new Map();
    private players: Map<string, PlayerSkills> = new Map();

    private constructor() {
        super();
        this.initializeDefaultTrees();
    }

    static getInstance(): SkillTreeSystem {
        if (!SkillTreeSystem.instance) {
            SkillTreeSystem.instance = new SkillTreeSystem();
        }
        return SkillTreeSystem.instance;
    }

    private initializeDefaultTrees(): void {
        // Warrior Tree
        const warrior: SkillTree = {
            id: 'warrior', name: 'Warrior', icon: '⚔️',
            description: 'Master of weapons and combat',
            skills: new Map(), tiers: 5
        };

        warrior.skills.set('power_strike', {
            id: 'power_strike', name: 'Power Strike', icon: '💪',
            description: 'A powerful attack that deals bonus damage',
            type: 'active', tier: 1, maxLevel: 5,
            prerequisites: [], requiredPoints: 0,
            cooldown: 5, manaCost: 10,
            effects: [{ stat: 'damage', value: 20, perLevel: 10, type: 'flat' }]
        });

        warrior.skills.set('toughness', {
            id: 'toughness', name: 'Toughness', icon: '🛡️',
            description: 'Increases maximum health',
            type: 'passive', tier: 1, maxLevel: 5,
            prerequisites: [], requiredPoints: 0,
            effects: [{ stat: 'maxHealth', value: 10, perLevel: 5, type: 'percent' }]
        });

        warrior.skills.set('whirlwind', {
            id: 'whirlwind', name: 'Whirlwind', icon: '🌀',
            description: 'Spin attack hitting all nearby enemies',
            type: 'active', tier: 2, maxLevel: 5,
            prerequisites: ['power_strike'], requiredPoints: 5,
            cooldown: 10, manaCost: 25,
            effects: [{ stat: 'aoe_damage', value: 15, perLevel: 8, type: 'flat' }]
        });

        warrior.skills.set('berserker_rage', {
            id: 'berserker_rage', name: 'Berserker Rage', icon: '😤',
            description: 'Ultimate: Massive damage boost for 10 seconds',
            type: 'ultimate', tier: 5, maxLevel: 1,
            prerequisites: ['whirlwind', 'toughness'], requiredPoints: 20,
            cooldown: 60, manaCost: 50,
            effects: [
                { stat: 'damage', value: 100, perLevel: 0, type: 'percent' },
                { stat: 'attack_speed', value: 50, perLevel: 0, type: 'percent' }
            ]
        });

        this.trees.set('warrior', warrior);

        // Mage Tree
        const mage: SkillTree = {
            id: 'mage', name: 'Mage', icon: '🔮',
            description: 'Master of arcane magic',
            skills: new Map(), tiers: 5
        };

        mage.skills.set('fireball', {
            id: 'fireball', name: 'Fireball', icon: '🔥',
            description: 'Launch a ball of fire at enemies',
            type: 'active', tier: 1, maxLevel: 5,
            prerequisites: [], requiredPoints: 0,
            cooldown: 3, manaCost: 15,
            effects: [{ stat: 'fire_damage', value: 30, perLevel: 15, type: 'flat' }]
        });

        mage.skills.set('mana_mastery', {
            id: 'mana_mastery', name: 'Mana Mastery', icon: '💙',
            description: 'Increases maximum mana',
            type: 'passive', tier: 1, maxLevel: 5,
            prerequisites: [], requiredPoints: 0,
            effects: [{ stat: 'maxMana', value: 15, perLevel: 10, type: 'percent' }]
        });

        mage.skills.set('meteor', {
            id: 'meteor', name: 'Meteor Strike', icon: '☄️',
            description: 'Ultimate: Rain meteors from the sky',
            type: 'ultimate', tier: 5, maxLevel: 1,
            prerequisites: ['fireball'], requiredPoints: 20,
            cooldown: 90, manaCost: 100,
            effects: [{ stat: 'fire_damage', value: 500, perLevel: 0, type: 'flat' }]
        });

        this.trees.set('mage', mage);
    }

    // ========================================================================
    // PLAYER MANAGEMENT
    // ========================================================================

    registerPlayer(playerId: string, startingPoints: number = 0): PlayerSkills {
        const player: PlayerSkills = {
            playerId,
            trees: new Map(),
            totalPoints: startingPoints,
            spentPoints: 0,
            unlockedSkills: new Set()
        };

        // Initialize empty skill allocations for each tree
        this.trees.forEach((_, treeId) => {
            player.trees.set(treeId, new Map());
        });

        this.players.set(playerId, player);
        return player;
    }

    addPoints(playerId: string, points: number): void {
        const player = this.players.get(playerId);
        if (player) {
            player.totalPoints += points;
            this.emit('pointsAdded', { playerId, points, total: player.totalPoints });
        }
    }

    // ========================================================================
    // SKILL ALLOCATION
    // ========================================================================

    allocateSkill(playerId: string, treeId: string, skillId: string): { success: boolean; error?: string } {
        const player = this.players.get(playerId);
        const tree = this.trees.get(treeId);

        if (!player) return { success: false, error: 'Player not found' };
        if (!tree) return { success: false, error: 'Tree not found' };

        const skill = tree.skills.get(skillId);
        if (!skill) return { success: false, error: 'Skill not found' };

        const playerTree = player.trees.get(treeId) || new Map();
        const currentLevel = playerTree.get(skillId) || 0;

        // Check max level
        if (currentLevel >= skill.maxLevel) {
            return { success: false, error: 'Skill already maxed' };
        }

        // Check available points
        if (player.totalPoints - player.spentPoints < 1) {
            return { success: false, error: 'No skill points available' };
        }

        // Check prerequisites
        for (const prereq of skill.prerequisites) {
            if (!player.unlockedSkills.has(prereq)) {
                return { success: false, error: `Requires ${prereq}` };
            }
        }

        // Check required points in tree
        const treePoints = Array.from(playerTree.values()).reduce((a, b) => a + b, 0);
        if (treePoints < skill.requiredPoints) {
            return { success: false, error: `Need ${skill.requiredPoints} points in tree` };
        }

        // Allocate
        playerTree.set(skillId, currentLevel + 1);
        player.trees.set(treeId, playerTree);
        player.spentPoints++;
        player.unlockedSkills.add(skillId);

        this.emit('skillAllocated', { playerId, treeId, skillId, level: currentLevel + 1 });

        return { success: true };
    }

    // ========================================================================
    // RESPEC
    // ========================================================================

    respecTree(playerId: string, treeId: string): { success: boolean; pointsRefunded: number } {
        const player = this.players.get(playerId);
        if (!player) return { success: false, pointsRefunded: 0 };

        const playerTree = player.trees.get(treeId);
        if (!playerTree) return { success: false, pointsRefunded: 0 };

        const pointsRefunded = Array.from(playerTree.values()).reduce((a, b) => a + b, 0);

        // Remove unlocked skills from this tree
        playerTree.forEach((_, skillId) => {
            player.unlockedSkills.delete(skillId);
        });

        playerTree.clear();
        player.spentPoints -= pointsRefunded;

        this.emit('treeRespec', { playerId, treeId, pointsRefunded });

        return { success: true, pointsRefunded };
    }

    respecAll(playerId: string): { success: boolean; pointsRefunded: number } {
        const player = this.players.get(playerId);
        if (!player) return { success: false, pointsRefunded: 0 };

        const pointsRefunded = player.spentPoints;

        player.trees.forEach(tree => tree.clear());
        player.unlockedSkills.clear();
        player.spentPoints = 0;

        this.emit('fullRespec', { playerId, pointsRefunded });

        return { success: true, pointsRefunded };
    }

    // ========================================================================
    // STAT CALCULATIONS
    // ========================================================================

    calculateBonuses(playerId: string): Map<string, number> {
        const bonuses = new Map<string, number>();
        const player = this.players.get(playerId);
        if (!player) return bonuses;

        player.trees.forEach((skills, treeId) => {
            const tree = this.trees.get(treeId);
            if (!tree) return;

            skills.forEach((level, skillId) => {
                const skill = tree.skills.get(skillId);
                if (!skill || skill.type !== 'passive') return;

                skill.effects.forEach(effect => {
                    const current = bonuses.get(effect.stat) || 0;
                    const bonus = effect.value + (effect.perLevel * (level - 1));
                    bonuses.set(effect.stat, current + bonus);
                });
            });
        });

        return bonuses;
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateSkillTreeCode(): string {
        return `
// Skill Tree System
class SkillTreeManager {
    constructor() {
        this.trees = new Map();
        this.playerSkills = new Map();
        this.availablePoints = 0;
    }

    allocateSkill(treeId, skillId) {
        const tree = this.trees.get(treeId);
        const skill = tree?.skills.get(skillId);
        if (!skill) return { success: false, error: 'Skill not found' };

        const currentLevel = this.playerSkills.get(skillId) || 0;
        
        if (currentLevel >= skill.maxLevel) {
            return { success: false, error: 'Already maxed' };
        }
        if (this.availablePoints < 1) {
            return { success: false, error: 'No points' };
        }

        // Check prereqs
        for (const prereq of skill.prerequisites) {
            if (!this.playerSkills.has(prereq)) {
                return { success: false, error: 'Missing prerequisite' };
            }
        }

        this.playerSkills.set(skillId, currentLevel + 1);
        this.availablePoints--;
        
        game.emit('skillLearned', skill);
        return { success: true };
    }

    getPassiveBonuses() {
        const bonuses = {};
        this.playerSkills.forEach((level, skillId) => {
            const skill = this.getSkill(skillId);
            if (skill?.type !== 'passive') return;
            
            skill.effects.forEach(e => {
                const bonus = e.value + e.perLevel * (level - 1);
                bonuses[e.stat] = (bonuses[e.stat] || 0) + bonus;
            });
        });
        return bonuses;
    }

    respec() {
        const refunded = this.playerSkills.size;
        this.playerSkills.clear();
        this.availablePoints += refunded;
    }
}`;
    }

    getTree(id: string): SkillTree | undefined {
        return this.trees.get(id);
    }

    getAllTrees(): SkillTree[] {
        return Array.from(this.trees.values());
    }
}

export const skillTreeSystem = SkillTreeSystem.getInstance();
