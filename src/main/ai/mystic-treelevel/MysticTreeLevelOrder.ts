/**
 * Mystic Tree Level Order
 */
import { EventEmitter } from 'events';
type TreeNode6 = { val: number; left?: TreeNode6; right?: TreeNode6 };
export class MysticTreeLevelOrder extends EventEmitter {
    private static instance: MysticTreeLevelOrder;
    private constructor() { super(); }
    static getInstance(): MysticTreeLevelOrder { if (!MysticTreeLevelOrder.instance) { MysticTreeLevelOrder.instance = new MysticTreeLevelOrder(); } return MysticTreeLevelOrder.instance; }
    levelOrder(root: TreeNode6 | null): number[][] { if (!root) return []; const result: number[][] = []; const queue: TreeNode6[] = [root]; while (queue.length) { const level: number[] = []; const size = queue.length; for (let i = 0; i < size; i++) { const node = queue.shift()!; level.push(node.val); if (node.left) queue.push(node.left); if (node.right) queue.push(node.right); } result.push(level); } return result; }
    zigzagLevelOrder(root: TreeNode6 | null): number[][] { if (!root) return []; const result: number[][] = []; const queue: TreeNode6[] = [root]; let leftToRight = true; while (queue.length) { const level: number[] = []; const size = queue.length; for (let i = 0; i < size; i++) { const node = queue.shift()!; level.push(node.val); if (node.left) queue.push(node.left); if (node.right) queue.push(node.right); } result.push(leftToRight ? level : level.reverse()); leftToRight = !leftToRight; } return result; }
    rightSideView(root: TreeNode6 | null): number[] { if (!root) return []; const result: number[] = []; const queue: TreeNode6[] = [root]; while (queue.length) { const size = queue.length; for (let i = 0; i < size; i++) { const node = queue.shift()!; if (i === size - 1) result.push(node.val); if (node.left) queue.push(node.left); if (node.right) queue.push(node.right); } } return result; }
}
export const mysticTreeLevelOrder = MysticTreeLevelOrder.getInstance();
