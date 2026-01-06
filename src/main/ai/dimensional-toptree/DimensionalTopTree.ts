/**
 * Dimensional Top Tree
 */
import { EventEmitter } from 'events';
class TopTreeNode { parent: TopTreeNode | null = null; left: TopTreeNode | null = null; right: TopTreeNode | null = null; boundary: [number, number] = [0, 0]; value: number; constructor(value: number) { this.value = value; } }
export class DimensionalTopTree extends EventEmitter {
    private nodes: TopTreeNode[] = [];
    private root: TopTreeNode | null = null;
    constructor(n: number) { super(); for (let i = 0; i < n; i++) { const node = new TopTreeNode(i); node.boundary = [i, i]; this.nodes.push(node); } }
    link(u: number, v: number): void { const uNode = this.nodes[u]; const vNode = this.nodes[v]; const newRoot = new TopTreeNode(-1); newRoot.left = uNode; newRoot.right = vNode; uNode.parent = newRoot; vNode.parent = newRoot; newRoot.boundary = [Math.min(uNode.boundary[0], vNode.boundary[0]), Math.max(uNode.boundary[1], vNode.boundary[1])]; this.root = newRoot; }
    cut(u: number): void { const uNode = this.nodes[u]; if (uNode.parent) { const parent = uNode.parent; if (parent.left === uNode) { if (parent.right) parent.right.parent = parent.parent; this.root = parent.right; } else { if (parent.left) parent.left.parent = parent.parent; this.root = parent.left; } uNode.parent = null; } }
    findRoot(u: number): TopTreeNode { let node = this.nodes[u]; while (node.parent) node = node.parent; return node; }
    connected(u: number, v: number): boolean { return this.findRoot(u) === this.findRoot(v); }
    getPath(u: number, v: number): number[] { const path: number[] = []; let current: TopTreeNode | null = this.nodes[u]; while (current) { if (current.value >= 0) path.push(current.value); current = current.parent; } return path; }
}
export const createTopTree = (n: number) => new DimensionalTopTree(n);
