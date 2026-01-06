/**
 * Agent Memory - Persistent memory
 */
import { EventEmitter } from 'events';

export interface MemoryEntry { id: string; agentId: string; type: 'fact' | 'preference' | 'instruction' | 'conversation'; content: string; metadata: Record<string, string>; timestamp: number; importance: number; }

export class AgentMemoryEngine extends EventEmitter {
    private static instance: AgentMemoryEngine;
    private memories: Map<string, MemoryEntry[]> = new Map();
    private maxPerAgent = 1000;
    private constructor() { super(); }
    static getInstance(): AgentMemoryEngine { if (!AgentMemoryEngine.instance) AgentMemoryEngine.instance = new AgentMemoryEngine(); return AgentMemoryEngine.instance; }

    store(agentId: string, type: MemoryEntry['type'], content: string, importance = 5, metadata: Record<string, string> = {}): MemoryEntry {
        const entry: MemoryEntry = { id: `mem_${Date.now()}`, agentId, type, content, metadata, timestamp: Date.now(), importance };
        const agentMems = this.memories.get(agentId) || [];
        agentMems.push(entry); if (agentMems.length > this.maxPerAgent) agentMems.shift();
        this.memories.set(agentId, agentMems); this.emit('stored', entry); return entry;
    }

    recall(agentId: string, query: string, limit = 10): MemoryEntry[] { const mems = this.memories.get(agentId) || []; const q = query.toLowerCase(); return mems.filter(m => m.content.toLowerCase().includes(q)).sort((a, b) => b.importance - a.importance).slice(0, limit); }
    getByType(agentId: string, type: MemoryEntry['type']): MemoryEntry[] { return (this.memories.get(agentId) || []).filter(m => m.type === type); }
    forget(agentId: string, memoryId: string): boolean { const mems = this.memories.get(agentId); if (!mems) return false; const idx = mems.findIndex(m => m.id === memoryId); if (idx === -1) return false; mems.splice(idx, 1); return true; }
}
export function getAgentMemoryEngine(): AgentMemoryEngine { return AgentMemoryEngine.getInstance(); }
