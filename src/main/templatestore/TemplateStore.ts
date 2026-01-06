/**
 * Template Store - Project templates
 */
import { EventEmitter } from 'events';

export interface Template { id: string; name: string; description: string; language: string; category: string; files: string[]; popularity: number; }

export class TemplateStore extends EventEmitter {
    private static instance: TemplateStore;
    private templates: Map<string, Template> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): TemplateStore { if (!TemplateStore.instance) TemplateStore.instance = new TemplateStore(); return TemplateStore.instance; }

    private initDefaults(): void {
        const defaults: Template[] = [
            { id: 't1', name: 'React App', description: 'React starter', language: 'typescript', category: 'frontend', files: ['index.tsx', 'App.tsx'], popularity: 100 },
            { id: 't2', name: 'Express API', description: 'Express server', language: 'javascript', category: 'backend', files: ['server.js', 'routes.js'], popularity: 90 },
            { id: 't3', name: 'Next.js', description: 'Next.js full-stack', language: 'typescript', category: 'fullstack', files: ['pages/index.tsx', 'api/hello.ts'], popularity: 95 },
            { id: 't4', name: 'Python Flask', description: 'Flask API', language: 'python', category: 'backend', files: ['app.py', 'requirements.txt'], popularity: 80 }
        ];
        defaults.forEach(t => this.templates.set(t.id, t));
    }

    getByCategory(category: string): Template[] { return Array.from(this.templates.values()).filter(t => t.category === category); }
    search(query: string): Template[] { const q = query.toLowerCase(); return Array.from(this.templates.values()).filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)); }
    getPopular(limit = 10): Template[] { return Array.from(this.templates.values()).sort((a, b) => b.popularity - a.popularity).slice(0, limit); }
    add(template: Template): void { this.templates.set(template.id, template); }
    getAll(): Template[] { return Array.from(this.templates.values()); }
}
export function getTemplateStore(): TemplateStore { return TemplateStore.getInstance(); }
