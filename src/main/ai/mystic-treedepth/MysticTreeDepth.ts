/**
 * Mystic Tree Depth
 */
import { EventEmitter } from 'events';
type TreeNodeD = { val: number; left?: TreeNodeD; right?: TreeNodeD };
export class MysticTreeDepth extends EventEmitter {
    private static instance: MysticTreeDepth;
    private constructor() { super(); }
    static getInstance(): MysticTreeDepth { if (!MysticTreeDepth.instance) { MysticTreeDepth.instance = new MysticTreeDepth(); } return MysticTreeDepth.instance; }
    maxDepth(root: TreeNodeD | null): number { if (!root) return 0; return 1 + Math.max(this.maxDepth(root.left || null), this.maxDepth(root.right || null)); }
    minDepth(root: TreeNodeD | null): number { if (!root) return 0; if (!root.left && !root.right) return 1; if (!root.left) return 1 + this.minDepth(root.right || null); if (!root.right) return 1 + this.minDepth(root.left || null); return 1 + Math.min(this.minDepth(root.left), this.minDepth(root.right)); }
    isBalanced(root: TreeNodeD | null): boolean { const check = (node: TreeNodeD | null): number => { if (!node) return 0; const left = check(node.left || null); if (left === -1) return -1; const right = check(node.right || null); if (right === -1) return -1; if (Math.abs(left - right) > 1) return -1; return 1 + Math.max(left, right); }; return check(root) !== -1; }
    isSymmetric(root: TreeNodeD | null): boolean { const check = (left: TreeNodeD | null, right: TreeNodeD | null): boolean => { if (!left && !right) return true; if (!left || !right) return false; return left.val === right.val && check(left.left || null, right.right || null) && check(left.right || null, right.left || null); }; return check(root, root); }
}
export const mysticTreeDepth = MysticTreeDepth.getInstance();
