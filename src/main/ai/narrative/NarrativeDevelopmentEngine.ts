/**
 * Narrative Driven Development Engine
 * 
 * Transforms projects into interactive storyboards where agents
 * narrate progress like a novel and track the development journey.
 */

import { EventEmitter } from 'events';

export interface DevelopmentStory {
    id: string;
    title: string;
    genre: StoryGenre;
    chapters: Chapter[];
    characters: Character[];
    currentChapter: number;
    progress: number;
    startedAt: Date;
    lastUpdate: Date;
}

export type StoryGenre = 'epic' | 'adventure' | 'mystery' | 'thriller' | 'comedy' | 'drama';

export interface Chapter {
    id: string;
    number: number;
    title: string;
    summary: string;
    scenes: Scene[];
    milestone?: string;
    status: 'upcoming' | 'in_progress' | 'completed';
    startedAt?: Date;
    completedAt?: Date;
}

export interface Scene {
    id: string;
    title: string;
    description: string;
    narrator: string;
    events: StoryEvent[];
    mood: Mood;
    timestamp: Date;
}

export interface StoryEvent {
    type: 'action' | 'dialogue' | 'revelation' | 'conflict' | 'resolution';
    content: string;
    actor: string;
    impact: 'minor' | 'moderate' | 'major' | 'critical';
}

export type Mood = 'hopeful' | 'tense' | 'triumphant' | 'suspenseful' | 'melancholic' | 'exciting' | 'peaceful';

export interface Character {
    id: string;
    name: string;
    role: CharacterRole;
    description: string;
    traits: string[];
    emotionalState: string;
    contributions: number;
}

export type CharacterRole = 'protagonist' | 'mentor' | 'ally' | 'challenger' | 'guardian' | 'trickster';

export interface NarrativeStyle {
    voice: 'epic' | 'casual' | 'dramatic' | 'humorous' | 'technical';
    tense: 'past' | 'present';
    perspective: 'first' | 'third';
}

export class NarrativeDevelopmentEngine extends EventEmitter {
    private static instance: NarrativeDevelopmentEngine;
    private stories: Map<string, DevelopmentStory> = new Map();
    private style: NarrativeStyle = { voice: 'epic', tense: 'past', perspective: 'third' };

    private constructor() {
        super();
    }

    static getInstance(): NarrativeDevelopmentEngine {
        if (!NarrativeDevelopmentEngine.instance) {
            NarrativeDevelopmentEngine.instance = new NarrativeDevelopmentEngine();
        }
        return NarrativeDevelopmentEngine.instance;
    }

    // ========================================================================
    // STORY CREATION
    // ========================================================================

    createStory(projectName: string, genre: StoryGenre = 'epic'): DevelopmentStory {
        const story: DevelopmentStory = {
            id: `story_${Date.now()}`,
            title: this.generateTitle(projectName, genre),
            genre,
            chapters: [],
            characters: this.createDefaultCharacters(),
            currentChapter: 0,
            progress: 0,
            startedAt: new Date(),
            lastUpdate: new Date(),
        };

        // Opening chapter
        story.chapters.push(this.createChapter(1, 'The Genesis', 'And so it began...'));
        story.currentChapter = 1;

        this.stories.set(story.id, story);
        this.emit('story:created', story);
        return story;
    }

    private generateTitle(projectName: string, genre: StoryGenre): string {
        const templates: Record<StoryGenre, string[]> = {
            epic: ['The Chronicles of {name}', 'Legend of {name}', '{name}: A Saga'],
            adventure: ['The {name} Adventure', 'Quest for {name}', 'Journey to {name}'],
            mystery: ['The {name} Enigma', 'Secrets of {name}', 'The {name} Files'],
            thriller: ['{name}: The Race', 'Deadline {name}', 'The {name} Protocol'],
            comedy: ['The Misadventures of {name}'],
            drama: ['{name}: A Story', 'The {name} Project', 'Building {name}'],
        };

        const options = templates[genre];
        const template = Array.isArray(options) ? options[Math.floor(Math.random() * options.length)] : options;
        return template.replace('{name}', projectName);
    }

    private createDefaultCharacters(): Character[] {
        return [
            {
                id: 'char_dev',
                name: 'The Developer',
                role: 'protagonist',
                description: 'A brave soul venturing into the unknown realms of code.',
                traits: ['determined', 'curious', 'resourceful'],
                emotionalState: 'focused',
                contributions: 0,
            },
            {
                id: 'char_ai',
                name: 'Shadow AI',
                role: 'mentor',
                description: 'An ancient intelligence, guiding with wisdom and power.',
                traits: ['wise', 'patient', 'powerful'],
                emotionalState: 'supportive',
                contributions: 0,
            },
            {
                id: 'char_bugs',
                name: 'The Bug Horde',
                role: 'challenger',
                description: 'Relentless enemies lurking in the shadows of logic.',
                traits: ['persistent', 'sneaky', 'numerous'],
                emotionalState: 'hostile',
                contributions: 0,
            },
            {
                id: 'char_tests',
                name: 'Guardian of Tests',
                role: 'guardian',
                description: 'The vigilant protector ensuring all paths are true.',
                traits: ['thorough', 'strict', 'reliable'],
                emotionalState: 'vigilant',
                contributions: 0,
            },
        ];
    }

