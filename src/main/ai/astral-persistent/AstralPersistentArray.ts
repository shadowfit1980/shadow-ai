/**
 * Astral Persistent Array
 */
import { EventEmitter } from 'events';
interface PersistentNode<T> { value: T; left: PersistentNode<T> | null; right: PersistentNode<T> | null; }
export class AstralPersistentArray<T> extends EventEmitter {
    private roots: (PersistentNode<T> | null)[] = [];
    private size: number;
    constructor(arr: T[]) { super(); this.size = arr.length; this.roots.push(this.build(arr, 0, arr.length - 1)); }
    private build(arr: T[], l: number, r: number): PersistentNode<T> | null { if (l > r) return null; const mid = Math.floor((l + r) / 2); return { value: arr[mid], left: this.build(arr, l, mid - 1), right: this.build(arr, mid + 1, r) }; }
    get(version: number, index: number): T | null { return this.getAt(this.roots[version], 0, this.size - 1, index); }
    private getAt(node: PersistentNode<T> | null, l: number, r: number, index: number): T | null { if (!node || l > r) return null; const mid = Math.floor((l + r) / 2); if (index === mid) return node.value; if (index < mid) return this.getAt(node.left, l, mid - 1, index); return this.getAt(node.right, mid + 1, r, index); }
    set(version: number, index: number, value: T): number { const newRoot = this.setAt(this.roots[version], 0, this.size - 1, index, value); this.roots.push(newRoot); return this.roots.length - 1; }
    private setAt(node: PersistentNode<T> | null, l: number, r: number, index: number, value: T): PersistentNode<T> | null { if (!node || l > r) return null; const mid = Math.floor((l + r) / 2); if (index === mid) return { value, left: node.left, right: node.right }; if (index < mid) return { value: node.value, left: this.setAt(node.left, l, mid - 1, index, value), right: node.right }; return { value: node.value, left: node.left, right: this.setAt(node.right, mid + 1, r, index, value) }; }
    getVersionCount(): number { return this.roots.length; }
}
export const createPersistentArray = <T>(arr: T[]) => new AstralPersistentArray<T>(arr);
