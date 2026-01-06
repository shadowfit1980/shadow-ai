/**
 * Analogical Reasoning Engine
 * 
 * Transfers knowledge and patterns across different domains
 * Learns from analogies to solve new problems using familiar patterns
 */

import { ModelManager } from '../ModelManager';
import { getMemoryEngine } from '../memory';

export interface Analogy {
    id: string;
    source: {
        domain: string;
        problem: string;
        solution: string;
        pattern: string;
    };
    target: {
        domain: string;
        problem: string;
    };
    mapping: Array<{
        sourceElement: string;
        targetElement: string;
        similarity: number;
    }>;
    confidence: number;
    applicability: number; // 0-1, how well the source solution applies to target
}

export interface Pattern {
    id: string;
    name: string;
    description: string;
    domain: string;
    structure: string; // Abstract structure of the pattern
    examples: string[];
    applicableTo: string[]; // Other domains where this pattern works
}

export interface AnalogicalSolution {
    originalProblem: string;
    analogousProblem: string;
    analogousSolution: string;
    adaptedSolution: string;
    mapping: Record<string, string>;
    confidence: number;
    reasoning: string;
}

export class AnalogicalReasoningEngine {
    private static instance: AnalogicalReasoningEngine;
    private modelManager: ModelManager;
    private memory = getMemoryEngine();

    // Store learned patterns
    private patterns: Map<string, Pattern> = new Map();

