/**
 * Multi-Perspective Analyzer
 * 
 * Analyzes problems from multiple expert viewpoints to ensure
 * comprehensive, well-rounded solutions
 */

import { ModelManager } from '../ModelManager';

export type PerspectiveType =
    | 'user'           // User needs and experience
    | 'performance'    // Speed, efficiency, scalability
    | 'security'       // Vulnerabilities, privacy, compliance
    | 'maintainability' // Code quality, readability, extensibility
    | 'scalability'    // Growth, load handling
    | 'cost'           // Resource efficiency, time investment
    | 'architecture'   // System design, patterns
    | 'testing'        // Testability, coverage
    | 'deployment'     // DevOps, CI/CD, infrastructure
    | 'accessibility'; // Inclusivity, standards compliance

export interface Perspective {
    type: PerspectiveType;
    name: string;
    description: string;
    insights: string[];
    concerns: string[];
    recommendations: string[];
    score: number; // 0-1, how well the current approach satisfies this perspective
    priority: 'low' | 'medium' | 'high' | 'critical';
    conflicts: string[]; // Conflicts with other perspectives
}

export interface PerspectiveAnalysis {
    perspectives: Perspective[];
    synthesis: string;
    tradeoffs: Tradeoff[];
    consensus: string[];
    conflicts: string[];
    overallScore: number;
    confidence: number;
}

export interface Tradeoff {
    perspective1: PerspectiveType;
    perspective2: PerspectiveType;
    description: string;
    recommendation: string;
    severity: 'minor' | 'moderate' | 'significant';
}

export interface AnalysisContext {
    task: string;
    currentApproach?: string;
    constraints?: string[];
    priorities?: PerspectiveType[];
}

