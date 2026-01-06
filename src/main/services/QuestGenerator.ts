/**
 * 🎯 Quest Generator
 * 
 * Procedural quest generation system:
 * - Multiple quest archetypes
 * - Dynamic objectives
 * - Reward scaling
 * - Narrative templates
 * - Quest chains
 */

import { EventEmitter } from 'events';

export type QuestType = 'fetch' | 'kill' | 'escort' | 'explore' | 'puzzle' | 'boss' | 'collect' | 'defend' | 'investigate' | 'craft';
export type QuestDifficulty = 'trivial' | 'easy' | 'normal' | 'hard' | 'heroic' | 'legendary';

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    difficulty: QuestDifficulty;
    giver: string;
    location?: string;
    objectives: QuestObjective[];
    rewards: QuestReward[];
    prerequisites?: string[];
    timeLimit?: number;
    isRepeatable: boolean;
    chain?: { previous?: string; next?: string };
}

export interface QuestObjective {
    id: string;
    description: string;
    type: 'kill' | 'collect' | 'reach' | 'interact' | 'survive' | 'escort' | 'craft';
    target: string;
    current: number;
    required: number;
    optional: boolean;
    hidden: boolean;
}

export interface QuestReward {
    type: 'xp' | 'gold' | 'item' | 'reputation' | 'ability' | 'unlockArea';
    value: any;
    amount?: number;
}

export class QuestGenerator extends EventEmitter {
    private static instance: QuestGenerator;
    private quests: Map<string, Quest> = new Map();
    private questIdCounter = 0;

    private constructor() { super(); }

    static getInstance(): QuestGenerator {
        if (!QuestGenerator.instance) {
            QuestGenerator.instance = new QuestGenerator();
        }
        return QuestGenerator.instance;
    }

    // ========================================================================
    // QUEST GENERATION
    // ========================================================================

    generateQuest(type: QuestType, difficulty: QuestDifficulty, context?: any): Quest {
        const id = `quest_${++this.questIdCounter}`;
        const template = this.getQuestTemplate(type);

        const quest: Quest = {
            id,
            title: this.generateTitle(type, context),
            description: this.generateDescription(type, context),
            type,
            difficulty,
            giver: context?.giver || this.generateQuestGiver(),
            location: context?.location || this.generateLocation(type),
            objectives: this.generateObjectives(type, difficulty),
            rewards: this.generateRewards(type, difficulty),
            isRepeatable: type === 'collect' || type === 'kill',
            ...template
        };

        this.quests.set(id, quest);
        this.emit('questGenerated', quest);
        return quest;
    }

    private getQuestTemplate(type: QuestType): Partial<Quest> {
        const templates: Partial<Record<QuestType, Partial<Quest>>> = {
            boss: { timeLimit: 600, isRepeatable: false },
            escort: { timeLimit: 300 },
            defend: { timeLimit: 180 },
        };
        return templates[type] || {};
    }

    private generateTitle(type: QuestType, context?: any): string {
        const titles: Record<QuestType, string[]> = {
            fetch: ['The Lost Artifact', 'Recovery Mission', 'Retrieve the Relic', 'The Missing Heirloom'],
            kill: ['Hunt the Beast', 'Clear the Threat', 'Monster Slayer', 'Bounty Hunt'],
            escort: ['Safe Passage', 'The Journey Home', 'Protect the Innocent', 'Guardian Duty'],
            explore: ['Into the Unknown', 'Uncharted Territory', 'Mapping the Depths', 'Discovery'],
            puzzle: ['The Ancient Riddle', 'Mind Games', 'Secrets of the Ancients', 'The Cryptic Challenge'],
            boss: ['The Final Challenge', 'Face Your Destiny', 'The Titan Awakens', 'Legendary Battle'],
            collect: ['Gathering Resources', 'The Collector', 'Harvest Time', 'Material Needs'],
            defend: ['Hold the Line', 'Last Stand', 'Siege Defense', 'Protect the Village'],
            investigate: ['Mystery of the Night', 'The Missing Person', 'Clues in the Dark', 'Trail of Evidence'],
            craft: ['Master Craftsman', 'Forge of Legends', 'The Perfect Creation', 'Artisan Challenge']
        };

        const options = titles[type] || ['The Quest'];
        return context?.title || options[Math.floor(Math.random() * options.length)];
    }

