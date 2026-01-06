/**
 * Dimensional Unique BST
 */
import { EventEmitter } from 'events';
type TreeNodeU = { val: number; left?: TreeNodeU; right?: TreeNodeU };
export class DimensionalUniqueBST extends EventEmitter {
    private static instance: DimensionalUniqueBST;
    private constructor() { super(); }
    static getInstance(): DimensionalUniqueBST { if (!DimensionalUniqueBST.instance) { DimensionalUniqueBST.instance = new DimensionalUniqueBST(); } return DimensionalUniqueBST.instance; }
    numTrees(n: number): number { const dp = new Array(n + 1).fill(0); dp[0] = 1; dp[1] = 1; for (let i = 2; i <= n; i++) { for (let j = 1; j <= i; j++) { dp[i] += dp[j - 1] * dp[i - j]; } } return dp[n]; }
    generateTrees(n: number): (TreeNodeU | null)[] { if (n === 0) return []; const generate = (start: number, end: number): (TreeNodeU | null)[] => { if (start > end) return [null]; const trees: (TreeNodeU | null)[] = []; for (let i = start; i <= end; i++) { const leftTrees = generate(start, i - 1); const rightTrees = generate(i + 1, end); for (const left of leftTrees) { for (const right of rightTrees) { const node: TreeNodeU = { val: i }; node.left = left || undefined; node.right = right || undefined; trees.push(node); } } } return trees; }; return generate(1, n); }
}
export const dimensionalUniqueBST = DimensionalUniqueBST.getInstance();
