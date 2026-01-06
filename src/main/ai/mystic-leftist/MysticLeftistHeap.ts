/**
 * Mystic Leftist Heap
 */
import { EventEmitter } from 'events';
class LeftistNode<T> { value: T; rank: number = 1; left: LeftistNode<T> | null = null; right: LeftistNode<T> | null = null; constructor(value: T) { this.value = value; } }
export class MysticLeftistHeap<T> extends EventEmitter {
    private root: LeftistNode<T> | null = null;
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    private rank(node: LeftistNode<T> | null): number { return node?.rank ?? 0; }
    private mergeNodes(a: LeftistNode<T> | null, b: LeftistNode<T> | null): LeftistNode<T> | null { if (!a) return b; if (!b) return a; if (this.compare(a.value, b.value) > 0) [a, b] = [b, a]; a.right = this.mergeNodes(a.right, b); if (this.rank(a.left) < this.rank(a.right)) [a.left, a.right] = [a.right, a.left]; a.rank = this.rank(a.right) + 1; return a; }
    insert(value: T): void { this.root = this.mergeNodes(this.root, new LeftistNode(value)); }
    findMin(): T | null { return this.root?.value ?? null; }
    extractMin(): T | null { if (!this.root) return null; const min = this.root.value; this.root = this.mergeNodes(this.root.left, this.root.right); return min; }
    merge(other: MysticLeftistHeap<T>): void { this.root = this.mergeNodes(this.root, other.root); }
    isEmpty(): boolean { return this.root === null; }
}
export const createLeftistHeap = <T>(compare?: (a: T, b: T) => number) => new MysticLeftistHeap<T>(compare);
