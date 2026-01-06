/**
 * Dimensional Interval Tree
 */
import { EventEmitter } from 'events';
interface IntervalNode { interval: [number, number]; max: number; left: IntervalNode | null; right: IntervalNode | null; }
export class DimensionalIntervalTree extends EventEmitter {
    private root: IntervalNode | null = null;
    insert(interval: [number, number]): void { this.root = this.insertNode(this.root, interval); }
    private insertNode(node: IntervalNode | null, interval: [number, number]): IntervalNode { if (!node) return { interval, max: interval[1], left: null, right: null }; const [low] = interval; if (low < node.interval[0]) node.left = this.insertNode(node.left, interval); else node.right = this.insertNode(node.right, interval); node.max = Math.max(node.max, interval[1]); return node; }
    overlapping(interval: [number, number]): [number, number][] { const results: [number, number][] = []; this.searchOverlapping(this.root, interval, results); return results; }
    private searchOverlapping(node: IntervalNode | null, interval: [number, number], results: [number, number][]): void { if (!node) return; if (this.overlaps(node.interval, interval)) results.push(node.interval); if (node.left && node.left.max >= interval[0]) this.searchOverlapping(node.left, interval, results); if (node.right && node.interval[0] <= interval[1]) this.searchOverlapping(node.right, interval, results); }
    private overlaps(a: [number, number], b: [number, number]): boolean { return a[0] <= b[1] && b[0] <= a[1]; }
    anyOverlapping(interval: [number, number]): boolean { return this.findAnyOverlapping(this.root, interval) !== null; }
    private findAnyOverlapping(node: IntervalNode | null, interval: [number, number]): [number, number] | null { if (!node) return null; if (this.overlaps(node.interval, interval)) return node.interval; if (node.left && node.left.max >= interval[0]) return this.findAnyOverlapping(node.left, interval); return this.findAnyOverlapping(node.right, interval); }
}
export const createIntervalTree = () => new DimensionalIntervalTree();
