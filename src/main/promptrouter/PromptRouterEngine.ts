/**
 * Prompt Router - Intelligent routing
 */
import { EventEmitter } from 'events';

export interface RoutingRule { id: string; pattern: string; targetModel: string; priority: number; conditions?: Record<string, string>; }
export interface RoutingDecision { ruleId: string; targetModel: string; confidence: number; }

export class PromptRouterEngine extends EventEmitter {
    private static instance: PromptRouterEngine;
    private rules: RoutingRule[] = [];
    private defaultModel = 'gpt-4o';
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PromptRouterEngine { if (!PromptRouterEngine.instance) PromptRouterEngine.instance = new PromptRouterEngine(); return PromptRouterEngine.instance; }

    private initDefaults(): void {
        this.rules = [
            { id: 'code', pattern: 'code|function|debug|fix', targetModel: 'claude-3.5-sonnet', priority: 10 },
            { id: 'creative', pattern: 'write|story|poem|creative', targetModel: 'gpt-4o', priority: 8 },
            { id: 'analysis', pattern: 'analyze|compare|evaluate', targetModel: 'gemini-2.0-flash', priority: 7 },
            { id: 'fast', pattern: 'quick|simple|basic', targetModel: 'gpt-4o-mini', priority: 5 }
        ];
    }

    addRule(pattern: string, targetModel: string, priority = 5): RoutingRule { const rule: RoutingRule = { id: `rule_${Date.now()}`, pattern, targetModel, priority }; this.rules.push(rule); this.rules.sort((a, b) => b.priority - a.priority); return rule; }

    route(prompt: string): RoutingDecision { const p = prompt.toLowerCase(); for (const rule of this.rules) { if (new RegExp(rule.pattern, 'i').test(p)) return { ruleId: rule.id, targetModel: rule.targetModel, confidence: 0.9 }; } return { ruleId: 'default', targetModel: this.defaultModel, confidence: 0.5 }; }
    setDefault(model: string): void { this.defaultModel = model; }
    getRules(): RoutingRule[] { return [...this.rules]; }
}
export function getPromptRouterEngine(): PromptRouterEngine { return PromptRouterEngine.getInstance(); }
