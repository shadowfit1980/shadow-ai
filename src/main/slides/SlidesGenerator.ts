/**
 * Slides Generator - Presentation slides
 */
import { EventEmitter } from 'events';

export interface Slide { id: string; title: string; content: string; notes?: string; layout: 'title' | 'content' | 'image' | 'split'; }
export interface Presentation { id: string; title: string; slides: Slide[]; theme: string; createdAt: number; }

export class SlidesGenerator extends EventEmitter {
    private static instance: SlidesGenerator;
    private presentations: Map<string, Presentation> = new Map();
    private constructor() { super(); }
    static getInstance(): SlidesGenerator { if (!SlidesGenerator.instance) SlidesGenerator.instance = new SlidesGenerator(); return SlidesGenerator.instance; }

    create(title: string, theme = 'modern'): Presentation {
        const pres: Presentation = { id: `pres_${Date.now()}`, title, slides: [], theme, createdAt: Date.now() };
        this.presentations.set(pres.id, pres);
        return pres;
    }

    addSlide(presId: string, title: string, content: string, layout: Slide['layout'] = 'content'): Slide | null {
        const pres = this.presentations.get(presId); if (!pres) return null;
        const slide: Slide = { id: `slide_${Date.now()}`, title, content, layout };
        pres.slides.push(slide);
        return slide;
    }

    async generateFromOutline(title: string, outline: string[]): Promise<Presentation> {
        const pres = this.create(title);
        this.addSlide(pres.id, title, '', 'title');
        outline.forEach(item => this.addSlide(pres.id, item, `Content for ${item}`, 'content'));
        return pres;
    }

    getAll(): Presentation[] { return Array.from(this.presentations.values()); }
}
export function getSlidesGenerator(): SlidesGenerator { return SlidesGenerator.getInstance(); }
