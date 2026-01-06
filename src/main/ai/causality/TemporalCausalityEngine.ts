/**
 * Temporal Causality Engine
 * 
 * Traces cause and effect chains through code execution,
 * understanding how changes propagate and predicting consequences.
 */

import { EventEmitter } from 'events';

export interface CausalityAnalysis {
    id: string;
    code: string;
    causalChains: CausalChain[];
    dependencies: DependencyGraph;
    rippleEffects: RippleEffect[];
    temporalView: TemporalView;
    predictions: CausalPrediction[];
    timestamp: Date;
}

export interface CausalChain {
    id: string;
    name: string;
    events: CausalEvent[];
    strength: number;
    type: 'data' | 'control' | 'side-effect' | 'temporal';
}

export interface CausalEvent {
    id: string;
    action: string;
    location: { line: number; column?: number };
    causes: string[];
    effects: string[];
    timing: 'immediate' | 'deferred' | 'conditional';
    probability: number;
}

export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
}

export interface DependencyNode {
    id: string;
    name: string;
    type: 'variable' | 'function' | 'class' | 'module' | 'external';
    impact: number;
}

export interface DependencyEdge {
    source: string;
    target: string;
    type: 'reads' | 'writes' | 'calls' | 'creates' | 'destroys';
    weight: number;
}

export interface RippleEffect {
    id: string;
    trigger: string;
    affectedAreas: string[];
    severity: 'minimal' | 'moderate' | 'significant' | 'critical';
    propagationPath: string[];
    estimatedImpact: number;
}

export interface TemporalView {
    phases: ExecutionPhase[];
    criticalMoments: CriticalMoment[];
    timeline: TimelineEvent[];
}

export interface ExecutionPhase {
    id: string;
    name: string;
    order: number;
    duration: 'instant' | 'short' | 'long' | 'variable';
    events: string[];
}

export interface CriticalMoment {
    id: string;
    description: string;
    riskLevel: number;
    mitigation?: string;
}

export interface TimelineEvent {
    timestamp: number;
    event: string;
    phase: string;
    causalLinks: string[];
}

export interface CausalPrediction {
    id: string;
    scenario: string;
    probability: number;
    consequences: string[];
    recommendations: string[];
}

export interface ChangeImpact {
    changeId: string;
    description: string;
    affectedNodes: string[];
    ripples: RippleEffect[];
    safetyScore: number;
    recommendations: string[];
}

export class TemporalCausalityEngine extends EventEmitter {
    private static instance: TemporalCausalityEngine;
    private analyses: Map<string, CausalityAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TemporalCausalityEngine {
        if (!TemporalCausalityEngine.instance) {
            TemporalCausalityEngine.instance = new TemporalCausalityEngine();
        }
        return TemporalCausalityEngine.instance;
    }

    // ========================================================================
    // CAUSALITY ANALYSIS
    // ========================================================================

