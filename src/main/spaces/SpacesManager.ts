/**
 * Spaces Manager - Copilot Spaces
 */
import { EventEmitter } from 'events';

export interface Space { id: string; name: string; description: string; files: string[]; context: string; createdAt: number; }

export class SpacesManager extends EventEmitter {
    private static instance: SpacesManager;
    private spaces: Map<string, Space> = new Map();
    private constructor() { super(); }
    static getInstance(): SpacesManager { if (!SpacesManager.instance) SpacesManager.instance = new SpacesManager(); return SpacesManager.instance; }

    create(name: string, description: string, files: string[] = []): Space {
        const space: Space = { id: `space_${Date.now()}`, name, description, files, context: '', createdAt: Date.now() };
        this.spaces.set(space.id, space);
        this.emit('created', space);
        return space;
    }

    updateContext(id: string, context: string): boolean { const s = this.spaces.get(id); if (!s) return false; s.context = context; return true; }
    addFiles(id: string, files: string[]): boolean { const s = this.spaces.get(id); if (!s) return false; s.files.push(...files); return true; }
    getAll(): Space[] { return Array.from(this.spaces.values()); }
    delete(id: string): boolean { return this.spaces.delete(id); }
}
export function getSpacesManager(): SpacesManager { return SpacesManager.getInstance(); }
