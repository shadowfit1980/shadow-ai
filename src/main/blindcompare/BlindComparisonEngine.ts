/**
 * Blind Comparison - Anonymous model comparison
 */
import { EventEmitter } from 'events';

export interface BlindComparison { id: string; prompt: string; responses: { label: string; content: string; modelId: string }[]; revealed: boolean; selectedLabel?: string; }

export class BlindComparisonEngine extends EventEmitter {
    private static instance: BlindComparisonEngine;
    private comparisons: Map<string, BlindComparison> = new Map();
    private constructor() { super(); }
    static getInstance(): BlindComparisonEngine { if (!BlindComparisonEngine.instance) BlindComparisonEngine.instance = new BlindComparisonEngine(); return BlindComparisonEngine.instance; }

    create(prompt: string, responses: { modelId: string; content: string }[]): BlindComparison {
        const labels = ['A', 'B', 'C', 'D', 'E'].slice(0, responses.length);
        const shuffled = responses.map((r, i) => ({ label: labels[i], content: r.content, modelId: r.modelId })).sort(() => Math.random() - 0.5);
        shuffled.forEach((r, i) => r.label = labels[i]);
        const comp: BlindComparison = { id: `blind_${Date.now()}`, prompt, responses: shuffled, revealed: false };
        this.comparisons.set(comp.id, comp); return comp;
    }

    select(comparisonId: string, label: string): boolean { const c = this.comparisons.get(comparisonId); if (!c || c.revealed) return false; c.selectedLabel = label; this.emit('selected', { comparisonId, label }); return true; }
    reveal(comparisonId: string): BlindComparison | null { const c = this.comparisons.get(comparisonId); if (!c || !c.selectedLabel) return null; c.revealed = true; this.emit('revealed', c); return c; }
    getBlindResponses(comparisonId: string): { label: string; content: string }[] | null { const c = this.comparisons.get(comparisonId); if (!c) return null; return c.responses.map(r => ({ label: r.label, content: r.content })); }
    get(comparisonId: string): BlindComparison | null { return this.comparisons.get(comparisonId) || null; }
}
export function getBlindComparisonEngine(): BlindComparisonEngine { return BlindComparisonEngine.getInstance(); }
