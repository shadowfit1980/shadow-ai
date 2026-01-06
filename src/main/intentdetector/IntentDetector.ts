/**
 * Intent Detector - User intent classification
 */
import { EventEmitter } from 'events';

export interface Intent { id: string; name: string; confidence: number; entities: { type: string; value: string }[]; }

export class IntentDetector extends EventEmitter {
    private static instance: IntentDetector;
    private patterns: { intent: string; patterns: RegExp[] }[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): IntentDetector { if (!IntentDetector.instance) IntentDetector.instance = new IntentDetector(); return IntentDetector.instance; }

    private initDefaults(): void {
        this.patterns = [
            { intent: 'code_generation', patterns: [/create|generate|write|build|make/i, /code|function|class|component/i] },
            { intent: 'code_explanation', patterns: [/explain|what does|how does|describe/i] },
            { intent: 'code_fix', patterns: [/fix|debug|repair|solve|error/i] },
            { intent: 'code_refactor', patterns: [/refactor|improve|optimize|clean/i] },
            { intent: 'search', patterns: [/find|search|look for|where is/i] }
        ];
    }

    detect(input: string): Intent[] {
        const intents: Intent[] = [];
        this.patterns.forEach(p => { const matches = p.patterns.filter(r => r.test(input)).length; if (matches > 0) intents.push({ id: `int_${Date.now()}_${intents.length}`, name: p.intent, confidence: matches / p.patterns.length, entities: [] }); });
        this.emit('detected', intents); return intents.sort((a, b) => b.confidence - a.confidence);
    }

    addPattern(intent: string, pattern: RegExp): void { const existing = this.patterns.find(p => p.intent === intent); if (existing) existing.patterns.push(pattern); else this.patterns.push({ intent, patterns: [pattern] }); }
}
export function getIntentDetector(): IntentDetector { return IntentDetector.getInstance(); }
