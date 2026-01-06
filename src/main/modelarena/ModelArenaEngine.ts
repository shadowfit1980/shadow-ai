/**
 * Model Arena - AI model battle platform
 */
import { EventEmitter } from 'events';

export interface ArenaBattle { id: string; modelA: string; modelB: string; prompt: string; responseA?: string; responseB?: string; winner?: 'A' | 'B' | 'tie'; votedAt?: number; category: string; }

export class ModelArenaEngine extends EventEmitter {
    private static instance: ModelArenaEngine;
    private battles: Map<string, ArenaBattle> = new Map();
    private models = ['gpt-4o', 'claude-3.5-sonnet', 'gemini-2.0-flash', 'llama-3.2', 'qwen-3', 'deepseek-r1', 'mistral-large'];
    private constructor() { super(); }
    static getInstance(): ModelArenaEngine { if (!ModelArenaEngine.instance) ModelArenaEngine.instance = new ModelArenaEngine(); return ModelArenaEngine.instance; }

    createBattle(prompt: string, category = 'general'): ArenaBattle {
        const shuffled = [...this.models].sort(() => Math.random() - 0.5);
        const battle: ArenaBattle = { id: `battle_${Date.now()}`, modelA: shuffled[0], modelB: shuffled[1], prompt, category };
        this.battles.set(battle.id, battle); this.emit('created', battle); return battle;
    }

    setResponses(battleId: string, responseA: string, responseB: string): boolean { const b = this.battles.get(battleId); if (!b) return false; b.responseA = responseA; b.responseB = responseB; return true; }
    vote(battleId: string, winner: 'A' | 'B' | 'tie'): boolean { const b = this.battles.get(battleId); if (!b || !b.responseA || !b.responseB) return false; b.winner = winner; b.votedAt = Date.now(); this.emit('voted', b); return true; }
    revealModels(battleId: string): { modelA: string; modelB: string } | null { const b = this.battles.get(battleId); if (!b || !b.winner) return null; return { modelA: b.modelA, modelB: b.modelB }; }
    get(battleId: string): ArenaBattle | null { return this.battles.get(battleId) || null; }
    getCompleted(): ArenaBattle[] { return Array.from(this.battles.values()).filter(b => b.winner); }
}
export function getModelArenaEngine(): ModelArenaEngine { return ModelArenaEngine.getInstance(); }
