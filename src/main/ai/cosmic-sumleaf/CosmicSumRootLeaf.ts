/**
 * Cosmic Sum Root Leaf
 */
import { EventEmitter } from 'events';
type TreeNodeR = { val: number; left?: TreeNodeR; right?: TreeNodeR };
export class CosmicSumRootLeaf extends EventEmitter {
    private static instance: CosmicSumRootLeaf;
    private constructor() { super(); }
    static getInstance(): CosmicSumRootLeaf { if (!CosmicSumRootLeaf.instance) { CosmicSumRootLeaf.instance = new CosmicSumRootLeaf(); } return CosmicSumRootLeaf.instance; }
    sumNumbers(root: TreeNodeR | null): number { const dfs = (node: TreeNodeR | null, currentSum: number): number => { if (!node) return 0; currentSum = currentSum * 10 + node.val; if (!node.left && !node.right) return currentSum; return dfs(node.left || null, currentSum) + dfs(node.right || null, currentSum); }; return dfs(root, 0); }
    sumOfLeftLeaves(root: TreeNodeR | null): number { const dfs = (node: TreeNodeR | null, isLeft: boolean): number => { if (!node) return 0; if (!node.left && !node.right && isLeft) return node.val; return dfs(node.left || null, true) + dfs(node.right || null, false); }; return dfs(root, false); }
}
export const cosmicSumRootLeaf = CosmicSumRootLeaf.getInstance();