    private createChapter(number: number, title: string, summary: string): Chapter {
        return {
            id: `chapter_${number}`,
            number,
            title,
            summary,
            scenes: [],
            status: number === 1 ? 'in_progress' : 'upcoming',
            startedAt: number === 1 ? new Date() : undefined,
        };
    }

    // ========================================================================
    // NARRATION
    // ========================================================================

    async narrate(storyId: string, event: { type: StoryEvent['type']; actor: string; action: string }): Promise<Scene> {
        const story = this.stories.get(storyId);
        if (!story) throw new Error('Story not found');

        const currentChapter = story.chapters.find(c => c.number === story.currentChapter);
        if (!currentChapter) throw new Error('No active chapter');

        const narrative = this.generateNarrative(event, story.genre);
        const mood = this.determineMood(event);

        const scene: Scene = {
            id: `scene_${Date.now()}`,
            title: this.generateSceneTitle(event),
            description: narrative,
            narrator: 'Shadow AI',
            events: [{
                type: event.type,
                content: event.action,
                actor: event.actor,
                impact: this.assessImpact(event.action),
            }],
            mood,
            timestamp: new Date(),
        };

        currentChapter.scenes.push(scene);
        story.lastUpdate = new Date();
        story.progress = this.calculateProgress(story);

        this.emit('scene:added', { story, scene });
        return scene;
    }

    private generateNarrative(event: { type: StoryEvent['type']; actor: string; action: string }, genre: StoryGenre): string {
        const templates: Record<StoryGenre, Record<StoryEvent['type'], string[]>> = {
            epic: {
                action: [
                    'With determination burning bright, {actor} embarked upon {action}.',
                    'The ancient halls echoed as {actor} executed {action}.',
                    'Legends would speak of how {actor} achieved {action}.',
                ],
                dialogue: [
                    '"Let it be done," spoke {actor}, as they initiated {action}.',
                    'The wisdom of {actor} rang clear: {action}.',
                ],
                revelation: [
                    'A great truth unveiled itself: {action}!',
                    'And lo, {actor} discovered {action}.',
                ],
                conflict: [
                    'But darkness stirred! {actor} faced {action}.',
                    'The challenge arose: {action}. {actor} stood firm.',
                ],
                resolution: [
                    'Victory! {actor} conquered {action}.',
                    'Peace returned as {actor} resolved {action}.',
                ],
            },
            adventure: {
                action: ['Adventure called as {actor} pursued {action}.'],
                dialogue: ['{actor} declared with excitement: "{action}!"'],
                revelation: ['What a discovery! {action}!'],
                conflict: ['Danger ahead! {action}'],
                resolution: ['Success! {actor} completed {action}.'],
            },
            mystery: {
                action: ['Quietly, {actor} investigated {action}.'],
                dialogue: ['"Curious..." murmured {actor}. {action}.'],
                revelation: ['The mystery deepens: {action}!'],
                conflict: ['Something was wrong. {action}.'],
                resolution: ['The pieces fit! {action}.'],
            },
            thriller: {
                action: ['Racing against time, {actor} executed {action}.'],
                dialogue: ['"We have no time!" {actor} shouted. {action}.'],
                revelation: ['Plot twist: {action}!'],
                conflict: ['Crisis! {action}!'],
                resolution: ['Just in time! {actor} delivered {action}.'],
            },
            comedy: {
                action: ['And there was {actor}, somehow managing {action}.'],
                dialogue: ['"Well, this is awkward," said {actor}. {action}.'],
                revelation: ['Wait, what? {action}!'],
                conflict: ['Oops! {action}. Classic {actor}.'],
                resolution: ['Miraculously, {actor} pulled off {action}.'],
            },
            drama: {
                action: ['{actor} focused intently on {action}.'],
                dialogue: ['With careful words, {actor} approached {action}.'],
                revelation: ['The truth emerged: {action}.'],
                conflict: ['Tension built as {action} unfolded.'],
                resolution: ['{actor} achieved {action} with grace.'],
            },
        };

        const typeTemplates = templates[genre]?.[event.type] || templates.epic[event.type];
        const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

        return template
            .replace('{actor}', event.actor)
            .replace('{action}', event.action);
    }

