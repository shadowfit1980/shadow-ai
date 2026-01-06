/**
 * Thought Tree - Branching reasoning
 */
import { EventEmitter } from 'events';

export interface ThoughtNode { id: string; thought: string; confidence: number; children: ThoughtNode[]; isLeaf: boolean; evaluation?: number; }
export interface ThoughtTreeResult { id: string; query: string; root: ThoughtNode; bestPath: string[]; totalNodes: number; depth: number; }

export class ThoughtTreeEngine extends EventEmitter {
    private static instance: ThoughtTreeEngine;
    private trees: Map<string, ThoughtTreeResult> = new Map();
    private constructor() { super(); }
    static getInstance(): ThoughtTreeEngine { if (!ThoughtTreeEngine.instance) ThoughtTreeEngine.instance = new ThoughtTreeEngine(); return ThoughtTreeEngine.instance; }

    async build(query: string, breadth = 3, depth = 4): Promise<ThoughtTreeResult> {
        const root = this.generateNode('Root: Analyze ' + query.slice(0, 30), depth, breadth);
        const bestPath = this.findBestPath(root);
        const totalNodes = this.countNodes(root);
        const result: ThoughtTreeResult = { id: `tree_${Date.now()}`, query, root, bestPath, totalNodes, depth };
        this.trees.set(result.id, result); this.emit('complete', result); return result;
    }

    private generateNode(thought: string, depth: number, breadth: number): ThoughtNode {
        const node: ThoughtNode = { id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, thought, confidence: 0.5 + Math.random() * 0.5, children: [], isLeaf: depth === 0 };
        if (depth > 0) { for (let i = 0; i < breadth; i++) { node.children.push(this.generateNode(`Branch ${i + 1}: Explore...`, depth - 1, breadth - 1)); } }
        node.evaluation = node.isLeaf ? node.confidence : Math.max(...node.children.map(c => c.evaluation || 0)) * node.confidence;
        return node;
    }

    private findBestPath(node: ThoughtNode): string[] { if (node.isLeaf) return [node.id]; const best = node.children.reduce((a, b) => (a.evaluation || 0) > (b.evaluation || 0) ? a : b); return [node.id, ...this.findBestPath(best)]; }
    private countNodes(node: ThoughtNode): number { return 1 + node.children.reduce((s, c) => s + this.countNodes(c), 0); }
    get(treeId: string): ThoughtTreeResult | null { return this.trees.get(treeId) || null; }
}
export function getThoughtTreeEngine(): ThoughtTreeEngine { return ThoughtTreeEngine.getInstance(); }
