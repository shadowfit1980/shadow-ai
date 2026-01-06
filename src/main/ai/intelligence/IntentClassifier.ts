/**
 * Intent Classifier
 * 
 * NLP-powered system that understands ambiguous user requests
 * and infers unspoken requirements using pattern matching.
 */

import { EventEmitter } from 'events';

export interface ParsedIntent {
    id: string;
    rawInput: string;
    primaryIntent: IntentType;
    confidence: number;
    inferredRequirements: InferredRequirement[];
    clarificationNeeded: boolean;
    suggestedClarifications?: string[];
    context: IntentContext;
}

export type IntentType =
    | 'code_generation'
    | 'code_modification'
    | 'code_explanation'
    | 'debugging'
    | 'testing'
    | 'documentation'
    | 'refactoring'
    | 'deployment'
    | 'project_setup'
    | 'file_operation'
    | 'command_execution'
    | 'question_answer'
    | 'creative_ideation'
    | 'unknown';

export interface InferredRequirement {
    type: 'language' | 'framework' | 'pattern' | 'constraint' | 'dependency' | 'style';
    value: string;
    confidence: number;
    source: 'explicit' | 'context' | 'pattern' | 'default';
}

export interface IntentContext {
    programmingLanguage?: string;
    framework?: string;
    projectType?: string;
    recentFiles?: string[];
    conversationHistory?: string[];
}

// Knowledge graph of programming paradigms
const PARADIGM_GRAPH: Record<string, string[]> = {
    'react': ['jsx', 'hooks', 'components', 'state-management', 'virtual-dom'],
    'typescript': ['types', 'interfaces', 'generics', 'decorators', 'enums'],
    'node': ['express', 'fastify', 'npm', 'async', 'streams'],
    'python': ['django', 'flask', 'pandas', 'numpy', 'asyncio'],
    'rust': ['ownership', 'borrowing', 'lifetimes', 'traits', 'cargo'],
    'go': ['goroutines', 'channels', 'interfaces', 'modules'],
    'testing': ['unit', 'integration', 'e2e', 'mocking', 'coverage'],
    'deployment': ['docker', 'kubernetes', 'ci-cd', 'serverless'],
    'security': ['auth', 'encryption', 'sanitization', 'cors', 'csrf'],
    'database': ['sql', 'nosql', 'orm', 'migrations', 'indexing'],
};

// Intent patterns for classification
const INTENT_PATTERNS: { pattern: RegExp; intent: IntentType; priority: number }[] = [
    { pattern: /\b(create|make|build|generate|write)\b.*\b(component|function|class|module|api)\b/i, intent: 'code_generation', priority: 10 },
    { pattern: /\b(fix|debug|solve|resolve)\b.*\b(error|bug|issue|problem)\b/i, intent: 'debugging', priority: 10 },
    { pattern: /\b(explain|what|how|why)\b.*\b(code|does|works|this)\b/i, intent: 'code_explanation', priority: 8 },
    { pattern: /\b(test|testing|unit test|spec)\b/i, intent: 'testing', priority: 9 },
    { pattern: /\b(document|docs|readme|jsdoc)\b/i, intent: 'documentation', priority: 8 },
    { pattern: /\b(refactor|improve|optimize|clean)\b/i, intent: 'refactoring', priority: 8 },
    { pattern: /\b(deploy|release|publish|build)\b/i, intent: 'deployment', priority: 7 },
    { pattern: /\b(setup|init|scaffold|bootstrap)\b.*\b(project|app)\b/i, intent: 'project_setup', priority: 9 },
    { pattern: /\b(change|modify|update|edit|add|remove)\b/i, intent: 'code_modification', priority: 6 },
    { pattern: /\b(run|execute|command|terminal|npm|yarn)\b/i, intent: 'command_execution', priority: 7 },
    { pattern: /\b(file|folder|directory|create file|delete file)\b/i, intent: 'file_operation', priority: 6 },
    { pattern: /\b(idea|brainstorm|suggest|creative|design)\b/i, intent: 'creative_ideation', priority: 5 },
];

export class IntentClassifier extends EventEmitter {
    private static instance: IntentClassifier;
    private contextCache: Map<string, IntentContext> = new Map();
    private classificationHistory: ParsedIntent[] = [];

    private constructor() {
        super();
    }

    static getInstance(): IntentClassifier {
        if (!IntentClassifier.instance) {
            IntentClassifier.instance = new IntentClassifier();
        }
        return IntentClassifier.instance;
    }

    /**
     * Classify user input into structured intent
     */
    async classify(input: string, context?: Partial<IntentContext>): Promise<ParsedIntent> {
        const id = `intent_${Date.now()}`;
        const fullContext = this.buildContext(context);

        // Pattern-based classification
        const { intent, confidence } = this.matchPatterns(input);

        // Infer requirements from input and context
        const inferredRequirements = this.inferRequirements(input, fullContext);

        // Determine if clarification is needed
        const { clarificationNeeded, suggestions } = this.checkClarification(input, intent, confidence, inferredRequirements);

        const parsed: ParsedIntent = {
            id,
            rawInput: input,
            primaryIntent: intent,
            confidence,
            inferredRequirements,
            clarificationNeeded,
            suggestedClarifications: suggestions,
            context: fullContext,
        };

        this.classificationHistory.push(parsed);
        this.emit('intent:classified', parsed);

        return parsed;
    }

