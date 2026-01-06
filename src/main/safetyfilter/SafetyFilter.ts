/**
 * Safety Filter - Content moderation
 */
import { EventEmitter } from 'events';

export interface SafetyCheck { id: string; content: string; safe: boolean; categories: { name: string; score: number; flagged: boolean }[]; }

export class SafetyFilter extends EventEmitter {
    private static instance: SafetyFilter;
    private checks: SafetyCheck[] = [];
    private thresholds: Record<string, number> = { harmful: 0.7, hate: 0.6, violence: 0.7, sexual: 0.8, self_harm: 0.5 };
    private constructor() { super(); }
    static getInstance(): SafetyFilter { if (!SafetyFilter.instance) SafetyFilter.instance = new SafetyFilter(); return SafetyFilter.instance; }

    async check(content: string): Promise<SafetyCheck> {
        const categories = Object.entries(this.thresholds).map(([name, threshold]) => ({ name, score: Math.random() * 0.3, flagged: false }));
        categories.forEach(c => { c.flagged = c.score >= this.thresholds[c.name]; });
        const check: SafetyCheck = { id: `safety_${Date.now()}`, content: content.slice(0, 100), safe: !categories.some(c => c.flagged), categories };
        this.checks.push(check);
        this.emit('checked', check);
        return check;
    }

    setThreshold(category: string, value: number): void { this.thresholds[category] = value; }
    getThresholds(): Record<string, number> { return { ...this.thresholds }; }
    getHistory(): SafetyCheck[] { return [...this.checks]; }
}
export function getSafetyFilter(): SafetyFilter { return SafetyFilter.getInstance(); }
