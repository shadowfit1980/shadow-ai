/**
 * Causal Reasoning Engine
 * 
 * Understands cause-effect relationships in code and systems
 * Traces dependencies, predicts impacts, and explains behavior
 */

import { ModelManager } from '../ModelManager';
import { getMemoryEngine } from '../memory';

export interface CausalNode {
    id: string;
    element: string;
    type: 'code' | 'config' | 'data' | 'environment' | 'user-action';
    description: string;
}

export interface CausalEdge {
    from: string; // CausalNode id
    to: string;   // CausalNode id
    type: 'causes' | 'enables' | 'prevents' | 'influences' | 'requires';
    strength: number; // 0-1, how strong the causal relationship is
    confidence: number; // 0-1, how confident we are in this relationship
    explanation: string;
}

export interface CausalGraph {
    nodes: Map<string, CausalNode>;
    edges: CausalEdge[];
}

export interface CausalChain {
    chain: CausalNode[];
    edges: CausalEdge[];
    likelihood: number;
    explanation: string;
}

export interface ImpactAnalysis {
    rootCause: CausalNode;
    affectedElements: Array<{
        node: CausalNode;
        impact: 'high' | 'medium' | 'low';
        path: CausalChain;
        probability: number;
    }>;
    riskAssessment: {
        severity: 'critical' | 'high' | 'medium' | 'low';
        blast_radius: number; // How many elements could be affected
        cascading_failures: string[];
    };
}

export interface RootCauseAnalysis {
    problem: string;
    rootCauses: Array<{
        cause: CausalNode;
        confidence: number;
        evidence: string[];
        path: CausalChain;
    }>;
    contributingFactors: Array<{
        factor: CausalNode;
        contribution: number; // 0-1
    }>;
    recommendation: string;
}

export class CausalReasoningEngine {
    private static instance: CausalReasoningEngine;
    private modelManager: ModelManager;
    private memory = getMemoryEngine();

