/**
 * Long Term Memory - Persistent agent memory
 */
import { EventEmitter } from 'events';

export interface MemoryEntry { id: string; type: 'fact' | 'experience' | 'plan' | 'reflection'; content: string; embedding?: number[]; timestamp: number; importance: number; }

export class LongTermMemory extends EventEmitter {
    private static instance: LongTermMemory;
    private memories: MemoryEntry[] = [];
    private maxSize = 10000;
    private constructor() { super(); }
    static getInstance(): LongTermMemory { if (!LongTermMemory.instance) LongTermMemory.instance = new LongTermMemory(); return LongTermMemory.instance; }

    store(type: MemoryEntry['type'], content: string, importance = 0.5): MemoryEntry {
        const entry: MemoryEntry = { id: `mem_${Date.now()}`, type, content, timestamp: Date.now(), importance };
        this.memories.push(entry);
        if (this.memories.length > this.maxSize) this.memories.shift();
        this.emit('stored', entry); return entry;
    }

    search(query: string, limit = 10): MemoryEntry[] { const q = query.toLowerCase(); return this.memories.filter(m => m.content.toLowerCase().includes(q)).slice(-limit); }
    getRecent(limit = 20): MemoryEntry[] { return this.memories.slice(-limit); }
    getByType(type: MemoryEntry['type']): MemoryEntry[] { return this.memories.filter(m => m.type === type); }
    forget(id: string): boolean { const i = this.memories.findIndex(m => m.id === id); if (i === -1) return false; this.memories.splice(i, 1); return true; }
    getStats(): { total: number; byType: Record<string, number> } { return { total: this.memories.length, byType: { fact: this.memories.filter(m => m.type === 'fact').length, experience: this.memories.filter(m => m.type === 'experience').length, plan: this.memories.filter(m => m.type === 'plan').length, reflection: this.memories.filter(m => m.type === 'reflection').length } }; }
}
export function getLongTermMemory(): LongTermMemory { return LongTermMemory.getInstance(); }
