/**
 * Astral File System Design
 */
import { EventEmitter } from 'events';
export class AstralFileSystem extends EventEmitter {
    private root: Map<string, unknown> = new Map();
    constructor() { super(); }
    ls(path: string): string[] { const parts = path === '/' ? [] : path.split('/').filter(p => p); let curr = this.root; for (const part of parts) { const next = curr.get(part); if (typeof next === 'string') return [part]; curr = next as Map<string, unknown>; } return [...curr.keys()].sort(); }
    mkdir(path: string): void { const parts = path.split('/').filter(p => p); let curr = this.root; for (const part of parts) { if (!curr.has(part)) curr.set(part, new Map()); curr = curr.get(part) as Map<string, unknown>; } }
    addContentToFile(filePath: string, content: string): void { const parts = filePath.split('/').filter(p => p); const fileName = parts.pop()!; let curr = this.root; for (const part of parts) { if (!curr.has(part)) curr.set(part, new Map()); curr = curr.get(part) as Map<string, unknown>; } const existing = curr.get(fileName) as string || ''; curr.set(fileName, existing + content); }
    readContentFromFile(filePath: string): string { const parts = filePath.split('/').filter(p => p); const fileName = parts.pop()!; let curr = this.root; for (const part of parts) curr = curr.get(part) as Map<string, unknown>; return curr.get(fileName) as string; }
}
export const createFileSystem = () => new AstralFileSystem();
