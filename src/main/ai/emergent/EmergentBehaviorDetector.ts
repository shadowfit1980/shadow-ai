/**
 * Emergent Behavior Detector
 * 
 * Detects emergent behaviors that arise from the interaction of
 * simple code components, revealing complex system dynamics.
 */

import { EventEmitter } from 'events';

export interface EmergentAnalysis {
    id: string;
    code: string;
    components: Component[];
    interactions: Interaction[];
    emergentBehaviors: EmergentBehavior[];
    systemDynamics: SystemDynamics;
    predictions: BehaviorPrediction[];
    createdAt: Date;
}

export interface Component {
    id: string;
    name: string;
    type: 'function' | 'class' | 'module' | 'variable';
    complexity: number;
    connections: string[];
}

export interface Interaction {
    sourceId: string;
    targetId: string;
    type: 'call' | 'read' | 'write' | 'inherit' | 'compose';
    frequency: number;
    strength: number;
}

export interface EmergentBehavior {
    id: string;
    name: string;
    description: string;
    components: string[];
    emergenceLevel: 'weak' | 'moderate' | 'strong';
    implications: string[];
}

export interface SystemDynamics {
    coupling: number;
    cohesion: number;
    entropy: number;
    stability: number;
    adaptability: number;
}

export interface BehaviorPrediction {
    scenario: string;
    likelihood: number;
    impact: 'positive' | 'negative' | 'neutral';
    recommendation: string;
}

