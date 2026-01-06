/**
 * Cosmic Binary Search Tree
 */
import { EventEmitter } from 'events';
type TreeNode4 = { val: number; left?: TreeNode4; right?: TreeNode4 };
export class CosmicBSTOperations extends EventEmitter {
    private static instance: CosmicBSTOperations;
    private constructor() { super(); }
    static getInstance(): CosmicBSTOperations { if (!CosmicBSTOperations.instance) { CosmicBSTOperations.instance = new CosmicBSTOperations(); } return CosmicBSTOperations.instance; }
    isValidBST(root: TreeNode4 | null): boolean { const validate = (node: TreeNode4 | null, min: number, max: number): boolean => { if (!node) return true; if (node.val <= min || node.val >= max) return false; return validate(node.left || null, min, node.val) && validate(node.right || null, node.val, max); }; return validate(root, -Infinity, Infinity); }
    searchBST(root: TreeNode4 | null, val: number): TreeNode4 | null { if (!root) return null; if (root.val === val) return root; return val < root.val ? this.searchBST(root.left || null, val) : this.searchBST(root.right || null, val); }
    insertIntoBST(root: TreeNode4 | null, val: number): TreeNode4 { if (!root) return { val }; if (val < root.val) root.left = this.insertIntoBST(root.left || null, val); else root.right = this.insertIntoBST(root.right || null, val); return root; }
    deleteNode(root: TreeNode4 | null, key: number): TreeNode4 | null { if (!root) return null; if (key < root.val) { root.left = this.deleteNode(root.left || null, key); } else if (key > root.val) { root.right = this.deleteNode(root.right || null, key); } else { if (!root.left) return root.right || null; if (!root.right) return root.left; let successor = root.right; while (successor.left) successor = successor.left; root.val = successor.val; root.right = this.deleteNode(root.right, successor.val); } return root; }
    kthSmallest(root: TreeNode4 | null, k: number): number { const inorder: number[] = []; const traverse = (node: TreeNode4 | null): void => { if (!node) return; traverse(node.left || null); inorder.push(node.val); traverse(node.right || null); }; traverse(root); return inorder[k - 1]; }
}
export const cosmicBSTOperations = CosmicBSTOperations.getInstance();
