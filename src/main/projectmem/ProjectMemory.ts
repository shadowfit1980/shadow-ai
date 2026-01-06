/**
 * Project Memory - Claude Projects
 */
import { EventEmitter } from 'events';

export interface Project { id: string; name: string; instructions: string; files: string[]; knowledge: string[]; createdAt: number; }

export class ProjectMemory extends EventEmitter {
    private static instance: ProjectMemory;
    private projects: Map<string, Project> = new Map();
    private activeId?: string;
    private constructor() { super(); }
    static getInstance(): ProjectMemory { if (!ProjectMemory.instance) ProjectMemory.instance = new ProjectMemory(); return ProjectMemory.instance; }

    create(name: string, instructions = ''): Project {
        const project: Project = { id: `proj_${Date.now()}`, name, instructions, files: [], knowledge: [], createdAt: Date.now() };
        this.projects.set(project.id, project);
        this.emit('created', project);
        return project;
    }

    setActive(id: string): boolean { if (!this.projects.has(id)) return false; this.activeId = id; this.emit('activated', this.projects.get(id)); return true; }
    getActive(): Project | null { return this.activeId ? this.projects.get(this.activeId) || null : null; }
    addFile(id: string, file: string): boolean { const p = this.projects.get(id); if (!p) return false; p.files.push(file); return true; }
    addKnowledge(id: string, knowledge: string): boolean { const p = this.projects.get(id); if (!p) return false; p.knowledge.push(knowledge); return true; }
    updateInstructions(id: string, instructions: string): boolean { const p = this.projects.get(id); if (!p) return false; p.instructions = instructions; return true; }
    getAll(): Project[] { return Array.from(this.projects.values()); }
}
export function getProjectMemory(): ProjectMemory { return ProjectMemory.getInstance(); }
