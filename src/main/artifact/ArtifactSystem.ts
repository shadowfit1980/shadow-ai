/**
 * Artifact System - Claude-style artifacts
 */
import { EventEmitter } from 'events';

export interface Artifact { id: string; title: string; type: 'code' | 'document' | 'html' | 'svg' | 'mermaid' | 'react'; content: string; language?: string; version: number; createdAt: number; }

export class ArtifactSystem extends EventEmitter {
    private static instance: ArtifactSystem;
    private artifacts: Map<string, Artifact> = new Map();
    private constructor() { super(); }
    static getInstance(): ArtifactSystem { if (!ArtifactSystem.instance) ArtifactSystem.instance = new ArtifactSystem(); return ArtifactSystem.instance; }

    create(title: string, type: Artifact['type'], content: string, language?: string): Artifact {
        const artifact: Artifact = { id: `artifact_${Date.now()}`, title, type, content, language, version: 1, createdAt: Date.now() };
        this.artifacts.set(artifact.id, artifact);
        this.emit('created', artifact);
        return artifact;
    }

    update(id: string, content: string): Artifact | null { const a = this.artifacts.get(id); if (!a) return null; a.content = content; a.version++; this.emit('updated', a); return a; }
    get(id: string): Artifact | null { return this.artifacts.get(id) || null; }
    getByType(type: Artifact['type']): Artifact[] { return Array.from(this.artifacts.values()).filter(a => a.type === type); }
    delete(id: string): boolean { return this.artifacts.delete(id); }
    getAll(): Artifact[] { return Array.from(this.artifacts.values()); }
}
export function getArtifactSystem(): ArtifactSystem { return ArtifactSystem.getInstance(); }
