/**
 * Astral Dependency Graph
 * 
 * Visualizes dependencies as constellations in the astral plane,
 * revealing hidden connections between modules.
 */

import { EventEmitter } from 'events';

export interface AstralGraph {
    id: string;
    nodes: AstralNode[];
    edges: AstralEdge[];
    constellation: string;
    brightness: number;
}

export interface AstralNode {
    id: string;
    name: string;
    magnitude: number;
    type: 'star' | 'planet' | 'moon';
}

export interface AstralEdge {
    from: string;
    to: string;
    lightYears: number;
}

export class AstralDependencyGraph extends EventEmitter {
    private static instance: AstralDependencyGraph;
    private graphs: Map<string, AstralGraph> = new Map();

    private constructor() { super(); }

    static getInstance(): AstralDependencyGraph {
        if (!AstralDependencyGraph.instance) {
            AstralDependencyGraph.instance = new AstralDependencyGraph();
        }
        return AstralDependencyGraph.instance;
    }

    map(modules: string[]): AstralGraph {
        const nodes: AstralNode[] = modules.map((m, i) => ({
            id: `node_${i}`,
            name: m,
            magnitude: Math.random() * 5 + 1,
            type: i === 0 ? 'star' : i < 3 ? 'planet' : 'moon' as const,
        }));

        const edges: AstralEdge[] = [];
        for (let i = 1; i < nodes.length; i++) {
            edges.push({
                from: nodes[0].id,
                to: nodes[i].id,
                lightYears: Math.random() * 100 + 1,
            });
        }

        const graph: AstralGraph = {
            id: `graph_${Date.now()}`,
            nodes,
            edges,
            constellation: this.nameConstellation(nodes.length),
            brightness: nodes.reduce((s, n) => s + n.magnitude, 0) / nodes.length,
        };

        this.graphs.set(graph.id, graph);
        this.emit('graph:created', graph);
        return graph;
    }

    private nameConstellation(size: number): string {
        const names = ['Orion', 'Andromeda', 'Pegasus', 'Cassiopeia', 'Cygnus'];
        return names[size % names.length];
    }

    getStats(): { total: number; avgBrightness: number } {
        const graphs = Array.from(this.graphs.values());
        return {
            total: graphs.length,
            avgBrightness: graphs.length > 0 ? graphs.reduce((s, g) => s + g.brightness, 0) / graphs.length : 0,
        };
    }
}

export const astralDependencyGraph = AstralDependencyGraph.getInstance();
