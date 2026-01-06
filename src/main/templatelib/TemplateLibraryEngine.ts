/**
 * Template Library - Design templates
 */
import { EventEmitter } from 'events';

export interface Template { id: string; name: string; category: string; thumbnail: string; width: number; height: number; elements: unknown[]; tags: string[]; premium: boolean; }

export class TemplateLibraryEngine extends EventEmitter {
    private static instance: TemplateLibraryEngine;
    private templates: Map<string, Template> = new Map();
    private categories = ['social', 'presentation', 'poster', 'card', 'resume', 'flyer', 'logo', 'banner'];
    private constructor() { super(); this.initTemplates(); }
    static getInstance(): TemplateLibraryEngine { if (!TemplateLibraryEngine.instance) TemplateLibraryEngine.instance = new TemplateLibraryEngine(); return TemplateLibraryEngine.instance; }

    private initTemplates(): void {
        const templates: Omit<Template, 'id'>[] = [
            { name: 'Instagram Post', category: 'social', thumbnail: '/thumbs/insta.png', width: 1080, height: 1080, elements: [], tags: ['social', 'square'], premium: false },
            { name: 'Facebook Cover', category: 'social', thumbnail: '/thumbs/fb.png', width: 820, height: 312, elements: [], tags: ['social', 'cover'], premium: false },
            { name: 'Presentation', category: 'presentation', thumbnail: '/thumbs/pres.png', width: 1920, height: 1080, elements: [], tags: ['slides', 'business'], premium: false },
            { name: 'Business Card', category: 'card', thumbnail: '/thumbs/card.png', width: 1050, height: 600, elements: [], tags: ['card', 'business'], premium: false },
            { name: 'Resume', category: 'resume', thumbnail: '/thumbs/resume.png', width: 816, height: 1056, elements: [], tags: ['resume', 'cv'], premium: true }
        ];
        templates.forEach(t => { const temp = { ...t, id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }; this.templates.set(temp.id, temp); });
    }

    search(query: string): Template[] { const q = query.toLowerCase(); return Array.from(this.templates.values()).filter(t => t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))); }
    getByCategory(category: string): Template[] { return Array.from(this.templates.values()).filter(t => t.category === category); }
    getCategories(): string[] { return [...this.categories]; }
    get(templateId: string): Template | null { return this.templates.get(templateId) || null; }
    getAll(): Template[] { return Array.from(this.templates.values()); }
}
export function getTemplateLibraryEngine(): TemplateLibraryEngine { return TemplateLibraryEngine.getInstance(); }
