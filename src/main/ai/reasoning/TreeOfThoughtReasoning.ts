/**
 * Tree-of-Thought Reasoning Engine
 * 
 * Advanced multi-path reasoning that explores multiple solution approaches
 * in parallel, evaluates them, and synthesizes the best solution
 */

import { getMemoryEngine } from '../memory';
import { ModelManager } from '../ModelManager';

export interface ThoughtNode {
    id: string;
    content: string;
    depth: number;
    score: number;
    confidence: number;
    children: ThoughtNode[];
    parent?: ThoughtNode;
    metadata: {
        approach: string;
        reasoning: string;
        alternatives: string[];
        pros: string[];
        cons: string[];
        assumptions: string[];
    };
    evaluated: boolean;
    pruned: boolean;
}

export interface ThoughtPath {
    nodes: ThoughtNode[];
    totalScore: number;
    confidence: number;
    completeness: number;
}

export interface ReasoningResult {
    finalSolution: string;
    exploredPaths: ThoughtPath[];
    bestPath: ThoughtPath;
    insights: string[];
    confidence: number;
    reasoningSteps: number;
    alternatives: Array<{
        solution: string;
        score: number;
        whyNotChosen: string;
    }>;
}

export interface Problem {
    description: string;
    constraints: string[];
    goals: string[];
    context?: Record<string, any>;
}

export class TreeOfThoughtReasoning {
    private static instance: TreeOfThoughtReasoning;
    private memory = getMemoryEngine();
    private modelManager: ModelManager;

