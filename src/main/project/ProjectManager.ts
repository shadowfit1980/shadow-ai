/**
 * Project Manager - Project configuration
 */
import { EventEmitter } from 'events';

export interface Project { id: string; name: string; path: string; type: string; framework?: string; dependencies: string[]; scripts: Record<string, string>; }

export class ProjectManager extends EventEmitter {
    private static instance: ProjectManager;
    private projects: Map<string, Project> = new Map();
    private current?: string;
    private constructor() { super(); }
    static getInstance(): ProjectManager { if (!ProjectManager.instance) ProjectManager.instance = new ProjectManager(); return ProjectManager.instance; }

    register(name: string, path: string, type: string): Project {
        const proj: Project = { id: `proj_${Date.now()}`, name, path, type, dependencies: [], scripts: {} };
        this.projects.set(proj.id, proj);
        this.emit('registered', proj);
        return proj;
    }

    detect(packageJson: any): Partial<Project> {
        return {
            name: packageJson.name, dependencies: Object.keys(packageJson.dependencies || {}), scripts: packageJson.scripts || {},
            framework: packageJson.dependencies?.react ? 'react' : packageJson.dependencies?.vue ? 'vue' : packageJson.dependencies?.angular ? 'angular' : undefined
        };
    }

    setCurrent(id: string): boolean { if (!this.projects.has(id)) return false; this.current = id; return true; }
    getCurrent(): Project | null { return this.current ? this.projects.get(this.current) || null : null; }
    getAll(): Project[] { return Array.from(this.projects.values()); }
    delete(id: string): boolean { return this.projects.delete(id); }
}

export function getProjectManager(): ProjectManager { return ProjectManager.getInstance(); }
