/**
 * Mystic Binary Tree Path
 */
import { EventEmitter } from 'events';
type TreeNode = { val: number; left?: TreeNode; right?: TreeNode };
export class MysticBinaryTreePath extends EventEmitter {
    private static instance: MysticBinaryTreePath;
    private constructor() { super(); }
    static getInstance(): MysticBinaryTreePath { if (!MysticBinaryTreePath.instance) { MysticBinaryTreePath.instance = new MysticBinaryTreePath(); } return MysticBinaryTreePath.instance; }
    binaryTreePaths(root: TreeNode | null): string[] { const result: string[] = []; const dfs = (node: TreeNode | null, path: string): void => { if (!node) return; path = path ? path + '->' + node.val : String(node.val); if (!node.left && !node.right) { result.push(path); return; } dfs(node.left || null, path); dfs(node.right || null, path); }; dfs(root, ''); return result; }
    hasPathSum(root: TreeNode | null, targetSum: number): boolean { if (!root) return false; if (!root.left && !root.right) return root.val === targetSum; return this.hasPathSum(root.left || null, targetSum - root.val) || this.hasPathSum(root.right || null, targetSum - root.val); }
    pathSum(root: TreeNode | null, targetSum: number): number[][] { const result: number[][] = []; const dfs = (node: TreeNode | null, target: number, path: number[]): void => { if (!node) return; path.push(node.val); if (!node.left && !node.right && target === node.val) result.push([...path]); dfs(node.left || null, target - node.val, path); dfs(node.right || null, target - node.val, path); path.pop(); }; dfs(root, targetSum, []); return result; }
}
export const mysticBinaryTreePath = MysticBinaryTreePath.getInstance();
