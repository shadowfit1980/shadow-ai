/**
 * Dimensional R Tree
 */
import { EventEmitter } from 'events';
export interface Rectangle { minX: number; minY: number; maxX: number; maxY: number; }
class RTreeNode<T> { bounds: Rectangle; children: RTreeNode<T>[] = []; data?: T; isLeaf = true; }
export class DimensionalRTree<T extends Rectangle> extends EventEmitter {
    private root: RTreeNode<T>;
    private maxEntries: number;
    constructor(maxEntries: number = 9) { super(); this.maxEntries = maxEntries; this.root = new RTreeNode<T>(); this.root.bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }; }
    private extendBounds(bounds: Rectangle, rect: Rectangle): Rectangle { return { minX: Math.min(bounds.minX, rect.minX), minY: Math.min(bounds.minY, rect.minY), maxX: Math.max(bounds.maxX, rect.maxX), maxY: Math.max(bounds.maxY, rect.maxY) }; }
    insert(item: T): void { const leaf = new RTreeNode<T>(); leaf.bounds = { minX: item.minX, minY: item.minY, maxX: item.maxX, maxY: item.maxY }; leaf.data = item; leaf.isLeaf = true; this.root.children.push(leaf); this.root.bounds = this.extendBounds(this.root.bounds, leaf.bounds); }
    private intersects(a: Rectangle, b: Rectangle): boolean { return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY; }
    search(range: Rectangle): T[] { const results: T[] = []; const searchNode = (node: RTreeNode<T>) => { if (!this.intersects(node.bounds, range)) return; if (node.isLeaf && node.data) { if (this.intersects(node.bounds, range)) results.push(node.data); } for (const child of node.children) searchNode(child); }; searchNode(this.root); return results; }
}
export const createRTree = <T extends Rectangle>(maxEntries?: number) => new DimensionalRTree<T>(maxEntries);