    // Store learned causal relationships
    private causalGraph: CausalGraph = {
        nodes: new Map(),
        edges: []
    };

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): CausalReasoningEngine {
        if (!CausalReasoningEngine.instance) {
            CausalReasoningEngine.instance = new CausalReasoningEngine();
        }
        return CausalReasoningEngine.instance;
    }

    /**
     * Analyze what would happen if we make a change
     */
    async predictImpact(change: string, context?: {
        codebase?: string[];
        system?: string;
    }): Promise<ImpactAnalysis> {
        console.log('🔍 Analyzing causal impact...');

        // Create node for the change
        const changeNode: CausalNode = {
            id: `change-${Date.now()}`,
            element: change,
            type: 'code',
            description: change
        };

        // Build causal graph for the system
        const graph = await this.buildCausalGraph(change, context);

        // Trace all effects
        const affectedElements = await this.traceEffects(changeNode, graph);

        // Assess risk
        const riskAssessment = this.assessRisk(affectedElements);

        return {
            rootCause: changeNode,
            affectedElements: affectedElements.map(({ node, path, probability }) => ({
                node,
                impact: this.calculateImpactLevel(probability, path.chain.length),
                path,
                probability
            })),
            riskAssessment
        };
    }

    /**
     * Find the root cause of a problem
     */
    async findRootCause(problem: string, context?: {
        symptoms?: string[];
        logs?: string[];
        recentChanges?: string[];
    }): Promise<RootCauseAnalysis> {
        console.log('🔎 Performing root cause analysis...');

        const prompt = this.buildRootCausePrompt(problem, context);
        const response = await this.callModel(prompt);
        const analysis = this.parseRootCauseResponse(response);

        // Build causal chains for each candidate
        const rootCauses = await Promise.all(
            analysis.candidates.map(async (candidate) => {
                const chain = await this.buildCausalChain(candidate, problem);
                return {
                    cause: {
                        id: candidate.id,
                        element: candidate.element,
                        type: candidate.type as any,
                        description: candidate.description
                    },
                    confidence: candidate.confidence,
                    evidence: candidate.evidence,
                    path: chain
                };
            })
        );

        return {
            problem,
            rootCauses: rootCauses.sort((a, b) => b.confidence - a.confidence),
            contributingFactors: analysis.contributingFactors.map(f => ({
                factor: {
                    id: f.id,
                    element: f.element,
                    type: f.type as any,
                    description: f.description
                },
                contribution: f.contribution
            })),
            recommendation: analysis.recommendation
        };
    }

    /**
     * Explain why something happened
     */
    async explainCausality(effect: string, context?: string): Promise<{
        effect: string;
        causes: Array<{
            cause: string;
            mechanism: string;
            confidence: number;
        }>;
        causalChain: string;
        counterfactual: string; // What would NOT have happened if cause didn't occur
    }> {
        console.log('💡 Explaining causality...');

        const prompt = `Explain the causal relationships for the following effect:

## Effect
${effect}

${context ? `## Context\n${context}\n` : ''}

Provide:
1. Primary causes (what directly caused this)
2. For each cause, explain the mechanism (HOW it caused the effect)
3. The complete causal chain
4. Counterfactual: what would NOT have happened without the primary cause

Response in JSON:
\`\`\`json
{
  "causes": [
    {
      "cause": "Description of cause",
      "mechanism": "How this cause leads to the effect",
      "confidence": 0.9
    }
  ],
  "causalChain": "Cause A → Mechanism B → Effect",
  "counterfactual": "If Cause A didn't happen, then Effect wouldn't occur because..."
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseCausalityResponse(response);

        return {
            effect,
            causes: parsed.causes,
            causalChain: parsed.causalChain,
            counterfactual: parsed.counterfactual
        };
    }

    /**
     * Detect circular dependencies and causality loops
     */
    async detectCausalLoops(graph?: CausalGraph): Promise<Array<{
        loop: CausalNode[];
        problem: string;
        severity: 'high' | 'medium' | 'low';
        suggestion: string;
    }>> {
        const targetGraph = graph || this.causalGraph;
        const loops: Array<{ loop: CausalNode[]; problem: string; severity: any; suggestion: string }> = [];

        // Use DFS to detect cycles
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const currentPath: CausalNode[] = [];

        const dfs = (nodeId: string): void => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            const node = targetGraph.nodes.get(nodeId);
            if (node) currentPath.push(node);

            // Find outgoing edges
            const outgoingEdges = targetGraph.edges.filter(e => e.from === nodeId);

            for (const edge of outgoingEdges) {
                if (!visited.has(edge.to)) {
                    dfs(edge.to);
                } else if (recursionStack.has(edge.to)) {
                    // Found a cycle
                    const loopStartIndex = currentPath.findIndex(n => n.id === edge.to);
                    const loop = currentPath.slice(loopStartIndex);

                    loops.push({
                        loop,
                        problem: this.describeCausalLoop(loop),
                        severity: this.assessLoopSeverity(loop, targetGraph),
                        suggestion: this.suggestLoopResolution(loop)
                    });
                }
            }

            if (node) currentPath.pop();
            recursionStack.delete(nodeId);
        };

        // Check all nodes
        targetGraph.nodes.forEach((_, nodeId) => {
            if (!visited.has(nodeId)) {
                dfs(nodeId);
            }
        });

        return loops;
    }

    // Private helper methods

    private async buildCausalGraph(change: string, context?: any): Promise<CausalGraph> {
        const graph: CausalGraph = {
            nodes: new Map(),
            edges: []
        };

        const prompt = this.buildGraphPrompt(change, context);
        const response = await this.callModel(prompt);
        const parsed = this.parseGraphResponse(response);

        // Add nodes
        parsed.nodes.forEach((node: any) => {
            graph.nodes.set(node.id, {
                id: node.id,
                element: node.element,
                type: node.type,
                description: node.description
            });
        });

        // Add edges
        graph.edges = parsed.edges.map((edge: any) => ({
            from: edge.from,
            to: edge.to,
            type: edge.type,
            strength: edge.strength || 0.8,
            confidence: edge.confidence || 0.7,
            explanation: edge.explanation || ''
        }));

        return graph;
    }

    private async traceEffects(
        startNode: CausalNode,
        graph: CausalGraph
    ): Promise<Array<{ node: CausalNode; path: CausalChain; probability: number }>> {
        const effects: Array<{ node: CausalNode; path: CausalChain; probability: number }> = [];
        const visited = new Set<string>();

        const traverse = (currentId: string, chain: CausalNode[], edges: CausalEdge[], probability: number) => {
            if (visited.has(currentId)) return;
            visited.add(currentId);

            const currentNode = graph.nodes.get(currentId);
            if (!currentNode) return;

            // Record this effect
            if (currentId !== startNode.id) {
                effects.push({
                    node: currentNode,
                    path: {
                        chain: [...chain],
                        edges: [...edges],
                        likelihood: probability,
                        explanation: this.explainChain(chain, edges)
                    },
                    probability
                });
            }

            // Find outgoing edges
            const outgoing = graph.edges.filter(e => e.from === currentId);

            for (const edge of outgoing) {
                const nextProb = probability * edge.strength * edge.confidence;
                traverse(
                    edge.to,
                    [...chain, currentNode],
                    [...edges, edge],
                    nextProb
                );
            }
        };

        traverse(startNode.id, [startNode], [], 1.0);

        return effects;
    }

    private async buildCausalChain(from: any, to: string): Promise<CausalChain> {
        // Simplified - would use actual graph traversal in production
        return {
            chain: [{
                id: from.id,
                element: from.element,
                type: from.type,
                description: from.description
            }],
            edges: [],
            likelihood: from.confidence,
            explanation: `${from.element} likely caused the issue`
        };
    }

    private assessRisk(affectedElements: any[]): {
        severity: 'critical' | 'high' | 'medium' | 'low';
        blast_radius: number;
        cascading_failures: string[];
    } {
        const highImpact = affectedElements.filter(e => e.probability > 0.7).length;
        const totalAffected = affectedElements.length;

        let severity: 'critical' | 'high' | 'medium' | 'low';
        if (highImpact > 10 || totalAffected > 50) {
            severity = 'critical';
        } else if (highImpact > 5 || totalAffected > 20) {
            severity = 'high';
        } else if (highImpact > 2 || totalAffected > 10) {
            severity = 'medium';
        } else {
            severity = 'low';
        }

        const cascading = affectedElements
            .filter(e => e.probability > 0.5)
            .map(e => e.node.element)
            .slice(0, 5);

        return {
            severity,
            blast_radius: totalAffected,
            cascading_failures: cascading
        };
    }

    private calculateImpactLevel(probability: number, chainLength: number): 'high' | 'medium' | 'low' {
        const score = probability / Math.log2(chainLength + 2);
        if (score > 0.7) return 'high';
        if (score > 0.4) return 'medium';
        return 'low';
    }

    private explainChain(chain: CausalNode[], edges: CausalEdge[]): string {
        const steps = chain.map((node, i) => {
            const edge = edges[i];
            if (edge) {
                return `${node.element} ${edge.type} ${chain[i + 1]?.element}`;
            }
            return node.element;
        });
        return steps.join(' → ');
    }

    private describeCausalLoop(loop: CausalNode[]): string {
        const elements = loop.map(n => n.element).join(' → ');
        return `Circular dependency detected: ${elements} → ${loop[0].element}`;
    }

    private assessLoopSeverity(loop: CausalNode[], graph: CausalGraph): 'high' | 'medium' | 'low' {
        // Longer loops and loops involving critical components are more severe
        if (loop.length > 5) return 'low';
        if (loop.some(n => n.type === 'environment' || n.type === 'data')) return 'high';
        return 'medium';
    }

    private suggestLoopResolution(loop: CausalNode[]): string {
        return `Break the cycle by refactoring one of: ${loop.map(n => n.element).join(', ')}`;
    }

    // Prompt builders

    private buildRootCausePrompt(problem: string, context?: any): string {
        return `Perform root cause analysis for the following problem:

## Problem
${problem}

${context?.symptoms ? `## Symptoms\n${context.symptoms.join('\n')}\n` : ''}
${context?.logs ? `## Error Logs\n${context.logs.slice(0, 3).join('\n')}\n` : ''}
${context?.recentChanges ? `## Recent Changes\n${context.recentChanges.join('\n')}\n` : ''}

Identify:
1. Most likely root causes (with evidence)
2. Contributing factors
3. Recommendation for fix

Response in JSON:
\`\`\`json
{
  "candidates": [
    {
      "id": "rc1",
      "element": "Database connection pool",
      "type": "config",
      "description": "Pool size too small",
      "confidence": 0.9,
      "evidence": ["Timeout errors", "Connection refused"]
    }
  ],
  "contributingFactors": [
    {
      "id": "cf1",
      "element": "Increased traffic",
      "type": "environment",
      "description": "Traffic spike",
      "contribution": 0.4
    }
  ],
  "recommendation": "Increase connection pool size to 50"
}
\`\`\``;
    }

    private buildGraphPrompt(change: string, context?: any): string {
        return `Build a causal graph showing what this change would affect:

## Change
${change}

${context?.system ? `## System\n${context.system}\n` : ''}

Create nodes for all affected components and edges showing causal relationships.

Response in JSON:
\`\`\`json
{
  "nodes": [
    {
      "id": "n1",
      "element": "API endpoint",
      "type": "code",
      "description": "User authentication endpoint"
    }
  ],
  "edges": [
    {
      "from": "n1",
      "to": "n2",
      "type": "causes",
      "strength": 0.9,
      "confidence": 0.8,
      "explanation": "Changes to auth affect session management"
    }
  ]
}
\`\`\``;
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert in causal reasoning and systems analysis.',
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

    // Response parsers

    private parseRootCauseResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                candidates: [],
                contributingFactors: [],
                recommendation: 'Unable to determine root cause'
            };
        }
    }

    private parseGraphResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { nodes: [], edges: [] };
        }
    }

    private parseCausalityResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                causes: [],
                causalChain: 'Unknown',
                counterfactual: 'Unable to determine'
            };
        }
    }
}

// Export singleton
export const causalReasoningEngine = CausalReasoningEngine.getInstance();
