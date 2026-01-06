/**
 * Project Scaffold - Generate project structures
 */
import { EventEmitter } from 'events';

export interface ScaffoldTemplate { id: string; name: string; framework: string; language: string; files: { path: string; content: string }[]; dependencies: Record<string, string>; }
export interface ScaffoldResult { templateId: string; projectPath: string; filesCreated: string[]; success: boolean; }

export class ProjectScaffoldEngine extends EventEmitter {
    private static instance: ProjectScaffoldEngine;
    private templates: Map<string, ScaffoldTemplate> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ProjectScaffoldEngine { if (!ProjectScaffoldEngine.instance) ProjectScaffoldEngine.instance = new ProjectScaffoldEngine(); return ProjectScaffoldEngine.instance; }

    private initDefaults(): void {
        const templates: ScaffoldTemplate[] = [
            { id: 'react-ts', name: 'React TypeScript', framework: 'react', language: 'typescript', files: [{ path: 'src/App.tsx', content: 'export default function App() { return <div>Hello</div>; }' }, { path: 'package.json', content: '{}' }], dependencies: { react: '^18.0.0', typescript: '^5.0.0' } },
            { id: 'node-api', name: 'Node.js API', framework: 'express', language: 'typescript', files: [{ path: 'src/index.ts', content: 'import express from "express"; const app = express();' }], dependencies: { express: '^4.18.0' } },
            { id: 'python-fastapi', name: 'FastAPI', framework: 'fastapi', language: 'python', files: [{ path: 'main.py', content: 'from fastapi import FastAPI; app = FastAPI()' }], dependencies: { fastapi: '0.100.0' } }
        ];
        templates.forEach(t => this.templates.set(t.id, t));
    }

    async scaffold(templateId: string, projectPath: string): Promise<ScaffoldResult> { const t = this.templates.get(templateId); if (!t) throw new Error('Template not found'); const result: ScaffoldResult = { templateId, projectPath, filesCreated: t.files.map(f => `${projectPath}/${f.path}`), success: true }; this.emit('scaffolded', result); return result; }
    addTemplate(template: ScaffoldTemplate): void { this.templates.set(template.id, template); }
    getTemplates(): ScaffoldTemplate[] { return Array.from(this.templates.values()); }
    getByFramework(framework: string): ScaffoldTemplate[] { return this.getTemplates().filter(t => t.framework === framework); }
}
export function getProjectScaffoldEngine(): ProjectScaffoldEngine { return ProjectScaffoldEngine.getInstance(); }
