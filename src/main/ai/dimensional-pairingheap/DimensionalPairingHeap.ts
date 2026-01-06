/**
 * Dimensional Pairing Heap
 */
import { EventEmitter } from 'events';
class PairingNode<T> { value: T; children: PairingNode<T>[] = []; constructor(value: T) { this.value = value; } }
export class DimensionalPairingHeap<T> extends EventEmitter {
    private root: PairingNode<T> | null = null;
    private compare: (a: T, b: T) => number;
    private count: number = 0;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    private mergeNodes(a: PairingNode<T> | null, b: PairingNode<T> | null): PairingNode<T> | null { if (!a) return b; if (!b) return a; if (this.compare(a.value, b.value) <= 0) { a.children.unshift(b); return a; } b.children.unshift(a); return b; }
    private mergePairs(nodes: PairingNode<T>[]): PairingNode<T> | null { if (nodes.length === 0) return null; if (nodes.length === 1) return nodes[0]; const pairs: PairingNode<T>[] = []; for (let i = 0; i < nodes.length; i += 2) pairs.push(this.mergeNodes(nodes[i], nodes[i + 1] || null)!); return pairs.reduce((acc, node) => this.mergeNodes(acc, node)!); }
    insert(value: T): void { this.root = this.mergeNodes(this.root, new PairingNode(value)); this.count++; }
    findMin(): T | null { return this.root?.value ?? null; }
    extractMin(): T | null { if (!this.root) return null; const min = this.root.value; this.root = this.mergePairs(this.root.children); this.count--; return min; }
    isEmpty(): boolean { return this.root === null; }
    size(): number { return this.count; }
    mergeHeap(other: DimensionalPairingHeap<T>): void { this.root = this.mergeNodes(this.root, other.root); this.count += other.count; }
}
export const createPairingHeap = <T>(compare?: (a: T, b: T) => number) => new DimensionalPairingHeap<T>(compare);
