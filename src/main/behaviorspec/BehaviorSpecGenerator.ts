/**
 * Behavior Spec Generator - BDD-style specifications
 */
import { EventEmitter } from 'events';

export interface BehaviorSpec { id: string; feature: string; scenarios: { name: string; given: string; when: string; then: string }[]; }

export class BehaviorSpecGenerator extends EventEmitter {
    private static instance: BehaviorSpecGenerator;
    private specs: Map<string, BehaviorSpec> = new Map();
    private constructor() { super(); }
    static getInstance(): BehaviorSpecGenerator { if (!BehaviorSpecGenerator.instance) BehaviorSpecGenerator.instance = new BehaviorSpecGenerator(); return BehaviorSpecGenerator.instance; }

    async generate(fnName: string, fnCode: string): Promise<BehaviorSpec> {
        const spec: BehaviorSpec = {
            id: `spec_${Date.now()}`, feature: fnName, scenarios: [
                { name: 'Happy path', given: 'Valid input provided', when: `${fnName} is called`, then: 'Expected result returned' },
                { name: 'Edge case - null input', given: 'Null input provided', when: `${fnName} is called`, then: 'Appropriate error or default returned' },
                { name: 'Edge case - invalid input', given: 'Invalid input provided', when: `${fnName} is called`, then: 'Validation error thrown' }
            ]
        };
        this.specs.set(spec.id, spec);
        this.emit('generated', spec);
        return spec;
    }

    toGherkin(specId: string): string | null {
        const spec = this.specs.get(specId); if (!spec) return null;
        return `Feature: ${spec.feature}\n\n${spec.scenarios.map(s => `  Scenario: ${s.name}\n    Given ${s.given}\n    When ${s.when}\n    Then ${s.then}`).join('\n\n')}`;
    }

    getAll(): BehaviorSpec[] { return Array.from(this.specs.values()); }
}
export function getBehaviorSpecGenerator(): BehaviorSpecGenerator { return BehaviorSpecGenerator.getInstance(); }
