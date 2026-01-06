/**
 * Cosmic Finger Tree
 */
import { EventEmitter } from 'events';
type Digit<T> = T[];
interface Node<T> { values: T[]; }
export class CosmicFingerTree<T> extends EventEmitter {
    private prefix: Digit<T>;
    private suffix: Digit<T>;
    private deeper: CosmicFingerTree<Node<T>> | null;
    constructor(prefix: Digit<T> = [], suffix: Digit<T> = [], deeper: CosmicFingerTree<Node<T>> | null = null) { super(); this.prefix = prefix; this.suffix = suffix; this.deeper = deeper; }
    isEmpty(): boolean { return this.prefix.length === 0 && this.suffix.length === 0 && !this.deeper; }
    pushFront(value: T): CosmicFingerTree<T> { if (this.prefix.length < 4) return new CosmicFingerTree([value, ...this.prefix], this.suffix, this.deeper); const newNode: Node<T> = { values: this.prefix.slice(1) }; const newDeeper = this.deeper ? this.deeper.pushFront(newNode) : new CosmicFingerTree<Node<T>>([newNode], []); return new CosmicFingerTree([value, this.prefix[0]], this.suffix, newDeeper); }
    pushBack(value: T): CosmicFingerTree<T> { if (this.suffix.length < 4) return new CosmicFingerTree(this.prefix, [...this.suffix, value], this.deeper); const newNode: Node<T> = { values: this.suffix.slice(0, 3) }; const newDeeper = this.deeper ? this.deeper.pushBack(newNode) : new CosmicFingerTree<Node<T>>([], [newNode]); return new CosmicFingerTree(this.prefix, [this.suffix[3], value], newDeeper); }
    peekFront(): T | null { if (this.prefix.length > 0) return this.prefix[0]; if (this.suffix.length > 0) return this.suffix[0]; return null; }
    peekBack(): T | null { if (this.suffix.length > 0) return this.suffix[this.suffix.length - 1]; if (this.prefix.length > 0) return this.prefix[this.prefix.length - 1]; return null; }
    toArray(): T[] { const result: T[] = [...this.prefix]; if (this.deeper) { const deeperArr = this.deeper.toArray(); for (const node of deeperArr) result.push(...node.values); } result.push(...this.suffix); return result; }
}
export const createFingerTree = <T>() => new CosmicFingerTree<T>();