    /**
     * Match input against intent patterns
     */
    private matchPatterns(input: string): { intent: IntentType; confidence: number } {
        let bestMatch: { intent: IntentType; confidence: number } = { intent: 'unknown', confidence: 0 };

        for (const { pattern, intent, priority } of INTENT_PATTERNS) {
            if (pattern.test(input)) {
                const confidence = priority / 10;
                if (confidence > bestMatch.confidence) {
                    bestMatch = { intent, confidence };
                }
            }
        }

        // Boost confidence if multiple patterns match
        const matchCount = INTENT_PATTERNS.filter(p => p.pattern.test(input)).length;
        if (matchCount > 1) {
            bestMatch.confidence = Math.min(1, bestMatch.confidence + 0.1 * matchCount);
        }

        return bestMatch;
    }

    /**
     * Infer unspoken requirements from input
     */
    private inferRequirements(input: string, context: IntentContext): InferredRequirement[] {
        const requirements: InferredRequirement[] = [];
        const inputLower = input.toLowerCase();

        // Language detection
        const languagePatterns: { lang: string; patterns: string[] }[] = [
            { lang: 'typescript', patterns: ['typescript', 'ts', '.tsx', 'interface', 'type '] },
            { lang: 'javascript', patterns: ['javascript', 'js', '.jsx', 'node'] },
            { lang: 'python', patterns: ['python', 'py', 'django', 'flask', 'pandas'] },
            { lang: 'rust', patterns: ['rust', 'cargo', 'ownership'] },
            { lang: 'go', patterns: ['golang', ' go ', 'goroutine'] },
        ];

        for (const { lang, patterns } of languagePatterns) {
            if (patterns.some(p => inputLower.includes(p))) {
                requirements.push({
                    type: 'language',
                    value: lang,
                    confidence: 0.9,
                    source: 'explicit',
                });
            }
        }

        // Framework detection via paradigm graph
        for (const [key, related] of Object.entries(PARADIGM_GRAPH)) {
            if (inputLower.includes(key)) {
                requirements.push({
                    type: 'framework',
                    value: key,
                    confidence: 0.85,
                    source: 'explicit',
                });

                // Infer related patterns
                for (const rel of related) {
                    if (inputLower.includes(rel)) {
                        requirements.push({
                            type: 'pattern',
                            value: rel,
                            confidence: 0.7,
                            source: 'pattern',
                        });
                    }
                }
            }
        }

        // Context-based inference
        if (context.programmingLanguage && requirements.filter(r => r.type === 'language').length === 0) {
            requirements.push({
                type: 'language',
                value: context.programmingLanguage,
                confidence: 0.6,
                source: 'context',
            });
        }

        return requirements;
    }

    /**
     * Check if clarification is needed for ambiguous requests
     */
    private checkClarification(
        input: string,
        intent: IntentType,
        confidence: number,
        requirements: InferredRequirement[]
    ): { clarificationNeeded: boolean; suggestions: string[] } {
        const suggestions: string[] = [];

        // Low confidence means ambiguous
        if (confidence < 0.5) {
            suggestions.push(`I'm not entirely sure what you need. Did you mean: ${this.getSimilarIntents(input).join(', ')}?`);
        }

        // Missing language for code tasks
        if (['code_generation', 'code_modification'].includes(intent)) {
            const hasLanguage = requirements.some(r => r.type === 'language');
            if (!hasLanguage) {
                suggestions.push('Which programming language should I use?');
            }
        }

        // Missing framework for web tasks
        if (input.toLowerCase().includes('web') || input.toLowerCase().includes('app')) {
            const hasFramework = requirements.some(r => r.type === 'framework');
            if (!hasFramework) {
                suggestions.push('Which framework would you like? (React, Vue, Angular, etc.)');
            }
        }

        return {
            clarificationNeeded: suggestions.length > 0,
            suggestions,
        };
    }

    /**
     * Get similar intents for disambiguation
     */
    private getSimilarIntents(input: string): string[] {
        const matches = INTENT_PATTERNS
            .filter(p => p.pattern.test(input))
            .map(p => p.intent);

        return [...new Set(matches)].slice(0, 3);
    }

    /**
     * Build full context from partial and cache
     */
    private buildContext(partial?: Partial<IntentContext>): IntentContext {
        const cached = this.contextCache.get('current') || {};
        return { ...cached, ...partial };
    }

    /**
     * Update context cache
     */
    updateContext(update: Partial<IntentContext>): void {
        const current = this.contextCache.get('current') || {};
        this.contextCache.set('current', { ...current, ...update });
    }

    /**
     * Get classification history
     */
    getHistory(): ParsedIntent[] {
        return [...this.classificationHistory];
    }
}

export const intentClassifier = IntentClassifier.getInstance();
