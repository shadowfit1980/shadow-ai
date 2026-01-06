/**
 * Problem Decomposition Engine
 * 
 * Breaks down complex problems into smaller, manageable subproblems
 * Solves them recursively and combines results
 */

import { ModelManager } from '../ModelManager';

export interface Problem {
    id: string;
    description: string;
    complexity: number; // 1-10
    domain: string;
    constraints?: string[];
    goals?: string[];
    context?: Record<string, any>;
}

export interface Subproblem extends Problem {
    parentId: string;
    dependencies: string[]; // IDs of other subproblems that must be solved first
    estimatedEffort: number; // hours
}

export interface Solution {
    problemId: string;
    approach: string;
    implementation: string;
    reasoning: string;
    confidence: number;
    verified: boolean;
}

export interface DecompositionResult {
    originalProblem: Problem;
    subproblems: Subproblem[];
    dependencyGraph: Map<string, string[]>;
    solvingOrder: string[]; // Topologically sorted order
    estimatedTotalEffort: number;
}

export interface RecursiveSolution {
    problem: Problem;
    directSolution?: Solution; // If problem was simple enough to solve directly
    subproblemSolutions?: Map<string, RecursiveSolution>; // If decomposed
    combinedSolution?: Solution; // Final combined solution
    decompositionDepth: number;
}

export class ProblemDecompositionEngine {
    private static instance: ProblemDecompositionEngine;
    private modelManager: ModelManager;

    private readonly COMPLEXITY_THRESHOLD = 6; // Problems above this get decomposed
    private readonly MAX_DEPTH = 4; // Maximum decomposition depth

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ProblemDecompositionEngine {
        if (!ProblemDecompositionEngine.instance) {
            ProblemDecompositionEngine.instance = new ProblemDecompositionEngine();
        }
        return ProblemDecompositionEngine.instance;
    }

    /**
     * Decompose a complex problem into subproblems
     */
    async decompose(problem: Problem): Promise<DecompositionResult> {
        console.log(`🔨 Decomposing problem: ${problem.description}`);

        if (problem.complexity <= this.COMPLEXITY_THRESHOLD) {
            console.log('Problem is simple enough - no decomposition needed');
            return {
                originalProblem: problem,
                subproblems: [],
                dependencyGraph: new Map(),
                solvingOrder: [],
                estimatedTotalEffort: problem.complexity
            };
        }

        const prompt = this.buildDecompositionPrompt(problem);
        const response = await this.callModel(prompt);
        const parsed = this.parseDecompositionResponse(response);

        // Create subproblem objects
        const subproblems: Subproblem[] = parsed.subproblems.map((sp: any, index: number) => ({
            id: `${problem.id}-sub${index + 1}`,
            description: sp.description,
            complexity: sp.complexity || Math.ceil(problem.complexity / parsed.subproblems.length),
            domain: problem.domain,
            constraints: sp.constraints || [],
            goals: sp.goals || [],
            parentId: problem.id,
            dependencies: sp.dependencies || [],
            estimatedEffort: sp.estimatedEffort || 0
        }));

        // Build dependency graph
        const dependencyGraph = new Map<string, string[]>();
        subproblems.forEach(sp => {
            dependencyGraph.set(sp.id, sp.dependencies);
        });

        // Compute solving order (topological sort)
        const solvingOrder = this.topologicalSort(subproblems, dependencyGraph);

        // Calculate total effort
        const estimatedTotalEffort = subproblems.reduce((sum, sp) => sum + sp.estimatedEffort, 0);

        console.log(`✅ Decomposed into ${subproblems.length} subproblems`);

        return {
            originalProblem: problem,
            subproblems,
            dependencyGraph,
            solvingOrder,
            estimatedTotalEffort
        };
    }

