/**
 * Astral BK Tree
 */
import { EventEmitter } from 'events';
class BKNode<T> { value: T; children: Map<number, BKNode<T>> = new Map(); constructor(value: T) { this.value = value; } }
export class AstralBKTree<T> extends EventEmitter {
    private root: BKNode<T> | null = null;
    private distance: (a: T, b: T) => number;
    constructor(distance: (a: T, b: T) => number) { super(); this.distance = distance; }
    insert(value: T): void { if (!this.root) { this.root = new BKNode(value); return; } let node = this.root; while (true) { const d = this.distance(node.value, value); if (d === 0) return; if (!node.children.has(d)) { node.children.set(d, new BKNode(value)); return; } node = node.children.get(d)!; } }
    search(value: T, tolerance: number): T[] { const results: T[] = []; if (!this.root) return results; const stack: BKNode<T>[] = [this.root]; while (stack.length) { const node = stack.pop()!; const d = this.distance(node.value, value); if (d <= tolerance) results.push(node.value); for (let i = d - tolerance; i <= d + tolerance; i++) if (node.children.has(i)) stack.push(node.children.get(i)!); } return results; }
}
export const createBKTree = <T>(distance: (a: T, b: T) => number) => new AstralBKTree<T>(distance);
