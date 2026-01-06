/**
 * Astral Maximum Path Sum
 */
import { EventEmitter } from 'events';
type TreeNode2 = { val: number; left?: TreeNode2; right?: TreeNode2 };
export class AstralMaxPathSum extends EventEmitter {
    private static instance: AstralMaxPathSum;
    private constructor() { super(); }
    static getInstance(): AstralMaxPathSum { if (!AstralMaxPathSum.instance) { AstralMaxPathSum.instance = new AstralMaxPathSum(); } return AstralMaxPathSum.instance; }
    maxPathSum(root: TreeNode2 | null): number { let maxSum = -Infinity; const dfs = (node: TreeNode2 | null): number => { if (!node) return 0; const left = Math.max(dfs(node.left || null), 0); const right = Math.max(dfs(node.right || null), 0); maxSum = Math.max(maxSum, node.val + left + right); return node.val + Math.max(left, right); }; dfs(root); return maxSum; }
    longestUnivaluePath(root: TreeNode2 | null): number { let maxLen = 0; const dfs = (node: TreeNode2 | null): number => { if (!node) return 0; let left = dfs(node.left || null); let right = dfs(node.right || null); let arrowLeft = 0, arrowRight = 0; if (node.left && node.left.val === node.val) arrowLeft = left + 1; if (node.right && node.right.val === node.val) arrowRight = right + 1; maxLen = Math.max(maxLen, arrowLeft + arrowRight); return Math.max(arrowLeft, arrowRight); }; dfs(root); return maxLen; }
}
export const astralMaxPathSum = AstralMaxPathSum.getInstance();
