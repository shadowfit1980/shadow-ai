/**
 * Contradiction Detection & Resolution Engine
 * 
 * Detects logical inconsistencies, conflicts, and contradictions
 * Proposes resolutions to maintain system coherence
 */

import { ModelManager } from '../ModelManager';

export interface Contradiction {
    id: string;
    type: 'logical' | 'temporal' | 'requirement' | 'implementation' | 'design';
    severity: 'critical' | 'high' | 'medium' | 'low';
    statement1: {
        content: string;
        source: string;
        context?: string;
    };
    statement2: {
        content: string;
        source: string;
        context?: string;
    };
    explanation: string;
    impact: string[];
}

export interface Resolution {
    contradiction: Contradiction;
    strategies: Array<{
        approach: string;
        description: string;
        pros: string[];
        cons: string[];
        priority: number;
    }>;
    recommendation: string;
    implementation: string;
}

export interface ConsistencyCheck {
    isConsistent: boolean;
    contradictions: Contradiction[];
    warnings: string[];
    score: number; // 0-1, overall consistency score
}

export class ContradictionDetector {
    private static instance: ContradictionDetector;
    private modelManager: ModelManager;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ContradictionDetector {
        if (!ContradictionDetector.instance) {
            ContradictionDetector.instance = new ContradictionDetector();
        }
        return ContradictionDetector.instance;
    }

    /**
     * Check for contradictions in a set of statements
     */
    async detectContradictions(statements: Array<{
        content: string;
        source: string;
        context?: string;
    }>): Promise<ConsistencyCheck> {
        console.log('🔍 Detecting contradictions...');

        if (statements.length < 2) {
            return {
                isConsistent: true,
                contradictions: [],
                warnings: [],
                score: 1.0
            };
        }

        const contradictions: Contradiction[] = [];

        // Compare all pairs of statements
        for (let i = 0; i < statements.length; i++) {
            for (let j = i + 1; j < statements.length; j++) {
                const s1 = statements[i];
                const s2 = statements[j];

                const conflict = await this.checkPairwise(s1, s2);
                if (conflict) {
                    contradictions.push(conflict);
                }
            }
        }

        const score = this.calculateConsistencyScore(contradictions, statements.length);

        return {
            isConsistent: contradictions.length === 0,
            contradictions,
            warnings: this.generateWarnings(contradictions),
            score
        };
    }

    /**
     * Check requirements for contradictions
     */
    async checkRequirements(requirements: string[]): Promise<ConsistencyCheck> {
        console.log('📋 Checking requirements consistency...');

        const statements = requirements.map((req, i) => ({
            content: req,
            source: `Requirement ${i + 1}`,
            context: 'requirements'
        }));

        return await this.detectContradictions(statements);
    }

