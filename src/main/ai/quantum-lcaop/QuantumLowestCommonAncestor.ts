/**
 * Quantum Lowest Common Ancestor
 */
import { EventEmitter } from 'events';
type TreeNode8 = { val: number; left?: TreeNode8; right?: TreeNode8 };
export class QuantumLowestCommonAncestor extends EventEmitter {
    private static instance: QuantumLowestCommonAncestor;
    private constructor() { super(); }
    static getInstance(): QuantumLowestCommonAncestor { if (!QuantumLowestCommonAncestor.instance) { QuantumLowestCommonAncestor.instance = new QuantumLowestCommonAncestor(); } return QuantumLowestCommonAncestor.instance; }
    lowestCommonAncestor(root: TreeNode8 | null, p: TreeNode8 | null, q: TreeNode8 | null): TreeNode8 | null { if (!root || root === p || root === q) return root; const left = this.lowestCommonAncestor(root.left || null, p, q); const right = this.lowestCommonAncestor(root.right || null, p, q); if (left && right) return root; return left || right; }
    lcaBST(root: TreeNode8 | null, p: TreeNode8, q: TreeNode8): TreeNode8 | null { if (!root) return null; if (p.val < root.val && q.val < root.val) return this.lcaBST(root.left || null, p, q); if (p.val > root.val && q.val > root.val) return this.lcaBST(root.right || null, p, q); return root; }
    lcaWithParent(p: { val: number; parent?: unknown }, q: { val: number; parent?: unknown }): number { const ancestors = new Set<number>(); let curr: unknown = p; while (curr) { const node = curr as { val: number; parent?: unknown }; ancestors.add(node.val); curr = node.parent; } curr = q; while (curr) { const node = curr as { val: number; parent?: unknown }; if (ancestors.has(node.val)) return node.val; curr = node.parent; } return -1; }
}
export const quantumLowestCommonAncestor = QuantumLowestCommonAncestor.getInstance();
