/**
 * Quantum Flatten Binary Tree
 */
import { EventEmitter } from 'events';
type TreeNode3 = { val: number; left?: TreeNode3; right?: TreeNode3 };
export class QuantumFlattenTree extends EventEmitter {
    private static instance: QuantumFlattenTree;
    private constructor() { super(); }
    static getInstance(): QuantumFlattenTree { if (!QuantumFlattenTree.instance) { QuantumFlattenTree.instance = new QuantumFlattenTree(); } return QuantumFlattenTree.instance; }
    flatten(root: TreeNode3 | null): void { let curr = root; while (curr) { if (curr.left) { let pred = curr.left; while (pred.right) pred = pred.right; pred.right = curr.right; curr.right = curr.left; curr.left = undefined; } curr = curr.right; } }
    flattenToList(root: TreeNode3 | null): TreeNode3 | null { if (!root) return null; const list: TreeNode3[] = []; const preorder = (node: TreeNode3 | null): void => { if (!node) return; list.push(node); preorder(node.left || null); preorder(node.right || null); }; preorder(root); for (let i = 0; i < list.length - 1; i++) { list[i].left = undefined; list[i].right = list[i + 1]; } list[list.length - 1].left = undefined; list[list.length - 1].right = undefined; return list[0]; }
}
export const quantumFlattenTree = QuantumFlattenTree.getInstance();
