/**
 * Astral Invert Tree
 */
import { EventEmitter } from 'events';
type TreeNodeI = { val: number; left?: TreeNodeI; right?: TreeNodeI };
export class AstralInvertTree extends EventEmitter {
    private static instance: AstralInvertTree;
    private constructor() { super(); }
    static getInstance(): AstralInvertTree { if (!AstralInvertTree.instance) { AstralInvertTree.instance = new AstralInvertTree(); } return AstralInvertTree.instance; }
    invertTree(root: TreeNodeI | null): TreeNodeI | null { if (!root) return null;[root.left, root.right] = [root.right, root.left]; this.invertTree(root.left || null); this.invertTree(root.right || null); return root; }
    invertTreeIterative(root: TreeNodeI | null): TreeNodeI | null { if (!root) return null; const queue = [root]; while (queue.length) { const node = queue.shift()!;[node.left, node.right] = [node.right, node.left]; if (node.left) queue.push(node.left); if (node.right) queue.push(node.right); } return root; }
}
export const astralInvertTree = AstralInvertTree.getInstance();
