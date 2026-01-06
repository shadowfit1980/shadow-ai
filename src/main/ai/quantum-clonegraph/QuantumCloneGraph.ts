/**
 * Quantum Clone Graph
 */
import { EventEmitter } from 'events';
interface GraphNode { val: number; neighbors: GraphNode[]; }
export class QuantumCloneGraph extends EventEmitter {
    private static instance: QuantumCloneGraph;
    private constructor() { super(); }
    static getInstance(): QuantumCloneGraph { if (!QuantumCloneGraph.instance) { QuantumCloneGraph.instance = new QuantumCloneGraph(); } return QuantumCloneGraph.instance; }
    cloneGraph(node: GraphNode | null): GraphNode | null { if (!node) return null; const visited: Map<GraphNode, GraphNode> = new Map(); const dfs = (n: GraphNode): GraphNode => { if (visited.has(n)) return visited.get(n)!; const clone: GraphNode = { val: n.val, neighbors: [] }; visited.set(n, clone); for (const neighbor of n.neighbors) clone.neighbors.push(dfs(neighbor)); return clone; }; return dfs(node); }
    cloneGraphBFS(node: GraphNode | null): GraphNode | null { if (!node) return null; const visited: Map<GraphNode, GraphNode> = new Map(); const queue = [node]; visited.set(node, { val: node.val, neighbors: [] }); while (queue.length) { const n = queue.shift()!; for (const neighbor of n.neighbors) { if (!visited.has(neighbor)) { visited.set(neighbor, { val: neighbor.val, neighbors: [] }); queue.push(neighbor); } visited.get(n)!.neighbors.push(visited.get(neighbor)!); } } return visited.get(node)!; }
}
export const quantumCloneGraph = QuantumCloneGraph.getInstance();
