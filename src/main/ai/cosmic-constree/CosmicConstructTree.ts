/**
 * Cosmic Construct Tree
 */
import { EventEmitter } from 'events';
type TreeNode9 = { val: number; left?: TreeNode9; right?: TreeNode9 };
export class CosmicConstructTree extends EventEmitter {
    private static instance: CosmicConstructTree;
    private constructor() { super(); }
    static getInstance(): CosmicConstructTree { if (!CosmicConstructTree.instance) { CosmicConstructTree.instance = new CosmicConstructTree(); } return CosmicConstructTree.instance; }
    buildTreeFromPreIn(preorder: number[], inorder: number[]): TreeNode9 | null { if (preorder.length === 0) return null; const inMap: Map<number, number> = new Map(); inorder.forEach((val, idx) => inMap.set(val, idx)); let preIdx = 0; const build = (left: number, right: number): TreeNode9 | null => { if (left > right) return null; const val = preorder[preIdx++]; const node: TreeNode9 = { val }; const inIdx = inMap.get(val)!; node.left = build(left, inIdx - 1) || undefined; node.right = build(inIdx + 1, right) || undefined; return node; }; return build(0, inorder.length - 1); }
    buildTreeFromInPost(inorder: number[], postorder: number[]): TreeNode9 | null { if (postorder.length === 0) return null; const inMap: Map<number, number> = new Map(); inorder.forEach((val, idx) => inMap.set(val, idx)); let postIdx = postorder.length - 1; const build = (left: number, right: number): TreeNode9 | null => { if (left > right) return null; const val = postorder[postIdx--]; const node: TreeNode9 = { val }; const inIdx = inMap.get(val)!; node.right = build(inIdx + 1, right) || undefined; node.left = build(left, inIdx - 1) || undefined; return node; }; return build(0, inorder.length - 1); }
    buildMaximumBinaryTree(nums: number[]): TreeNode9 | null { if (nums.length === 0) return null; const maxIdx = nums.indexOf(Math.max(...nums)); const node: TreeNode9 = { val: nums[maxIdx] }; node.left = this.buildMaximumBinaryTree(nums.slice(0, maxIdx)) || undefined; node.right = this.buildMaximumBinaryTree(nums.slice(maxIdx + 1)) || undefined; return node; }
}
export const cosmicConstructTree = CosmicConstructTree.getInstance();
