/**
 * Astral Linked List
 */
import { EventEmitter } from 'events';
class LLNode<T> { value: T; next: LLNode<T> | null = null; prev: LLNode<T> | null = null; constructor(value: T) { this.value = value; } }
export class AstralLinkedList<T> extends EventEmitter {
    private headNode: LLNode<T> | null = null;
    private tailNode: LLNode<T> | null = null;
    private count = 0;
    pushFront(value: T): void { const node = new LLNode(value); node.next = this.headNode; if (this.headNode) this.headNode.prev = node; this.headNode = node; if (!this.tailNode) this.tailNode = node; this.count++; }
    pushBack(value: T): void { const node = new LLNode(value); node.prev = this.tailNode; if (this.tailNode) this.tailNode.next = node; this.tailNode = node; if (!this.headNode) this.headNode = node; this.count++; }
    popFront(): T | undefined { if (!this.headNode) return undefined; const value = this.headNode.value; this.headNode = this.headNode.next; if (this.headNode) this.headNode.prev = null; else this.tailNode = null; this.count--; return value; }
    popBack(): T | undefined { if (!this.tailNode) return undefined; const value = this.tailNode.value; this.tailNode = this.tailNode.prev; if (this.tailNode) this.tailNode.next = null; else this.headNode = null; this.count--; return value; }
    size(): number { return this.count; }
    toArray(): T[] { const arr: T[] = []; let current = this.headNode; while (current) { arr.push(current.value); current = current.next; } return arr; }
}
export const createLinkedList = <T>() => new AstralLinkedList<T>();
