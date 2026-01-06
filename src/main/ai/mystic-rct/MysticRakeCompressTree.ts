/**
 * Mystic Rake Compress Tree
 */
import { EventEmitter } from 'events';
class RCNode<T> { value: T; children: RCNode<T>[] = []; compressed: boolean = false; constructor(value: T) { this.value = value; } }
export class MysticRakeCompressTree<T> extends EventEmitter {
    private root: RCNode<T> | null = null;
    constructor() { super(); }
    build(adj: Map<T, T[]>, root: T): void { this.root = this.buildNode(adj, root, null); }
    private buildNode(adj: Map<T, T[]>, node: T, parent: T | null): RCNode<T> { const rcNode = new RCNode(node); const neighbors = adj.get(node) || []; for (const neighbor of neighbors) { if (neighbor !== parent) rcNode.children.push(this.buildNode(adj, neighbor, node)); } return rcNode; }
    compress(): void { if (this.root) this.compressNode(this.root); }
    private compressNode(node: RCNode<T>): void { while (node.children.length === 1 && !node.children[0].compressed) { const child = node.children[0]; node.value = child.value; node.children = child.children; node.compressed = true; } for (const child of node.children) this.compressNode(child); }
    rake(): void { if (this.root) this.rakeNode(this.root); }
    private rakeNode(node: RCNode<T>): void { const newChildren: RCNode<T>[] = []; for (const child of node.children) { if (child.children.length === 0) continue; newChildren.push(child); this.rakeNode(child); } node.children = newChildren; }
    getRoot(): RCNode<T> | null { return this.root; }
}
export const createRakeCompressTree = <T>() => new MysticRakeCompressTree<T>();