    // Store successful analogies
    private analogyLibrary: Analogy[] = [];

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializeCommonPatterns();
    }

    static getInstance(): AnalogicalReasoningEngine {
        if (!AnalogicalReasoningEngine.instance) {
            AnalogicalReasoningEngine.instance = new AnalogicalReasoningEngine();
        }
        return AnalogicalReasoningEngine.instance;
    }

    /**
     * Solve a problem by finding analogies to previously solved problems
     */
    async solveByAnalogy(problem: string, context?: {
        domain?: string;
        constraints?: string[];
        goals?: string[];
    }): Promise<AnalogicalSolution> {
        console.log('🔄 Solving by analogy...');

        // Find similar past problems
        const analogies = await this.findAnalogies(problem, context);

        if (analogies.length === 0) {
            // No analogies found, try pattern matching
            return await this.solveByPatternMatching(problem, context);
        }

        // Use best analogy
        const bestAnalogy = analogies[0];

        // Adapt the solution
        const adaptedSolution = await this.adaptSolution(
            bestAnalogy.source.solution,
            bestAnalogy.source.problem,
            problem,
            bestAnalogy.mapping
        );

        return {
            originalProblem: problem,
            analogousProblem: bestAnalogy.source.problem,
            analogousSolution: bestAnalogy.source.solution,
            adaptedSolution,
            mapping: Object.fromEntries(
                bestAnalogy.mapping.map(m => [m.sourceElement, m.targetElement])
            ),
            confidence: bestAnalogy.confidence,
            reasoning: this.explainAnalogy(bestAnalogy)
        };
    }

    /**
     * Extract and learn abstract patterns from examples
     */
    async learnPattern(examples: Array<{
        problem: string;
        solution: string;
        domain: string;
    }>): Promise<Pattern> {
        console.log('📚 Learning pattern from examples...');

        const prompt = `Extract the abstract pattern from these examples:

${examples.map((ex, i) => `
## Example ${i + 1} (${ex.domain})
**Problem**: ${ex.problem}
**Solution**: ${ex.solution}
`).join('\n')}

Identify:
1. The common abstract pattern
2. The structure (independent of domain)
3. Key elements that map across examples
4. Other domains where this pattern could apply

Response in JSON:
\`\`\`json
{
  "name": "Pattern name",
  "description": "Abstract description",
  "structure": "Generic structure",
  "keyElements": ["element1", "element2"],
  "applicableDomains": ["domain1", "domain2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parsePatternResponse(response);

        const pattern: Pattern = {
            id: `pattern-${Date.now()}`,
            name: parsed.name,
            description: parsed.description,
            domain: 'general',
            structure: parsed.structure,
            examples: examples.map(ex => `${ex.domain}: ${ex.problem}`),
            applicableTo: parsed.applicableDomains || []
        };

        this.patterns.set(pattern.id, pattern);

        console.log(`✅ Learned pattern: ${pattern.name}`);
        return pattern;
    }

    /**
     * Transfer a solution from one domain to another
     */
    async transferPattern(
        patternId: string,
        targetProblem: string,
        targetDomain: string
    ): Promise<{
        solution: string;
        mapping: Record<string, string>;
        confidence: number;
    }> {
        const pattern = this.patterns.get(patternId);
        if (!pattern) {
            throw new Error(`Pattern ${patternId} not found`);
        }

        console.log(`🔀 Transferring pattern "${pattern.name}" to ${targetDomain}...`);

        const prompt = `Apply this abstract pattern to a new problem:

## Abstract Pattern
**Name**: ${pattern.name}
**Description**: ${pattern.description}
**Structure**: ${pattern.structure}

## Examples of this pattern:
${pattern.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

## New Problem (${targetDomain})
${targetProblem}

Provide:
1. How to apply the pattern to this problem
2. Mapping from abstract elements to concrete elements
3. The adapted solution

Response in JSON:
\`\`\`json
{
  "solution": "Concrete solution for the new problem",
  "mapping": {
    "abstract_element1": "concrete_element1",
    "abstract_element2": "concrete_element2"
  },
  "confidence": 0.85
}
\`\`\``;

        const response = await this.callModel(prompt);
        return this.parseTransferResponse(response);
    }

    /**
     * Find cross-domain analogies
     */
    async findCrossDomainAnalogies(
        concept: string,
        fromDomain: string,
        toDomain: string
    ): Promise<Array<{
        analogy: string;
        similarity: number;
        explanation: string;
    }>> {
        console.log(`🌉 Finding analogies from ${fromDomain} to ${toDomain}...`);

        const prompt = `Find cross-domain analogies:

## Concept
${concept}

## Source Domain
${fromDomain}

## Target Domain
${toDomain}

Find 3-5 analogies that map concepts from the source domain to the target domain.

Response in JSON:
\`\`\`json
{
  "analogies": [
    {
      "analogy": "X in source domain is like Y in target domain",
      "similarity": 0.8,
      "explanation": "Why this analogy works"
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseAnalogiesResponse(response);

        return parsed.analogies || [];
    }

    /**
     * Recognize familiar patterns in new problems
     */
    async recognizePattern(problem: string, domain: string): Promise<{
        matchedPatterns: Array<{
            pattern: Pattern;
            confidence: number;
            mapping: Record<string, string>;
        }>;
        recommendation: string;
    }> {
        console.log('🎯 Recognizing patterns...');

        const matches: Array<{
            pattern: Pattern;
            confidence: number;
            mapping: Record<string, string>;
        }> = [];

        // Check all known patterns
        for (const pattern of this.patterns.values()) {
            const match = await this.matchPattern(pattern, problem, domain);
            if (match.confidence > 0.5) {
                matches.push({
                    pattern,
                    confidence: match.confidence,
                    mapping: match.mapping
                });
            }
        }

        // Sort by confidence
        matches.sort((a, b) => b.confidence - a.confidence);

        const recommendation = matches.length > 0
            ? `This problem matches the "${matches[0].pattern.name}" pattern. Consider applying solutions from: ${matches[0].pattern.examples.slice(0, 2).join(', ')}`
            : 'No familiar patterns recognized. This may be a novel problem requiring new approaches.';

        return { matchedPatterns: matches, recommendation };
    }

    /**
     * Learn from a successful analogy
     */
    recordAnalogy(analogy: Analogy): void {
        this.analogyLibrary.push(analogy);

        // Keep library manageable
        if (this.analogyLibrary.length > 1000) {
            // Sort by applicability and keep top 500
            this.analogyLibrary.sort((a, b) => b.applicability - a.applicability);
            this.analogyLibrary = this.analogyLibrary.slice(0, 500);
        }

        console.log(`📝 Recorded analogy: ${analogy.source.domain} → ${analogy.target.domain}`);
    }

    // Private methods

    private async findAnalogies(problem: string, context?: any): Promise<Analogy[]> {
        const prompt = `Find analogous problems from different domains:

## Current Problem
${problem}

${context?.domain ? `## Domain\n${context.domain}\n` : ''}

Search your knowledge for similar problems in other domains that have known solutions.
Return 3-5 analogies ranked by relevance.

Response in JSON:
\`\`\`json
{
  "analogies": [
    {
      "sourceDomain": "networking",
      "sourceProblem": "Congestion control in TCP",
      "sourceSolution": "Sliding window algorithm",
      "pattern": "Rate limiting"
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseFindAnalogiesResponse(response);

        return (parsed.analogies || []).map((a: any, index: number) => ({
            id: `analogy-${Date.now()}-${index}`,
            source: {
                domain: a.sourceDomain,
                problem: a.sourceProblem,
                solution: a.sourceSolution,
                pattern: a.pattern
            },
            target: {
                domain: context?.domain || 'unknown',
                problem
            },
            mapping: a.mapping || [],
            confidence: a.confidence || 0.7,
            applicability: a.applicability || 0.7
        }));
    }

    private async solveByPatternMatching(problem: string, context?: any): Promise<AnalogicalSolution> {
        const recognized = await this.recognizePattern(problem, context?.domain || 'general');

        if (recognized.matchedPatterns.length > 0) {
            const best = recognized.matchedPatterns[0];
            const adapted = await this.transferPattern(best.pattern.id, problem, context?.domain || 'general');

            return {
                originalProblem: problem,
                analogousProblem: best.pattern.examples[0],
                analogousSolution: best.pattern.description,
                adaptedSolution: adapted.solution,
                mapping: adapted.mapping,
                confidence: adapted.confidence * best.confidence,
                reasoning: `Matched pattern: ${best.pattern.name}`
            };
        }

        return {
            originalProblem: problem,
            analogousProblem: 'No analogy found',
            analogousSolution: 'N/A',
            adaptedSolution: 'Unable to solve by analogy. Consider novel approaches.',
            mapping: {},
            confidence: 0,
            reasoning: 'No matching patterns or analogies found'
        };
    }

    private async adaptSolution(
        solution: string,
        sourceProblem: string,
        targetProblem: string,
        mapping: Array<{ sourceElement: string; targetElement: string; similarity: number }>
    ): Promise<string> {
        const prompt = `Adapt this solution to a new problem:

## Original Problem
${sourceProblem}

## Original Solution
${solution}

## New Problem
${targetProblem}

## Element Mapping
${mapping.map(m => `- ${m.sourceElement} → ${m.targetElement}`).join('\n')}

Provide an adapted solution that applies to the new problem.`;

        const response = await this.callModel(prompt);
        return response;
    }

    private async matchPattern(pattern: Pattern, problem: string, domain: string): Promise<{
        confidence: number;
        mapping: Record<string, string>;
    }> {
        // Simplified pattern matching - would use ML in production
        const similarityScore = pattern.applicableTo.includes(domain) ? 0.7 : 0.3;

        return {
            confidence: similarityScore,
            mapping: {} // Would compute actual mapping
        };
    }

    private explainAnalogy(analogy: Analogy): string {
        return `This problem in ${analogy.target.domain} is similar to ${analogy.source.problem} in ${analogy.source.domain}. The solution pattern "${analogy.source.pattern}" can be adapted.`;
    }

    private initializeCommonPatterns(): void {
        // Pre-populate with common software patterns
        this.patterns.set('divide-conquer', {
            id: 'divide-conquer',
            name: 'Divide and Conquer',
            description: 'Break problem into smaller subproblems, solve recursively, combine results',
            domain: 'general',
            structure: 'Split(problem) → Solve(subproblems) → Combine(results)',
            examples: [
                'algorithms: Merge sort',
                'systems: Microservices architecture',
                'management: Hierarchical delegation'
            ],
            applicableTo: ['algorithms', 'systems', 'organization', 'data-processing']
        });

        this.patterns.set('caching', {
            id: 'caching',
            name: 'Caching/Memoization',
            description: 'Store results of expensive operations for reuse',
            domain: 'performance',
            structure: 'Check cache → If miss, compute and store → Return result',
            examples: [
                'web: Browser caching',
                'databases: Query result caching',
                'algorithms: Dynamic programming'
            ],
            applicableTo: ['performance', 'databases', 'algorithms', 'networking']
        });

        this.patterns.set('retry-backoff', {
            id: 'retry-backoff',
            name: 'Retry with Backoff',
            description: 'Retry failed operations with increasing delays',
            domain: 'reliability',
            structure: 'Try → If fail, wait(delay) → Try again → Increase delay',
            examples: [
                'networking: TCP retransmission',
                'apis: Rate limit handling',
                'distributed-systems: Leader election'
            ],
            applicableTo: ['networking', 'distributed-systems', 'apis', 'reliability']
        });
    }

    // Parsers

    private parsePatternResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                name: 'Unknown Pattern',
                description: 'Failed to parse',
                structure: '',
                keyElements: [],
                applicableDomains: []
            };
        }
    }

    private parseTransferResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                solution: 'Unable to transfer pattern',
                mapping: {},
                confidence: 0
            };
        }
    }

    private parseAnalogiesResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { analogies: [] };
        }
    }

    private parseFindAnalogiesResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { analogies: [] };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert in pattern recognition and analogical reasoning.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '{}';
        }
    }
}

// Export singleton
export const analogicalReasoningEngine = AnalogicalReasoningEngine.getInstance();