    private generateDescription(type: QuestType, context?: any): string {
        const templates: Record<QuestType, string[]> = {
            fetch: [
                'An important item has gone missing. Track it down and return it to its rightful owner.',
                'A precious artifact was stolen by bandits. Recover it before it falls into the wrong hands.',
            ],
            kill: [
                'A dangerous creature threatens the region. Hunt it down and put an end to the menace.',
                'Monsters have been spotted near the village. Eliminate them before anyone gets hurt.',
            ],
            escort: [
                'A traveler needs protection on their journey through dangerous lands.',
                'Ensure safe passage for the merchant caravan through hostile territory.',
            ],
            explore: [
                'Ancient ruins have been discovered. Explore them and report your findings.',
                'Map the uncharted caves to the north. Who knows what secrets lie within?',
            ],
            puzzle: [
                'An ancient mechanism guards a hidden treasure. Solve its riddles to claim the prize.',
                'Decipher the cryptic inscriptions to unlock the sealed chamber.',
            ],
            boss: [
                'A legendary creature of immense power has awakened. Gather your courage and face it.',
                'The final confrontation awaits. Prepare yourself for the battle of a lifetime.',
            ],
            collect: [
                'Gather the required materials for an important crafting project.',
                'The alchemist needs rare ingredients. Collect them from the wilderness.',
            ],
            defend: [
                'Enemy forces are approaching. Prepare defenses and hold your ground.',
                'Protect the village from the incoming raid until reinforcements arrive.',
            ],
            investigate: [
                'Strange occurrences have been reported. Investigate and uncover the truth.',
                'A person has gone missing. Follow the clues and find out what happened.',
            ],
            craft: [
                'Create a masterwork item using the finest materials and your skills.',
                'The legendary forge requires a skilled artisan. Prove your worth.',
            ]
        };

        const options = templates[type] || ['Complete the objectives.'];
        return context?.description || options[Math.floor(Math.random() * options.length)];
    }

    private generateQuestGiver(): string {
        const givers = [
            'Village Elder', 'Mysterious Stranger', 'Town Guard Captain',
            'Traveling Merchant', 'Local Farmer', 'Royal Messenger',
            'Tavern Keeper', 'Wandering Monk', 'Guild Master', 'Desperate Widow'
        ];
        return givers[Math.floor(Math.random() * givers.length)];
    }

    private generateLocation(type: QuestType): string {
        const locations: Partial<Record<QuestType, string[]>> = {
            explore: ['Ancient Ruins', 'Forgotten Caves', 'Sunken Temple', 'Haunted Manor'],
            kill: ['Dark Forest', 'Mountain Pass', 'Swamp', 'Abandoned Mine'],
            fetch: ['Bandit Camp', 'Thieves Guild', 'Enemy Fortress', 'Hidden Cave'],
            boss: ['Dragon\'s Lair', 'Demon Tower', 'Abyssal Depths', 'Throne of Bones'],
        };
        const options = locations[type] || ['Unknown Location'];
        return options[Math.floor(Math.random() * options.length)];
    }

    private generateObjectives(type: QuestType, difficulty: QuestDifficulty): QuestObjective[] {
        const multiplier = this.getDifficultyMultiplier(difficulty);
        const objectives: QuestObjective[] = [];

        switch (type) {
            case 'kill':
                objectives.push({
                    id: 'obj_1',
                    description: `Defeat ${Math.floor(5 * multiplier)} enemies`,
                    type: 'kill',
                    target: 'enemy',
                    current: 0,
                    required: Math.floor(5 * multiplier),
                    optional: false,
                    hidden: false
                });
                break;
            case 'collect':
                objectives.push({
                    id: 'obj_1',
                    description: `Collect ${Math.floor(10 * multiplier)} items`,
                    type: 'collect',
                    target: 'resource',
                    current: 0,
                    required: Math.floor(10 * multiplier),
                    optional: false,
                    hidden: false
                });
                break;
            case 'escort':
                objectives.push({
                    id: 'obj_1',
                    description: 'Escort the NPC to safety',
                    type: 'escort',
                    target: 'npc',
                    current: 0,
                    required: 1,
                    optional: false,
                    hidden: false
                });
                objectives.push({
                    id: 'obj_2',
                    description: 'Keep the NPC alive',
                    type: 'survive',
                    target: 'npc_health',
                    current: 100,
                    required: 50,
                    optional: false,
                    hidden: false
                });
                break;
            case 'explore':
                objectives.push({
                    id: 'obj_1',
                    description: 'Reach the destination',
                    type: 'reach',
                    target: 'location',
                    current: 0,
                    required: 1,
                    optional: false,
                    hidden: false
                });
                objectives.push({
                    id: 'obj_2',
                    description: 'Discover hidden secrets',
                    type: 'interact',
                    target: 'secrets',
                    current: 0,
                    required: 3,
                    optional: true,
                    hidden: true
                });
                break;
            case 'boss':
                objectives.push({
                    id: 'obj_1',
                    description: 'Defeat the boss',
                    type: 'kill',
                    target: 'boss',
                    current: 0,
                    required: 1,
                    optional: false,
                    hidden: false
                });
                break;
            default:
                objectives.push({
                    id: 'obj_1',
                    description: 'Complete the objective',
                    type: 'interact',
                    target: 'objective',
                    current: 0,
                    required: 1,
                    optional: false,
                    hidden: false
                });
        }

        return objectives;
    }

