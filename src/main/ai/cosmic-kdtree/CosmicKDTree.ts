/**
 * Cosmic KD Tree
 */
import { EventEmitter } from 'events';
class KDNode<T> { point: T; left: KDNode<T> | null = null; right: KDNode<T> | null = null; constructor(point: T) { this.point = point; } }
export class CosmicKDTree<T extends { [key: string]: number }> extends EventEmitter {
    private root: KDNode<T> | null = null;
    private k: number;
    constructor(k: number = 2) { super(); this.k = k; }
    private buildTree(points: T[], depth: number = 0): KDNode<T> | null { if (points.length === 0) return null; const axis = depth % this.k; const keys = Object.keys(points[0]); const axisKey = keys[axis]; points.sort((a, b) => a[axisKey] - b[axisKey]); const mid = Math.floor(points.length / 2); const node = new KDNode(points[mid]); node.left = this.buildTree(points.slice(0, mid), depth + 1); node.right = this.buildTree(points.slice(mid + 1), depth + 1); return node; }
    build(points: T[]): void { this.root = this.buildTree([...points]); }
    insert(point: T): void { this.root = this.insertNode(this.root, point, 0); }
    private insertNode(node: KDNode<T> | null, point: T, depth: number): KDNode<T> { if (!node) return new KDNode(point); const keys = Object.keys(point); const axis = depth % this.k; const axisKey = keys[axis]; if (point[axisKey] < node.point[axisKey]) node.left = this.insertNode(node.left, point, depth + 1); else node.right = this.insertNode(node.right, point, depth + 1); return node; }
}
export const createKDTree = <T extends { [key: string]: number }>(k?: number) => new CosmicKDTree<T>(k);
