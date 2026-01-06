/**
 * Astral Binomial Heap
 */
import { EventEmitter } from 'events';
class BinomialNode<T> { value: T; degree: number = 0; children: BinomialNode<T>[] = []; constructor(value: T) { this.value = value; } }
export class AstralBinomialHeap<T> extends EventEmitter {
    private trees: BinomialNode<T>[] = [];
    private compare: (a: T, b: T) => number;
    private count: number = 0;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    private link(a: BinomialNode<T>, b: BinomialNode<T>): BinomialNode<T> { if (this.compare(a.value, b.value) > 0) [a, b] = [b, a]; a.children.push(b); a.degree++; return a; }
    private mergeTrees(trees: BinomialNode<T>[]): BinomialNode<T>[] { const result: BinomialNode<T>[] = []; trees.sort((a, b) => a.degree - b.degree); let carry: BinomialNode<T> | null = null; for (let i = 0; i < trees.length; i++) { const tree = trees[i]; if (carry && carry.degree === tree.degree) { carry = this.link(carry, tree); } else if (carry) { if (i + 1 < trees.length && trees[i + 1].degree === carry.degree) { result.push(tree); } else { result.push(carry); carry = null; i--; } } else if (i + 1 < trees.length && trees[i + 1].degree === tree.degree) { carry = this.link(tree, trees[i + 1]); i++; } else { result.push(tree); } } if (carry) result.push(carry); return result; }
    insert(value: T): void { this.trees = this.mergeTrees([...this.trees, new BinomialNode(value)]); this.count++; }
    findMin(): T | null { if (this.trees.length === 0) return null; return this.trees.reduce((min, t) => this.compare(t.value, min.value) < 0 ? t : min).value; }
    extractMin(): T | null { if (this.trees.length === 0) return null; let minIdx = 0; for (let i = 1; i < this.trees.length; i++) if (this.compare(this.trees[i].value, this.trees[minIdx].value) < 0) minIdx = i; const min = this.trees[minIdx]; this.trees.splice(minIdx, 1); this.trees = this.mergeTrees([...this.trees, ...min.children]); this.count--; return min.value; }
    isEmpty(): boolean { return this.trees.length === 0; }
    size(): number { return this.count; }
}
export const createBinomialHeap = <T>(compare?: (a: T, b: T) => number) => new AstralBinomialHeap<T>(compare);
