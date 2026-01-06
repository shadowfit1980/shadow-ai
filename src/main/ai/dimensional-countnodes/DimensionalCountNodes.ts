/**
 * Dimensional Count Nodes
 */
import { EventEmitter } from 'events';
type TreeNodeC = { val: number; left?: TreeNodeC; right?: TreeNodeC };
export class DimensionalCountNodes extends EventEmitter {
    private static instance: DimensionalCountNodes;
    private constructor() { super(); }
    static getInstance(): DimensionalCountNodes { if (!DimensionalCountNodes.instance) { DimensionalCountNodes.instance = new DimensionalCountNodes(); } return DimensionalCountNodes.instance; }
    countNodes(root: TreeNodeC | null): number { if (!root) return 0; let leftHeight = 0, rightHeight = 0; let left = root, right = root; while (left) { leftHeight++; left = left.left || null as unknown as TreeNodeC; } while (right) { rightHeight++; right = right.right || null as unknown as TreeNodeC; } if (leftHeight === rightHeight) return (1 << leftHeight) - 1; return 1 + this.countNodes(root.left || null) + this.countNodes(root.right || null); }
    goodNodes(root: TreeNodeC | null): number { const dfs = (node: TreeNodeC | null, maxVal: number): number => { if (!node) return 0; let count = node.val >= maxVal ? 1 : 0; maxVal = Math.max(maxVal, node.val); count += dfs(node.left || null, maxVal) + dfs(node.right || null, maxVal); return count; }; return dfs(root, -Infinity); }
}
export const dimensionalCountNodes = DimensionalCountNodes.getInstance();
