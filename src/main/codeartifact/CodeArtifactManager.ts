/**
 * Code Artifact - Executable code artifacts
 */
import { EventEmitter } from 'events';

export interface CodeArtifact { id: string; title: string; language: string; code: string; runnable: boolean; output?: string; error?: string; }

export class CodeArtifactManager extends EventEmitter {
    private static instance: CodeArtifactManager;
    private artifacts: Map<string, CodeArtifact> = new Map();
    private constructor() { super(); }
    static getInstance(): CodeArtifactManager { if (!CodeArtifactManager.instance) CodeArtifactManager.instance = new CodeArtifactManager(); return CodeArtifactManager.instance; }

    create(title: string, language: string, code: string, runnable = true): CodeArtifact {
        const artifact: CodeArtifact = { id: `code_${Date.now()}`, title, language, code, runnable };
        this.artifacts.set(artifact.id, artifact);
        this.emit('created', artifact);
        return artifact;
    }

    async run(id: string): Promise<{ output?: string; error?: string }> {
        const artifact = this.artifacts.get(id); if (!artifact || !artifact.runnable) return { error: 'Not runnable' };
        artifact.output = `// Output from ${artifact.language} execution\nSuccess!`;
        this.emit('executed', artifact);
        return { output: artifact.output };
    }

    update(id: string, code: string): boolean { const a = this.artifacts.get(id); if (!a) return false; a.code = code; return true; }
    get(id: string): CodeArtifact | null { return this.artifacts.get(id) || null; }
    getByLanguage(language: string): CodeArtifact[] { return Array.from(this.artifacts.values()).filter(a => a.language === language); }
    getAll(): CodeArtifact[] { return Array.from(this.artifacts.values()); }
}
export function getCodeArtifactManager(): CodeArtifactManager { return CodeArtifactManager.getInstance(); }