    private generateRewards(type: QuestType, difficulty: QuestDifficulty): QuestReward[] {
        const multiplier = this.getDifficultyMultiplier(difficulty);
        const rewards: QuestReward[] = [];

        // XP reward
        rewards.push({
            type: 'xp',
            value: Math.floor(100 * multiplier),
            amount: Math.floor(100 * multiplier)
        });

        // Gold reward
        rewards.push({
            type: 'gold',
            value: Math.floor(50 * multiplier),
            amount: Math.floor(50 * multiplier)
        });

        // Boss quests give items
        if (type === 'boss' || (difficulty === 'legendary' && Math.random() > 0.5)) {
            rewards.push({
                type: 'item',
                value: this.generateRewardItem(difficulty)
            });
        }

        return rewards;
    }

    private getDifficultyMultiplier(difficulty: QuestDifficulty): number {
        const multipliers: Record<QuestDifficulty, number> = {
            trivial: 0.5,
            easy: 0.75,
            normal: 1,
            hard: 1.5,
            heroic: 2,
            legendary: 3
        };
        return multipliers[difficulty];
    }

    private generateRewardItem(difficulty: QuestDifficulty): string {
        const items: Record<QuestDifficulty, string[]> = {
            trivial: ['Potion', 'Bandage'],
            easy: ['Iron Sword', 'Leather Armor'],
            normal: ['Steel Sword', 'Chainmail'],
            hard: ['Enchanted Blade', 'Runic Armor'],
            heroic: ['Legendary Weapon', 'Epic Armor'],
            legendary: ['Godslayer', 'Divine Armor', 'Mythic Artifact']
        };
        const options = items[difficulty];
        return options[Math.floor(Math.random() * options.length)];
    }

    // ========================================================================
    // QUEST CHAIN GENERATION
    // ========================================================================

    generateQuestChain(name: string, length: number, startDifficulty: QuestDifficulty): Quest[] {
        const chain: Quest[] = [];
        const difficulties: QuestDifficulty[] = ['trivial', 'easy', 'normal', 'hard', 'heroic', 'legendary'];
        let currentDiffIndex = difficulties.indexOf(startDifficulty);

        for (let i = 0; i < length; i++) {
            const types: QuestType[] = ['fetch', 'kill', 'explore', 'investigate'];
            const type = i === length - 1 ? 'boss' : types[Math.floor(Math.random() * types.length)];

            const quest = this.generateQuest(type, difficulties[currentDiffIndex], {
                title: `${name} - Part ${i + 1}`
            });

            quest.chain = {
                previous: chain.length > 0 ? chain[chain.length - 1].id : undefined,
                next: i < length - 1 ? `pending_${i + 1}` : undefined
            };

            if (chain.length > 0) {
                quest.prerequisites = [chain[chain.length - 1].id];
            }

            chain.push(quest);

            // Increase difficulty every 2 quests
            if ((i + 1) % 2 === 0 && currentDiffIndex < difficulties.length - 1) {
                currentDiffIndex++;
            }
        }

        return chain;
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateQuestSystemCode(): string {
        return `
// Quest System Implementation
class QuestManager {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questLog = [];
    }

    startQuest(quest) {
        if (this.activeQuests.has(quest.id)) return false;
        if (quest.prerequisites?.some(p => !this.completedQuests.has(p))) return false;

        this.activeQuests.set(quest.id, {
            ...quest,
            startTime: Date.now(),
            objectives: quest.objectives.map(o => ({ ...o }))
        });
        
        this.questLog.push({ type: 'start', questId: quest.id, time: Date.now() });
        game.emit('questStarted', quest);
        return true;
    }

    updateObjective(questId, objectiveId, progress) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;

        const objective = quest.objectives.find(o => o.id === objectiveId);
        if (!objective) return;

        objective.current = Math.min(progress, objective.required);
        game.emit('objectiveUpdated', { questId, objectiveId, progress: objective.current });

        if (this.checkQuestComplete(quest)) {
            this.completeQuest(questId);
        }
    }

    checkQuestComplete(quest) {
        return quest.objectives
            .filter(o => !o.optional)
            .every(o => o.current >= o.required);
    }

    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;

        // Grant rewards
        quest.rewards.forEach(reward => {
            switch (reward.type) {
                case 'xp': game.player.addXP(reward.amount); break;
                case 'gold': game.player.addGold(reward.amount); break;
                case 'item': game.inventory.add(reward.value); break;
            }
        });

        this.completedQuests.add(questId);
        this.activeQuests.delete(questId);
        
        this.questLog.push({ type: 'complete', questId, time: Date.now() });
        game.emit('questCompleted', quest);

        // Auto-start next in chain
        if (quest.chain?.next) {
            const nextQuest = this.getQuestById(quest.chain.next);
            if (nextQuest) this.startQuest(nextQuest);
        }
    }

    abandonQuest(questId) {
        if (!this.activeQuests.has(questId)) return false;
        
        this.activeQuests.delete(questId);
        this.questLog.push({ type: 'abandon', questId, time: Date.now() });
        game.emit('questAbandoned', questId);
        return true;
    }

    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }
}`;
    }

    getQuest(id: string): Quest | undefined {
        return this.quests.get(id);
    }

    getAllQuests(): Quest[] {
        return Array.from(this.quests.values());
    }
}

export const questGenerator = QuestGenerator.getInstance();
