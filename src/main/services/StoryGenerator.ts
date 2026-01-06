/**
 * 📖 Story Generator
 * 
 * Procedural narrative generation:
 * - Story arcs
 * - Character relationships
 * - Branching narratives
 * - Dynamic endings
 */

import { EventEmitter } from 'events';

export interface StoryCharacter {
    id: string;
    name: string;
    role: 'hero' | 'villain' | 'mentor' | 'ally' | 'neutral';
    traits: string[];
    motivation: string;
    relationships: { characterId: string; relation: string; strength: number }[];
}

export interface StoryAct {
    id: string;
    title: string;
    description: string;
    scenes: StoryScene[];
    triggers: { condition: string; nextActId: string }[];
}

export interface StoryScene {
    id: string;
    type: 'dialogue' | 'choice' | 'battle' | 'exploration' | 'revelation';
    content: string;
    characters: string[];
    choices?: { text: string; nextSceneId: string; consequence?: string }[];
}

export interface GeneratedStory {
    title: string;
    genre: string;
    setting: string;
    characters: StoryCharacter[];
    acts: StoryAct[];
    endings: { id: string; title: string; description: string; conditions: string[] }[];
}

export class StoryGenerator extends EventEmitter {
    private static instance: StoryGenerator;
    private templates: Map<string, any> = new Map();

    private constructor() {
        super();
        this.initializeTemplates();
    }

    static getInstance(): StoryGenerator {
        if (!StoryGenerator.instance) {
            StoryGenerator.instance = new StoryGenerator();
        }
        return StoryGenerator.instance;
    }

    private initializeTemplates(): void {
        // Hero's Journey template
        this.templates.set('heroes_journey', {
            acts: [
                { phase: 'ordinary_world', title: 'The Beginning' },
                { phase: 'call_to_adventure', title: 'The Call' },
                { phase: 'refusal', title: 'Hesitation' },
                { phase: 'meeting_mentor', title: 'Guidance' },
                { phase: 'crossing_threshold', title: 'Into the Unknown' },
                { phase: 'tests_allies', title: 'Trials' },
                { phase: 'approach', title: 'Preparation' },
                { phase: 'ordeal', title: 'The Crisis' },
                { phase: 'reward', title: 'Victory' },
                { phase: 'return', title: 'Homecoming' }
            ]
        });

        // Three act structure
        this.templates.set('three_act', {
            acts: [
                { phase: 'setup', title: 'Act I: Setup' },
                { phase: 'confrontation', title: 'Act II: Confrontation' },
                { phase: 'resolution', title: 'Act III: Resolution' }
            ]
        });
    }

    // ========================================================================
    // STORY GENERATION
    // ========================================================================

    generateStory(config: {
        genre: 'fantasy' | 'scifi' | 'mystery' | 'horror' | 'adventure';
        complexity: 'simple' | 'moderate' | 'complex';
        playerChoiceLevel: 'linear' | 'branching' | 'open';
    }): GeneratedStory {
        const setting = this.generateSetting(config.genre);
        const characters = this.generateCharacters(config.genre, config.complexity);
        const acts = this.generateActs(config.genre, config.complexity, characters);
        const endings = this.generateEndings(config.playerChoiceLevel);

        return {
            title: this.generateTitle(config.genre),
            genre: config.genre,
            setting,
            characters,
            acts,
            endings
        };
    }

    private generateTitle(genre: string): string {
        const titles: Record<string, string[]> = {
            fantasy: ['The Last Dragon', 'Crown of Shadows', 'Realm of Echoes', 'The Forgotten Kingdom'],
            scifi: ['Stellar Exodus', 'Neural Dawn', 'The Andromeda Protocol', 'Quantum Requiem'],
            mystery: ['The Silent Witness', 'Shadows in the Mirror', 'The Cipher', 'Midnight Truth'],
            horror: ['The Hollow', 'Whispers in the Dark', 'The Descent', 'Crimson Night'],
            adventure: ['Lost Horizons', 'The Golden Path', 'Uncharted Depths', 'Legacy of the Ancients']
        };

        const options = titles[genre] || titles['adventure'];
        return options[Math.floor(Math.random() * options.length)];
    }