    private generateSceneTitle(event: { type: StoryEvent['type']; action: string }): string {
        const words = event.action.split(' ').slice(0, 3).join(' ');
        const prefixes: Record<StoryEvent['type'], string> = {
            action: 'The Act of',
            dialogue: 'Words of',
            revelation: 'The Discovery:',
            conflict: 'The Challenge:',
            resolution: 'Victory:',
        };
        return `${prefixes[event.type]} ${words}`;
    }

    private determineMood(event: { type: StoryEvent['type'] }): Mood {
        const moodMap: Record<StoryEvent['type'], Mood> = {
            action: 'exciting',
            dialogue: 'peaceful',
            revelation: 'hopeful',
            conflict: 'tense',
            resolution: 'triumphant',
        };
        return moodMap[event.type];
    }

    private assessImpact(action: string): StoryEvent['impact'] {
        const critical = ['deploy', 'release', 'launch', 'complete', 'finish'];
        const major = ['implement', 'create', 'build', 'fix', 'resolve'];
        const moderate = ['update', 'refactor', 'improve', 'add'];

        const lower = action.toLowerCase();
        if (critical.some(w => lower.includes(w))) return 'critical';
        if (major.some(w => lower.includes(w))) return 'major';
        if (moderate.some(w => lower.includes(w))) return 'moderate';
        return 'minor';
    }

    private calculateProgress(story: DevelopmentStory): number {
        const completedChapters = story.chapters.filter(c => c.status === 'completed').length;
        return Math.round((completedChapters / Math.max(story.chapters.length, 1)) * 100);
    }

    // ========================================================================
    // CHAPTER MANAGEMENT
    // ========================================================================

    completeChapter(storyId: string, nextChapterTitle?: string): Chapter | undefined {
        const story = this.stories.get(storyId);
        if (!story) return undefined;

        const current = story.chapters.find(c => c.number === story.currentChapter);
        if (current) {
            current.status = 'completed';
            current.completedAt = new Date();
        }

        if (nextChapterTitle) {
            const newChapter = this.createChapter(
                story.currentChapter + 1,
                nextChapterTitle,
                `Chapter ${story.currentChapter + 1} begins...`
            );
            newChapter.status = 'in_progress';
            newChapter.startedAt = new Date();
            story.chapters.push(newChapter);
            story.currentChapter = newChapter.number;
        }

        story.progress = this.calculateProgress(story);
        story.lastUpdate = new Date();

        this.emit('chapter:completed', { story, chapter: current });
        return current;
    }

    addMilestone(storyId: string, milestone: string): void {
        const story = this.stories.get(storyId);
        if (!story) return;

        const current = story.chapters.find(c => c.number === story.currentChapter);
        if (current) {
            current.milestone = milestone;
            this.emit('milestone:added', { story, milestone });
        }
    }

    // ========================================================================
    // EXPORT
    // ========================================================================

    exportAsMarkdown(storyId: string): string | undefined {
        const story = this.stories.get(storyId);
        if (!story) return undefined;

        let md = `# ${story.title}\n\n`;
        md += `*A ${story.genre} development story*\n\n`;
        md += `**Progress:** ${story.progress}%\n\n`;
        md += `---\n\n`;

        for (const chapter of story.chapters) {
            md += `## Chapter ${chapter.number}: ${chapter.title}\n\n`;
            md += `*${chapter.summary}*\n\n`;

            if (chapter.milestone) {
                md += `> 🏆 **Milestone:** ${chapter.milestone}\n\n`;
            }

            for (const scene of chapter.scenes) {
                md += `### ${scene.title}\n\n`;
                md += `${scene.description}\n\n`;

                if (scene.events.length > 0) {
                    md += `**Events:** ${scene.events.map(e => e.content).join(', ')}\n\n`;
                }
            }

            md += `---\n\n`;
        }

        return md;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getStory(id: string): DevelopmentStory | undefined {
        return this.stories.get(id);
    }

    getAllStories(): DevelopmentStory[] {
        return Array.from(this.stories.values());
    }

    setStyle(style: Partial<NarrativeStyle>): void {
        Object.assign(this.style, style);
    }

    getStats(): {
        totalStories: number;
        totalChapters: number;
        totalScenes: number;
        genres: Record<StoryGenre, number>;
    } {
        const stories = Array.from(this.stories.values());
        const genres: Record<string, number> = {};

        for (const story of stories) {
            genres[story.genre] = (genres[story.genre] || 0) + 1;
        }

        return {
            totalStories: stories.length,
            totalChapters: stories.reduce((s, st) => s + st.chapters.length, 0),
            totalScenes: stories.reduce((s, st) => s + st.chapters.reduce((cs, c) => cs + c.scenes.length, 0), 0),
            genres: genres as Record<StoryGenre, number>,
        };
    }
}

export const narrativeDevelopmentEngine = NarrativeDevelopmentEngine.getInstance();
