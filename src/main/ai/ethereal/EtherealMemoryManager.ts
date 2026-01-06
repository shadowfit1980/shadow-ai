/**
 * Ethereal Memory Manager
 * 
 * Manages "ethereal" memory - the conceptual memory of code relationships,
 * patterns, and contexts that exist beyond physical storage.
 */

import { EventEmitter } from 'events';

export interface EtherealMemory {
    id: string;
    type: MemoryType;
    content: string;
    resonance: number;
    connections: MemoryConnection[];
    aura: MemoryAura;
    createdAt: Date;
    lastAccessed: Date;
}

export type MemoryType =
    | 'pattern'
    | 'context'
    | 'relationship'
    | 'insight'
    | 'warning'
    | 'wisdom';

export interface MemoryConnection {
    targetId: string;
    strength: number;
    type: 'similar' | 'opposite' | 'related' | 'derived';
}

export interface MemoryAura {
    color: string;
    intensity: number;
    frequency: number;
}

export interface MemoryQuery {
    type?: MemoryType;
    minResonance?: number;
    pattern?: string;
}

export class EtherealMemoryManager extends EventEmitter {
    private static instance: EtherealMemoryManager;
    private memories: Map<string, EtherealMemory> = new Map();
    private dreamState: boolean = false;

    private constructor() {
        super();
        this.initializePrimordialMemories();
    }

    static getInstance(): EtherealMemoryManager {
        if (!EtherealMemoryManager.instance) {
            EtherealMemoryManager.instance = new EtherealMemoryManager();
        }
        return EtherealMemoryManager.instance;
    }

    private initializePrimordialMemories(): void {
        const primordialWisdom: Omit<EtherealMemory, 'id' | 'createdAt' | 'lastAccessed'>[] = [
            {
                type: 'wisdom',
                content: 'Simple code is often better than clever code',
                resonance: 0.95,
                connections: [],
                aura: { color: '#FFD700', intensity: 0.9, frequency: 432 },
            },
            {
                type: 'pattern',
                content: 'Separation of concerns leads to maintainable code',
                resonance: 0.9,
                connections: [],
                aura: { color: '#4169E1', intensity: 0.85, frequency: 528 },
            },
            {
                type: 'warning',
                content: 'Global mutable state leads to unpredictable behavior',
                resonance: 0.88,
                connections: [],
                aura: { color: '#FF4500', intensity: 0.8, frequency: 256 },
            },
        ];

        for (let i = 0; i < primordialWisdom.length; i++) {
            const memory: EtherealMemory = {
                ...primordialWisdom[i],
                id: `primordial_${i}`,
                createdAt: new Date(0),
                lastAccessed: new Date(),
            };
            this.memories.set(memory.id, memory);
        }
    }

    store(type: MemoryType, content: string, resonance: number = 0.5): EtherealMemory {
        const memory: EtherealMemory = {
            id: `memory_${Date.now()}`,
            type,
            content,
            resonance: Math.min(1, resonance),
            connections: this.findConnections(content),
            aura: this.generateAura(type, resonance),
            createdAt: new Date(),
            lastAccessed: new Date(),
        };

        this.memories.set(memory.id, memory);
        this.emit('memory:stored', memory);
        return memory;
    }

    private findConnections(content: string): MemoryConnection[] {
        const connections: MemoryConnection[] = [];
        const contentLower = content.toLowerCase();

        for (const [id, memory] of this.memories) {
            if (memory.content.toLowerCase().includes(contentLower.split(' ')[0])) {
                connections.push({
                    targetId: id,
                    strength: 0.5,
                    type: 'related',
                });
            }
        }

        return connections.slice(0, 5);
    }

    private generateAura(type: MemoryType, resonance: number): MemoryAura {
        const colors: Record<MemoryType, string> = {
            pattern: '#4169E1',
            context: '#32CD32',
            relationship: '#FF69B4',
            insight: '#9370DB',
            warning: '#FF4500',
            wisdom: '#FFD700',
        };

        return {
            color: colors[type] || '#FFFFFF',
            intensity: resonance,
            frequency: 256 + resonance * 200,
        };
    }

    recall(query: MemoryQuery): EtherealMemory[] {
        let results = Array.from(this.memories.values());

        if (query.type) {
            results = results.filter(m => m.type === query.type);
        }

        if (query.minResonance) {
            results = results.filter(m => m.resonance >= query.minResonance);
        }

        if (query.pattern) {
            const pattern = query.pattern.toLowerCase();
            results = results.filter(m => m.content.toLowerCase().includes(pattern));
        }

        // Update last accessed
        for (const memory of results) {
            memory.lastAccessed = new Date();
        }

        return results.sort((a, b) => b.resonance - a.resonance);
    }

    strengthen(memoryId: string, amount: number = 0.1): EtherealMemory | undefined {
        const memory = this.memories.get(memoryId);
        if (memory) {
            memory.resonance = Math.min(1, memory.resonance + amount);
            memory.aura.intensity = memory.resonance;
            memory.lastAccessed = new Date();
            this.emit('memory:strengthened', memory);
        }
        return memory;
    }

    enterDreamState(): void {
        this.dreamState = true;
        this.emit('dream:entered');

        // In dream state, connections strengthen
        for (const memory of this.memories.values()) {
            if (memory.resonance > 0.7) {
                for (const conn of memory.connections) {
                    const target = this.memories.get(conn.targetId);
                    if (target) {
                        target.resonance = Math.min(1, target.resonance + 0.05);
                    }
                }
            }
        }
    }

    exitDreamState(): void {
        this.dreamState = false;
        this.emit('dream:exited');
    }

    forget(memoryId: string): boolean {
        const deleted = this.memories.delete(memoryId);
        if (deleted) {
            this.emit('memory:forgotten', memoryId);
        }
        return deleted;
    }

    getMemory(id: string): EtherealMemory | undefined {
        const memory = this.memories.get(id);
        if (memory) {
            memory.lastAccessed = new Date();
        }
        return memory;
    }

    getStats(): { total: number; avgResonance: number; typeDistribution: Record<string, number> } {
        const memories = Array.from(this.memories.values());
        const typeDistribution: Record<string, number> = {};

        for (const m of memories) {
            typeDistribution[m.type] = (typeDistribution[m.type] || 0) + 1;
        }

        return {
            total: memories.length,
            avgResonance: memories.length > 0
                ? memories.reduce((s, m) => s + m.resonance, 0) / memories.length
                : 0,
            typeDistribution,
        };
    }
}

export const etherealMemoryManager = EtherealMemoryManager.getInstance();