    /**
     * Solve a problem recursively by decomposing as needed
     */
    async solveRecursively(
        problem: Problem,
        depth: number = 0
    ): Promise<RecursiveSolution> {
        console.log(`${'  '.repeat(depth)}📋 Solving: ${problem.description} (complexity: ${problem.complexity})`);

        // Base case: problem is simple enough or max depth reached
        if (problem.complexity <= this.COMPLEXITY_THRESHOLD || depth >= this.MAX_DEPTH) {
            const solution = await this.solveDirect(problem);
            console.log(`${'  '.repeat(depth)}✅ Solved directly`);
            return {
                problem,
                directSolution: solution,
                decompositionDepth: depth
            };
        }

        // Recursive case: decompose and solve subproblems
        const decomposition = await this.decompose(problem);

        if (decomposition.subproblems.length === 0) {
            // Decomposition not possible, solve directly
            const solution = await this.solveDirect(problem);
            return {
                problem,
                directSolution: solution,
                decompositionDepth: depth
            };
        }

        console.log(`${'  '.repeat(depth)}🔀 Decomposed into ${decomposition.subproblems.length} subproblems`);

        // Solve subproblems in dependency order
        const subproblemSolutions = new Map<string, RecursiveSolution>();

        for (const subproblemId of decomposition.solvingOrder) {
            const subproblem = decomposition.subproblems.find(sp => sp.id === subproblemId);
            if (!subproblem) continue;

            const solution = await this.solveRecursively(subproblem, depth + 1);
            subproblemSolutions.set(subproblemId, solution);
        }

        // Combine solutions
        const combinedSolution = await this.combineSolutions(problem, subproblemSolutions);

        console.log(`${'  '.repeat(depth)}✨ Combined solutions`);

        return {
            problem,
            subproblemSolutions,
            combinedSolution,
            decompositionDepth: depth
        };
    }

    /**
     * Verify a solution solves the problem
     */
    async verifySolution(problem: Problem, solution: Solution): Promise<{
        isValid: boolean;
        issues: string[];
        suggestions: string[];
    }> {
        console.log('🔍 Verifying solution...');

        const prompt = `Verify if this solution solves the problem:

## Problem
${problem.description}

${problem.goals ? `## Goals\n${problem.goals.join('\n')}\n` : ''}
${problem.constraints ? `## Constraints\n${problem.constraints.join('\n')}\n` : ''}

## Proposed Solution
**Approach**: ${solution.approach}
**Implementation**: ${solution.implementation}
**Reasoning**: ${solution.reasoning}

Verify:
1. Does it achieve all goals?
2. Does it satisfy all constraints?
3. Are there any edge cases not handled?
4. Is the implementation complete?

Response in JSON:
\`\`\`json
{
  "isValid": true/false,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseVerificationResponse(response);

        return {
            isValid: parsed.isValid || false,
            issues: parsed.issues || [],
            suggestions: parsed.suggestions || []
        };
    }

    /**
     * Simplify a problem by removing non-essential constraints
     */
    async simplify(problem: Problem): Promise<Problem> {
        console.log('🎯 Simplifying problem...');

        const prompt = `Simplify this problem by identifying the core essence:

## Problem
${problem.description}

${problem.constraints ? `## Constraints\n${problem.constraints.join('\n')}\n` : ''}
${problem.goals ? `## Goals\n${problem.goals.join('\n')}\n` : ''}

Identify:
1. Essential constraints (must-have)
2. Optional constraints (nice-to-have)
3. Core goals vs extended goals

Provide a simplified version focusing on the essence.

Response in JSON:
\`\`\`json
{
  "simplifiedDescription": "Core problem",
  "essentialConstraints": ["constraint1"],
  "coreGoals": ["goal1"],
  "removedComplexity": ["What was removed"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseSimplificationResponse(response);

        return {
            id: `${problem.id}-simplified`,
            description: parsed.simplifiedDescription || problem.description,
            complexity: Math.max(1, problem.complexity - 2),
            domain: problem.domain,
            constraints: parsed.essentialConstraints,
            goals: parsed.coreGoals,
            context: {
                ...problem.context,
                simplifiedFrom: problem.id,
                removedComplexity: parsed.removedComplexity
            }
        };
    }

    // Private methods

    private async solveDirect(problem: Problem): Promise<Solution> {
        const prompt = `Solve this problem directly:

## Problem
${problem.description}

${problem.constraints ? `## Constraints\n${problem.constraints.join('\n')}\n` : ''}
${problem.goals ? `## Goals\n${problem.goals.join('\n')}\n` : ''}

Provide:
1. Overall approach
2. Implementation details
3. Reasoning for why this approach works
4. Confidence level (0-1)

Response in JSON:
\`\`\`json
{
  "approach": "High-level approach",
  "implementation": "Detailed implementation",
  "reasoning": "Why this works",
  "confidence": 0.9
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseSolutionResponse(response);

        return {
            problemId: problem.id,
            approach: parsed.approach || 'Not specified',
            implementation: parsed.implementation || 'Not specified',
            reasoning: parsed.reasoning || 'Not specified',
            confidence: parsed.confidence || 0.7,
            verified: false
        };
    }

    private async combineSolutions(
        problem: Problem,
        subproblemSolutions: Map<string, RecursiveSolution>
    ): Promise<Solution> {
        const solutions = Array.from(subproblemSolutions.values());

        const solutionDescriptions = solutions.map((rs, i) => {
            const sol = rs.directSolution || rs.combinedSolution;
            return `### Subproblem ${i + 1}: ${rs.problem.description}\n${sol?.implementation || 'No solution'}`;
        }).join('\n\n');

        const prompt = `Combine these subproblem solutions into a complete solution:

## Original Problem
${problem.description}

## Subproblem Solutions
${solutionDescriptions}

Provide:
1. How to integrate all subproblem solutions
2. Final implementation combining all parts
3. Reasoning for integration approach

Response in JSON:
\`\`\`json
{
  "approach": "Integration strategy",
  "implementation": "Complete solution",
  "reasoning": "Why this integration works",
  "confidence": 0.85
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseSolutionResponse(response);

        return {
            problemId: problem.id,
            approach: parsed.approach || 'Combined from subproblems',
            implementation: parsed.implementation || 'See subproblem solutions',
            reasoning: parsed.reasoning || 'Integrated subproblem solutions',
            confidence: parsed.confidence || 0.8,
            verified: false
        };
    }

    private topologicalSort(
        subproblems: Subproblem[],
        dependencyGraph: Map<string, string[]>
    ): string[] {
        const order: string[] = [];
        const visited = new Set<string>();
        const temp = new Set<string>();

        const visit = (nodeId: string): void => {
            if (temp.has(nodeId)) {
                throw new Error(`Circular dependency detected: ${nodeId}`);
            }
            if (visited.has(nodeId)) return;

            temp.add(nodeId);

            const deps = dependencyGraph.get(nodeId) || [];
            deps.forEach(dep => visit(dep));

            temp.delete(nodeId);
            visited.add(nodeId);
            order.push(nodeId);
        };

        subproblems.forEach(sp => {
            if (!visited.has(sp.id)) {
                visit(sp.id);
            }
        });

        return order;
    }

    // Prompt builders

    private buildDecompositionPrompt(problem: Problem): string {
        return `Decompose this complex problem into smaller, manageable subproblems:

