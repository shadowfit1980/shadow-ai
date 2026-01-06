/**
 * Local Doc Chat - Chat with local documents
 */
import { EventEmitter } from 'events';

export interface DocCollection { id: string; name: string; paths: string[]; docCount: number; chunkCount: number; indexed: boolean; }
export interface DocChatResult { answer: string; sources: { file: string; chunk: string; score: number }[]; }

export class LocalDocChatEngine extends EventEmitter {
    private static instance: LocalDocChatEngine;
    private collections: Map<string, DocCollection> = new Map();
    private constructor() { super(); }
    static getInstance(): LocalDocChatEngine { if (!LocalDocChatEngine.instance) LocalDocChatEngine.instance = new LocalDocChatEngine(); return LocalDocChatEngine.instance; }

    createCollection(name: string, paths: string[]): DocCollection { const col: DocCollection = { id: `col_${Date.now()}`, name, paths, docCount: paths.length, chunkCount: 0, indexed: false }; this.collections.set(col.id, col); return col; }

    async index(collectionId: string): Promise<boolean> { const col = this.collections.get(collectionId); if (!col) return false; col.chunkCount = col.docCount * 10; col.indexed = true; this.emit('indexed', col); return true; }

    async chat(collectionId: string, question: string): Promise<DocChatResult> {
        const col = this.collections.get(collectionId); if (!col || !col.indexed) throw new Error('Collection not indexed');
        return { answer: `Based on your documents: ${question.slice(0, 30)}...`, sources: col.paths.slice(0, 3).map((p, i) => ({ file: p, chunk: `Relevant chunk from ${p}`, score: 0.9 - i * 0.1 })) };
    }

    addPath(collectionId: string, path: string): boolean { const col = this.collections.get(collectionId); if (!col) return false; col.paths.push(path); col.docCount++; col.indexed = false; return true; }
    getAll(): DocCollection[] { return Array.from(this.collections.values()); }
}
export function getLocalDocChatEngine(): LocalDocChatEngine { return LocalDocChatEngine.getInstance(); }
