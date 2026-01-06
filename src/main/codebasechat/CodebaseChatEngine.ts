/**
 * Codebase Chat - @codebase queries
 */
import { EventEmitter } from 'events';

export interface CodebaseQuery { id: string; query: string; files: string[]; response: string; timestamp: number; }

export class CodebaseChatEngine extends EventEmitter {
    private static instance: CodebaseChatEngine;
    private queries: CodebaseQuery[] = [];
    private indexedFiles: Map<string, string> = new Map();
    private constructor() { super(); }
    static getInstance(): CodebaseChatEngine { if (!CodebaseChatEngine.instance) CodebaseChatEngine.instance = new CodebaseChatEngine(); return CodebaseChatEngine.instance; }

    index(file: string, content: string): void { this.indexedFiles.set(file, content); this.emit('indexed', { file, size: content.length }); }
    getIndexedCount(): number { return this.indexedFiles.size; }

    async query(question: string): Promise<CodebaseQuery> {
        const relevantFiles = Array.from(this.indexedFiles.keys()).slice(0, 5);
        const q: CodebaseQuery = { id: `cbq_${Date.now()}`, query: question, files: relevantFiles, response: `Based on ${relevantFiles.length} files in your codebase: ${question}`, timestamp: Date.now() };
        this.queries.push(q); this.emit('query', q); return q;
    }

    getHistory(): CodebaseQuery[] { return [...this.queries]; }
    clearIndex(): void { this.indexedFiles.clear(); }
}
export function getCodebaseChatEngine(): CodebaseChatEngine { return CodebaseChatEngine.getInstance(); }
