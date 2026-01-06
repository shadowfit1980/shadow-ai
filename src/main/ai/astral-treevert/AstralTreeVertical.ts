/**
 * Astral Tree Vertical Order
 */
import { EventEmitter } from 'events';
type TreeNode7 = { val: number; left?: TreeNode7; right?: TreeNode7 };
export class AstralTreeVertical extends EventEmitter {
    private static instance: AstralTreeVertical;
    private constructor() { super(); }
    static getInstance(): AstralTreeVertical { if (!AstralTreeVertical.instance) { AstralTreeVertical.instance = new AstralTreeVertical(); } return AstralTreeVertical.instance; }
    verticalOrder(root: TreeNode7 | null): number[][] { if (!root) return []; const columnMap: Map<number, number[]> = new Map(); const queue: [TreeNode7, number][] = [[root, 0]]; let minCol = 0, maxCol = 0; while (queue.length) { const [node, col] = queue.shift()!; if (!columnMap.has(col)) columnMap.set(col, []); columnMap.get(col)!.push(node.val); minCol = Math.min(minCol, col); maxCol = Math.max(maxCol, col); if (node.left) queue.push([node.left, col - 1]); if (node.right) queue.push([node.right, col + 1]); } const result: number[][] = []; for (let c = minCol; c <= maxCol; c++) result.push(columnMap.get(c)!); return result; }
    verticalTraversal(root: TreeNode7 | null): number[][] { if (!root) return []; const nodes: [number, number, number][] = []; const dfs = (node: TreeNode7 | null, row: number, col: number): void => { if (!node) return; nodes.push([col, row, node.val]); dfs(node.left || null, row + 1, col - 1); dfs(node.right || null, row + 1, col + 1); }; dfs(root, 0, 0); nodes.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); const result: number[][] = []; let prevCol = -Infinity; for (const [col, , val] of nodes) { if (col !== prevCol) { result.push([]); prevCol = col; } result[result.length - 1].push(val); } return result; }
}
export const astralTreeVertical = AstralTreeVertical.getInstance();