    private generateSetting(genre: string): string {
        const settings: Record<string, string[]> = {
            fantasy: [
                'A kingdom on the brink of war, where ancient magic stirs once more.',
                'A world where dragons have returned after a thousand-year absence.',
                'A realm where the barrier between the living and the dead grows thin.'
            ],
            scifi: [
                'The year 2847, humanity spans a dozen star systems but faces extinction.',
                'A generation ship lost in deep space, its inhabitants unaware of the truth.',
                'Earth after the Singularity, where AI and humans share an uneasy peace.'
            ],
            mystery: [
                'A foggy coastal town where secrets run as deep as the tides.',
                'A prestigious academy where a student\'s disappearance reveals dark truths.',
                'A quiet village that hasn\'t been quiet in a very long time.'
            ],
            horror: [
                'An abandoned asylum that was never truly abandoned.',
                'A small town where the residents don\'t stay dead.',
                'A manor house that feeds on fear.'
            ],
            adventure: [
                'Uncharted islands rumored to hold the treasure of a lost civilization.',
                'Ancient ruins beneath a modern city, hiding forgotten technology.',
                'A dangerous journey across war-torn lands to reach sanctuary.'
            ]
        };

        const options = settings[genre] || settings['adventure'];
        return options[Math.floor(Math.random() * options.length)];
    }

    private generateCharacters(genre: string, complexity: string): StoryCharacter[] {
        const characterCount = complexity === 'simple' ? 3 : complexity === 'moderate' ? 5 : 8;
        const characters: StoryCharacter[] = [];

        // Hero
        characters.push({
            id: 'hero',
            name: this.randomName(),
            role: 'hero',
            traits: this.randomTraits(3),
            motivation: 'To restore peace and find their true purpose',
            relationships: []
        });

        // Villain
        characters.push({
            id: 'villain',
            name: this.randomName(),
            role: 'villain',
            traits: ['cunning', 'powerful', 'driven'],
            motivation: 'To reshape the world according to their vision',
            relationships: [{ characterId: 'hero', relation: 'nemesis', strength: -100 }]
        });

        // Mentor
        if (characterCount >= 3) {
            characters.push({
                id: 'mentor',
                name: this.randomName(),
                role: 'mentor',
                traits: ['wise', 'mysterious', 'burdened'],
                motivation: 'To guide the hero and atone for past failures',
                relationships: [{ characterId: 'hero', relation: 'teacher', strength: 80 }]
            });
        }

        // Additional allies
        for (let i = characters.length; i < characterCount; i++) {
            characters.push({
                id: `ally_${i}`,
                name: this.randomName(),
                role: Math.random() > 0.3 ? 'ally' : 'neutral',
                traits: this.randomTraits(2),
                motivation: 'To survive and protect what they love',
                relationships: [{ characterId: 'hero', relation: 'friend', strength: 50 + Math.random() * 50 }]
            });
        }

        return characters;
    }

    private generateActs(genre: string, complexity: string, characters: StoryCharacter[]): StoryAct[] {
        const template = this.templates.get('three_act');
        const acts: StoryAct[] = [];

        template.acts.forEach((actTemplate: any, index: number) => {
            const scenes = this.generateScenes(actTemplate.phase, genre, characters);

            acts.push({
                id: `act_${index}`,
                title: actTemplate.title,
                description: this.generateActDescription(actTemplate.phase, genre),
                scenes,
                triggers: index < template.acts.length - 1
                    ? [{ condition: 'scenes_complete', nextActId: `act_${index + 1}` }]
                    : []
            });
        });

        return acts;
    }

    private generateScenes(phase: string, genre: string, characters: StoryCharacter[]): StoryScene[] {
        const scenes: StoryScene[] = [];
        const sceneCount = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < sceneCount; i++) {
            const sceneType = this.randomSceneType(phase);
            const involvedCharacters = characters.slice(0, Math.floor(Math.random() * 3) + 1).map(c => c.id);

            const scene: StoryScene = {
                id: `scene_${phase}_${i}`,
                type: sceneType,
                content: this.generateSceneContent(sceneType, phase, genre),
                characters: involvedCharacters
            };

            if (sceneType === 'choice') {
                scene.choices = [
                    { text: 'Take the bold approach', nextSceneId: `scene_${phase}_${i}_a`, consequence: 'reputation_increase' },
                    { text: 'Proceed cautiously', nextSceneId: `scene_${phase}_${i}_b`, consequence: 'safety' },
                    { text: 'Seek another way', nextSceneId: `scene_${phase}_${i}_c`, consequence: 'discovery' }
                ];
            }

            scenes.push(scene);
        }