export class MultiPerspectiveAnalyzer {
    private static instance: MultiPerspectiveAnalyzer;
    private modelManager: ModelManager;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): MultiPerspectiveAnalyzer {
        if (!MultiPerspectiveAnalyzer.instance) {
            MultiPerspectiveAnalyzer.instance = new MultiPerspectiveAnalyzer();
        }
        return MultiPerspectiveAnalyzer.instance;
    }

    /**
     * Analyze from all relevant perspectives
     */
    async analyze(context: AnalysisContext): Promise<PerspectiveAnalysis> {
        console.log('👁️  Starting multi-perspective analysis...');

        // Determine relevant perspectives
        const relevantPerspectives = this.determineRelevantPerspectives(context);

        // Analyze from each perspective
        const perspectives: Perspective[] = [];
        for (const type of relevantPerspectives) {
            const perspective = await this.analyzeFromPerspective(type, context);
            perspectives.push(perspective);
        }

        // Identify tradeoffs and conflicts
        const tradeoffs = this.identifyTradeoffs(perspectives);
        const conflicts = this.identifyConflicts(perspectives);
        const consensus = this.findConsensus(perspectives);

        // Synthesize overall analysis
        const synthesis = await this.synthesizeAnalysis(perspectives, context);

        // Calculate overall score
        const overallScore = this.calculateOverallScore(perspectives, context);

        const result: PerspectiveAnalysis = {
            perspectives,
            synthesis,
            tradeoffs,
            consensus,
            conflicts,
            overallScore,
            confidence: this.calculateConfidence(perspectives)
        };

        console.log(`✅ Multi-perspective analysis complete:`, {
            perspectives: perspectives.length,
            tradeoffs: tradeoffs.length,
            conflicts: conflicts.length,
            overallScore: overallScore.toFixed(2)
        });

        return result;
    }

    /**
     * Analyze from a specific perspective
     */
    async analyzeFromPerspective(
        type: PerspectiveType,
        context: AnalysisContext
    ): Promise<Perspective> {
        const perspectiveInfo = this.getPerspectiveInfo(type);
        const prompt = this.buildPerspectivePrompt(type, context, perspectiveInfo);

        const response = await this.callModel(prompt);
        const parsed = this.parsePerspectiveResponse(response);

        return {
            type,
            name: perspectiveInfo.name,
            description: perspectiveInfo.description,
            insights: parsed.insights,
            concerns: parsed.concerns,
            recommendations: parsed.recommendations,
            score: parsed.score,
            priority: this.calculatePriority(type, context),
            conflicts: []
        };
    }

    /**
     * Compare two solutions from all perspectives
     */
    async compareSolutions(
        solution1: string,
        solution2: string,
        context: AnalysisContext
    ): Promise<{
        winner: 'solution1' | 'solution2' | 'tie';
        reasoning: string;
        perspectiveScores: Map<PerspectiveType, { sol1: number; sol2: number }>;
        recommendation: string;
    }> {
        const relevantPerspectives = this.determineRelevantPerspectives(context);
        const scores = new Map<PerspectiveType, { sol1: number; sol2: number }>();

        for (const type of relevantPerspectives) {
            const context1 = { ...context, currentApproach: solution1 };
            const context2 = { ...context, currentApproach: solution2 };

            const p1 = await this.analyzeFromPerspective(type, context1);
            const p2 = await this.analyzeFromPerspective(type, context2);

            scores.set(type, {
                sol1: p1.score,
                sol2: p2.score
            });
        }

        // Calculate weighted scores
        let sol1Total = 0;
        let sol2Total = 0;
        let weights = 0;

        scores.forEach((score, type) => {
            const weight = this.getPerspectiveWeight(type, context);
            sol1Total += score.sol1 * weight;
            sol2Total += score.sol2 * weight;
            weights += weight;
        });

        const sol1Avg = sol1Total / weights;
        const sol2Avg = sol2Total / weights;

        let winner: 'solution1' | 'solution2' | 'tie';
        if (Math.abs(sol1Avg - sol2Avg) < 0.05) {
            winner = 'tie';
        } else {
            winner = sol1Avg > sol2Avg ? 'solution1' : 'solution2';
        }

        const reasoning = this.generateComparisonReasoning(scores, sol1Avg, sol2Avg);
        const recommendation = await this.generateRecommendation(winner, scores, context);

        return {
            winner,
            reasoning,
            perspectiveScores: scores,
            recommendation
        };
    }

    /**
     * Get prioritized recommendations
     */
    getPrioritizedRecommendations(analysis: PerspectiveAnalysis): Array<{
        recommendation: string;
        priority: string;
        perspectives: string[];
        impact: string;
    }> {
        const recommendations: Map<string, {
            priority: string;
            perspectives: Set<string>;
            count: number;
        }> = new Map();

        // Aggregate recommendations from all perspectives
        analysis.perspectives.forEach(p => {
            p.recommendations.forEach(rec => {
                const existing = recommendations.get(rec);
                if (existing) {
                    existing.perspectives.add(p.name);
                    existing.count++;
                } else {
                    recommendations.set(rec, {
                        priority: p.priority,
                        perspectives: new Set([p.name]),
                        count: 1
                    });
                }
            });
        });

        // Convert to array and prioritize
        return Array.from(recommendations.entries())
            .map(([rec, data]) => ({
                recommendation: rec,
                priority: data.priority,
                perspectives: Array.from(data.perspectives),
                impact: data.count > 2 ? 'high' : data.count > 1 ? 'medium' : 'low'
            }))
            .sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const impactOrder = { high: 3, medium: 2, low: 1 };

                const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
                const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

                if (aPriority !== bPriority) return bPriority - aPriority;

                const aImpact = impactOrder[a.impact as keyof typeof impactOrder] || 0;
                const bImpact = impactOrder[b.impact as keyof typeof impactOrder] || 0;

                return bImpact - aImpact;
            });
    }

    // Private methods

    private determineRelevantPerspectives(context: AnalysisContext): PerspectiveType[] {
        // Start with priorities if specified
        if (context.priorities && context.priorities.length > 0) {
            return context.priorities;
        }

        // Otherwise, determine based on task
        const task = context.task.toLowerCase();
        const perspectives: Set<PerspectiveType> = new Set();

        // Always include core perspectives
        perspectives.add('user');
        perspectives.add('maintainability');
        perspectives.add('performance');

        // Add context-specific perspectives
        if (task.includes('api') || task.includes('endpoint') || task.includes('service')) {
            perspectives.add('security');
            perspectives.add('scalability');
        }

        if (task.includes('ui') || task.includes('component') || task.includes('interface')) {
            perspectives.add('accessibility');
        }

        if (task.includes('deploy') || task.includes('production') || task.includes('infrastructure')) {
            perspectives.add('deployment');
            perspectives.add('cost');
        }

        if (task.includes('architecture') || task.includes('system') || task.includes('design')) {
            perspectives.add('architecture');
            perspectives.add('scalability');
        }

        if (task.includes('test') || task.includes('quality')) {
            perspectives.add('testing');
        }

        return Array.from(perspectives);
    }

    private getPerspectiveInfo(type: PerspectiveType): {
        name: string;
        description: string;
        keyQuestions: string[];
    } {
        const perspectives = {
            user: {
                name: 'User Experience',
                description: 'Focus on user needs, usability, and satisfaction',
                keyQuestions: [
                    'Does this solve the user\'s actual problem?',
                    'Is it intuitive and easy to use?',
                    'Does it meet user expectations?'
                ]
            },
            performance: {
                name: 'Performance',
                description: 'Focus on speed, efficiency, and resource usage',
                keyQuestions: [
                    'How fast is this solution?',
                    'What is the computational complexity?',
                    'Are there bottlenecks?'
                ]
            },
            security: {
                name: 'Security',
                description: 'Focus on vulnerabilities, privacy, and compliance',
                keyQuestions: [
                    'What are the security risks?',
                    'Is data properly protected?',
                    'Does it follow security best practices?'
                ]
            },
            maintainability: {
                name: 'Maintainability',
                description: 'Focus on code quality, readability, and extensibility',
                keyQuestions: [
                    'Is the code easy to understand?',
                    'Can it be easily modified?',
                    'Is it well-documented?'
                ]
            },
            scalability: {
                name: 'Scalability',
                description: 'Focus on growth and handling increased load',
                keyQuestions: [
                    'Can this handle 10x the load?',
                    'What are the scaling bottlenecks?',
                    'Is it horizontally scalable?'
                ]
            },
            cost: {
                name: 'Cost Efficiency',
                description: 'Focus on resource and time efficiency',
                keyQuestions: [
                    'What are the infrastructure costs?',
                    'How much development time is required?',
                    'What is the maintenance burden?'
                ]
            },
            architecture: {
                name: 'Architecture',
                description: 'Focus on system design and patterns',
                keyQuestions: [
                    'Does it follow good architectural patterns?',
                    'How does it fit into the overall system?',
                    'Is it properly decoupled?'
                ]
            },
            testing: {
                name: 'Testability',
                description: 'Focus on test coverage and quality assurance',
                keyQuestions: [
                    'How testable is this code?',
                    'What test coverage can be achieved?',
                    'Are edge cases covered?'
                ]
            },
            deployment: {
                name: 'Deployment',
                description: 'Focus on DevOps, CI/CD, and infrastructure',
                keyQuestions: [
                    'How easy is it to deploy?',
                    'What infrastructure is needed?',
                    'Can it be rolled back safely?'
                ]
            },
            accessibility: {
                name: 'Accessibility',
                description: 'Focus on inclusivity and standards compliance',
                keyQuestions: [
                    'Is it accessible to all users?',
                    'Does it meet WCAG standards?',
                    'Can assistive technologies use it?'
                ]
            }
        };

        return perspectives[type];
    }

    private buildPerspectivePrompt(
        type: PerspectiveType,
        context: AnalysisContext,
        perspectiveInfo: { name: string; description: string; keyQuestions: string[] }
    ): string {
        return `You are a ${perspectiveInfo.name} expert. Analyze the following from your perspective.

## Task
${context.task}

${context.currentApproach ? `## Current Approach\n${context.currentApproach}\n` : ''}

${context.constraints && context.constraints.length > 0
                ? `## Constraints\n${context.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`
                : ''}

## Your Perspective: ${perspectiveInfo.name}
${perspectiveInfo.description}

## Key Questions to Consider
${perspectiveInfo.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Provide your analysis in JSON format:
\`\`\`json
{
  "insights": ["insight1", "insight2", "insight3"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "score": 0.85
}
\`\`\`

- insights: Key observations from your perspective
- concerns: Issues or risks you identify
- recommendations: Specific suggestions for improvement
- score: 0-1 rating of how well this addresses your perspective`;
    }

    private async synthesizeAnalysis(
        perspectives: Perspective[],
        context: AnalysisContext
    ): Promise<string> {
        const perspectiveSummaries = perspectives.map(p =>
            `### ${p.name} (Score: ${p.score.toFixed(2)}, Priority: ${p.priority})\n` +
            `Insights: ${p.insights.slice(0, 2).join('; ')}\n` +
            `Concerns: ${p.concerns.slice(0, 2).join('; ')}`
        ).join('\n\n');

        const prompt = `Synthesize a comprehensive analysis from multiple expert perspectives.

## Task
${context.task}

## Perspectives
${perspectiveSummaries}

Provide a concise synthesis that:
1. Highlights the most important insights across all perspectives
2. Identifies critical concerns that must be addressed
3. Recommends a balanced approach that satisfies multiple perspectives
4. Notes any unavoidable tradeoffs

Keep it actionable and under 200 words.`;

        return await this.callModel(prompt);
    }

    private identifyTradeoffs(perspectives: Perspective[]): Tradeoff[] {
        const tradeoffs: Tradeoff[] = [];

        // Common tradeoffs
        const tradeoffPairs: Array<[PerspectiveType, PerspectiveType, string]> = [
            ['performance', 'maintainability', 'Optimized code is often harder to maintain'],
            ['performance', 'security', 'Security measures may impact performance'],
            ['scalability', 'cost', 'Scalable solutions often require more resources'],
            ['user', 'security', 'User convenience vs security strictness'],
            ['performance', 'testing', 'Highly optimized code may be harder to test'],
            ['cost', 'scalability', 'Cost-effective solutions may not scale well']
        ];

        for (const [type1, type2, description] of tradeoffPairs) {
            const p1 = perspectives.find(p => p.type === type1);
            const p2 = perspectives.find(p => p.type === type2);

            if (p1 && p2) {
                const scoreDiff = Math.abs(p1.score - p2.score);
                if (scoreDiff > 0.2) {
                    tradeoffs.push({
                        perspective1: type1,
                        perspective2: type2,
                        description,
                        recommendation: this.generateTradeoffRecommendation(p1, p2),
                        severity: scoreDiff > 0.4 ? 'significant' : scoreDiff > 0.3 ? 'moderate' : 'minor'
                    });
                }
            }
        }

        return tradeoffs;
    }

    private identifyConflicts(perspectives: Perspective[]): string[] {
        const conflicts: string[] = [];

        perspectives.forEach(p1 => {
            perspectives.forEach(p2 => {
                if (p1.type === p2.type) return;

                // Check if recommendations conflict
                p1.recommendations.forEach(rec1 => {
                    p2.recommendations.forEach(rec2 => {
                        if (this.areConflicting(rec1, rec2)) {
                            conflicts.push(
                                `${p1.name} recommends "${rec1}" but ` +
                                `${p2.name} recommends "${rec2}"`
                            );
                        }
                    });
                });
            });
        });

        return [...new Set(conflicts)]; // Remove duplicates
    }

    private findConsensus(perspectives: Perspective[]): string[] {
        const consensus: string[] = [];
        const recommendationCounts = new Map<string, Set<string>>();

        perspectives.forEach(p => {
            p.recommendations.forEach(rec => {
                const normalized = rec.toLowerCase();
                const existing = recommendationCounts.get(normalized) || new Set();
                existing.add(p.name);
                recommendationCounts.set(normalized, existing);
            });
        });

        recommendationCounts.forEach((perspectives, rec) => {
            if (perspectives.size >= 3) {
                consensus.push(rec);
            }
        });

        return consensus;
    }

    private calculateOverallScore(perspectives: Perspective[], context: AnalysisContext): number {
        let totalScore = 0;
        let totalWeight = 0;

        perspectives.forEach(p => {
            const weight = this.getPerspectiveWeight(p.type, context);
            totalScore += p.score * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    private calculateConfidence(perspectives: Perspective[]): number {
        // Higher confidence when perspectives agree
        const scores = perspectives.map(p => p.score);
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        // Lower standard deviation = higher confidence
        return Math.max(0, 1 - stdDev);
    }

    private calculatePriority(type: PerspectiveType, context: AnalysisContext): 'low' | 'medium' | 'high' | 'critical' {
        if (context.priorities?.includes(type)) {
            return 'high';
        }

        const criticalPerspectives: PerspectiveType[] = ['security', 'user'];
        if (criticalPerspectives.includes(type)) {
            return 'critical';
        }

        const highPerspectives: PerspectiveType[] = ['performance', 'maintainability'];
        if (highPerspectives.includes(type)) {
            return 'high';
        }

        return 'medium';
    }

    private getPerspectiveWeight(type: PerspectiveType, context: AnalysisContext): number {
        const priority = this.calculatePriority(type, context);
        const weights = {
            critical: 1.5,
            high: 1.2,
            medium: 1.0,
            low: 0.8
        };
        return weights[priority];
    }

    private generateTradeoffRecommendation(p1: Perspective, p2: Perspective): string {
        if (p1.score > p2.score + 0.3) {
            return `Prioritize ${p1.name} while maintaining minimum acceptable ${p2.name} standards`;
        } else if (p2.score > p1.score + 0.3) {
            return `Prioritize ${p2.name} while maintaining minimum acceptable ${p1.name} standards`;
        } else {
            return `Find balanced approach between ${p1.name} and ${p2.name}`;
        }
    }

    private areConflicting(rec1: string, rec2: string): boolean {
        // Simplified conflict detection
        const conflictPairs = [
            ['optimize', 'simplify'],
            ['add', 'remove'],
            ['increase', 'decrease'],
            ['more', 'less']
        ];

        const rec1Lower = rec1.toLowerCase();
        const rec2Lower = rec2.toLowerCase();

        return conflictPairs.some(([word1, word2]) =>
            (rec1Lower.includes(word1) && rec2Lower.includes(word2)) ||
            (rec1Lower.includes(word2) && rec2Lower.includes(word1))
        );
    }

    private generateComparisonReasoning(
        scores: Map<PerspectiveType, { sol1: number; sol2: number }>,
        sol1Avg: number,
        sol2Avg: number
    ): string {
        const differences: string[] = [];

        scores.forEach((score, type) => {
            const diff = Math.abs(score.sol1 - score.sol2);
            if (diff > 0.2) {
                const better = score.sol1 > score.sol2 ? 'Solution 1' : 'Solution 2';
                differences.push(`${better} scores higher on ${type}`);
            }
        });

        return differences.join('; ') || 'Solutions are very similar across all perspectives';
    }

    private async generateRecommendation(
        winner: 'solution1' | 'solution2' | 'tie',
        scores: Map<PerspectiveType, { sol1: number; sol2: number }>,
        context: AnalysisContext
    ): Promise<string> {
        if (winner === 'tie') {
            return 'Both solutions are equally viable. Choose based on team preference and context.';
        }

        const winnerNum = winner === 'solution1' ? 1 : 2;
        return `Recommend Solution ${winnerNum} as it better satisfies the key perspectives for this task.`;
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert analyst providing objective, insightful perspectives.',
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

    private parsePerspectiveResponse(response: string): {
        insights: string[];
        concerns: string[];
        recommendations: string[];
        score: number;
    } {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;

            const parsed = JSON.parse(jsonStr);

            return {
                insights: Array.isArray(parsed.insights) ? parsed.insights : [],
                concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                score: Math.max(0, Math.min(1, parsed.score || 0.5))
            };
        } catch (error) {
            return {
                insights: ['Analysis temporarily unavailable'],
                concerns: [],
                recommendations: [],
                score: 0.5
            };
        }
    }
}

// Export singleton
export const multiPerspectiveAnalyzer = MultiPerspectiveAnalyzer.getInstance();