    async analyze(code: string): Promise<CausalityAnalysis> {
        this.emit('analysis:started', { code });

        const dependencies = this.buildDependencyGraph(code);
        const causalChains = this.extractCausalChains(code, dependencies);
        const rippleEffects = this.analyzeRippleEffects(dependencies);
        const temporalView = this.buildTemporalView(code, causalChains);
        const predictions = this.generatePredictions(causalChains, rippleEffects);

        const analysis: CausalityAnalysis = {
            id: `causal_${Date.now()}`,
            code,
            causalChains,
            dependencies,
            rippleEffects,
            temporalView,
            predictions,
            timestamp: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:completed', analysis);
        return analysis;
    }

    private buildDependencyGraph(code: string): DependencyGraph {
        const nodes: DependencyNode[] = [];
        const edges: DependencyEdge[] = [];
        const lines = code.split('\n');

        // Extract variables
        const varMatches = code.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g);
        for (const match of varMatches) {
            nodes.push({
                id: `var_${match[1]}`,
                name: match[1],
                type: 'variable',
                impact: 0.3,
            });
        }

        // Extract functions
        const funcMatches = code.matchAll(/(?:function|async function)\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
        for (const match of funcMatches) {
            const name = match[1] || match[2];
            if (name) {
                nodes.push({
                    id: `func_${name}`,
                    name,
                    type: 'function',
                    impact: 0.6,
                });
            }
        }

        // Extract classes
        const classMatches = code.matchAll(/class\s+(\w+)/g);
        for (const match of classMatches) {
            nodes.push({
                id: `class_${match[1]}`,
                name: match[1],
                type: 'class',
                impact: 0.8,
            });
        }

        // Build edges based on references
        for (const node of nodes) {
            const regex = new RegExp(`\\b${node.name}\\b`, 'g');
            const matches = code.matchAll(regex);
            let count = 0;
            for (const _ of matches) {
                count++;
            }

            // More references = higher impact
            node.impact = Math.min(1, node.impact + count * 0.05);
        }

        // Function calls create edges
        for (const funcNode of nodes.filter(n => n.type === 'function')) {
            const callRegex = new RegExp(`\\b${funcNode.name}\\s*\\(`, 'g');
            for (const varNode of nodes.filter(n => n.type === 'variable')) {
                if (code.includes(`${funcNode.name}(`) && code.includes(varNode.name)) {
                    edges.push({
                        source: funcNode.id,
                        target: varNode.id,
                        type: 'reads',
                        weight: 0.5,
                    });
                }
            }
        }

        return { nodes, edges };
    }

    private extractCausalChains(code: string, deps: DependencyGraph): CausalChain[] {
        const chains: CausalChain[] = [];
        const lines = code.split('\n');

        // Data flow chain
        const dataChain: CausalChain = {
            id: 'chain_data',
            name: 'Data Flow',
            events: [],
            strength: 0.8,
            type: 'data',
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('=') && !line.includes('==') && !line.includes('===')) {
                dataChain.events.push({
                    id: `event_${i}`,
                    action: 'Assignment',
                    location: { line: i + 1 },
                    causes: [],
                    effects: ['State change'],
                    timing: 'immediate',
                    probability: 1,
                });
            }
        }

        if (dataChain.events.length > 0) {
            chains.push(dataChain);
        }

        // Control flow chain
        const controlChain: CausalChain = {
            id: 'chain_control',
            name: 'Control Flow',
            events: [],
            strength: 0.9,
            type: 'control',
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/\b(if|else|for|while|switch)\b/.test(line)) {
                controlChain.events.push({
                    id: `control_${i}`,
                    action: 'Branch',
                    location: { line: i + 1 },
                    causes: ['Condition evaluation'],
                    effects: ['Execution path selection'],
                    timing: 'immediate',
                    probability: 0.5,
                });
            }
        }

        if (controlChain.events.length > 0) {
            chains.push(controlChain);
        }

        // Side effect chain
        const sideEffectChain: CausalChain = {
            id: 'chain_side',
            name: 'Side Effects',
            events: [],
            strength: 0.7,
            type: 'side-effect',
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/console\.|fetch\(|fs\.|http\./.test(line)) {
                sideEffectChain.events.push({
                    id: `side_${i}`,
                    action: 'External interaction',
                    location: { line: i + 1 },
                    causes: ['Code execution'],
                    effects: ['External state modification'],
                    timing: 'deferred',
                    probability: 0.9,
                });
            }
        }

        if (sideEffectChain.events.length > 0) {
            chains.push(sideEffectChain);
        }

