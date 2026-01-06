/**
 * Knowledge Graph - Semantic relationships
 */
import { EventEmitter } from 'events';

export interface GraphNode { id: string; type: string; label: string; properties: Record<string, string>; }
export interface GraphEdge { source: string; target: string; relation: string; weight: number; }

export class KnowledgeGraph extends EventEmitter {
    private static instance: KnowledgeGraph;
    private nodes: Map<string, GraphNode> = new Map();
    private edges: GraphEdge[] = [];
    private constructor() { super(); }
    static getInstance(): KnowledgeGraph { if (!KnowledgeGraph.instance) KnowledgeGraph.instance = new KnowledgeGraph(); return KnowledgeGraph.instance; }

    addNode(type: string, label: string, properties: Record<string, string> = {}): GraphNode { const node: GraphNode = { id: `node_${Date.now()}_${this.nodes.size}`, type, label, properties }; this.nodes.set(node.id, node); return node; }
    addEdge(sourceId: string, targetId: string, relation: string, weight = 1): boolean { if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return false; this.edges.push({ source: sourceId, target: targetId, relation, weight }); return true; }

    findRelated(nodeId: string): { node: GraphNode; relation: string; weight: number }[] {
        const related: { node: GraphNode; relation: string; weight: number }[] = [];
        this.edges.filter(e => e.source === nodeId || e.target === nodeId).forEach(e => {
            const targetId = e.source === nodeId ? e.target : e.source;
            const node = this.nodes.get(targetId); if (node) related.push({ node, relation: e.relation, weight: e.weight });
        });
        return related.sort((a, b) => b.weight - a.weight);
    }

    query(type?: string): GraphNode[] { return Array.from(this.nodes.values()).filter(n => !type || n.type === type); }
    getStats(): { nodes: number; edges: number } { return { nodes: this.nodes.size, edges: this.edges.length }; }
}
export function getKnowledgeGraph(): KnowledgeGraph { return KnowledgeGraph.getInstance(); }
