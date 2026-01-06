/**
 * Mythic Code Narrator
 * 
 * Narrates code as epic tales, transforming algorithms
 * into heroic adventures.
 */

import { EventEmitter } from 'events';

export interface CodeNarrative {
    id: string;
    code: string;
    story: string;
    protagonists: string[];
    epicLevel: number;
}

export class MythicCodeNarrator extends EventEmitter {
    private static instance: MythicCodeNarrator;
    private narratives: Map<string, CodeNarrative> = new Map();

    private constructor() { super(); }

    static getInstance(): MythicCodeNarrator {
        if (!MythicCodeNarrator.instance) {
            MythicCodeNarrator.instance = new MythicCodeNarrator();
        }
        return MythicCodeNarrator.instance;
    }

    narrate(code: string): CodeNarrative {
        const protagonists = this.findProtagonists(code);
        const story = this.craftStory(code, protagonists);

        const narrative: CodeNarrative = {
            id: `story_${Date.now()}`,
            code,
            story,
            protagonists,
            epicLevel: protagonists.length * 0.2 + 0.5,
        };

        this.narratives.set(narrative.id, narrative);
        this.emit('narrative:created', narrative);
        return narrative;
    }

    private findProtagonists(code: string): string[] {
        const matches = code.match(/(?:class|function|const)\s+(\w+)/g) || [];
        return matches.map(m => m.split(/\s+/)[1]).filter(Boolean).slice(0, 5);
    }

    private craftStory(code: string, protagonists: string[]): string {
        if (protagonists.length === 0) return 'In the vast emptiness, a lone script awaits its purpose...';
        const hero = protagonists[0];
        return `In the legendary realm of ${hero}, our hero embarks on a quest to process data and return truth to the kingdom...`;
    }

    getStats(): { total: number; avgEpic: number } {
        const narrs = Array.from(this.narratives.values());
        return {
            total: narrs.length,
            avgEpic: narrs.length > 0 ? narrs.reduce((s, n) => s + n.epicLevel, 0) / narrs.length : 0,
        };
    }
}

export const mythicCodeNarrator = MythicCodeNarrator.getInstance();