        return scenes;
    }

    private generateEndings(choiceLevel: string): { id: string; title: string; description: string; conditions: string[] }[] {
        const endings = [
            {
                id: 'ending_triumph',
                title: 'Complete Victory',
                description: 'The hero has overcome all obstacles and brought lasting peace.',
                conditions: ['villain_defeated', 'allies_survived', 'secrets_revealed']
            },
            {
                id: 'ending_pyrrhic',
                title: 'Pyrrhic Victory',
                description: 'The evil is vanquished, but at great personal cost.',
                conditions: ['villain_defeated', 'ally_sacrifice']
            }
        ];

        if (choiceLevel !== 'linear') {
            endings.push({
                id: 'ending_dark',
                title: 'The Dark Path',
                description: 'Power corrupts, and the hero becomes what they sought to destroy.',
                conditions: ['dark_choices', 'mentor_betrayed']
            });
        }

        if (choiceLevel === 'open') {
            endings.push({
                id: 'ending_mystery',
                title: 'Into the Unknown',
                description: 'The journey continues, with new horizons awaiting.',
                conditions: ['secrets_undiscovered', 'hero_transformed']
            });
        }

        return endings;
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private randomName(): string {
        const firstNames = ['Aria', 'Marcus', 'Elena', 'Kael', 'Lyra', 'Theron', 'Zara', 'Rowan'];
        const lastNames = ['Shadowmend', 'Stormborn', 'Nighthollow', 'Ironforge', 'Starweaver'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    private randomTraits(count: number): string[] {
        const allTraits = ['brave', 'cunning', 'compassionate', 'stubborn', 'loyal', 'secretive', 'hopeful', 'haunted'];
        return allTraits.sort(() => Math.random() - 0.5).slice(0, count);
    }

    private randomSceneType(phase: string): 'dialogue' | 'choice' | 'battle' | 'exploration' | 'revelation' {
        const types: ('dialogue' | 'choice' | 'battle' | 'exploration' | 'revelation')[] =
            phase === 'confrontation'
                ? ['battle', 'choice', 'dialogue']
                : ['dialogue', 'exploration', 'choice', 'revelation'];
        return types[Math.floor(Math.random() * types.length)];
    }

    private generateActDescription(phase: string, _genre: string): string {
        const descriptions: Record<string, string> = {
            setup: 'The world is introduced, and the seeds of conflict are planted.',
            confrontation: 'The stakes escalate as the hero faces mounting challenges.',
            resolution: 'All threads converge as the final confrontation approaches.'
        };
        return descriptions[phase] || 'The story unfolds...';
    }

    private generateSceneContent(type: string, _phase: string, _genre: string): string {
        const content: Record<string, string[]> = {
            dialogue: [
                'A tense conversation reveals hidden truths.',
                'An unexpected ally shares crucial information.',
                'Old wounds are reopened as past betrayals come to light.'
            ],
            choice: [
                'A crossroads presents itself, with no clear right answer.',
                'The hero must decide who to trust.',
                'Sacrifice or pragmatism—the choice will shape what follows.'
            ],
            battle: [
                'Steel clashes against steel in a desperate fight.',
                'The enemy forces close in from all sides.',
                'A duel of wills and power determines the victor.'
            ],
            exploration: [
                'Ancient ruins hold secrets of a forgotten age.',
                'The path forward leads through dangerous territory.',
                'Discovery awaits those brave enough to venture into the unknown.'
            ],
            revelation: [
                'The truth emerges, changing everything.',
                'A shocking betrayal is revealed.',
                'The hero learns the true nature of their quest.'
            ]
        };

        const options = content[type] || ['The scene unfolds...'];
        return options[Math.floor(Math.random() * options.length)];
    }
}

export const storyGenerator = StoryGenerator.getInstance();
