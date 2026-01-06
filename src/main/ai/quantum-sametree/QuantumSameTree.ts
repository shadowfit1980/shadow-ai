/**
 * Quantum Same Tree
 */
import { EventEmitter } from 'events';
type TreeNodeS = { val: number; left?: TreeNodeS; right?: TreeNodeS };
export class QuantumSameTree extends EventEmitter {
    private static instance: QuantumSameTree;
    private constructor() { super(); }
    static getInstance(): QuantumSameTree { if (!QuantumSameTree.instance) { QuantumSameTree.instance = new QuantumSameTree(); } return QuantumSameTree.instance; }
    isSameTree(p: TreeNodeS | null, q: TreeNodeS | null): boolean { if (!p && !q) return true; if (!p || !q) return false; return p.val === q.val && this.isSameTree(p.left || null, q.left || null) && this.isSameTree(p.right || null, q.right || null); }
    isSubtree(root: TreeNodeS | null, subRoot: TreeNodeS | null): boolean { if (!root) return !subRoot; if (this.isSameTree(root, subRoot)) return true; return this.isSubtree(root.left || null, subRoot) || this.isSubtree(root.right || null, subRoot); }
    mergeTrees(root1: TreeNodeS | null, root2: TreeNodeS | null): TreeNodeS | null { if (!root1) return root2; if (!root2) return root1; root1.val += root2.val; root1.left = this.mergeTrees(root1.left || null, root2.left || null) || undefined; root1.right = this.mergeTrees(root1.right || null, root2.right || null) || undefined; return root1; }
}
export const quantumSameTree = QuantumSameTree.getInstance();