export class EmergentBehaviorDetector extends EventEmitter {
    private static instance: EmergentBehaviorDetector;
    private analyses: Map<string, EmergentAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): EmergentBehaviorDetector {
        if (!EmergentBehaviorDetector.instance) {
            EmergentBehaviorDetector.instance = new EmergentBehaviorDetector();
        }
        return EmergentBehaviorDetector.instance;
    }

    analyze(code: string): EmergentAnalysis {
        const components = this.extractComponents(code);
        const interactions = this.findInteractions(components, code);
        const emergentBehaviors = this.detectEmergentBehaviors(components, interactions);
        const systemDynamics = this.analyzeSystemDynamics(components, interactions);
        const predictions = this.generatePredictions(emergentBehaviors, systemDynamics);

        const analysis: EmergentAnalysis = {
            id: `emergent_${Date.now()}`,
            code,
            components,
            interactions,
            emergentBehaviors,
            systemDynamics,
            predictions,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:created', analysis);
        return analysis;
    }

    private extractComponents(code: string): Component[] {
        const components: Component[] = [];

        // Extract functions
        const funcMatches = code.matchAll(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()/g);
        for (const match of funcMatches) {
            const name = match[1] || match[2];
            if (name) {
                components.push({
                    id: `comp_func_${name}`,
                    name,
                    type: 'function',
                    complexity: 0.5,
                    connections: [],
                });
            }
        }

        // Extract classes
        const classMatches = code.matchAll(/class\s+(\w+)/g);
        for (const match of classMatches) {
            components.push({
                id: `comp_class_${match[1]}`,
                name: match[1],
                type: 'class',
                complexity: 0.7,
                connections: [],
            });
        }

        // Extract variables
        const varMatches = code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?!function|async|\()/g);
        for (const match of varMatches) {
            components.push({
                id: `comp_var_${match[1]}`,
                name: match[1],
                type: 'variable',
                complexity: 0.2,
                connections: [],
            });
        }

        return components;
    }

    private findInteractions(components: Component[], code: string): Interaction[] {
        const interactions: Interaction[] = [];

        for (const source of components) {
            for (const target of components) {
                if (source.id === target.id) continue;

                // Check if source references target
                const regex = new RegExp(`\\b${source.name}\\b.*\\b${target.name}\\b`);
                if (regex.test(code)) {
                    const type: Interaction['type'] =
                        source.type === 'function' && target.type === 'function' ? 'call' :
                            source.type === 'class' && target.type === 'class' ? 'inherit' : 'read';

                    interactions.push({
                        sourceId: source.id,
                        targetId: target.id,
                        type,
                        frequency: 1,
                        strength: 0.5,
                    });

                    source.connections.push(target.id);
                }
            }
        }

        return interactions;
    }

    private detectEmergentBehaviors(components: Component[], interactions: Interaction[]): EmergentBehavior[] {
        const behaviors: EmergentBehavior[] = [];

        // Detect circular dependencies (feedback loops)
        const hasCircular = this.detectCircularDependencies(components, interactions);
        if (hasCircular) {
            behaviors.push({
                id: 'emergent_feedback',
                name: 'Feedback Loop',
                description: 'Circular dependencies may create feedback loops',
                components: components.map(c => c.id),
                emergenceLevel: 'moderate',
                implications: ['May cause infinite loops', 'State changes propagate unexpectedly'],
            });
        }

        // Detect hub pattern (central component)
        const hubs = this.detectHubs(components, interactions);
        for (const hub of hubs) {
            behaviors.push({
                id: `emergent_hub_${hub.id}`,
                name: 'Hub Pattern',
                description: `${hub.name} acts as a hub connecting many components`,
                components: [hub.id, ...hub.connections],
                emergenceLevel: 'strong',
                implications: ['Single point of failure', 'High coupling risk'],
            });
        }

        // Detect cascade potential
        if (interactions.length > components.length * 0.5) {
            behaviors.push({
                id: 'emergent_cascade',
                name: 'Cascade Potential',
                description: 'High interconnectivity may cause cascading effects',
                components: components.map(c => c.id),
                emergenceLevel: 'weak',
                implications: ['Changes propagate widely', 'Testing complexity increases'],
            });
        }

        return behaviors;
    }

    private detectCircularDependencies(components: Component[], interactions: Interaction[]): boolean {
        for (const interaction of interactions) {
            const reverse = interactions.find(
                i => i.sourceId === interaction.targetId && i.targetId === interaction.sourceId
            );
            if (reverse) return true;
        }
        return false;
    }

    private detectHubs(components: Component[], interactions: Interaction[]): Component[] {
        const connectionCounts = new Map<string, number>();

        for (const interaction of interactions) {
            connectionCounts.set(
                interaction.sourceId,
                (connectionCounts.get(interaction.sourceId) || 0) + 1
            );
            connectionCounts.set(
                interaction.targetId,
                (connectionCounts.get(interaction.targetId) || 0) + 1
            );
        }

        const threshold = components.length * 0.4;
        return components.filter(c => (connectionCounts.get(c.id) || 0) >= threshold);
    }

    private analyzeSystemDynamics(components: Component[], interactions: Interaction[]): SystemDynamics {
        const n = components.length;
        const i = interactions.length;

        // Coupling: ratio of actual to possible connections
        const maxConnections = n * (n - 1);
        const coupling = maxConnections > 0 ? i / maxConnections : 0;

        // Cohesion: average connections per component
        const cohesion = n > 0 ? (i * 2) / n : 0;

        // Entropy: measure of disorder
        const entropy = Math.min(1, coupling + (1 - cohesion / n));

        // Stability: inverse of entropy
        const stability = 1 - entropy;

        // Adaptability: based on component variety
        const types = new Set(components.map(c => c.type));
        const adaptability = types.size / 4; // 4 possible types

        return { coupling, cohesion, entropy, stability, adaptability };
    }

    private generatePredictions(behaviors: EmergentBehavior[], dynamics: SystemDynamics): BehaviorPrediction[] {
        const predictions: BehaviorPrediction[] = [];

        if (dynamics.coupling > 0.5) {
            predictions.push({
                scenario: 'High Coupling Risk',
                likelihood: dynamics.coupling,
                impact: 'negative',
                recommendation: 'Consider introducing interfaces to reduce coupling',
            });
        }

        if (behaviors.some(b => b.name === 'Feedback Loop')) {
            predictions.push({
                scenario: 'Potential Infinite Loop',
                likelihood: 0.4,
                impact: 'negative',
                recommendation: 'Add termination conditions to circular paths',
            });
        }

        if (dynamics.stability > 0.7) {
            predictions.push({
                scenario: 'Stable System',
                likelihood: dynamics.stability,
                impact: 'positive',
                recommendation: 'Maintain current architecture',
            });
        }

        return predictions;
    }

    getAnalysis(id: string): EmergentAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): EmergentAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getStats(): { total: number; avgComponents: number; avgStability: number } {
        const analyses = Array.from(this.analyses.values());
        return {
            total: analyses.length,
            avgComponents: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.components.length, 0) / analyses.length
                : 0,
            avgStability: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.systemDynamics.stability, 0) / analyses.length
                : 0,
        };
    }
}

export const emergentBehaviorDetector = EmergentBehaviorDetector.getInstance();