        return chains;
    }

    private analyzeRippleEffects(deps: DependencyGraph): RippleEffect[] {
        const effects: RippleEffect[] = [];

        // High impact nodes cause ripples
        const highImpactNodes = deps.nodes.filter(n => n.impact > 0.6);

        for (const node of highImpactNodes) {
            const affectedEdges = deps.edges.filter(e => e.source === node.id || e.target === node.id);
            const affectedNodes = affectedEdges.map(e => e.source === node.id ? e.target : e.source);

            effects.push({
                id: `ripple_${node.id}`,
                trigger: `Changes to ${node.name}`,
                affectedAreas: affectedNodes,
                severity: node.impact > 0.8 ? 'critical' : 'significant',
                propagationPath: [node.id, ...affectedNodes.slice(0, 3)],
                estimatedImpact: node.impact,
            });
        }

        return effects;
    }

    private buildTemporalView(code: string, chains: CausalChain[]): TemporalView {
        const phases: ExecutionPhase[] = [
            { id: 'init', name: 'Initialization', order: 1, duration: 'instant', events: [] },
            { id: 'exec', name: 'Execution', order: 2, duration: 'variable', events: [] },
            { id: 'cleanup', name: 'Cleanup', order: 3, duration: 'short', events: [] },
        ];

        // Assign events to phases
        for (const chain of chains) {
            for (const event of chain.events) {
                if (event.location.line <= 5) {
                    phases[0].events.push(event.id);
                } else {
                    phases[1].events.push(event.id);
                }
            }
        }

        // Identify critical moments
        const criticalMoments: CriticalMoment[] = [];

        if (code.includes('try')) {
            criticalMoments.push({
                id: 'critical_error',
                description: 'Error handling boundary',
                riskLevel: 0.4,
                mitigation: 'Ensure comprehensive error handling',
            });
        }

        if (code.includes('async')) {
            criticalMoments.push({
                id: 'critical_async',
                description: 'Asynchronous operation',
                riskLevel: 0.5,
                mitigation: 'Handle promise rejections and timeouts',
            });
        }

        // Build timeline
        const timeline: TimelineEvent[] = [];
        let order = 0;
        for (const phase of phases) {
            for (const eventId of phase.events) {
                timeline.push({
                    timestamp: order++,
                    event: eventId,
                    phase: phase.id,
                    causalLinks: [],
                });
            }
        }

        return { phases, criticalMoments, timeline };
    }

    private generatePredictions(chains: CausalChain[], ripples: RippleEffect[]): CausalPrediction[] {
        const predictions: CausalPrediction[] = [];

        // Predict based on chain strength
        const weakChains = chains.filter(c => c.strength < 0.5);
        if (weakChains.length > 0) {
            predictions.push({
                id: `pred_weak_${Date.now()}`,
                scenario: 'Weak causal connections detected',
                probability: 0.6,
                consequences: ['Potential unexpected behavior', 'Hard to trace bugs'],
                recommendations: ['Strengthen type system', 'Add explicit dependencies'],
            });
        }

        // Predict based on ripple effects
        const criticalRipples = ripples.filter(r => r.severity === 'critical');
        if (criticalRipples.length > 0) {
            predictions.push({
                id: `pred_ripple_${Date.now()}`,
                scenario: 'High-impact changes possible',
                probability: 0.5,
                consequences: ['Changes may cascade widely', 'Testing scope increases'],
                recommendations: ['Isolate high-impact components', 'Add regression tests'],
            });
        }

        // General prediction
        predictions.push({
            id: `pred_general_${Date.now()}`,
            scenario: 'Standard execution path',
            probability: 0.8,
            consequences: ['Expected behavior'],
            recommendations: ['Monitor for edge cases'],
        });

        return predictions;
    }

    // ========================================================================
    // CHANGE IMPACT ANALYSIS
    // ========================================================================

    async predictChangeImpact(analysisId: string, changeDescription: string): Promise<ChangeImpact | undefined> {
        const analysis = this.analyses.get(analysisId);
        if (!analysis) return undefined;

        // Find affected nodes based on change description
        const affectedNodes: string[] = [];
        for (const node of analysis.dependencies.nodes) {
            if (changeDescription.toLowerCase().includes(node.name.toLowerCase())) {
                affectedNodes.push(node.id);
            }
        }

        // Find ripples from affected nodes
        const ripples = analysis.rippleEffects.filter(r =>
            affectedNodes.some(n => r.trigger.includes(n))
        );

        // Calculate safety score
        const maxRippleSeverity = ripples.length > 0
            ? Math.max(...ripples.map(r => r.estimatedImpact))
            : 0;
        const safetyScore = 1 - maxRippleSeverity;

        const recommendations: string[] = [];
        if (safetyScore < 0.5) {
            recommendations.push('Consider incremental refactoring');
            recommendations.push('Add comprehensive tests before change');
        }
        if (ripples.length > 0) {
            recommendations.push('Test affected areas: ' + ripples[0].affectedAreas.slice(0, 3).join(', '));
        }

        return {
            changeId: `change_${Date.now()}`,
            description: changeDescription,
            affectedNodes,
            ripples,
            safetyScore,
            recommendations,
        };
    }

    // ========================================================================
    // VISUALIZATION
    // ========================================================================

    exportToMermaid(analysisId: string): string | undefined {
        const analysis = this.analyses.get(analysisId);
        if (!analysis) return undefined;

        let diagram = 'graph TD\n';

        for (const node of analysis.dependencies.nodes) {
            const shape = node.type === 'function' ? '(' : '[';
            const closeShape = node.type === 'function' ? ')' : ']';
            diagram += `    ${node.id}${shape}"${node.name}"${closeShape}\n`;
        }

        for (const edge of analysis.dependencies.edges) {
            diagram += `    ${edge.source} -->|${edge.type}| ${edge.target}\n`;
        }

        return diagram;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAnalysis(id: string): CausalityAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): CausalityAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getStats(): {
        totalAnalyses: number;
        avgChainStrength: number;
        totalRippleEffects: number;
        criticalMoments: number;
    } {
        const analyses = Array.from(this.analyses.values());

        let totalChainStrength = 0;
        let chainCount = 0;
        let totalRipples = 0;
        let criticalMoments = 0;

        for (const a of analyses) {
            for (const chain of a.causalChains) {
                totalChainStrength += chain.strength;
                chainCount++;
            }
            totalRipples += a.rippleEffects.length;
            criticalMoments += a.temporalView.criticalMoments.length;
        }

        return {
            totalAnalyses: analyses.length,
            avgChainStrength: chainCount > 0 ? totalChainStrength / chainCount : 0,
            totalRippleEffects: totalRipples,
            criticalMoments,
        };
    }
}

export const temporalCausalityEngine = TemporalCausalityEngine.getInstance();