    /**
     * Check if implementation matches design
     */
    async checkImplementationConsistency(
        design: string,
        implementation: string
    ): Promise<{
        isConsistent: boolean;
        contradictions: Contradiction[];
        gaps: string[];
    }> {
        console.log('⚖️  Checking design-implementation consistency...');

        const prompt = `Compare design specification with implementation:

## Design
${design}

## Implementation
${implementation}

Identify:
1. Any contradictions between design and code
2. Missing implementations
3. Deviations from design
4. Consistency issues

Response in JSON:
\`\`\`json
{
  "contradictions": [
    {
      "type": "implementation",
      "severity": "high",
      "designStatement": "Use async/await",
      "implementationStatement": "Uses callbacks",
      "explanation": "Implementation doesn't follow specified pattern"
    }
  ],
  "gaps": ["Feature X not implemented", "Error handling missing"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseConsistencyResponse(response);

        const contradictions = (parsed.contradictions || []).map((c: any, i: number) => ({
            id: `impl-${i}`,
            type: 'implementation' as const,
            severity: c.severity || 'medium',
            statement1: {
                content: c.designStatement,
                source: 'Design Specification'
            },
            statement2: {
                content: c.implementationStatement,
                source: 'Implementation'
            },
            explanation: c.explanation,
            impact: ['Implementation may not meet requirements']
        }));

        return {
            isConsistent: contradictions.length === 0 && (parsed.gaps || []).length === 0,
            contradictions,
            gaps: parsed.gaps || []
        };
    }

    /**
     * Resolve a contradiction
     */
    async resolveContradiction(contradiction: Contradiction): Promise<Resolution> {
        console.log('🔧 Resolving contradiction...');

        const prompt = `Propose resolutions for this contradiction:

## Contradiction
**Type**: ${contradiction.type}
**Severity**: ${contradiction.severity}

**Statement 1** (${contradiction.statement1.source}):
${contradiction.statement1.content}

**Statement 2** (${contradiction.statement2.source}):
${contradiction.statement2.content}

**Why it's a contradiction**:
${contradiction.explanation}

Propose 3-5 resolution strategies, ranked by preference.

Response in JSON:
\`\`\`json
{
  "strategies": [
    {
      "approach": "Prioritize Statement 1",
      "description": "Keep Statement 1, modify Statement 2",
      "pros": ["Maintains X", "Simpler to implement"],
      "cons": ["May lose Y functionality"],
      "priority": 1
    }
  ],
  "recommendation": "Based on severity and impact, recommend strategy 1",
  "implementation": "Concrete steps to implement the recommended resolution"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseResolutionResponse(response);

        return {
            contradiction,
            strategies: parsed.strategies || [],
            recommendation: parsed.recommendation || 'Manual review required',
            implementation: parsed.implementation || 'No implementation provided'
        };
    }

    /**
     * Detect temporal contradictions (things that change over time)
     */
    async detectTemporalContradictions(
        timeline: Array<{
            timestamp: Date;
            statement: string;
            source: string;
        }>
    ): Promise<Contradiction[]> {
        console.log('⏰ Detecting temporal contradictions...');

        // Sort by time
        const sorted = [...timeline].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const contradictions: Contradiction[] = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const earlier = sorted[i];
            const later = sorted[i + 1];

            // Check if later statement contradicts earlier one
            const conflict = await this.checkTemporalPair(earlier, later);
            if (conflict) {
                contradictions.push(conflict);
            }
        }

        return contradictions;
    }

    /**
     * Find logical fallacies in reasoning
     */
    async detectLogicalFallacies(argument: string): Promise<Array<{
        type: string;
        description: string;
        location: string;
        severity: 'high' | 'medium' | 'low';
    }>> {
        console.log('🧠 Analyzing for logical fallacies...');

        const prompt = `Analyze this argument for logical fallacies:

${argument}

Identify any logical fallacies such as:
- Circular reasoning
- False dichotomy
- Straw man
- Ad hominem
- Appeal to authority
- Hasty generalization
- Slippery slope

Response in JSON:
\`\`\`json
{
  "fallacies": [
    {
      "type": "Circular reasoning",
      "description": "The argument assumes what it's trying to prove",
      "location": "Quote from argument",
      "severity": "high"
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseFallaciesResponse(response);

        return parsed.fallacies || [];
    }

    // Private methods

    private async checkPairwise(
        s1: { content: string; source: string; context?: string },
        s2: { content: string; source: string; context?: string }
    ): Promise<Contradiction | null> {
        const prompt = `Check if these two statements contradict each other:

**Statement 1** (${s1.source}):
${s1.content}

**Statement 2** (${s2.source}):
${s2.content}

Response in JSON:
\`\`\`json
{
  "isContradiction": true/false,
  "type": "logical/temporal/requirement/implementation/design",
  "severity": "critical/high/medium/low",
  "explanation": "Why they contradict",
  "impact": ["Impact 1", "Impact 2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseContradictionResponse(response);

        if (!parsed.isContradiction) {
            return null;
        }

        return {
            id: `contra-${Date.now()}-${Math.random()}`,
            type: parsed.type || 'logical',
            severity: parsed.severity || 'medium',
            statement1: s1,
            statement2: s2,
            explanation: parsed.explanation || 'Statements are contradictory',
            impact: parsed.impact || []
        };
    }

    private async checkTemporalPair(
        earlier: { timestamp: Date; statement: string; source: string },
        later: { timestamp: Date; statement: string; source: string }
    ): Promise<Contradiction | null> {
        const timeDiff = later.timestamp.getTime() - earlier.timestamp.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        const prompt = `Check if the later statement contradicts the earlier one:

**Earlier** (${earlier.source}, ${daysDiff} days ago):
${earlier.statement}

**Later** (${later.source}):
${later.statement}

Determine if this is a contradiction or a legitimate change of requirements/understanding.

Response in JSON:
\`\`\`json
{
  "isContradiction": true/false,
  "explanation": "Why this is or isn't a contradiction",
  "isLegitimateChange": true/false
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseTemporalResponse(response);

        if (!parsed.isContradiction || parsed.isLegitimateChange) {
            return null;
        }

        return {
            id: `temporal-${Date.now()}`,
            type: 'temporal',
            severity: 'medium',
            statement1: {
                content: earlier.statement,
                source: earlier.source,
                context: `${daysDiff} days ago`
            },
            statement2: {
                content: later.statement,
                source: later.source,
                context: 'recent'
            },
            explanation: parsed.explanation || 'Temporal contradiction detected',
            impact: ['May indicate unstable requirements', 'Could confuse implementation']
        };
    }

    private calculateConsistencyScore(contradictions: Contradiction[], totalStatements: number): number {
        if (totalStatements === 0) return 1.0;

        const severityWeights = {
            critical: 1.0,
            high: 0.7,
            medium: 0.4,
            low: 0.2
        };

        const totalPenalty = contradictions.reduce((sum, c) => {
            return sum + severityWeights[c.severity];
        }, 0);

        // Max possible pairs
        const maxPairs = (totalStatements * (totalStatements - 1)) / 2;

        // Score decreases with more/severe contradictions
        const score = Math.max(0, 1 - (totalPenalty / maxPairs));

        return score;
    }

    private generateWarnings(contradictions: Contradiction[]): string[] {
        const warnings: string[] = [];

        const criticalCount = contradictions.filter(c => c.severity === 'critical').length;
        const highCount = contradictions.filter(c => c.severity === 'high').length;

        if (criticalCount > 0) {
            warnings.push(`${criticalCount} critical contradiction(s) found - immediate resolution required`);
        }

        if (highCount > 0) {
            warnings.push(`${highCount} high-severity contradiction(s) detected`);
        }

        const types = new Set(contradictions.map(c => c.type));
        if (types.has('requirement')) {
            warnings.push('Contradictory requirements detected - stakeholder alignment needed');
        }

        if (types.has('implementation')) {
            warnings.push('Implementation deviates from design - review recommended');
        }

        return warnings;
    }

    // Response parsers

    private parseContradictionResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { isContradiction: false };
        }
    }

    private parseConsistencyResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { contradictions: [], gaps: [] };
        }
    }

    private parseResolutionResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                strategies: [],
                recommendation: 'Unable to generate resolution',
                implementation: ''
            };
        }
    }

    private parseTemporalResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { isContradiction: false, isLegitimateChange: true };
        }
    }

    private parseFallaciesResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { fallacies: [] };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert in logic, consistency checking, and identifying contradictions.',
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
export const contradictionDetector = ContradictionDetector.getInstance();