## Problem
${problem.description}

**Complexity**: ${problem.complexity}/10
${problem.constraints ? `\n## Constraints\n${problem.constraints.join('\n')}\n` : ''}
${problem.goals ? `## Goals\n${problem.goals.join('\n')}\n` : ''}

Break this into 3-5 subproblems that:
1. Are simpler than the original (complexity 1-5 each)
2. Can be solved independently or with minimal dependencies
3. When combined, solve the original problem
4. Have clear interfaces between them

Response in JSON:
\`\`\`json
{
  "subproblems": [
    {
      "description": "Subproblem 1 description",
      "complexity": 3,
      "constraints": ["constraint1"],
      "goals": ["goal1"],
      "dependencies": [], 
      "estimatedEffort": 2
    }
  ]
}
\`\`\``;
    }

    // Response parsers

    private parseDecompositionResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { subproblems: [] };
        }
    }

    private parseSolutionResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                approach: 'Error parsing solution',
                implementation: '',
                reasoning: '',
                confidence: 0
            };
        }
    }

    private parseVerificationResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { isValid: false, issues: [], suggestions: [] };
        }
    }

    private parseSimplificationResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                simplifiedDescription: '',
                essentialConstraints: [],
                coreGoals: [],
                removedComplexity: []
            };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at problem decomposition and recursive problem solving.',
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
export const problemDecompositionEngine = ProblemDecompositionEngine.getInstance();
