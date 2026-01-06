/**
 * Template Engine - Project templates
 */
import { EventEmitter } from 'events';

export interface Template { id: string; name: string; type: string; files: { path: string; content: string }[]; variables: string[]; }

export class TemplateEngine extends EventEmitter {
    private static instance: TemplateEngine;
    private templates: Map<string, Template> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): TemplateEngine { if (!TemplateEngine.instance) TemplateEngine.instance = new TemplateEngine(); return TemplateEngine.instance; }

    private initDefaults(): void {
        this.register({
            id: 'ts-lib', name: 'TypeScript Library', type: 'library',
            files: [{ path: 'src/index.ts', content: 'export const {{NAME}} = {};' }, { path: 'package.json', content: '{"name":"{{NAME}}","version":"1.0.0"}' }],
            variables: ['NAME']
        });
        this.register({
            id: 'react-app', name: 'React App', type: 'frontend',
            files: [{ path: 'src/App.tsx', content: 'export function App() { return <div>{{NAME}}</div>; }' }],
            variables: ['NAME']
        });
        this.register({
            id: 'express-api', name: 'Express API', type: 'backend',
            files: [{ path: 'src/index.ts', content: 'import express from "express"; const app = express(); app.listen({{PORT}});' }],
            variables: ['NAME', 'PORT']
        });
    }

    register(template: Template): void { this.templates.set(template.id, template); }
    get(id: string): Template | null { return this.templates.get(id) || null; }
    getAll(): Template[] { return Array.from(this.templates.values()); }

    render(id: string, variables: Record<string, string>): { path: string; content: string }[] {
        const template = this.get(id);
        if (!template) return [];
        return template.files.map(f => ({ path: f.path.replace(/\{\{(\w+)\}\}/g, (_, k) => variables[k] || ''), content: f.content.replace(/\{\{(\w+)\}\}/g, (_, k) => variables[k] || '') }));
    }
}

export function getTemplateEngine(): TemplateEngine { return TemplateEngine.getInstance(); }