    // Configuration
    private readonly MAX_DEPTH = 4;
    private readonly BREADTH_FACTOR = 3; // Generate N thoughts per level
    private readonly MIN_SCORE_THRESHOLD = 0.3;
    private readonly TOP_K_PATHS = 5;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): TreeOfThoughtReasoning {
        if (!TreeOfThoughtReasoning.instance) {
            TreeOfThoughtReasoning.instance = new TreeOfThoughtReasoning();
        }
        return TreeOfThoughtReasoning.instance;
    }

    /**
     * Solve a problem using tree-of-thought reasoning
     */
    async solve(problem: Problem): Promise<ReasoningResult> {
        console.log('🌳 Starting tree-of-thought reasoning...');

        // Generate initial thought nodes
        const rootNodes = await this.generateInitialThoughts(problem);

        // Explore thought tree
        const exploredPaths: ThoughtPath[] = [];

        for (const root of rootNodes) {
            const paths = await this.exploreBranch(root, problem, 0);
            exploredPaths.push(...paths);
        }

        // Evaluate and rank paths
        const rankedPaths = exploredPaths
            .sort((a, b) => this.calculatePathScore(b) - this.calculatePathScore(a))
            .slice(0, this.TOP_K_PATHS);

        // Synthesize final solution from best paths
        const finalSolution = await this.synthesizeSolution(rankedPaths, problem);

        // Extract insights
        const insights = this.extractInsights(rankedPaths);

        // Generate alternatives
        const alternatives = rankedPaths.slice(1, 4).map(path => ({
            solution: this.pathToSolution(path),
            score: this.calculatePathScore(path),
            whyNotChosen: this.explainWhyNotChosen(path, rankedPaths[0])
        }));

        const result: ReasoningResult = {
            finalSolution,
            exploredPaths: rankedPaths,
            bestPath: rankedPaths[0],
            insights,
            confidence: rankedPaths[0]?.totalScore || 0,
            reasoningSteps: exploredPaths.reduce((sum, p) => sum + p.nodes.length, 0),
            alternatives
        };

        console.log(`✅ Tree-of-thought reasoning complete:`, {
            pathsExplored: exploredPaths.length,
            bestScore: rankedPaths[0]?.totalScore.toFixed(2),
            insights: insights.length
        });

        return result;
    }

    /**
     * Generate initial thought branches
     */
    private async generateInitialThoughts(problem: Problem): Promise<ThoughtNode[]> {
        const prompt = this.buildInitialThoughtPrompt(problem);
        const response = await this.callModel(prompt);

        const thoughts = this.parseThoughts(response);

        return thoughts.map((thought, index) => ({
            id: `root-${index}`,
            content: thought.content,
            depth: 0,
            score: 0,
            confidence: 0,
            children: [],
            metadata: {
                approach: thought.approach,
                reasoning: thought.reasoning,
                alternatives: [],
                pros: thought.pros || [],
                cons: thought.cons || [],
                assumptions: thought.assumptions || []
            },
            evaluated: false,
            pruned: false
        }));
    }

    /**
     * Explore a thought branch recursively
     */
    private async exploreBranch(
        node: ThoughtNode,
        problem: Problem,
        depth: number
    ): Promise<ThoughtPath[]> {
        // Evaluate current node
        if (!node.evaluated) {
            await this.evaluateNode(node, problem);
        }

        // Prune low-quality branches
        if (node.score < this.MIN_SCORE_THRESHOLD || depth >= this.MAX_DEPTH) {
            if (node.score < this.MIN_SCORE_THRESHOLD) {
                node.pruned = true;
            }
            return [this.nodeToPath(node)];
        }

        // Generate child thoughts
        const children = await this.generateChildThoughts(node, problem);
        node.children = children;

        // Recursively explore children
        const allPaths: ThoughtPath[] = [];

        for (const child of children) {
            const childPaths = await this.exploreBranch(child, problem, depth + 1);
            allPaths.push(...childPaths);
        }

        return allPaths;
    }

    /**
     * Generate child thought nodes
     */
    private async generateChildThoughts(
        parent: ThoughtNode,
        problem: Problem
    ): Promise<ThoughtNode[]> {
        const prompt = this.buildChildThoughtPrompt(parent, problem);
        const response = await this.callModel(prompt);

        const thoughts = this.parseThoughts(response);

        return thoughts.slice(0, this.BREADTH_FACTOR).map((thought, index) => ({
            id: `${parent.id}-${index}`,
            content: thought.content,
            depth: parent.depth + 1,
            score: 0,
            confidence: 0,
            children: [],
            parent,
            metadata: {
                approach: thought.approach,
                reasoning: thought.reasoning,
                alternatives: [],
                pros: thought.pros || [],
                cons: thought.cons || [],
                assumptions: thought.assumptions || []
            },
            evaluated: false,
            pruned: false
        }));
    }

    /**
     * Evaluate a thought node
     */
    private async evaluateNode(node: ThoughtNode, problem: Problem): Promise<void> {
        const prompt = this.buildEvaluationPrompt(node, problem);
        const response = await this.callModel(prompt);

        const evaluation = this.parseEvaluation(response);

        node.score = evaluation.score;
        node.confidence = evaluation.confidence;
        node.evaluated = true;

        console.log(`📊 Evaluated node ${node.id}: score=${node.score.toFixed(2)}, depth=${node.depth}`);
    }

    /**
     * Synthesize final solution from multiple paths
     */
    private async synthesizeSolution(
        paths: ThoughtPath[],
        problem: Problem
    ): Promise<string> {
        if (paths.length === 0) {
            return 'No viable solution found';
        }

        if (paths.length === 1) {
            return this.pathToSolution(paths[0]);
        }

        // Combine insights from multiple paths
        const prompt = this.buildSynthesisPrompt(paths, problem);
        const response = await this.callModel(prompt);

        return response;
    }

    /**
     * Extract insights from explored paths
     */
    private extractInsights(paths: ThoughtPath[]): string[] {
        const insights: string[] = [];

        // Common approaches across high-scoring paths
        const approaches = new Map<string, number>();
        paths.slice(0, 3).forEach(path => {
            path.nodes.forEach(node => {
                const approach = node.metadata.approach;
                approaches.set(approach, (approaches.get(approach) || 0) + 1);
            });
        });

        const commonApproaches = Array.from(approaches.entries())
            .filter(([_, count]) => count >= 2)
            .map(([approach, _]) => approach);

        if (commonApproaches.length > 0) {
            insights.push(`Common successful approaches: ${commonApproaches.join(', ')}`);
        }

        // Key assumptions
        const allAssumptions = new Set<string>();
        paths[0]?.nodes.forEach(node => {
            node.metadata.assumptions.forEach(a => allAssumptions.add(a));
        });

        if (allAssumptions.size > 0) {
            insights.push(`Key assumptions: ${Array.from(allAssumptions).join('; ')}`);
        }

        // Trade-offs
        const pros = new Set<string>();
        const cons = new Set<string>();
        paths[0]?.nodes.forEach(node => {
            node.metadata.pros.forEach(p => pros.add(p));
            node.metadata.cons.forEach(c => cons.add(c));
        });

        if (cons.size > 0) {
            insights.push(`Trade-offs: ${Array.from(cons).join('; ')}`);
        }

        return insights;
    }

    // Helper methods

    private calculatePathScore(path: ThoughtPath): number {
        if (path.nodes.length === 0) return 0;

        // Weighted score: deeper nodes contribute more
        const weightedScore = path.nodes.reduce((sum, node, index) => {
            const depthWeight = 1 + (index * 0.1);
            return sum + (node.score * node.confidence * depthWeight);
        }, 0);

        return weightedScore / path.nodes.length;
    }

    private nodeToPath(node: ThoughtNode): ThoughtPath {
        const nodes: ThoughtNode[] = [];
        let current: ThoughtNode | undefined = node;

        while (current) {
            nodes.unshift(current);
            current = current.parent;
        }

        return {
            nodes,
            totalScore: this.calculatePathScore({ nodes, totalScore: 0, confidence: 0, completeness: 0 }),
            confidence: nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length,
            completeness: node.depth / this.MAX_DEPTH
        };
    }

    private pathToSolution(path: ThoughtPath): string {
        return path.nodes.map(n => n.content).join('\n\n');
    }

    private explainWhyNotChosen(path: ThoughtPath, bestPath: ThoughtPath): string {
        const scoreDiff = this.calculatePathScore(bestPath) - this.calculatePathScore(path);

        if (scoreDiff > 0.3) {
            return 'Significantly lower overall score';
        } else if (path.confidence < bestPath.confidence) {
            return 'Lower confidence in approach';
        } else if (path.completeness < bestPath.completeness) {
            return 'Less complete solution';
        } else {
            return 'Slightly lower evaluation across multiple factors';
        }
    }

    // Prompt building

    private buildInitialThoughtPrompt(problem: Problem): string {
        return `You are an expert problem solver. Generate ${this.BREADTH_FACTOR} distinct approaches to solve the following problem.

## Problem
${problem.description}

## Constraints
${problem.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Goals
${problem.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

For each approach, provide:
1. A clear description of the approach
2. The core reasoning behind it
3. Key assumptions
4. Pros and cons

Format your response as a JSON array of thought objects:
\`\`\`json
[
  {
    "content": "Approach description",
    "approach": "Brief approach name",
    "reasoning": "Why this approach makes sense",
    "assumptions": ["assumption1", "assumption2"],
    "pros": ["pro1", "pro2"],
    "cons": ["con1", "con2"]
  }
]
\`\`\``;
    }

    private buildChildThoughtPrompt(parent: ThoughtNode, problem: Problem): string {
        return `Continue exploring the following approach to solving the problem.

## Original Problem
${problem.description}

## Current Approach
${parent.content}

## Current Reasoning
${parent.metadata.reasoning}

Generate ${this.BREADTH_FACTOR} next steps or refinements to this approach. Each should:
1. Build on the current approach
2. Address potential issues
3. Add more detail or explore a specific aspect

Format as JSON array like before.`;
    }

    private buildEvaluationPrompt(node: ThoughtNode, problem: Problem): string {
        return `Evaluate how well this thought addresses the problem.

## Problem
${problem.description}

## Thought to Evaluate
${node.content}

## Approach
${node.metadata.approach}

## Reasoning
${node.metadata.reasoning}

Rate this thought on:
1. Feasibility (0-1): Can this actually be implemented?
2. Effectiveness (0-1): Will it solve the problem well?
3. Completeness (0-1): Does it address all constraints and goals?

Respond with JSON:
\`\`\`json
{
  "score": 0.85,
  "confidence": 0.9,
  "reasoning": "Brief explanation"
}
\`\`\``;
    }

    private buildSynthesisPrompt(paths: ThoughtPath[], problem: Problem): string {
        const pathDescriptions = paths.map((path, index) =>
            `### Path ${index + 1} (Score: ${this.calculatePathScore(path).toFixed(2)})\n${this.pathToSolution(path)}`
        ).join('\n\n');

        return `Synthesize a final, optimal solution by combining the best elements from these approaches.

## Original Problem
${problem.description}

## Explored Approaches
${pathDescriptions}

Provide a cohesive solution that:
1. Incorporates the strongest elements from each approach
2. Addresses all constraints and goals
3. Resolves any contradictions between approaches
4. Provides clear, actionable steps`;
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert reasoning assistant. Provide clear, structured responses.',
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

    // Parsing helpers

    private parseThoughts(response: string): Array<{
        content: string;
        approach: string;
        reasoning: string;
        assumptions?: string[];
        pros?: string[];
        cons?: string[];
    }> {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;

            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            console.error('Error parsing thoughts:', error);
            return [{
                content: response,
                approach: 'default',
                reasoning: 'Fallback parsing',
                assumptions: [],
                pros: [],
                cons: []
            }];
        }
    }

    private parseEvaluation(response: string): { score: number; confidence: number; reasoning: string } {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;

            const parsed = JSON.parse(jsonStr);
            return {
                score: Math.max(0, Math.min(1, parsed.score || 0.5)),
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
                reasoning: parsed.reasoning || ''
            };
        } catch (error) {
            return { score: 0.5, confidence: 0.5, reasoning: 'Fallback evaluation' };
        }
    }
}

// Export singleton
export const treeOfThoughtReasoning = TreeOfThoughtReasoning.getInstance();
