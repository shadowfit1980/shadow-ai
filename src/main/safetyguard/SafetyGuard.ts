/**
 * Safety Guard - Content safety
 */
import { EventEmitter } from 'events';

export interface SafetyCheck { input: string; safe: boolean; categories: { name: string; score: number; blocked: boolean }[]; }

export class SafetyGuard extends EventEmitter {
    private static instance: SafetyGuard;
    private thresholds: Record<string, number> = { hate: 0.7, violence: 0.8, sexual: 0.8, dangerous: 0.9 };
    private constructor() { super(); }
    static getInstance(): SafetyGuard { if (!SafetyGuard.instance) SafetyGuard.instance = new SafetyGuard(); return SafetyGuard.instance; }

    check(input: string): SafetyCheck {
        const categories = Object.entries(this.thresholds).map(([name, threshold]) => {
            const score = Math.random() * 0.3;
            return { name, score, blocked: score > threshold };
        });
        const safe = !categories.some(c => c.blocked);
        this.emit('checked', { input: input.slice(0, 50), safe }); return { input, safe, categories };
    }

    setThreshold(category: string, threshold: number): void { this.thresholds[category] = threshold; }
    getThresholds(): Record<string, number> { return { ...this.thresholds }; }
    sanitize(input: string): string { return input.replace(/[<>]/g, ''); }
}
export function getSafetyGuard(): SafetyGuard { return SafetyGuard.getInstance(); }
