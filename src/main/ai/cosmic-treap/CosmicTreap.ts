/**
 * Cosmic Treap
 */
import { EventEmitter } from 'events';
class TreapNode<T> { value: T; priority: number; left: TreapNode<T> | null = null; right: TreapNode<T> | null = null; constructor(value: T) { this.value = value; this.priority = Math.random(); } }
export class CosmicTreap<T> extends EventEmitter {
    private root: TreapNode<T> | null = null;
    private comparator: (a: T, b: T) => number;
    constructor(comparator: (a: T, b: T) => number = (a, b) => a > b ? 1 : a < b ? -1 : 0) { super(); this.comparator = comparator; }
    private rotateRight(node: TreapNode<T>): TreapNode<T> { const left = node.left!; node.left = left.right; left.right = node; return left; }
    private rotateLeft(node: TreapNode<T>): TreapNode<T> { const right = node.right!; node.right = right.left; right.left = node; return right; }
    private insertNode(node: TreapNode<T> | null, value: T): TreapNode<T> { if (!node) return new TreapNode(value); if (this.comparator(value, node.value) < 0) { node.left = this.insertNode(node.left, value); if (node.left.priority > node.priority) node = this.rotateRight(node); } else { node.right = this.insertNode(node.right, value); if (node.right.priority > node.priority) node = this.rotateLeft(node); } return node; }
    insert(value: T): void { this.root = this.insertNode(this.root, value); }
    search(value: T): boolean { let current = this.root; while (current) { const cmp = this.comparator(value, current.value); if (cmp === 0) return true; current = cmp < 0 ? current.left : current.right; } return false; }
}
export const createTreap = <T>(comparator?: (a: T, b: T) => number) => new CosmicTreap<T>(comparator);
