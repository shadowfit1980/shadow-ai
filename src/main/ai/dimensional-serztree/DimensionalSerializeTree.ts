/**
 * Dimensional Serialize Tree
 */
import { EventEmitter } from 'events';
type TreeNode5 = { val: number; left?: TreeNode5; right?: TreeNode5 };
export class DimensionalSerializeTree extends EventEmitter {
    private static instance: DimensionalSerializeTree;
    private constructor() { super(); }
    static getInstance(): DimensionalSerializeTree { if (!DimensionalSerializeTree.instance) { DimensionalSerializeTree.instance = new DimensionalSerializeTree(); } return DimensionalSerializeTree.instance; }
    serialize(root: TreeNode5 | null): string { if (!root) return 'null'; return `${root.val},${this.serialize(root.left || null)},${this.serialize(root.right || null)}`; }
    deserialize(data: string): TreeNode5 | null { const vals = data.split(','); let index = 0; const build = (): TreeNode5 | null => { if (index >= vals.length || vals[index] === 'null') { index++; return null; } const node: TreeNode5 = { val: parseInt(vals[index++]) }; node.left = build() || undefined; node.right = build() || undefined; return node; }; return build(); }
    levelOrderSerialize(root: TreeNode5 | null): string { if (!root) return ''; const result: (number | null)[] = []; const queue: (TreeNode5 | null)[] = [root]; while (queue.length) { const node = queue.shift(); if (node) { result.push(node.val); queue.push(node.left || null); queue.push(node.right || null); } else { result.push(null); } } while (result.length && result[result.length - 1] === null) result.pop(); return result.map(v => v === null ? 'null' : String(v)).join(','); }
}
export const dimensionalSerializeTree = DimensionalSerializeTree.getInstance();
