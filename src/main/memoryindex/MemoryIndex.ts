/**
 * Memory Index - Codebase indexing
 */
import { EventEmitter } from 'events';

export interface IndexedFile { path: string; content: string; symbols: string[]; imports: string[]; exports: string[]; lastIndexed: number; }

export class MemoryIndex extends EventEmitter {
    private static instance: MemoryIndex;
    private index: Map<string, IndexedFile> = new Map();
    private constructor() { super(); }
    static getInstance(): MemoryIndex { if (!MemoryIndex.instance) MemoryIndex.instance = new MemoryIndex(); return MemoryIndex.instance; }

    add(path: string, content: string): IndexedFile {
        const symbols = [...(content.match(/(?:function|class|const|let|var)\s+(\w+)/g) || [])].map(s => s.split(/\s+/)[1]);
        const imports = [...(content.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g) || [])];
        const exports = [...(content.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g) || [])];
        const file: IndexedFile = { path, content, symbols, imports, exports, lastIndexed: Date.now() };
        this.index.set(path, file); this.emit('indexed', file); return file;
    }

    search(query: string): IndexedFile[] { const q = query.toLowerCase(); return Array.from(this.index.values()).filter(f => f.path.toLowerCase().includes(q) || f.symbols.some(s => s.toLowerCase().includes(q))); }
    getSymbol(symbol: string): { file: string; content: string }[] { return Array.from(this.index.values()).filter(f => f.symbols.includes(symbol)).map(f => ({ file: f.path, content: f.content })); }
    get(path: string): IndexedFile | null { return this.index.get(path) || null; }
    getStats(): { files: number; symbols: number } { const files = this.index.size; const symbols = Array.from(this.index.values()).reduce((s, f) => s + f.symbols.length, 0); return { files, symbols }; }
}
export function getMemoryIndex(): MemoryIndex { return MemoryIndex.getInstance(); }
