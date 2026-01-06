/**
 * Telepathic Intent Reader
 * 
 * Predicts developer intent from minimal input, suggesting
 * complete implementations from just a few characters or concepts.
 */

import { EventEmitter } from 'events';

export interface IntentReading {
    id: string;
    input: string;
    interpretations: Interpretation[];
    selectedInterpretation?: string;
    confidence: number;
    createdAt: Date;
}

export interface Interpretation {
    id: string;
    intent: string;
    description: string;
    implementation: string;
    probability: number;
    reasoning: string[];
}

export interface IntentContext {
    recentCode: string[];
    fileType: string;
    projectContext?: string;
    userPatterns: string[];
}

export class TelepathicIntentReader extends EventEmitter {
    private static instance: TelepathicIntentReader;
    private readings: Map<string, IntentReading> = new Map();
    private patternMemory: Map<string, string[]> = new Map();

    private constructor() {
        super();
        this.initializePatterns();
    }

    static getInstance(): TelepathicIntentReader {
        if (!TelepathicIntentReader.instance) {
            TelepathicIntentReader.instance = new TelepathicIntentReader();
        }
        return TelepathicIntentReader.instance;
    }

    private initializePatterns(): void {
        this.patternMemory.set('api', ['API endpoint', 'REST handler', 'GraphQL resolver']);
        this.patternMemory.set('auth', ['Authentication', 'Authorization', 'Login flow']);
        this.patternMemory.set('val', ['Validation', 'Value extraction', 'Variable']);
        this.patternMemory.set('test', ['Unit test', 'Integration test', 'Test suite']);
        this.patternMemory.set('comp', ['Component', 'Comparison', 'Computation']);
        this.patternMemory.set('fetch', ['API call', 'Data fetching', 'Network request']);
        this.patternMemory.set('state', ['State management', 'State machine', 'Stateful']);
        this.patternMemory.set('log', ['Logging', 'Login', 'Logic']);
        this.patternMemory.set('err', ['Error handling', 'Error boundary', 'Error message']);
        this.patternMemory.set('util', ['Utility function', 'Helper', 'Shared code']);
    }

    async readIntent(input: string, context?: IntentContext): Promise<IntentReading> {
        const interpretations = this.generateInterpretations(input, context);

        const reading: IntentReading = {
            id: `intent_${Date.now()}`,
            input,
            interpretations,
            confidence: interpretations.length > 0 ? interpretations[0].probability : 0,
            createdAt: new Date(),
        };

        this.readings.set(reading.id, reading);
        this.emit('intent:read', reading);
        return reading;
    }

    private generateInterpretations(input: string, context?: IntentContext): Interpretation[] {
        const interpretations: Interpretation[] = [];
        const lower = input.toLowerCase().trim();

        // Check pattern memory
        for (const [pattern, meanings] of this.patternMemory) {
            if (lower.startsWith(pattern) || lower.includes(pattern)) {
                for (const meaning of meanings) {
                    interpretations.push({
                        id: `interp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        intent: meaning,
                        description: `Create ${meaning.toLowerCase()} based on "${input}"`,
                        implementation: this.generateImplementation(meaning, input, context),
                        probability: this.calculateProbability(meaning, input, context),
                        reasoning: [`Matched pattern "${pattern}"`, `Context suggests ${meaning}`],
                    });
                }
            }
        }

        // Add generic interpretations
        if (interpretations.length === 0) {
            interpretations.push({
                id: `interp_generic_${Date.now()}`,
                intent: 'General implementation',
                description: `Implement functionality for "${input}"`,
                implementation: this.generateGenericImplementation(input),
                probability: 0.5,
                reasoning: ['No specific pattern matched', 'Using general template'],
            });
        }

        // Sort by probability
        interpretations.sort((a, b) => b.probability - a.probability);
        return interpretations.slice(0, 5);
    }

    private calculateProbability(meaning: string, input: string, context?: IntentContext): number {
        let probability = 0.6;

        // Boost if context matches
        if (context?.fileType?.includes('test') && meaning.includes('test')) {
            probability += 0.2;
        }
        if (context?.projectContext?.includes(meaning.toLowerCase())) {
            probability += 0.15;
        }
        if (input.length > 5) {
            probability += 0.1;
        }

        return Math.min(0.95, probability);
    }

    private generateImplementation(meaning: string, input: string, context?: IntentContext): string {
        const meaningLower = meaning.toLowerCase();

        if (meaningLower.includes('test')) {
            return `describe('${input}', () => {
  it('should work correctly', () => {
    // Test implementation
    expect(true).toBe(true);
  });
});`;
        }

        if (meaningLower.includes('api') || meaningLower.includes('endpoint')) {
            return `async function ${this.toCamelCase(input)}(req: Request, res: Response) {
  try {
    // Implementation
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
}`;
        }

        if (meaningLower.includes('component')) {
            return `export function ${this.toPascalCase(input)}({ props }: Props) {
  return (
    <div className="${input}">
      {/* Component content */}
    </div>
  );
}`;
        }

        if (meaningLower.includes('validation')) {
            return `function validate${this.toPascalCase(input)}(value: unknown): boolean {
  if (!value) return false;
  // Add validation logic
  return true;
}`;
        }

        if (meaningLower.includes('error')) {
            return `class ${this.toPascalCase(input)}Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = '${this.toPascalCase(input)}Error';
  }
}`;
        }

        return `function ${this.toCamelCase(input)}() {
  // Implementation for ${meaning}
}`;
    }

    private generateGenericImplementation(input: string): string {
        return `// Implementation for: ${input}
export function ${this.toCamelCase(input)}() {
  // TODO: Implement ${input}
}`;
    }

    private toCamelCase(str: string): string {
        return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, chr => chr.toLowerCase());
    }

    private toPascalCase(str: string): string {
        const camel = this.toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    selectInterpretation(readingId: string, interpretationId: string): void {
        const reading = this.readings.get(readingId);
        if (reading) {
            reading.selectedInterpretation = interpretationId;
            this.emit('interpretation:selected', { reading, interpretationId });
        }
    }

    getReading(id: string): IntentReading | undefined {
        return this.readings.get(id);
    }

    getAllReadings(): IntentReading[] {
        return Array.from(this.readings.values());
    }

    getStats(): { totalReadings: number; avgConfidence: number; topIntents: string[] } {
        const readings = Array.from(this.readings.values());
        const intentCounts: Record<string, number> = {};

        for (const r of readings) {
            if (r.interpretations[0]) {
                const intent = r.interpretations[0].intent;
                intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            }
        }

        const topIntents = Object.entries(intentCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([intent]) => intent);

        return {
            totalReadings: readings.length,
            avgConfidence: readings.length > 0
                ? readings.reduce((s, r) => s + r.confidence, 0) / readings.length
                : 0,
            topIntents,
        };
    }
}

export const telepathicIntentReader = TelepathicIntentReader.getInstance();
